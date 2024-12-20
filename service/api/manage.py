from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from service.util.auth import manager
from service.models.api import MeData


router = APIRouter()


@router.get("/me/")
def protected_route(user=Depends(manager)):
    return JSONResponse(MeData(email=user.email, is_admin=user.is_admin, name=user.name).model_dump(), status_code=200)
