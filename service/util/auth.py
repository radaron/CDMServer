from fastapi_login import LoginManager
from sqlalchemy.future import select
from passlib.context import CryptContext
from service.models.database import AsyncSessionLocal, User
from service.util.configuration import ADMIN_EMAIL, ADMIN_PASSWORD, SECRET_KEY


SECRET = SECRET_KEY
COOKIE_NAME = "access-token"
manager = LoginManager(SECRET, token_url="/api/auth/login/", use_cookie=True, cookie_name=COOKIE_NAME)


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
                email=ADMIN_EMAIL, password=Hasher.get_password_hash(ADMIN_PASSWORD), is_admin=True, name="Admin"
            )
            session.add(admin_user)
        await session.commit()


class Hasher:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    @classmethod
    def verify_password(cls, plain_password, hashed_password):
        return cls.pwd_context.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password):
        return cls.pwd_context.hash(password)
