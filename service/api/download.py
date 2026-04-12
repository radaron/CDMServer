from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from ncoreparser import SearchParamType, SearchParamWhere

from service.core.download_service import (
    DeviceNotFoundError,
    InvalidNcoreCredentialsError,
    NcoreUnavailableError,
    TorrentNotFoundError,
    add_download_for_user,
    search_torrents_for_user,
)
from service.models.api import AddDownloadData, SearchResponse
from service.models.database import AsyncSession, User, get_session
from service.util.auth import manager

router = APIRouter()


@router.get("/search/")
async def search_torrents(
    user: User = Depends(manager),
    pattern: str = None,
    category: str = SearchParamType.ALL_OWN.value,
    where: str = SearchParamWhere.NAME.value,
    page: int = 1,
):
    torrents, total_pages = await search_torrents_for_user(
        user=user, pattern=pattern, category=category, where=where, page=page
    )
    return JSONResponse(
        SearchResponse(data={"torrents": torrents}, meta={"total_pages": total_pages}).model_dump()
    )


@router.post("/")
async def add_download(
    data: AddDownloadData,
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
):
    try:
        await add_download_for_user(
            session=session,
            user=user,
            torrent_id=data.torrent_id,
            device_id=data.device_id,
        )
    except DeviceNotFoundError:
        return JSONResponse({"message": "Device not found"}, status_code=404)
    except TorrentNotFoundError:
        return JSONResponse({"message": "Torrent not found"}, status_code=404)
    except InvalidNcoreCredentialsError:
        return JSONResponse({"message": "Invalid Ncore credentials"}, status_code=400)
    except NcoreUnavailableError:
        return JSONResponse({"message": "Could not connect to Ncore"}, status_code=502)

    return JSONResponse({"message": "Torrent added successfully"})
