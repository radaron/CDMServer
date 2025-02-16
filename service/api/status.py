from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from service.util.auth import manager
from service.models.database import (
    AsyncSession,
    get_session,
    select,
    desc,
    Device,
    User,
    Torrent,
    user_device_association,
)


router = APIRouter()


@router.get("/{device_id}/")
async def get_devices(
    user: User = Depends(manager), session: AsyncSession = Depends(get_session), device_id: int = None
):
    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user.id, Device.id == device_id)
    )
    device = result.scalars().first()
    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    torrents = await session.execute(
        select(Torrent).where(Torrent.device_id == device.id).order_by(desc(Torrent.added_date))
    )
    torrents = torrents.scalars().all()

    return JSONResponse({"data": {"torrents": [dump_torrent(t) for t in torrents]}})


def dump_torrent(torrent: Torrent):
    return {
        "id": torrent.torrent_id,
        "name": torrent.name,
        "status": torrent.status,
        "progress": torrent.progress,
        "eta": torrent.eta,
        "downloadDir": torrent.download_dir,
        "totalSize": torrent.total_size,
    }
