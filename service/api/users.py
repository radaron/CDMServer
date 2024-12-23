from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from service.util.auth import manager, Hasher
from service.util.logger import logger
from service.models.database import AsyncSession, User, get_session, select
from service.models.api import NewUserData, MeData


router = APIRouter()


@router.post("/")
async def register(data: NewUserData, session: AsyncSession = Depends(get_session), user: User = Depends(manager)):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    try:
        new_user = User(
            email=data.email, password=Hasher.get_password_hash(data.password), is_admin=data.is_admin, name=data.name
        )
        session.add(new_user)
        await session.commit()
    except Exception as e:
        logger.error(e)
        return JSONResponse({"message": "User creation failed"}, status_code=400)
    return JSONResponse({"message": "User created successfully"})


@router.get("/")
async def get_users(session: AsyncSession = Depends(get_session), user: User = Depends(manager)):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    user_objects = await session.execute(select(User))
    user_objects = user_objects.scalars().all()
    return JSONResponse({"data": {"users": [dump_user(u) for u in user_objects]}})


@router.delete("/{user_id}/")
async def delete_user(session: AsyncSession = Depends(get_session), user: User = Depends(manager), user_id: int = None):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)

    result = await session.execute(select(User).where(User.id == user_id))
    user_object = result.scalars().first()

    if user_object is None:
        return JSONResponse({"message": "User not found"}, status_code=404)

    await session.delete(user_object)
    await session.commit()

    return JSONResponse({"message": f"User {user_id} deleted successfully"})


@router.get("/me/")
def protected_route(user: User = Depends(manager)):
    return JSONResponse(MeData(email=user.email, is_admin=user.is_admin, name=user.name).model_dump(), status_code=200)


# TODO: Remove this endpoint
@router.get("/hack/")
async def hack(session: AsyncSession = Depends(get_session)):
    new_user = User(email="admin@admin.hu", password=Hasher.get_password_hash("admin"), is_admin=True, name="Admin")
    session.add(new_user)
    await session.commit()
    return JSONResponse({"message": "User created successfully"})


def dump_user(user: User) -> dict:
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}
