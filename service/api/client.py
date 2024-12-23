from datetime import datetime, timezone
from secrets import token_hex
from fastapi.responses import JSONResponse, FileResponse
from fastapi import APIRouter, Depends, Header
from service.util.auth import manager
from service.models.api import NewDeviceData
from service.models.database import AsyncSession, get_session, select, Device


router = APIRouter()


@router.get("/")
async def get_order(session: AsyncSession = Depends(get_session), x_api_key: str = Header(None)):
    devices = await session.execute(select(Device).where(Device.token == x_api_key))
    device = devices.scalars().first()
    if device is None:
        return JSONResponse({"message": "Unathorized"}, status_code=401)
    # add new file to the device
    # device.file_list = {"2345": "/Users/radaron/projects/sandbox/CDMServer/test.torrent"}
    files = device.file_list
    device.updated = datetime.now(tz=timezone.utc)
    session.add(device)
    await session.commit()
    return JSONResponse({"data": {"files": list(files.keys())}})


@router.get("/download/{file_id}")
async def download_file(
    session: AsyncSession = Depends(get_session), x_api_key: str = Header(None), file_id: str = None
):
    devices = await session.execute(select(Device).where(Device.token == x_api_key))
    device = devices.scalars().first()
    if device is None:
        return JSONResponse({"message": "Unathorized"}, status_code=401)
    if file_id not in device.file_list:
        return JSONResponse({"message": "File not found"}, status_code=404)

    file_path = device.file_list[file_id]
    file_name = file_path.split("/")[-1]
    files = device.file_list.copy()
    files.pop(file_id)
    device.file_list = files
    session.add(device)
    await session.commit()

    return FileResponse(path=file_path, media_type="application/octet-stream", filename=file_name)


@router.post("/status/")
async def add_device(
    data: NewDeviceData,
    session: AsyncSession = Depends(get_session),
    x_api_key: str = Header(None),
    file_id: str = None,
):
    devices = await session.execute(select(Device).where(Device.token == x_api_key))
    device = devices.scalars().first()
    if device is None:
        return JSONResponse({"message": "Unathorized"}, status_code=401)
    return JSONResponse({"message": "Not implemented"}, status_code=501)
