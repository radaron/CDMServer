from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends, HTTPException
from fastapi_login.exceptions import InvalidCredentialsException
from service.util.auth import manager, load_user
from service.models.database import AsyncSession, User, get_session
from service.models.api import RegisterData, LoginData


router = APIRouter()


@router.post('/token')
async def login(data: LoginData):
    email = data.email
    password = data.password
    user = await load_user(email)
    if not user or user.password != password:
        raise InvalidCredentialsException
    access_token = manager.create_access_token(
        data={"sub": email}
    )
    response = JSONResponse({"message": "Successfully logged in"})
    manager.set_cookie(response, access_token)
    return response


@router.post("/users")
async def register(data: RegisterData, session: AsyncSession = Depends(get_session), user=Depends(manager)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail={"message": "Forbidden"})
    new_user = User(
        email=data.email,
        password=data.password,
        is_admin=data.is_admin
    )
    session.add(new_user)
    await session.commit()
    return JSONResponse({"message": "User created successfully"})
