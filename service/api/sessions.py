from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from service.models.api import SessionData
from service.models.database import AsyncSession, RefreshSession, User, get_session
from service.util.auth import manager

router = APIRouter()


@router.get("/")
async def list_sessions(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(manager),
):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    result = await session.execute(
        select(RefreshSession).options(joinedload(RefreshSession.user))
    )
    rows = result.scalars().all()
    return JSONResponse(
        {
            "data": {
                "sessions": [
                    SessionData(
                        jti=r.jti,
                        user_id=r.user_id,
                        user_email=r.user.email,
                        user_name=r.user.name,
                        client_type=r.client_type,
                        created_at=r.created_at.isoformat(),
                        last_used_at=r.last_used_at.isoformat(),
                    ).model_dump()
                    for r in rows
                ]
            }
        }
    )


@router.delete("/{jti}/")
async def delete_session(
    jti: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(manager),
):
    if not user.is_admin:
        return JSONResponse({"message": "Forbidden"}, status_code=403)
    result = await session.execute(
        select(RefreshSession).where(RefreshSession.jti == jti)
    )
    row = result.scalars().first()
    if row is None:
        return JSONResponse({"message": "Session not found"}, status_code=404)
    await session.delete(row)
    await session.commit()
    return JSONResponse({"message": f"Session {jti} revoked"}, status_code=200)
