from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from service.util.configuration import settings

SYNC_DATABASE_URL = f"mysql+pymysql://{settings.db_user}:{settings.db_password}@{settings.db_host}/{settings.db_name}"

engine = create_engine(SYNC_DATABASE_URL, pool_pre_ping=True)
SyncSession = sessionmaker(bind=engine)
