from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
from ncoreparser import AsyncClient, SearchParamWhere, SearchParamType, Torrent, ParamSort, ParamSeq
from service.util.auth import manager
from service.models.api import NewDeviceData
from service.models.database import AsyncSession, get_session, User
from service.util.configuration import NCORE_USERNAME, NCORE_PASSWORD


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


@router.post("/downloads/{torrent_id}/")
async def add_download(data: NewDeviceData, user=Depends(manager), session: AsyncSession = Depends(get_session)):
    return JSONResponse({"message": "Device added successfully"})


def dump_torrent(torrent: Torrent) -> dict:
    return {
        "id": torrent["id"],
        "title": torrent["title"],
        "size": str(torrent["size"]),
        "seeders": torrent["seed"],
        "leechers": torrent["leech"],
    }
