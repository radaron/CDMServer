import tempfile
from copy import copy

from cryptography.fernet import Fernet
from ncoreparser import (
    AsyncClient,
    NcoreConnectionError,
    NcoreCredentialError,
    ParamSeq,
    ParamSort,
    SearchParamType,
    SearchParamWhere,
    SearchResult,
    Torrent,
)
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from service.constant import map_category_path
from service.models.api import TorrentData
from service.models.database import (
    AsyncSession,
    AsyncSessionLocal,
    Device,
    User,
    user_device_association,
)
from service.torrents_adapter import TorrentsAdapter
from service.util.configuration import NCORE_PASSWORD, NCORE_USERNAME, SECRET_KEY


class DeviceNotFoundError(Exception):
    pass


class TorrentNotFoundError(Exception):
    pass


class InvalidNcoreCredentialsError(Exception):
    pass


class NcoreUnavailableError(Exception):
    pass


async def search_torrents_for_user(
    user: User,
    pattern: str | None = None,
    category: str = SearchParamType.ALL_OWN.value,
    where: str = SearchParamWhere.NAME.value,
    page: int = 1,
) -> tuple[list[dict], int]:
    client = AsyncClient(timeout=5)
    await client.login(NCORE_USERNAME, NCORE_PASSWORD)
    result: SearchResult = await client.search(
        pattern=pattern,
        type=SearchParamType(category),
        where=SearchParamWhere(where),
        sort_by=ParamSort.SEEDERS,
        sort_order=ParamSeq.DECREASING,
        page=page,
    )
    availability = await get_tracker_ids_for_devices(user)
    torrents = [dump_torrent(torrent, availability) for torrent in result.torrents]
    return torrents, result.num_of_pages


async def add_download_for_user(
    session: AsyncSession, user: User, torrent_id: int, device_id: int
) -> None:
    result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(user_device_association.c.user_id == user.id, Device.id == device_id)
        .with_for_update()
    )
    device = result.scalars().first()
    if device is None:
        raise DeviceNotFoundError

    client = AsyncClient(timeout=5)
    try:
        await client.login(*get_ncore_credential(user))
        torrent = await client.get_torrent(torrent_id)
        if torrent is None:
            raise TorrentNotFoundError
        file_path = await client.download(torrent, tempfile.gettempdir(), override=True)
    except NcoreCredentialError as exception:
        raise InvalidNcoreCredentialsError from exception
    except NcoreConnectionError as exception:
        raise NcoreUnavailableError from exception

    download_path = [
        value
        for setting_name, value in device.settings.items()
        if setting_name == map_category_path(torrent["type"])
    ][0]

    existing_files = copy(device.file_list)
    existing_files[torrent_id] = {
        "file_path": file_path,
        "downloading_path": download_path,
    }
    device.file_list = existing_files

    session.add(device)
    await session.commit()


def dump_torrent(torrent: Torrent, availability: dict[int, set]) -> dict:
    return TorrentData(
        id=torrent["id"],
        title=torrent["title"],
        size=str(torrent["size"]),
        seeders=torrent["seed"],
        leechers=torrent["leech"],
        category=torrent["type"].value,
        url=torrent["url"],
        available=[
            device_id
            for device_id, tracker_ids in availability.items()
            if int(torrent["id"]) not in tracker_ids
        ],
    ).model_dump()


async def get_tracker_ids_for_devices(user: User) -> dict[int, set]:
    torrents_adapter = TorrentsAdapter()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Device)
            .join(user_device_association)
            .where(user_device_association.c.user_id == user.id)
            .options(selectinload(Device.users))
        )
        devices = result.scalars().all()

    availability = {}
    for device in devices:
        torrents = await torrents_adapter.get_torrents(device.id)
        tracker_ids = {t.tracker_id for t in torrents if t.tracker_id}
        availability[device.id] = tracker_ids

    return availability


def get_ncore_credential(user: User) -> tuple[str, str]:
    cipher_suite = Fernet(SECRET_KEY)
    if user.ncore_user and user.ncore_pass:
        ncore_username = user.ncore_user
        ncore_password = cipher_suite.decrypt(user.ncore_pass.encode("utf-8")).decode(
            "utf-8"
        )
    else:
        ncore_username = NCORE_USERNAME
        ncore_password = NCORE_PASSWORD
    return ncore_username, ncore_password
