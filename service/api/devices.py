from secrets import token_hex
from datetime import timedelta, datetime, timezone
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from service.util.auth import manager
from service.models.api import NewDeviceData, EditDeviceData
from service.models.database import AsyncSession, get_session, select, Device, User


ACTIVE_THRESHOLD = timedelta(minutes=1)


router = APIRouter()


@router.get("/")
async def get_devices(user: User = Depends(manager), session: AsyncSession = Depends(get_session)):
    devices = await session.execute(select(Device).where(Device.user_id == user.id))
    devices = devices.scalars().all()
    return JSONResponse({"data": {"devices": [dump_device(d) for d in devices]}})


@router.post("/")
async def add_device(data: NewDeviceData, user: User = Depends(manager), session: AsyncSession = Depends(get_session)):
    new_device = Device(user=user, name=data.name, token=token_hex(16))
    session.add(new_device)
    await session.commit()
    return JSONResponse({"message": "Device added successfully"})


@router.put("/{device_id}/")
async def modify_device(
    data: EditDeviceData,
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
    device_id: int = None,
):
    result = await session.execute(select(Device).where(Device.user_id == user.id, Device.id == device_id))
    device = result.scalars().first()

    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    device.settings = data.settings
    await session.commit()

    return JSONResponse({"message": "Device added successfully"})


@router.delete("/{device_id}/")
async def delete_device(
    user: User = Depends(manager), session: AsyncSession = Depends(get_session), device_id: int = None
):
    result = await session.execute(select(Device).where(Device.user_id == user.id, Device.id == device_id))
    device = result.scalars().first()

    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    await session.delete(device)
    await session.commit()

    return JSONResponse({"message": f"Device {device_id=} deleted successfully"})


def dump_device(device: Device) -> dict:
    updated_utc = device.updated.replace(tzinfo=timezone.utc)
    return {
        "id": device.id,
        "name": device.name,
        "active": updated_utc > datetime.now(tz=timezone.utc) - ACTIVE_THRESHOLD,
        "updated": updated_utc.timestamp(),
        "token": device.token,
        "settings": device.settings,
    }
