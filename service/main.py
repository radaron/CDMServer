from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette import status
from service.api.auth import router as login_router
from service.api.users import router as users_router
from service.api.devices import router as devices_router
from service.api.client import router as client_router
from service.api.download import router as download_router
from service.api.status import router as status_router
from service.util.logger import logger


origins = [
    "http://localhost:3000",
]

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(login_router, prefix="/api/auth")
app.include_router(users_router, prefix="/api/users")
app.include_router(devices_router, prefix="/api/devices")
app.include_router(client_router, prefix="/api/client")
app.include_router(download_router, prefix="/api/download")
app.include_router(status_router, prefix="/api/status")
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(exc)
    # if exc.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED):
    #     return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    return HTMLResponse(
        status_code=exc.status_code,
        content=f"<h1>{exc.status_code}</h1><p>{exc.detail}</p>",
    )


@app.get("/", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
@app.get("/manage", response_class=HTMLResponse)
async def main(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")
