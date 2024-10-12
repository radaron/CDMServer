from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException as StarletteHTTPException
import starlette.status as status
from service.api.auth import router as login_router
from service.api.manage import router as manage_router

origins = [
    "http://localhost:3000",
]

app = FastAPI()
app.include_router(login_router, prefix="/api/auth")
app.include_router(manage_router, prefix="/api/manage")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
templates = Jinja2Templates(directory="templates")


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED):
        return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
    return HTMLResponse(
        status_code=exc.status_code,
        content=f"<h1>{exc.status_code}</h1><p>{exc.detail}</p>",
    )


@app.get("/", response_class=HTMLResponse)
@app.get("/login", response_class=HTMLResponse)
async def main(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html"
    )
