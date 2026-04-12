import json
from datetime import datetime, timedelta, timezone

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken, TokenVerifier
from fastmcp.server.dependencies import get_access_token
from jwt import InvalidTokenError
from jwt import decode as jwt_decode
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


@mcp.tool()
async def tmdb_search(pattern: str, page: int = 1, language: str | None = None) -> dict:
    await get_authenticated_user()
    data, total_pages = await search_media(pattern=pattern, page=page, language=language)
    return {"data": data, "meta": {"totalPages": total_pages}}


@mcp.tool()
async def ncore_search(
    pattern: str,
    category: str = "all_own",
    where: str = "name",
    page: int = 1,
) -> dict:
    user = await get_authenticated_user()
    torrents, total_pages = await search_torrents_for_user(
        user=user,
        pattern=pattern,
        category=category,
        where=where,
        page=page,
    )
    return {"data": {"torrents": torrents}, "meta": {"totalPages": total_pages}}


@mcp.tool()
async def add_download(torrent_id: int, device_id: int) -> dict:
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


mcp_sse_app = mcp.http_app(path="/sse", transport="sse")
