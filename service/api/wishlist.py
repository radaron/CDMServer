from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from service.constant import MOVIE_TORRENT_TYPES
from service.core.tmdb_service import get_english_title
from service.models.api import AddWishlistData, WishlistItemData
from service.models.database import (
    AsyncSession,
    Device,
    User,
    Wishlist,
    get_session,
    user_device_association,
)
from service.util.auth import manager
from worker.celery_app import app as celery_app

router = APIRouter()


@router.get("/types/")
async def get_wishlist_types() -> JSONResponse:
    return JSONResponse({"data": MOVIE_TORRENT_TYPES})


@router.get("/")
async def get_wishlist(
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    result = await session.execute(
        select(Wishlist)
        .where(Wishlist.user_id == user.id)
        .options(selectinload(Wishlist.device))
        .order_by(Wishlist.created_at.desc())
    )
    items = result.scalars().all()
    return JSONResponse(
        {
            "data": [
                WishlistItemData(
                    id=item.id,
                    imdb_id=item.imdb_id,
                    title=item.title,
                    device_id=item.device_id,
                    device_name=item.device.name,
                    torrent_type=item.torrent_type,
                    created_at=item.created_at.isoformat(),
                ).model_dump()
                for item in items
            ]
        }
    )


@router.post("/")
async def add_wishlist_item(
    data: AddWishlistData,
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    if data.torrent_type not in MOVIE_TORRENT_TYPES:
        return JSONResponse({"message": "Invalid torrent type"}, status_code=400)

    device_result = await session.execute(
        select(Device)
        .join(user_device_association)
        .where(
            user_device_association.c.user_id == user.id,
            Device.id == data.device_id,
        )
    )
    if device_result.scalars().first() is None:
        return JSONResponse({"message": "Device not found"}, status_code=404)

    existing = await session.execute(
        select(Wishlist).where(
            Wishlist.user_id == user.id,
            Wishlist.imdb_id == data.imdb_id,
            Wishlist.device_id == data.device_id,
            Wishlist.torrent_type == data.torrent_type,
        )
    )
    if existing.scalars().first() is not None:
        return JSONResponse({"message": "Already in wishlist"}, status_code=409)

    title = await get_english_title(data.imdb_id) or data.imdb_id

    item = Wishlist(
        user_id=user.id,
        device_id=data.device_id,
        imdb_id=data.imdb_id,
        title=title,
        torrent_type=data.torrent_type,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)

    celery_app.send_task("worker.tasks.try_download_wishlist_item", args=[item.id])

    return JSONResponse({"message": "Added to wishlist"})


@router.delete("/{item_id}/")
async def delete_wishlist_item(
    item_id: int,
    user: User = Depends(manager),
    session: AsyncSession = Depends(get_session),
) -> JSONResponse:
    result = await session.execute(
        select(Wishlist).where(Wishlist.id == item_id, Wishlist.user_id == user.id)
    )
    item = result.scalars().first()
    if item is None:
        return JSONResponse({"message": "Not found"}, status_code=404)

    await session.delete(item)
    await session.commit()
    return JSONResponse({"message": "Removed from wishlist"})
