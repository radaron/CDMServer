import math
from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
import httpx
from service.models.api import OmdbMovieData, OmdbSearchData, OmdbSearchResponse, OmdbSearchEntityResponse
from service.models.database import User
from service.util.auth import manager
from service.util.configuration import OMDB_API_KEY

OMDB_PAGE_SIZE = 10
router = APIRouter()


@router.get("/search/")
async def search(pattern: str, page: int = 1, _: User = Depends(manager)):
    search_result = await search_movies(pattern, page)
    movies = await get_movie_by_ids([movie.imdb_id for movie in search_result.search])
    return JSONResponse(dump_response(movies, int(search_result.total_results)))


async def get_movie_by_ids(imdb_ids: list[str]) -> list[OmdbMovieData]:
    resp: list[OmdbMovieData] = []
    for imdb_id in imdb_ids:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://www.omdbapi.com/",
                params={"apikey": OMDB_API_KEY, "i": imdb_id, "plot": "full"},
            )
            resp.append(OmdbMovieData.model_validate(response.json()))
    return resp


async def search_movies(pattern: str, page: int) -> OmdbSearchData:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://www.omdbapi.com/",
            params={"apikey": OMDB_API_KEY, "s": pattern, "page": page},
        )
    return OmdbSearchData.model_validate(response.json())


def dump_response(movies: list[OmdbMovieData], total_results: int = 0) -> dict:
    return OmdbSearchResponse(
        data=[
            OmdbSearchEntityResponse(
                director=movie.director,
                imdb_id=movie.imdb_id,
                plot=movie.plot,
                poster=movie.poster,
                rating=movie.imdb_rating,
                title=movie.title,
                year=movie.year,
            )
            for movie in movies
        ],
        meta={
            "total_pages": math.ceil(total_results / OMDB_PAGE_SIZE),
        },
    ).model_dump()
