from fastapi.responses import JSONResponse
from fastapi import APIRouter, Depends
import httpx
from service.models.database import User
from service.util.auth import manager
from service.util.configuration import OMDB_API_KEY


router = APIRouter()


@router.get("/search/")
async def search(pattern: str, _: User = Depends(manager)):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://www.omdbapi.com/",
            params={"apikey": OMDB_API_KEY, "s": pattern},
        )
        response = await get_movie_by_ids([movie["imdbID"] for movie in response.json()["Search"]])
    return JSONResponse({"data": response})


async def get_movie_by_ids(imdb_ids: list[str]):
    resp = []
    for imdb_id in imdb_ids:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://www.omdbapi.com/",
                params={"apikey": OMDB_API_KEY, "i": imdb_id, "plot": "full"},
            )
            resp.append(response.json())
    return resp
