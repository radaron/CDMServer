from os import environ


NCORE_USERNAME = environ["NCORE_USERNAME"]
NCORE_PASSWORD = environ["NCORE_PASSWORD"]

DB_HOST = environ["DB_HOST"]
DB_PORT = environ["DB_PORT"]
DB_NAME = environ["DB_NAME"]
DB_USER = environ["DB_USER"]
DB_PASSWORD = environ["DB_PASSWORD"]

REDIS_HOST = environ["REDIS_HOST"]
REDIS_PORT = environ["REDIS_PORT"]

ADMIN_EMAIL = environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = environ["ADMIN_PASSWORD"]

OMDB_API_KEY = environ["OMDB_API_KEY"]

SECRET_KEY = environ["SECRET_KEY"]
