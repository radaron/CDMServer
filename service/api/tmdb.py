from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from service.core.tmdb_service import get_imdb_id, popular_media, search_media
from service.models.api import (
    TmdbImdbResponse,
    TmdbPopularData,
    TmdbPopularResponse,
    TmdbSearchResponse,
    TmdbSearchResponseMeta,
)
from service.models.database import User
from service.util.auth import manager

router = APIRouter()


@router.get("/popular/")
async def get_popular(
    page: int = 1, language: str | None = None, _: User = Depends(manager)
):
    popular_data = await popular_media(page=page, language=language)
    return JSONResponse(
        TmdbPopularResponse(data=TmdbPopularData(**popular_data)).model_dump()
    )


@router.get("/search/")
async def search(
    pattern: str,
    page: int = 1,
    language: str | None = None,
    _: User = Depends(manager),
):
    data, total_pages = await search_media(pattern=pattern, page=page, language=language)
    return JSONResponse(
        TmdbSearchResponse(
            data=data, meta=TmdbSearchResponseMeta(total_pages=total_pages)
        ).model_dump()
    )


@router.get("/imdb/")
async def get_imdb(
    tmdb_id: int,
    media_type: str,
    language: str | None = None,
    _: User = Depends(manager),
):
    imdb_id = await get_imdb_id(tmdb_id, media_type, language=language)
    return JSONResponse(TmdbImdbResponse(imdb_id=imdb_id).model_dump())
