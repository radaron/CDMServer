from copy import copy
import os
from datetime import datetime, timezone
from fastapi.responses import JSONResponse, FileResponse
from fastapi import APIRouter, Depends, Header
from service.models.api import StatusData
from service.models.database import AsyncSession, get_session, select, delete, Device
from service.torrents_adapter import TorrentsAdapter, TorrentStatus


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

    torrents_adapter = TorrentsAdapter()
    for item in data.data:
        torrent = TorrentStatus.model_validate(
            {
                "id": item.id,
                "name": item.name,
                "status": item.status,
                "progress": item.progress,
                "download_dir": item.download_dir,
                "added_date": item.added_date,
                "total_size": item.total_size,
                "eta": item.eta,
            }
        )
        await torrents_adapter.set_torrent(device.id, torrent)

    return JSONResponse({"message": "Status updated"}, status_code=200)
