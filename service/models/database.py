from datetime import datetime, timezone
from typing import AsyncGenerator
from sqlalchemy import (  # pylint: disable=unused-import # noqa
    Column,
    Integer,
    String,
    select,
    Boolean,
    ForeignKey,
    DateTime,
    JSON,
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped, mapped_column


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
    id: Mapped[int] = mapped_column(primary_key=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(255), nullable=False)
    password = Column(String(255))
    is_admin = Column(Boolean(), default=False)
    devices: Mapped[list["Device"]] = relationship(back_populates="user")


class Device(Base):
    __tablename__ = "devices"
    id: Mapped[int] = mapped_column(primary_key=True)
    name = Column(String(255))
    token = Column(String(255))
    file_list = Column(JSON, default={})
    updated = Column(DateTime, default=datetime.now(tz=timezone.utc))
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"))
    user: Mapped["User"] = relationship(back_populates="devices")
