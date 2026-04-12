from urllib.parse import parse_qsl, quote, urlencode, urlparse, urlunparse

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse

from service.models.database import User
from service.util.auth import manager
from service.util.oauth_flow import create_authorization_code

router = APIRouter()
OAUTH_BASE_PATH = "/api/auth/oauth"
MCP_WELL_KNOWN_PREFIXES = ("/mcp/.well-known", "/mcp/sse/.well-known")


def append_query_params(url: str, **kwargs: str) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.update(kwargs)
    return urlunparse(parsed._replace(query=urlencode(query)))


def build_oauth_metadata(request: Request) -> dict:
    base_url = str(request.base_url).rstrip("/")
    oauth_issuer = f"{base_url}{OAUTH_BASE_PATH}"
    return {
        "issuer": oauth_issuer,
        "authorization_endpoint": f"{oauth_issuer}/authorize",
        "token_endpoint": f"{oauth_issuer}/token",
        "grant_types_supported": ["authorization_code"],
        "response_types_supported": ["code"],
        "token_endpoint_auth_methods_supported": [
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


@router.get("/.well-known/oauth-authorization-server/mcp/sse")
async def oauth_authorization_server_metadata(request: Request):
    return JSONResponse(build_oauth_metadata(request))


@router.get("/.well-known/openid-configuration/mcp/sse")
@router.get("/mcp/sse/.well-known/openid-configuration")
async def openid_configuration(request: Request):
    return JSONResponse(build_openid_metadata(request))
