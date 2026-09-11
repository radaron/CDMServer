from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ncore_username: str
    ncore_password: str

    db_host: str
    db_port: str
    db_name: str
    db_user: str
    db_password: str

    redis_host: str
    redis_port: str

    admin_email: str
    admin_password: str

    tmdb_api_key: str
    secret_key: str

    allowed_origins: str
    smtp_from: str = ""
    smtp_token: str = ""
    smtp_host: str = ""
    smtp_port: int = 0

    @property
    def allowed_origins_list(self) -> list[str]:
        return self.allowed_origins.split(",")


settings = Settings()
