import time

from fastapi import Request
from fastapi_login import LoginManager
from jwt import InvalidTokenError
from jwt import decode as jwt_decode
from jwt import encode as jwt_encode
from passlib.context import CryptContext
from sqlalchemy.future import select

from service.models.database import AsyncSessionLocal, User
from service.util.configuration import ADMIN_EMAIL, ADMIN_PASSWORD, SECRET_KEY

REFRESH_COOKIE_NAME = "refresh-token"
USER_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

manager = LoginManager(SECRET_KEY, token_url="/api/auth/login/", use_cookie=False)


@manager.user_loader()
async def load_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalars().first()


async def create_admin_user():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        admin_user = result.scalars().first()
        if admin_user:
            admin_user.password = Hasher.get_password_hash(ADMIN_PASSWORD)
        else:
            admin_user = User(
                email=ADMIN_EMAIL,
                password=Hasher.get_password_hash(ADMIN_PASSWORD),
                is_admin=True,
                name="Admin",
            )
            session.add(admin_user)
        await session.commit()


def create_user_refresh_token(user_email: str, user_id: int) -> str:
    expires_at = int(time.time()) + USER_REFRESH_TOKEN_TTL_SECONDS
    return jwt_encode(
        {
            "sub": user_email,
            "user_id": user_id,
            "token_use": "user_refresh",
            "exp": expires_at,
        },
        SECRET_KEY,
        algorithm="HS256",
    )


def decode_user_refresh_token(refresh_token: str) -> dict | None:
    try:
        payload = jwt_decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
    except InvalidTokenError:
        return None
    if payload.get("token_use") != "user_refresh":
        return None
    if not isinstance(payload.get("sub"), str):
        return None
    if not isinstance(payload.get("user_id"), int):
        return None
    return payload


async def get_user_from_refresh_cookie(request: Request) -> User | None:
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        return None
    payload = decode_user_refresh_token(token)
    if not payload:
        return None
    return await load_user(payload["sub"])


class Hasher:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    @classmethod
    def verify_password(cls, plain_password, hashed_password):
        return cls.pwd_context.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password):
        return cls.pwd_context.hash(password)
