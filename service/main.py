from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette import status
from service.api.auth import router as login_router
from service.api.users import router as users_router
from service.api.devices import router as devices_router
from service.api.client import router as client_router
from service.api.download import router as download_router
from service.api.status import router as status_router
from service.api.omdb import router as omdb_router
from service.models.database import init_db, User
from service.util.auth import create_admin_user, manager


allowed_origins = [
    "http://localhost:3000",
    "https://cdm.radaron.hu",
]


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
app.include_router(omdb_router, prefix="/api/omdb")
app.add_middleware(
    CORSMiddleware, allow_origins=allowed_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/favicon.png", response_class=HTMLResponse)
async def favicon(request: Request):  # pylint: disable=unused-argument
    return RedirectResponse(url="/static/favicon.png", status_code=status.HTTP_302_FOUND)


@app.get("/", response_class=HTMLResponse)
async def root(request: Request):  # pylint: disable=unused-argument
    return RedirectResponse(url="/manage/download", status_code=status.HTTP_302_FOUND)


@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):  # pylint: disable=unused-argument
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/{full_path:path}", response_class=HTMLResponse)
async def manage(request: Request, user: User = Depends(manager.optional)):
    if user is None:
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse(request=request, name="index.html")
