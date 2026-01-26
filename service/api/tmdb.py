import asyncio

from aiohttp import ClientSession
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from themoviedb import aioTMDb
from themoviedb.schemas._enums import MediaType, SizeType

from service.models.api import (
    TmdbImdbResponse,
    TmdbMediaData,
    TmdbPopularData,
    TmdbPopularResponse,
    TmdbSearchResponse,
    TmdbSearchResponseMeta,
)
from service.models.database import User
from service.util.auth import manager
from service.util.configuration import TMDB_API_KEY

router = APIRouter()

DEFAULT_LANGUAGE = "en-US"
DEFAULT_REGION = "US"
LANGUAGE_MAP = {
    "hu": ("hu-HU", "HU"),
    "en": ("en-US", "US"),
}


def normalize_language(language: str | None) -> tuple[str, str | None]:
    if not language:
        return DEFAULT_LANGUAGE, DEFAULT_REGION
    normalized = language.replace("_", "-").strip()
    if normalized in LANGUAGE_MAP:
        return LANGUAGE_MAP[normalized]
    if "-" in normalized:
        lang_code, region = normalized.split("-", 1)
        return f"{lang_code.lower()}-{region.upper()}", region.upper()
    return normalized, None


def get_tmdb(language: str | None, session: ClientSession | None = None) -> aioTMDb:
    tmdb_language, region = normalize_language(language)
    return aioTMDb(
        key=TMDB_API_KEY, language=tmdb_language, region=region, session=session
    )


def build_media_data(item, imdb_id: str | None = None) -> dict:
    title = (
        getattr(item, "title", None)
        or getattr(item, "name", None)
        or getattr(item, "original_title", None)
        or getattr(item, "original_name", None)
        or ""
    )
    media_type = (
        item.media_type.value
        if isinstance(item.media_type, MediaType)
        else str(item.media_type)
    )
    if media_type == "person":
        poster = item.profile_url(SizeType.w500) if item.profile_path else None
    else:
        poster = item.poster_url(SizeType.w500) if item.poster_path else None

    return TmdbMediaData(
        tmdb_id=item.id,
        imdb_id=imdb_id,
        title=title,
        overview=item.overview or "",
        poster=poster,
        rating=item.vote_average,
        year=item.year,
        media_type=media_type,
    ).model_dump()


async def fetch_imdb_id(tmdb: aioTMDb, tmdb_id: int, media_type: str) -> str | None:
    if media_type == "movie":
        return (await tmdb.movie(tmdb_id).external_ids()).imdb_id
    if media_type == "tv":
        return (await tmdb.tv(tmdb_id).external_ids()).imdb_id
    return None


@router.get("/popular/")
async def get_popular(
    page: int = 1, language: str | None = None, _: User = Depends(manager)
):
    async with ClientSession(raise_for_status=True) as session:
        tmdb = get_tmdb(language, session=session)
        movies, tvs = await asyncio.gather(
            tmdb.trending().movie_weekly(page=page),
            tmdb.trending().tv_weekly(page=page),
        )

        semaphore = asyncio.Semaphore(8)

        async def fetch_with_limit(item, media_type: str):
            async with semaphore:
                imdb_id = await fetch_imdb_id(tmdb, item.id, media_type)
                return build_media_data(item, imdb_id=imdb_id)

        popular_data = {
            "movies": await asyncio.gather(
                *(
                    fetch_with_limit(item, "movie")
                    for item in movies.results or []
                    if item.id
                )
            ),
            "tvs": await asyncio.gather(
                *(fetch_with_limit(item, "tv") for item in tvs.results or [] if item.id)
            ),
        }
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
    async with ClientSession(raise_for_status=True) as session:
        tmdb = get_tmdb(language, session=session)
        search_result = await tmdb.search().multi(query=pattern, page=page)
        items = [
            item
            for item in (search_result.results or [])
            # if item.id and (item.is_movie() or item.is_tv())
        ]
        semaphore = asyncio.Semaphore(8)

        async def fetch_with_limit(item):
            async with semaphore:
                media_type = {
                    item.is_movie(): "movie",
                    item.is_tv(): "tv",
                    item.is_person(): "person",
                }.get(True)
                imdb_id = await fetch_imdb_id(tmdb, item.id, media_type)
                return build_media_data(item, imdb_id=imdb_id)

        data = await asyncio.gather(*(fetch_with_limit(item) for item in items))
        total_pages = search_result.total_pages or 0
    return JSONResponse(
        TmdbSearchResponse(
            data=data, meta=TmdbSearchResponseMeta(total_pages=total_pages)
        ).model_dump()
    )


@router.get("/imdb/")
async def get_imdb_id(
    tmdb_id: int,
    media_type: str,
    language: str | None = None,
    _: User = Depends(manager),
):
    async with ClientSession(raise_for_status=True) as session:
        tmdb = get_tmdb(language, session=session)
        imdb_id = await fetch_imdb_id(tmdb, tmdb_id, media_type)
    return JSONResponse(TmdbImdbResponse(imdb_id=imdb_id).model_dump())
