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
from service.api.status import router as status_router
from service.api.tmdb import router as tmdb_router
from service.api.users import router as users_router
from service.models.database import init_db
from service.util.auth import (
    REFRESH_COOKIE_NAME,
    create_admin_user,
    decode_user_refresh_token,
)
from service.util.configuration import ALLOWED_ORIGINS

allowed_origins = ALLOWED_ORIGINS
NON_SPA_PREFIXES = ("/api", "/assets")


@asynccontextmanager
async def lifespan(app_obj: FastAPI):  # pylint: disable=unused-argument
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
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

    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    has_session = (
        refresh_token is not None
        and decode_user_refresh_token(refresh_token) is not None
    )
    if not has_session:
        redirect_url = path
        if request.url.query:
            redirect_url += f"?{request.url.query}"
        return RedirectResponse(
            url=f"/login?redirectUrl={quote(redirect_url)}",
            status_code=status.HTTP_302_FOUND,
        )

    return templates.TemplateResponse(request=request, name="index.html")
