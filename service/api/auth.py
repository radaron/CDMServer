from datetime import timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from fastapi_login.exceptions import InvalidCredentialsException
from sqlalchemy import select

from service.models.api import LoginData
from service.models.database import AsyncSessionLocal, User
from service.util.auth import COOKIE_NAME, Hasher, load_user, manager
from service.util.oauth_flow import (
    consume_authorization_code,
    create_refresh_token,
    decode_refresh_token,
    validate_pkce,
)

router = APIRouter()
ACCESS_TOKEN_EXPIRATION = timedelta(minutes=30)


@router.post("/login/")
async def login(data: LoginData):
    email = data.email
    password = data.password
    user = await load_user(email)
    if not user or not Hasher.verify_password(password, user.password):
        raise InvalidCredentialsException
    expiration = timedelta(days=30) if data.keep_logged_in else timedelta(minutes=30)
    access_token = manager.create_access_token(data={"sub": email}, expires=expiration)
    response = JSONResponse({"message": "Successfully logged in"})
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        max_age=int(expiration.total_seconds()),
    )
    return response


@router.post("/logout/")
async def logout(_=Depends(manager)):
    response = JSONResponse({"message": "Successfully logged out"})
    response.delete_cookie(COOKIE_NAME)
    return response


@router.post("/oauth/token")
async def oauth_token(request: Request):
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        payload = await request.json()
        grant_type = payload.get("grant_type", payload.get("grantType"))
        client_id = payload.get("client_id", payload.get("clientId"))
        code = payload.get("code")
        redirect_uri = payload.get("redirect_uri", payload.get("redirectUri"))
        code_verifier = payload.get("code_verifier", payload.get("codeVerifier"))
        refresh_token = payload.get("refresh_token", payload.get("refreshToken"))
    else:
        form = await request.form()
        grant_type = form.get("grant_type")
        client_id = form.get("client_id")
        code = form.get("code")
        redirect_uri = form.get("redirect_uri")
        code_verifier = form.get("code_verifier")
        refresh_token = form.get("refresh_token")

    if not isinstance(grant_type, str) or not isinstance(client_id, str):
        return JSONResponse({"error": "invalid_request"}, status_code=400)

    if grant_type == "authorization_code":
        if not isinstance(code, str) or not isinstance(redirect_uri, str):
            return JSONResponse({"error": "invalid_request"}, status_code=400)
        return await _exchange_authorization_code(
            client_id=client_id,
            code=code,
            redirect_uri=redirect_uri,
            code_verifier=code_verifier if isinstance(code_verifier, str) else None,
        )

    if grant_type == "refresh_token":
        if not isinstance(refresh_token, str):
            return JSONResponse({"error": "invalid_request"}, status_code=400)
        return await _refresh_access_token(
            client_id=client_id,
            refresh_token=refresh_token,
        )

    return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)


async def _exchange_authorization_code(
    client_id: str,
    code: str,
    redirect_uri: str,
    code_verifier: str | None,
) -> JSONResponse:
    code_data = consume_authorization_code(code)
    if code_data is None:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    if code_data.client_id != client_id or code_data.redirect_uri != redirect_uri:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    if not validate_pkce(
        code_verifier=code_verifier,
        code_challenge=code_data.code_challenge,
        code_challenge_method=code_data.code_challenge_method,
    ):
        return JSONResponse({"error": "invalid_grant"}, status_code=400)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == code_data.user_email)
        )
        authorized_user = result.scalars().first()

    if code_data.client_id != client_id:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    if authorized_user is None:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    if not authorized_user.mcp_client_secret_hash:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)

    return _build_token_response(
        client_id=client_id,
        authorized_user=authorized_user,
        scope=code_data.scope or "cdm:mcp",
    )


async def _refresh_access_token(client_id: str, refresh_token: str) -> JSONResponse:
    refresh_payload = decode_refresh_token(refresh_token)
    if refresh_payload is None:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    if refresh_payload["client_id"] != client_id:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.id == refresh_payload["mcp_user_id"])
        )
        authorized_user = result.scalars().first()

    if authorized_user is None:
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    if (
        not authorized_user.mcp_client_secret_hash
        or authorized_user.mcp_client_secret_hash
        != refresh_payload["mcp_client_secret_hash"]
    ):
        return JSONResponse({"error": "invalid_grant"}, status_code=400)

    scope = refresh_payload.get("scope")
    return _build_token_response(
        client_id=client_id,
        authorized_user=authorized_user,
        scope=scope if isinstance(scope, str) else "cdm:mcp",
    )


def _build_token_response(
    client_id: str, authorized_user: User, scope: str
) -> JSONResponse:
    access_token = manager.create_access_token(
        data={
            "sub": authorized_user.email,
            "token_use": "mcp_access",
            "mcp_user_id": authorized_user.id,
            "mcp_client_secret_hash": authorized_user.mcp_client_secret_hash,
        },
        expires=ACCESS_TOKEN_EXPIRATION,
    )
    refresh_token = create_refresh_token(
        client_id=client_id,
        user_id=authorized_user.id,
        user_email=authorized_user.email,
        client_secret_hash=authorized_user.mcp_client_secret_hash,
        scope=scope,
    )
    return JSONResponse(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": int(ACCESS_TOKEN_EXPIRATION.total_seconds()),
            "scope": scope,
        }
    )
