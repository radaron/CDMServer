from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from service.models.api import MeData, ModifyMyData, NewUserData, UserData
from service.models.database import (
    AsyncSession,
    Device,
    User,
    get_session,
    user_device_association,
)
from service.util.auth import Hasher, manager
from service.util.configuration import SECRET_KEY
from service.util.logger import logger

router = APIRouter()


@router.post("/")
async def register(
    data: NewUserData,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(manager),
):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    try:
        new_user = User(
            email=data.email,
            password=Hasher.get_password_hash(data.password),
            is_admin=data.is_admin,
            name=data.name,
        )
        session.add(new_user)
        await session.commit()
    except Exception as e:  # pylint: disable=broad-exception-caught
        logger.error(e)
        return JSONResponse({"message": "User creation failed"}, status_code=400)
    return JSONResponse({"message": "User created successfully"})


@router.get("/")
async def get_users(
    session: AsyncSession = Depends(get_session), user: User = Depends(manager)
):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    user_objects = await session.execute(select(User))
    user_objects = user_objects.scalars().all()
    return JSONResponse(
        {
            "data": {
                "users": [
                    UserData(id=u.id, email=u.email, name=u.name).model_dump()
                    for u in user_objects
                ]
            }
        }
    )


@router.delete("/{user_id}/")
async def delete_user(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(manager),
    user_id: int = None,
):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)

    if user_id == user.id:
        return JSONResponse({"message": "Cannot delete yourself"}, status_code=400)

    result = await session.execute(select(User).where(User.id == user_id))
    user_object = result.scalars().first()

    if user_object is None:
        return JSONResponse({"message": "User not found"}, status_code=404)

    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user_object.id)
        # Lazyload is buggy in async mode
        # See: https://stackoverflow.com/questions/68195361/how-to-properly-handle-many-to-many-in-async-sqlalchemy
        .options(selectinload(Device.users))
    )
    devices = result.scalars().all()
    for device in devices:
        if len(device.users) == 1:
            await session.delete(device)

    await session.delete(user_object)
    await session.commit()

    return JSONResponse({"message": f"User {user_id} deleted successfully"})


@router.patch("/me/")
async def modify_user(
    data: ModifyMyData,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(manager),
):
    result = await session.execute(select(User).where(User.id == user.id))
    user_object = result.scalars().first()

    if user_object is None:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    if isinstance(data.ncore_user, str) and isinstance(data.ncore_pass, str):
        cipher_suite = Fernet(SECRET_KEY)
        user_object.ncore_user = data.ncore_user
        user_object.ncore_pass = (
            cipher_suite.encrypt(data.ncore_pass.encode("utf-8"))
            if data.ncore_pass
            else ""
        )
    if isinstance(data.password, str) and len(data.password) > 0:
        user_object.password = Hasher.get_password_hash(data.password)

    await session.commit()
    return JSONResponse(
        {"message": f"User {user.id} updated successfully"}, status_code=200
    )


@router.get("/me/")
def get_user(user: User = Depends(manager)):
    return JSONResponse(
        MeData(
            email=user.email,
            is_admin=user.is_admin,
            name=user.name,
            ncore_user=user.ncore_user,
            is_ncore_credential_set=bool(user.ncore_user and user.ncore_pass),
        ).model_dump(),
        status_code=200,
    )
