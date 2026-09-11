import tempfile
from copy import copy

from celery import group
from celery.result import allow_join_result
from cryptography.fernet import Fernet
from ncoreparser import Client, NcoreConnectionError, NcoreCredentialError, ParamSeq, ParamSort, SearchParamType, SearchParamWhere
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from service.constant import map_category_path
from service.models.database import Base, Device, User, Wishlist
from service.util.configuration import settings
from service.util.logger import logger
from worker.celery_app import app
from worker.db import SyncSession, engine
from worker.email_service import send_wishlist_status_email

Base.metadata.create_all(engine)


def _get_ncore_credential(user: User) -> tuple[str, str]:
    cipher_suite = Fernet(settings.secret_key)
    if user.ncore_user and user.ncore_pass:
        return user.ncore_user, cipher_suite.decrypt(user.ncore_pass.encode()).decode()
    return settings.ncore_username, settings.ncore_password


def _search(user: User, imdb_id: str, torrent_type: str) -> int | None:
    username, password = _get_ncore_credential(user)
    client = Client(timeout=5)
    client.login(username, password)
    result = client.search(
        pattern=imdb_id,
        type=SearchParamType(torrent_type),
        where=SearchParamWhere.IMDB,
        sort_by=ParamSort.SEEDERS,
        sort_order=ParamSeq.DECREASING,
    )
    torrents = result.torrents
    return torrents[0]["id"] if torrents else None


def _download(user: User, torrent_id: int, device: Device) -> None:
    username, password = _get_ncore_credential(user)
    client = Client(timeout=5)
    client.login(username, password)
    torrent = client.get_torrent(torrent_id)
    if torrent is None:
        raise ValueError(f"Torrent {torrent_id} not found")
    file_path = client.download(torrent, tempfile.gettempdir(), override=True)

    download_path = next(
        value
        for setting_name, value in device.settings.items()
        if setting_name == map_category_path(torrent["type"])
    )

    existing_files = copy(device.file_list)
    existing_files[torrent_id] = {"file_path": file_path, "downloading_path": download_path}

    with SyncSession() as session:
        dev = session.get(Device, device.id)
        dev.file_list = existing_files
        session.commit()


@app.task(name="worker.tasks.try_download_wishlist_item")
def try_download_wishlist_item(item_id: int) -> dict | None:
    with SyncSession() as session:
        item = session.execute(
            select(Wishlist)
            .where(Wishlist.id == item_id)
            .options(joinedload(Wishlist.user), joinedload(Wishlist.device))
        ).scalar_one_or_none()
        if item is None:
            return None
        user = item.user
        device = item.device
        user_email = user.email
        title = item.title
        imdb_id = item.imdb_id
        torrent_type = item.torrent_type
        device_name = device.name

    outcome = {
        "user_email": user_email,
        "title": title,
        "device_name": device_name,
        "torrent_type": torrent_type,
        "found": False,
        "success": False,
    }

    try:
        torrent_id = _search(user, imdb_id, torrent_type)
    except (NcoreCredentialError, NcoreConnectionError):
        logger.exception("Wishlist item %d: search error", item_id)
        return outcome

    if torrent_id is None:
        logger.info("Wishlist item %d: '%s' not found on NCore", item_id, title)
        return outcome

    outcome["found"] = True
    try:
        _download(user, torrent_id, device)
        outcome["success"] = True
    except Exception:
        logger.exception("Wishlist item %d: download error", item_id)
        return outcome

    with SyncSession() as session:
        item = session.get(Wishlist, item_id)
        if item:
            session.delete(item)
            session.commit()

    logger.info("Wishlist item %d: '%s' downloaded to '%s'", item_id, title, device_name)
    return outcome


@app.task(name="worker.tasks.scan_all_wishlist")
def scan_all_wishlist():
    with SyncSession() as session:
        item_ids = [row.id for row in session.execute(select(Wishlist.id)).all()]

    logger.info("Weekly wishlist scan: %d item(s)", len(item_ids))

    job = group(try_download_wishlist_item.s(item_id) for item_id in item_ids)
    with allow_join_result():
        outcomes = job.apply_async().get()

    user_outcomes: dict[str, list[dict]] = {}
    for outcome in outcomes:
        if outcome:
            user_outcomes.setdefault(outcome["user_email"], []).append(outcome)

    for user_email, outcomes in user_outcomes.items():
        send_wishlist_status_email(user_email, outcomes)
