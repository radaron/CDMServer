from copy import copy
import tempfile
from cryptography.fernet import Fernet
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from ncoreparser import (
    AsyncClient,
    SearchParamWhere,
    SearchParamType,
    Torrent,
    ParamSort,
    ParamSeq,
    NcoreCredentialError,
    NcoreConnectionError,
)
from service.util.auth import manager
from service.models.api import AddDownloadData, TorrentData
from service.models.database import AsyncSession, get_session, select, Device, User, user_device_association
from service.util.configuration import NCORE_USERNAME, NCORE_PASSWORD, SECRET_KEY
from service.constant import map_category_path


router = APIRouter()


@router.get("/search/")
async def get_order(
    _: User = Depends(manager),
    pattern: str = None,
    category: str = SearchParamType.ALL_OWN.value,
    where: str = SearchParamWhere.NAME.value,
):
    client = AsyncClient(timeout=5)
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
    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user.id, Device.id == data.device_id)
    )
    device = result.scalars().first()

    if device is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    client = AsyncClient(timeout=5)
    try:
        await client.login(*get_ncore_credential(user))
        torrent = await client.get_torrent(data.torrent_id)
        if torrent is None:
            return JSONResponse({"message": "Torrent not found"}, status_code=404)
        file_path = await client.download(torrent, tempfile.gettempdir(), override=True)
    except NcoreCredentialError:
        return JSONResponse({"message": "Invalid Ncore credentials"}, status_code=400)
    except NcoreConnectionError:
        return JSONResponse({"message": "Could not connect to Ncore"}, status_code=502)

    download_path = [
        value for setting_name, value in device.settings.items() if setting_name == map_category_path(torrent["type"])
    ][0]

    existing_files = copy(device.file_list)
    existing_files[data.torrent_id] = {"file_path": file_path, "downloading_path": download_path}
    device.file_list = existing_files

    session.add(device)
    await session.commit()

    return JSONResponse({"message": "Torrent added successfully"})


def dump_torrent(torrent: Torrent) -> dict:
    return TorrentData(
        id=torrent["id"],
        title=torrent["title"],
        size=str(torrent["size"]),
        seeders=torrent["seed"],
        leechers=torrent["leech"],
        category=torrent["type"].value,
        url=torrent["url"],
    ).model_dump()


def get_ncore_credential(user: User):
    cipher_suite = Fernet(SECRET_KEY)
    if user.ncore_user and user.ncore_pass:
        ncore_username = user.ncore_user
        ncore_password = cipher_suite.decrypt(user.ncore_pass.encode("utf-8")).decode("utf-8")
    else:
        ncore_username = NCORE_USERNAME
        ncore_password = NCORE_PASSWORD
    return ncore_username, ncore_password
