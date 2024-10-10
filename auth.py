from fastapi_login import LoginManager


SECRET = "your-secret-key"
manager = LoginManager(SECRET, token_url="/auth/token", use_cookie=True)

# Dummy user database
fake_db = {
    "user1": {"username": "user1", "password": "password1", "is_admin": True},
}


@manager.user_loader()
def load_user(username: str):
    return fake_db.get(username)
