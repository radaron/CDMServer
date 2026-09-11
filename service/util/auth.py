import uuid
from datetime import datetime, timezone

from fastapi import Request
from fastapi_login import LoginManager
from jwt import InvalidTokenError
from jwt import decode as jwt_decode
from jwt import encode as jwt_encode
from passlib.context import CryptContext
from sqlalchemy import delete
from sqlalchemy.future import select

from service.models.database import AsyncSessionLocal, RefreshSession, User
from service.util.configuration import settings

REFRESH_COOKIE_NAME = "refresh-token"
USER_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

manager = LoginManager(
    settings.secret_key, token_url="/api/auth/login/", use_cookie=False
)


@manager.user_loader()
async def load_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalars().first()


async def create_admin_user():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == settings.admin_email)
        )
        admin_user = result.scalars().first()
        if admin_user:
            admin_user.password = Hasher.get_password_hash(settings.admin_password)
        else:
            admin_user = User(
                email=settings.admin_email,
                password=Hasher.get_password_hash(settings.admin_password),
                is_admin=True,
                name="Admin",
            )
            session.add(admin_user)
        await session.commit()


def client_type_from_user_agent(user_agent: str) -> str:
    match user_agent:
        case ua if ua.startswith("CDMServerCli/"):
            return "cli"
        case ua if "Mozilla" in ua:
            return "browser"
        case _:
            return "unknown"


def decode_user_refresh_token(refresh_token: str) -> dict | None:
    try:
        payload = jwt_decode(
            refresh_token,
            settings.secret_key,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
    except InvalidTokenError:
        return None
    if payload.get("token_use") != "user_refresh":
        return None
    if not isinstance(payload.get("sub"), str):
        return None
    if not isinstance(payload.get("user_id"), int):
        return None
    if not isinstance(payload.get("jti"), str):
        return None
    return payload


async def create_refresh_token_and_session(
    user_email: str, user_id: int, client_type: str = "browser"
) -> str:
    jti = str(uuid.uuid4())
    token = jwt_encode(
        {
            "sub": user_email,
            "user_id": user_id,
            "token_use": "user_refresh",
            "jti": jti,
        },
        settings.secret_key,
        algorithm="HS256",
    )
    async with AsyncSessionLocal() as session:
        session.add(RefreshSession(jti=jti, user_id=user_id, client_type=client_type))
        await session.commit()
    return token


async def validate_and_touch_session(
    jti: str, client_type: str
) -> RefreshSession | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(RefreshSession).where(RefreshSession.jti == jti)
        )
        row = result.scalars().first()
        if not row:
            return None
        row.last_used_at = datetime.now(tz=timezone.utc)
        row.client_type = client_type
        await session.commit()
        return row


async def delete_refresh_session_by_jti(jti: str) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(delete(RefreshSession).where(RefreshSession.jti == jti))
        await session.commit()


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
