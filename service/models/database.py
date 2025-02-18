# pylint: disable=unused-import
import asyncio
from datetime import datetime, timezone
from typing import AsyncGenerator
from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    select,
    desc,
    Boolean,
    ForeignKey,
    DateTime,
    JSON,
    Table,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Mapped, mapped_column, selectinload
from service.util.configuration import DB_HOST, DB_NAME, DB_PASSWORD, DB_USER
from service.util.logger import logger
from service.constant import DEFAULT_DEVICE_SETTINGS


DATABASE_URL = f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"

engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine)
Base = declarative_base()


async def init_db(retries: int = 5, delay: int = 5):
    for attempt in range(retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            break
        except Exception as e:  # pylint: disable=broad-exception-caught
            if attempt < retries - 1:
                logger.warning("Database connection failed. Retrying in %s seconds...", delay)
                await asyncio.sleep(delay)
            else:
                logger.error("Database connection failed. Maximum retries reached.")
                raise e


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


# Association table for the many-to-many relationship
user_device_association = Table(
    "user_device_association",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("device_id", Integer, ForeignKey("devices.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(255), nullable=False)
    password = Column(String(255))
    is_admin = Column(Boolean(), default=False)
    devices: Mapped[list["Device"]] = relationship("Device", secondary=user_device_association, back_populates="users")
    ncore_user = Column(String(255), nullable=True)
    ncore_pass = Column(String(255), nullable=True)


class Device(Base):
    __tablename__ = "devices"
    id: Mapped[int] = mapped_column(primary_key=True)
    name = Column(String(255), unique=True)
    token = Column(String(255))
    file_list = Column(JSON, default={})
    settings = Column(JSON, default=DEFAULT_DEVICE_SETTINGS)
    updated = Column(DateTime, default=datetime.now(tz=timezone.utc))
    users: Mapped[list["User"]] = relationship("User", secondary=user_device_association, back_populates="devices")
    torrents: Mapped[list["Torrent"]] = relationship(back_populates="device")


class Torrent(Base):
    __tablename__ = "torrents"
    id: Mapped[int] = mapped_column(primary_key=True)
    torrent_id = Column(Integer)
    name = Column(String(255))
    status = Column(String(255))
    progress = Column(Integer)
    download_dir = Column(String(255))
    added_date = Column(DateTime)
    total_size = Column(BigInteger)
    eta = Column(Integer, nullable=True)
    device_id: Mapped[int] = Column(Integer, ForeignKey("devices.id"))
    device: Mapped["Device"] = relationship(back_populates="torrents")
