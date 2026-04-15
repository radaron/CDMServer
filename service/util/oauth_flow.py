import base64
import hashlib
import secrets
import time
from dataclasses import dataclass

from jwt import InvalidTokenError
from jwt import decode as jwt_decode
from jwt import encode as jwt_encode

from service.util.configuration import SECRET_KEY

AUTH_CODE_TTL_SECONDS = 300
REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60


@dataclass
class AuthorizationCodeData:
    code: str
    client_id: str
    redirect_uri: str
    user_email: str
    expires_at: int
    code_challenge: str | None = None
    code_challenge_method: str | None = None
    scope: str | None = None


authorization_codes: dict[str, AuthorizationCodeData] = {}


def create_authorization_code(
    client_id: str,
    redirect_uri: str,
    user_email: str,
    code_challenge: str | None = None,
    code_challenge_method: str | None = None,
    scope: str | None = None,
) -> AuthorizationCodeData:
    code = secrets.token_urlsafe(32)
    data = AuthorizationCodeData(
        code=code,
        client_id=client_id,
        redirect_uri=redirect_uri,
        user_email=user_email,
        expires_at=int(time.time()) + AUTH_CODE_TTL_SECONDS,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        scope=scope,
    )
    authorization_codes[code] = data
    return data


def consume_authorization_code(code: str) -> AuthorizationCodeData | None:
    data = authorization_codes.pop(code, None)
    if data is None:
        return None
    if data.expires_at < int(time.time()):
        return None
    return data


def validate_pkce(
    code_verifier: str | None,
    code_challenge: str | None,
    code_challenge_method: str | None,
) -> bool:
    if code_challenge is None:
        return True
    if not code_verifier:
        return False
    method = (code_challenge_method or "plain").lower()
    if method == "plain":
        return code_verifier == code_challenge
    if method == "s256":
        digest = hashlib.sha256(code_verifier.encode("utf-8")).digest()
        encoded = base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")
        return encoded == code_challenge
    return False


def create_refresh_token(
    *,
    client_id: str,
    user_id: int,
    user_email: str,
    client_secret_hash: str,
    scope: str,
) -> str:
    expires_at = int(time.time()) + REFRESH_TOKEN_TTL_SECONDS
    return jwt_encode(
        {
            "sub": user_email,
            "token_use": "mcp_refresh",
            "client_id": client_id,
            "mcp_user_id": user_id,
            "mcp_client_secret_hash": client_secret_hash,
            "scope": scope,
            "exp": expires_at,
        },
        SECRET_KEY,
        algorithm="HS256",
    )


def decode_refresh_token(refresh_token: str) -> dict | None:
    try:
        payload = jwt_decode(refresh_token, SECRET_KEY, algorithms=["HS256"])
    except InvalidTokenError:
        return None

    if payload.get("token_use") != "mcp_refresh":
        return None
    if not isinstance(payload.get("client_id"), str):
        return None
    if not isinstance(payload.get("mcp_user_id"), int):
        return None
    if not isinstance(payload.get("mcp_client_secret_hash"), str):
        return None
    return payload
