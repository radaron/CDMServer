from copy import copy
import os
from datetime import datetime, timezone
from fastapi.responses import JSONResponse, FileResponse
from fastapi import APIRouter, Depends, Header
from service.models.api import StatusData
from service.models.database import AsyncSession, get_session, select, delete, Device, Torrent


router = APIRouter()


@router.get("/")
async def get_order(session: AsyncSession = Depends(get_session), x_api_key: str = Header(None)):
    devices = await session.execute(select(Device).where(Device.token == x_api_key).with_for_update())
    device = devices.scalars().first()
    if device is None:
        return JSONResponse({"message": "Unathorized"}, status_code=401)
    files = device.file_list
    device.updated = datetime.now(tz=timezone.utc)
    session.add(device)
    await session.commit()
    return JSONResponse({"data": {"files": {key: value["downloading_path"] for key, value in files.items()}}})


@router.get("/download/{file_id}/")
async def download_file(
    session: AsyncSession = Depends(get_session), x_api_key: str = Header(None), file_id: str = None
):
    devices = await session.execute(select(Device).where(Device.token == x_api_key).with_for_update())
    device = devices.scalars().first()
    if device is None:
        return JSONResponse({"message": "Unathorized"}, status_code=401)
    if file_id not in device.file_list:
        return JSONResponse({"message": "File not found"}, status_code=404)
    file_path = device.file_list[file_id].get("file_path", "")
    if not os.path.exists(file_path):
        files = copy(device.file_list)
        files.pop(file_id)
        device.file_list = files
        session.add(device)
        await session.commit()
        return JSONResponse({"message": "File not found"}, status_code=404)

    file_name = file_path.split("/")[-1]
    files = copy(device.file_list)
    files.pop(file_id)
    device.file_list = files
    session.add(device)
    await session.commit()

    return FileResponse(path=file_path, media_type="application/octet-stream", filename=file_name)


@router.post("/status/")
async def add_device(data: StatusData, session: AsyncSession = Depends(get_session), x_api_key: str = Header(None)):
    result = await session.execute(select(Device).where(Device.token == x_api_key))
    device = result.scalars().first()
    if device is None:
        return JSONResponse({"message": "Unathorized"}, status_code=401)

    await session.execute(delete(Torrent).where(Torrent.device_id == device.id))

    for item in data.data:
        result = await session.execute(
            select(Torrent).where(Torrent.device_id == device.id, Torrent.torrent_id == item.id)
        )
        torrent = result.scalars().first()
        if torrent is None:
            added_date = datetime.fromtimestamp(item.added_date, tz=timezone.utc)
            new_torrent = Torrent(
                device_id=device.id,
                torrent_id=item.id,
                name=item.name,
                added_date=added_date,
                status=item.status,
                progress=item.progress,
                download_dir=item.download_dir,
                total_size=item.total_size,
                eta=item.eta,
            )
            session.add(new_torrent)
        else:
            torrent.status = item.status
            torrent.progress = item.progress
            torrent.download_dir = item.download_dir
            torrent.total_size = item.total_size
            torrent.eta = item.eta
            session.add(torrent)
    await session.commit()

    return JSONResponse({"message": "Status updated"}, status_code=200)
