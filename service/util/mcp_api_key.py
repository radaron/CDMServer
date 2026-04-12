import hashlib
import hmac
import secrets

from service.util.configuration import SECRET_KEY


def generate_mcp_client_secret() -> str:
    return secrets.token_urlsafe(48)


def hash_mcp_client_secret(client_secret: str) -> str:
    return hmac.new(
        SECRET_KEY.encode("utf-8"), client_secret.encode("utf-8"), hashlib.sha256
    ).hexdigest()
