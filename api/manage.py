from fastapi import APIRouter, Depends
from auth import manager

router = APIRouter()


@router.get('/me')
def protected_route(user=Depends(manager)):
    return {"message": f"Hello, {user['username']}!"}
