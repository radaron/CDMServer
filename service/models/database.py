from typing import AsyncGenerator
from sqlalchemy import Column, Integer, String, select, Boolean  # pylint: disable=unused-import # noqa
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base


# Define the connection string
USERNAME = "myuser"
PASSWORD = "mypassword"
HOSTNAME = "localhost"
DATABASE_NAME = "mydatabase"

DATABASE_URL = f"mysql+aiomysql://{USERNAME}:{PASSWORD}@{HOSTNAME}/{DATABASE_NAME}"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine)
Base = declarative_base()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(255), nullable=False)
    password = Column(String(255))
    is_admin = Column(Boolean(), default=False)
