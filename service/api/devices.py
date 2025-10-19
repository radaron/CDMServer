from datetime import datetime, timedelta, timezone
from secrets import token_hex

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from service.models.api import DeviceData, EditDeviceData, NewDeviceData
from service.models.database import (
    AsyncSession,
    Device,
    User,
    get_session,
    user_device_association,
)
from service.util.auth import manager

ACTIVE_THRESHOLD = timedelta(minutes=1)


router = APIRouter()


@router.get("/")
async def get_devices(
    user: User = Depends(manager), session: AsyncSession = Depends(get_session)
):
    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user.id)
        # Lazyload is buggy in async mode
        # See: https://stackoverflow.com/questions/68195361/how-to-properly-handle-many-to-many-in-async-sqlalchemy
        .options(selectinload(Device.users))
    )
    devices = result.scalars().all()
    return JSONResponse({"data": {"devices": [dump_device(d) for d in devices]}})


@router.post("/")
async def add_device(
    data: NewDeviceData,
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
):
    new_device = Device(name=data.name, token=token_hex(16))
    new_device.users.append(user)
    session.add(new_device)
    try:
        await session.commit()
    except IntegrityError as e:
        await session.rollback()
        if "Duplicate entry" in str(e.orig):
            return JSONResponse(
                {"message": "Device name already exists"}, status_code=409
            )
        raise
    return JSONResponse({"message": "Device added successfully"})


@router.put("/{device_id}/")
async def modify_device(
    data: EditDeviceData,
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
    device_id: int = None,
):
    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user.id, Device.id == device_id)
        # Lazyload is buggy in async mode
        # See: https://stackoverflow.com/questions/68195361/how-to-properly-handle-many-to-many-in-async-sqlalchemy
        .options(selectinload(Device.users))
    )
    device = result.scalars().first()

    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    device.settings = data.settings

    result = await session.execute(select(User).where(User.email.in_(data.user_emails)))
    users = result.scalars().all()

    if len(users) == 0:
        return JSONResponse(
            {"message": "At least 1 valid user should be added."}, status_code=400
        )

    device.users = users

    await session.commit()

    return JSONResponse({"message": "Device modified successfully"})


@router.delete("/{device_id}/")
async def delete_device(
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
    device_id: int = None,
):
    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user.id, Device.id == device_id)
    )
    device = result.scalars().first()

    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    await session.delete(device)
    await session.commit()

    return JSONResponse({"message": f"Device {device_id=} deleted successfully"})


def dump_device(device: Device) -> dict:
    updated_utc = device.updated.replace(tzinfo=timezone.utc)
    return DeviceData(
        id=device.id,
        name=device.name,
        active=updated_utc > datetime.now(tz=timezone.utc) - ACTIVE_THRESHOLD,
        updated=updated_utc.timestamp(),
        token=device.token,
        settings=device.settings,
        userEmails=[user.email for user in device.users],
    ).model_dump()
