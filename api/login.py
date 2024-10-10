from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from fastapi_login.exceptions import InvalidCredentialsException
from auth import manager, load_user

router = APIRouter()


@router.post('/token')
async def login(data: OAuth2PasswordRequestForm = Depends()):
    email = data.username
    password = data.password
    user = load_user(email)
    if not user or user['password'] != password:
        raise InvalidCredentialsException
    access_token = manager.create_access_token(
        data={"sub": email}
    )
    response = JSONResponse({"access_token": access_token, "token_type": "bearer"})
    manager.set_cookie(response, access_token)
    return response


@router.post("/register")
async def register(username: str, password: str):
    # Implement your login logic here
    return {"username": username, "message": "Registered successful"}
