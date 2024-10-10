from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


# Define the connection string
username = 'myuser'
password = 'mypassword'
hostname = 'mysql'
database_name = 'mydatabase'

DATABASE_URL = f'mysql+aiomysql://{username}:{password}@{hostname}/{database_name}'

async_engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    name = Column(String(255))
    password = Column(String(255))
