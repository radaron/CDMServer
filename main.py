from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from api.login import router as login_router
from api.manage import router as manage_router


app = FastAPI()
app.include_router(login_router, prefix="/auth")
app.include_router(manage_router, prefix="/manage")
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


@app.get("/status")
async def read_root():
    return {"status": "OK"}


@app.get("/", response_class=HTMLResponse)
async def read_item(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html"
    )
