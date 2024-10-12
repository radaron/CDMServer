from fastapi import APIRouter, Depends
from service.util.auth import manager

router = APIRouter()


@router.get('/me')
def protected_route(user=Depends(manager)):
    return {"message": f"Hello, {user['username']}!"}
