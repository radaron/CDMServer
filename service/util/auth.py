from fastapi_login import LoginManager
from sqlalchemy.future import select
from service.models.database import AsyncSessionLocal, User
from passlib.context import CryptContext


SECRET = "your-secret-key"
COOKIE_NAME = "access-token"
manager = LoginManager(SECRET, token_url="/api/auth/login/", use_cookie=True, cookie_name=COOKIE_NAME)


@manager.user_loader()
async def load_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalars().first()


class Hasher:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    @classmethod
    def verify_password(cls, plain_password, hashed_password):
        return cls.pwd_context.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password):
        return cls.pwd_context.hash(password)
