import secrets
import time
from urllib.parse import parse_qsl, quote, urlencode, urlparse, urlunparse

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse

from service.models.database import User
from service.util.auth import manager
from service.util.oauth_flow import create_authorization_code

router = APIRouter()
OAUTH_BASE_PATH = "/api/auth/oauth"


def append_query_params(url: str, **kwargs: str) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.update(kwargs)
    return urlunparse(parsed._replace(query=urlencode(query)))


def _first_proxy_value(value: str | None) -> str | None:
    if value is None:
        return None
    first_value = value.split(",", maxsplit=1)[0].strip()
    return first_value or None


def _forwarded_header_params(request: Request) -> dict[str, str]:
    forwarded = request.headers.get("forwarded")
    if not forwarded:
        return {}

    params: dict[str, str] = {}
    first_entry = forwarded.split(",", maxsplit=1)[0]
    for item in first_entry.split(";"):
        key, separator, raw_value = item.partition("=")
        if not separator:
            continue
        params[key.strip().lower()] = raw_value.strip().strip('"')
    return params


def _external_base_url(request: Request) -> str:
    parsed_base_url = urlparse(str(request.base_url))
    forwarded = _forwarded_header_params(request)

    scheme = (
        forwarded.get("proto")
        or _first_proxy_value(request.headers.get("x-forwarded-proto"))
        or parsed_base_url.scheme
    )
    host = (
        forwarded.get("host")
        or _first_proxy_value(request.headers.get("x-forwarded-host"))
        or parsed_base_url.netloc
    )

    if host == parsed_base_url.hostname:
        forwarded_port = (
            _first_proxy_value(request.headers.get("x-forwarded-port"))
            or parsed_base_url.port
        )
        if forwarded_port:
            port = str(forwarded_port)
            if (scheme == "https" and port != "443") or (
                scheme == "http" and port != "80"
            ):
                host = f"{host}:{port}"

    return f"{scheme}://{host}".rstrip("/")


def build_oauth_metadata(request: Request) -> dict:
    base_url = _external_base_url(request)
    oauth_issuer = f"{base_url}{OAUTH_BASE_PATH}"
    return {
        "issuer": oauth_issuer,
        "authorization_endpoint": f"{oauth_issuer}/authorize",
        "token_endpoint": f"{oauth_issuer}/token",
        "registration_endpoint": f"{oauth_issuer}/register",
        "grant_types_supported": ["authorization_code"],
        "response_types_supported": ["code"],
        "token_endpoint_auth_methods_supported": [
            "none",
            "client_secret_post",
            "client_secret_basic",
        ],
        "code_challenge_methods_supported": ["S256", "plain"],
        "scopes_supported": ["cdm:mcp"],
    }


def build_openid_metadata(request: Request) -> dict:
    metadata = build_oauth_metadata(request)
    metadata.update(
        {
            "subject_types_supported": ["public"],
            "id_token_signing_alg_values_supported": ["HS256"],
        }
    )
    return metadata


async def _read_registration_payload(request: Request) -> dict:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        payload = await request.json()
        return payload if isinstance(payload, dict) else {}
    form = await request.form()
    return dict(form)


@router.post("/api/auth/oauth/register")
async def oauth_register_client(request: Request):
    payload = await _read_registration_payload(request)

    redirect_uris = payload.get("redirect_uris", payload.get("redirectUris", []))
    if isinstance(redirect_uris, str):
        redirect_uris = [redirect_uris]
    if not isinstance(redirect_uris, list) or any(
        not isinstance(uri, str) for uri in redirect_uris
    ):
        return JSONResponse({"error": "invalid_client_metadata"}, status_code=400)

    token_endpoint_auth_method = payload.get("token_endpoint_auth_method", "none")
    supported_auth_methods = {"none", "client_secret_post", "client_secret_basic"}
    if token_endpoint_auth_method not in supported_auth_methods:
        return JSONResponse({"error": "invalid_client_metadata"}, status_code=400)

    now = int(time.time())
    response: dict = {
        "client_id": secrets.token_urlsafe(24),
        "client_id_issued_at": now,
        "redirect_uris": redirect_uris,
        "grant_types": ["authorization_code"],
        "response_types": ["code"],
        "token_endpoint_auth_method": token_endpoint_auth_method,
        "scope": "cdm:mcp",
    }
    if token_endpoint_auth_method != "none":
        response["client_secret"] = secrets.token_urlsafe(32)
        response["client_secret_expires_at"] = 0

    return JSONResponse(response, status_code=201)


@router.get("/api/auth/oauth/authorize")
async def oauth_authorize(request: Request, user: User = Depends(manager.optional)):
    query = request.query_params
    response_type = query.get("response_type")
    client_id = query.get("client_id")
    redirect_uri = query.get("redirect_uri")
    state = query.get("state")
    scope = query.get("scope")
    code_challenge = query.get("code_challenge")
    code_challenge_method = query.get("code_challenge_method")

    if response_type != "code":
        return JSONResponse({"error": "unsupported_response_type"}, status_code=400)
    if not client_id or not redirect_uri:
        return JSONResponse({"error": "invalid_request"}, status_code=400)

    if user is None:
        redirect_url = request.url.path
        if request.url.query:
            redirect_url += f"?{request.url.query}"
        return RedirectResponse(
            url=f"/login?redirectUrl={quote(redirect_url)}", status_code=302
        )

    if not user.mcp_client_secret_hash:
        target = append_query_params(
            redirect_uri, error="access_denied", state=state or ""
        )
        return RedirectResponse(url=target, status_code=302)

    code_data = create_authorization_code(
        client_id=client_id,
        redirect_uri=redirect_uri,
        user_email=user.email,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        scope=scope,
    )
    target = append_query_params(redirect_uri, code=code_data.code, state=state or "")
    return RedirectResponse(url=target, status_code=302)


@router.get("/.well-known/oauth-authorization-server/mcp")
@router.get("/.well-known/oauth-authorization-server/mcp/sse")
@router.get("/mcp/.well-known/oauth-authorization-server")
@router.get("/mcp/sse/.well-known/oauth-authorization-server")
async def oauth_authorization_server_metadata(request: Request):
    return JSONResponse(build_oauth_metadata(request))


@router.get("/.well-known/openid-configuration/mcp")
@router.get("/.well-known/openid-configuration/mcp/sse")
@router.get("/mcp/.well-known/openid-configuration")
@router.get("/mcp/sse/.well-known/openid-configuration")
@router.get("/mcp/sse//.well-known/openid-configuration")
async def openid_configuration(request: Request):
    return JSONResponse(build_openid_metadata(request))
