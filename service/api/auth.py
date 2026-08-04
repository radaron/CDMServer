from datetime import timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from fastapi_login.exceptions import InvalidCredentialsException

from service.models.api import LoginData
from service.util.auth import (
    REFRESH_COOKIE_NAME,
    USER_REFRESH_TOKEN_TTL_SECONDS,
    Hasher,
    create_user_refresh_token,
    decode_user_refresh_token,
    load_user,
    manager,
)

router = APIRouter()
ACCESS_TOKEN_EXPIRATION = timedelta(minutes=30)


@router.post("/login/")
async def login(data: LoginData):
    user = await load_user(data.email)
    if not user or not Hasher.verify_password(data.password, user.password):
        raise InvalidCredentialsException
    access_token = manager.create_access_token(
        data={"sub": data.email}, expires=ACCESS_TOKEN_EXPIRATION
    )
    refresh_token = create_user_refresh_token(data.email, user.id)
    response = JSONResponse(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": int(ACCESS_TOKEN_EXPIRATION.total_seconds()),
        }
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        max_age=USER_REFRESH_TOKEN_TTL_SECONDS,
        samesite="lax",
    )
    return response


@router.post("/logout/")
async def logout(_=Depends(manager)):
    response = JSONResponse({"message": "Successfully logged out"})
    response.delete_cookie(REFRESH_COOKIE_NAME)
    return response


@router.post("/refresh/")
async def refresh(request: Request):
    body = {}
    try:
        body = await request.json()
    except Exception:
        pass
    token = body.get("refresh_token") or request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        return JSONResponse({"error": "missing_token"}, status_code=401)
    payload = decode_user_refresh_token(token)
    if payload is None:
        return JSONResponse({"error": "invalid_token"}, status_code=401)
    user = await load_user(payload["sub"])
    if user is None:
        return JSONResponse({"error": "invalid_token"}, status_code=401)
    access_token = manager.create_access_token(
        data={"sub": user.email}, expires=ACCESS_TOKEN_EXPIRATION
    )
    return JSONResponse(
        {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": int(ACCESS_TOKEN_EXPIRATION.total_seconds()),
        }
    )
