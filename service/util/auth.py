from fastapi_login import LoginManager
from sqlalchemy.future import select
from service.models.database import AsyncSessionLocal, User


SECRET = "your-secret-key"
COOKIE_NAME = "access-token"
manager = LoginManager(SECRET, token_url="/api/auth/token/", use_cookie=True, cookie_name=COOKIE_NAME)


@manager.user_loader()
async def load_user(email: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalars().first()
