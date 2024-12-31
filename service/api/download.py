from copy import copy
import tempfile
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from ncoreparser import AsyncClient, SearchParamWhere, SearchParamType, Torrent, ParamSort, ParamSeq
from service.util.auth import manager
from service.models.api import AddDownloadData
from service.models.database import AsyncSession, get_session, select, Device, User
from service.util.configuration import NCORE_USERNAME, NCORE_PASSWORD
from service.constant import map_category_path


router = APIRouter()


@router.get("/search/")
async def get_order(
    user: User = Depends(manager),
    pattern: str = None,
    category: str = SearchParamType.ALL_OWN.value,
    where: str = SearchParamWhere.NAME.value,
):
    client = AsyncClient()
    await client.login(NCORE_USERNAME, NCORE_PASSWORD)
    torrents = await client.search(
        pattern=pattern,
        type=SearchParamType(category),
        where=SearchParamWhere(where),
        sort_by=ParamSort.SEEDERS,
        sort_order=ParamSeq.DECREASING,
    )

    return JSONResponse({"data": {"torrents": [dump_torrent(t) for t in torrents]}})


@router.post("/")
async def add_download(data: AddDownloadData, user=Depends(manager), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Device).where(Device.user_id == user.id, Device.id == data.device_id))
    device = result.scalars().first()

    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    client = AsyncClient()
    await client.login(NCORE_USERNAME, NCORE_PASSWORD)
    torrent = await client.get_torrent(data.torrent_id)
    if torrent is None:
        return JSONResponse({"message": "Torrent not found"}, status_code=404)
    file_path = await client.download(torrent, tempfile.gettempdir(), override=True)
    download_path = [setting for setting in device.settings if setting["name"] == map_category_path(torrent["type"])][0]["value"]

    existing_files = copy(device.file_list)
    existing_files[data.torrent_id] = {"file_path": file_path, "downloading_path": download_path}
    device.file_list = existing_files

    session.add(device)
    await session.commit()

    return JSONResponse({"message": "Torrent added successfully"})


def dump_torrent(torrent: Torrent) -> dict:
    return {
        "id": torrent["id"],
        "title": torrent["title"],
        "size": str(torrent["size"]),
        "seeders": torrent["seed"],
        "leechers": torrent["leech"],
        "category": torrent["type"].value,
        "url": torrent["url"],
    }
