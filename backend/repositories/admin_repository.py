from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload, joinedload
from models.user import User
from models.role import Role
from models.profile import UserProfile
from uuid import UUID
from typing import Optional, Tuple, List, Dict

async def get_all_roles(db: AsyncSession) -> List[Role]:
    result = await db.execute(select(Role).order_by(Role.id.asc()))
    return list(result.scalars().all())

async def get_users_overview_stats(db: AsyncSession) -> Dict[str, int]:
    # Gom 4 truy vấn COUNT thành 1 truy vấn duy nhất: GROUP BY (role_code, status)
    # rồi suy ra total / active / inactive / role counts trong Python.
    roles_res = await db.execute(
        select(Role.role_code, User.status, func.count(User.id))
        .outerjoin(User, User.role_id == Role.id)
        .group_by(Role.role_code, User.status)
    )

    role_counts: Dict[str, int] = {}
    total_users = 0
    active_users = 0
    inactive_users = 0
    for code, status, count in roles_res.all():
        if not count:
            continue
        total_users += count
        role_counts[code] = role_counts.get(code, 0) + count
        if status == "ACTIVE":
            active_users += count
        elif status == "INACTIVE":
            inactive_users += count

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "admin_count": role_counts.get("ADMIN", 0),
        "instructor_count": role_counts.get("INSTRUCTOR", 0),
        "parent_count": role_counts.get("STUDENT_PARENT", 0),
        "student_count": role_counts.get("STUDENT_CHILD", 0) + role_counts.get("STUDENT", 0)
    }

async def get_users_list_paginated(
    db: AsyncSession,
    search: Optional[str] = None,
    role_code: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 15
) -> Tuple[List[User], int]:
    query = (
        select(User)
        .options(
            joinedload(User.role),
            joinedload(User.profile)
        )
    )
    count_query = select(func.count(User.id)).outerjoin(User.role)

    filters = []

    if search:
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
                User.username.ilike(search_term)
            )
        )

    if role_code:
        filters.append(Role.role_code == role_code)
        query = query.join(User.role)

    if status:
        filters.append(User.status == status)

    if filters:
        combined = and_(*filters)
        query = query.where(combined)
        count_query = count_query.where(combined)

    # Count total
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate and order by created_at desc
    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

    results = await db.execute(query)
    users = results.unique().scalars().all()

    return list(users), total

async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await db.execute(
        select(User)
        .options(
            joinedload(User.role),
            joinedload(User.profile)
        )
        .where(User.id == user_id)
    )
    return result.scalars().first()

async def get_user_by_email_or_username_exclude_self(
    db: AsyncSession,
    email: Optional[str],
    username: Optional[str],
    exclude_user_id: UUID
) -> Optional[User]:
    conditions = []
    if email and email.strip():
        conditions.append(func.lower(User.email) == email.strip().lower())
    if username and username.strip():
        conditions.append(func.lower(User.username) == username.strip().lower())
    if not conditions:
        return None

    result = await db.execute(
        select(User).where(
            and_(
                or_(*conditions),
                User.id != exclude_user_id
            )
        )
    )
    return result.scalars().first()

async def update_user_status(db: AsyncSession, user: User, status: str) -> User:
    user.status = status
    await db.commit()
    await db.refresh(user)
    return user
