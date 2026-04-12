from contextlib import asynccontextmanager
from urllib.parse import quote

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette import status

from service.api.auth import router as login_router
from service.api.client import router as client_router
from service.api.devices import router as devices_router
from service.api.download import router as download_router
from service.api.oauth import router as oauth_router
from service.api.status import router as status_router
from service.api.tmdb import router as tmdb_router
from service.api.users import router as users_router
from service.mcp_server import mcp_http_app, mcp_sse_app
from service.models.database import init_db
from service.util.auth import create_admin_user, manager
from service.util.configuration import ALLOWED_ORIGINS

allowed_origins = ALLOWED_ORIGINS
NON_SPA_PREFIXES = ("/api", "/assets", "/mcp", "/.well-known")


@asynccontextmanager
async def lifespan(app_obj: FastAPI):  # pylint: disable=unused-argument
    async with mcp_http_app.lifespan(app_obj), mcp_sse_app.lifespan(app_obj):
        await init_db()
        await create_admin_user()
        yield


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.include_router(login_router, prefix="/api/auth")
app.include_router(users_router, prefix="/api/users")
app.include_router(devices_router, prefix="/api/devices")
app.include_router(client_router, prefix="/api/client")
app.include_router(download_router, prefix="/api/download")
app.include_router(status_router, prefix="/api/status")
app.include_router(tmdb_router, prefix="/api/tmdb")
app.include_router(oauth_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/mcp/sse", mcp_sse_app, name="mcp-sse")
app.mount("/mcp", mcp_http_app, name="mcp")
templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):  # pylint: disable=unused-argument
    return RedirectResponse(url="/manage/tmdb", status_code=status.HTTP_302_FOUND)


@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):  # pylint: disable=unused-argument
    return templates.TemplateResponse(request=request, name="index.html")


@app.middleware("http")
async def spa_fallback(request: Request, call_next):
    response = await call_next(request)
    if request.method != "GET" or response.status_code != status.HTTP_404_NOT_FOUND:
        return response

    path = request.url.path
    if path.startswith(NON_SPA_PREFIXES):
        return response

    accept = request.headers.get("accept", "")
    if "text/html" not in accept and "*/*" not in accept:
        return response

    user = await manager.optional(request)
    if user is None:
        redirect_url = path
        if request.url.query:
            redirect_url += f"?{request.url.query}"
        return RedirectResponse(
            url=f"/login?redirectUrl={quote(redirect_url)}",
            status_code=status.HTTP_302_FOUND,
        )

    return templates.TemplateResponse(request=request, name="index.html")
