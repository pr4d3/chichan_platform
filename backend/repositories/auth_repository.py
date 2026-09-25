from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.session import UserSession

async def create_session(db: AsyncSession, session: UserSession) -> UserSession:
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session_by_refresh_token(db: AsyncSession, refresh_token: str) -> UserSession:
    result = await db.execute(select(UserSession).where(UserSession.refresh_token == refresh_token))
    return result.scalars().first()

async def delete_session(db: AsyncSession, refresh_token: str) -> bool:
    session = await get_session_by_refresh_token(db, refresh_token)
    if session:
        await db.delete(session)
        await db.commit()
        return True
    return False

async def delete_all_user_sessions(db: AsyncSession, user_id) -> bool:
    from sqlalchemy import delete
    await db.execute(delete(UserSession).where(UserSession.user_id == user_id))
    await db.commit()
    return True

