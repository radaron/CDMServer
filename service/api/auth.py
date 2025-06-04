from datetime import timedelta
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from fastapi_login.exceptions import InvalidCredentialsException
from service.util.auth import manager, load_user, COOKIE_NAME, Hasher
from service.models.api import LoginData


router = APIRouter()


@router.post("/login/")
async def login(data: LoginData):
    email = data.email
    password = data.password
    user = await load_user(email)
    if not user or not Hasher.verify_password(password, user.password):
        raise InvalidCredentialsException
    expiration = timedelta(days=7) if data.keep_logged_in else timedelta(minutes=30)
    access_token = manager.create_access_token(data={"sub": email}, expires=expiration)
    response = JSONResponse({"message": "Successfully logged in"})
    response.set_cookie(
        key=COOKIE_NAME,
        value=access_token,
        httponly=True,
        max_age=int(expiration.total_seconds()),
        # expires="persistent",
    )
    return response


@router.post("/logout/")
async def logout(_=Depends(manager)):
    response = JSONResponse({"message": "Successfully logged out"})
    response.delete_cookie(COOKIE_NAME)
    return response
