from cryptography.fernet import Fernet
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from service.util.auth import manager, Hasher
from service.util.configuration import SECRET_KEY
from service.util.logger import logger
from service.models.database import AsyncSession, User, get_session, select
from service.models.api import NewUserData, MeData, ModifyMyData


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
    except Exception as e:  # pylint: disable=broad-exception-caught
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


@router.patch("/me/")
async def modify_user(data: ModifyMyData, session: AsyncSession = Depends(get_session), user: User = Depends(manager)):
    result = await session.execute(select(User).where(User.id == user.id))
    user_object = result.scalars().first()

    if user_object is None:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    if (
        isinstance(data.ncore_user, str)
        and isinstance(data.ncore_pass, str)
    ):
        cipher_suite = Fernet(SECRET_KEY)
        user_object.ncore_user = data.ncore_user
        user_object.ncore_pass = cipher_suite.encrypt(data.ncore_pass.encode("utf-8")) if data.ncore_pass else ""
    await session.commit()
    return JSONResponse({"message": f"User {user.id} updated successfully"})


@router.get("/me/")
def get_user(user: User = Depends(manager)):
    return JSONResponse(
        MeData(
            email=user.email,
            is_admin=user.is_admin,
            name=user.name,
            ncore_user=user.ncore_user,
            is_ncore_credential_set=bool(user.ncore_user and user.ncore_pass)
        ).model_dump(),
        status_code=200,
    )


def dump_user(user: User) -> dict:
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}
