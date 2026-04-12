import json
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken, TokenVerifier
from fastmcp.server.dependencies import get_access_token
from jwt import InvalidTokenError
from jwt import decode as jwt_decode
from ncoreparser import SearchParamType, SearchParamWhere
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from service.core.download_service import (
    DeviceNotFoundError,
    InvalidNcoreCredentialsError,
    NcoreUnavailableError,
    TorrentNotFoundError,
    add_download_for_user,
    search_torrents_for_user,
)
from service.core.tmdb_service import search_media
from service.models.database import AsyncSessionLocal, Device, User, user_device_association
from service.util.configuration import SECRET_KEY

ACTIVE_THRESHOLD = timedelta(minutes=1)
MCP_SCOPES = ["cdm:mcp"]


class CdmOAuthTokenVerifier(TokenVerifier):
    async def verify_token(self, token: str) -> AccessToken | None:
        async with AsyncSessionLocal() as session:
            user = await self._verify_mcp_access_token(session=session, token=token)
            if user is None:
                return None

        return AccessToken(
            token=token,
            client_id=str(user.id),
            scopes=MCP_SCOPES,
            claims={"user_id": user.id, "email": user.email},
        )

    async def _verify_mcp_access_token(
        self, session: AsyncSession, token: str
    ) -> User | None:
        try:
            payload = jwt_decode(token, SECRET_KEY, algorithms=["HS256"])
        except InvalidTokenError:
            return None

        if payload.get("token_use") != "mcp_access":
            return None

        user_id = payload.get("mcp_user_id")
        token_secret_hash = payload.get(
            "mcp_client_secret_hash", payload.get("mcp_key_hash")
        )
        if not isinstance(user_id, int) or not isinstance(token_secret_hash, str):
            return None

        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user is None or user.mcp_client_secret_hash != token_secret_hash:
            return None
        return user


mcp = FastMCP("CDMServer MCP", auth=CdmOAuthTokenVerifier(required_scopes=MCP_SCOPES))


async def get_authenticated_user() -> User:
    access_token = get_access_token()
    if access_token is None:
        raise ValueError("Unauthorized")
    user_id = access_token.claims.get("user_id")
    if not isinstance(user_id, int):
        raise ValueError("Unauthorized")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user is None:
            raise ValueError("Unauthorized")
        return user


async def get_user_devices(user_id: int) -> list[dict]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Device)
            .join(user_device_association)
            .where(user_device_association.c.user_id == user_id)
        )
        devices = result.scalars().all()

    now = datetime.now(tz=timezone.utc)
    return [
        {
            "id": device.id,
            "name": device.name,
            "active": device.updated.replace(tzinfo=timezone.utc)
            > now - ACTIVE_THRESHOLD,
        }
        for device in devices
    ]


@mcp.tool(description="Search movies and TV shows in TMDB by text query.")
async def tmdb_search(
    pattern: Annotated[
        str,
        Field(description="Text to search for (title, keyword, or phrase).", min_length=1),
    ],
    page: Annotated[int, Field(description="TMDB result page number.", ge=1)] = 1,
    language: Annotated[
        str | None,
        Field(
            description=(
                "Optional IETF language tag for localized results (for example: en-US, hu-HU)."
            )
        ),
    ] = None,
) -> dict:
    await get_authenticated_user()
    data, total_pages = await search_media(pattern=pattern, page=page, language=language)
    return {"data": data, "meta": {"totalPages": total_pages}}


@mcp.tool(
    description=(
        "Search nCore torrents for the authenticated user with filtering and pagination."
    )
)
async def ncore_search(
    pattern: Annotated[
        str,
        Field(
            description="Text to search for in nCore.",
            min_length=1,
        ),
    ],
    category: Annotated[
        SearchParamType,
        Field(description="Torrent category filter."),
    ] = SearchParamType.ALL_OWN,
    where: Annotated[
        SearchParamWhere,
        Field(description="Search scope used for matching the pattern."),
    ] = SearchParamWhere.NAME,
    page: Annotated[int, Field(description="nCore result page number.", ge=1)] = 1,
) -> dict:
    user = await get_authenticated_user()
    torrents, total_pages = await search_torrents_for_user(
        user=user,
        pattern=pattern,
        category=category.value,
        where=where.value,
        page=page,
    )
    return {"data": {"torrents": torrents}, "meta": {"totalPages": total_pages}}


@mcp.tool(
    description=(
        "Queue a torrent download on one of the authenticated user's configured devices."
    )
)
async def add_download(
    torrent_id: Annotated[
        int,
        Field(description="The nCore torrent identifier to download.", ge=1),
    ],
    device_id: Annotated[
        int,
        Field(description="The target device identifier.", ge=1),
    ],
) -> dict:
    user = await get_authenticated_user()
    async with AsyncSessionLocal() as session:
        try:
            await add_download_for_user(
                session=session,
                user=user,
                torrent_id=torrent_id,
                device_id=device_id,
            )
        except DeviceNotFoundError as exception:
            raise ValueError("Device not found") from exception
        except TorrentNotFoundError as exception:
            raise ValueError("Torrent not found") from exception
        except InvalidNcoreCredentialsError as exception:
            raise ValueError("Invalid Ncore credentials") from exception
        except NcoreUnavailableError as exception:
            raise ValueError("Could not connect to Ncore") from exception

    return {"message": "Torrent added successfully"}


@mcp.resource("context://me", mime_type="application/json")
async def context_me() -> str:
    user = await get_authenticated_user()
    payload = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "isAdmin": user.is_admin,
        "hasNcoreCredentials": bool(user.ncore_user and user.ncore_pass),
    }
    return json.dumps(payload)


@mcp.resource("context://devices", mime_type="application/json")
async def context_devices() -> str:
    user = await get_authenticated_user()
    devices = await get_user_devices(user.id)
    return json.dumps({"devices": devices})


@mcp.resource("context://download-workflow", mime_type="application/json")
async def context_download_workflow() -> str:
    await get_authenticated_user()
    payload = {
        "name": "TMDB to nCore download workflow",
        "description": (
            "How to use tmdb_search, ncore_search and add_download together."
        ),
        "steps": [
            {
                "step": 1,
                "title": "Search movie/series in TMDB",
                "tool": "tmdb_search",
                "input": {
                    "pattern": "The Last of Us",
                    "page": 1,
                    "language": "en-US",
                },
                "notes": [
                    "Pick the best matching movie or TV entry from data[]",
                    "Read the selected item's imdb_id from the TMDB response",
                ],
            },
            {
                "step": 2,
                "title": "Search nCore with IMDb id",
                "tool": "ncore_search",
                "input": {
                    "pattern": "tt3581920",
                    "where": "imdb",
                    "category": "all_own",
                    "page": 1,
                },
                "notes": ["Choose the best torrent result and keep its id"],
            },
            {
                "step": 3,
                "title": "Download to a user device",
                "tool": "add_download",
                "input": {
                    "torrent_id": 12345678,
                    "device_id": 42,
                },
                "notes": [
                    "Read available devices from context://devices",
                    "Use the selected device's id as device_id",
                ],
            },
        ],
        "relatedContext": ["context://devices", "context://me"],
    }
    return json.dumps(payload)


mcp_http_app = mcp.http_app(path="/", transport="streamable-http")
mcp_sse_app = mcp.http_app(path="/", transport="sse")
