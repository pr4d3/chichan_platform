from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from repositories import admin_repository
from schemas.admin_schema import AdminUserUpdate, AdminUserListItem
from core.security import get_password_hash_async
from models.profile import UserProfile
from uuid import UUID
from typing import Optional, Dict, Any
import math

def format_user_list_item(user) -> dict:
    profile = user.profile
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role_id": user.role_id,
        "role_code": user.role.role_code if user.role else "UNKNOWN",
        "role_name": user.role.role_name if user.role else "Không xác định",
        "status": user.status,
        "avatar_url": profile.avatar_url if profile else None,
        "phone_number": profile.phone_number if profile else None,
        "gender": profile.gender if profile else None,
        "date_of_birth": profile.date_of_birth if profile else None,
        "bio": profile.bio if profile else None,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

async def get_roles(db: AsyncSession):
    roles = await admin_repository.get_all_roles(db)
    return [
        {
            "id": r.id,
            "role_code": r.role_code,
            "role_name": r.role_name,
            "description": r.description
        }
        for r in roles
    ]

async def get_users_page(
    db: AsyncSession,
    search: Optional[str] = None,
    role_code: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 15
):
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 15

    users, total = await admin_repository.get_users_list_paginated(
        db=db,
        search=search,
        role_code=role_code,
        status=status,
        page=page,
        limit=limit
    )

    stats = await admin_repository.get_users_overview_stats(db)

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return {
        "users": [format_user_list_item(u) for u in users],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        },
        "stats": stats
    }

async def update_user_status(
    db: AsyncSession,
    admin_id: UUID,
    target_user_id: UUID,
    new_status: str
):
    if str(admin_id) == str(target_user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự vô hiệu hóa tài khoản của chính mình."
        )

    user = await admin_repository.get_user_by_id(db, target_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng."
        )

    user = await admin_repository.update_user_status(db, user, new_status)
    return format_user_list_item(user)

async def update_user_details(
    db: AsyncSession,
    admin_id: UUID,
    target_user_id: UUID,
    data: AdminUserUpdate
):
    user = await admin_repository.get_user_by_id(db, target_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng."
        )

    # Check email or username uniqueness
    if data.email or data.username:
        existing = await admin_repository.get_user_by_email_or_username_exclude_self(
            db=db,
            email=data.email,
            username=data.username,
            exclude_user_id=target_user_id
        )
        if existing:
            if data.email and existing.email == data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email này đã được sử dụng bởi một tài khoản khác."
                )
            if data.username and existing.username == data.username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tên đăng nhập (username) này đã tồn tại."
                )

    # Prevent Admin from demoting/inactivating self
    if str(admin_id) == str(target_user_id):
        if data.status and data.status == "INACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn không thể tự vô hiệu hóa tài khoản của chính mình."
            )

    # Update basic user info
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        user.email = data.email
    if data.username is not None:
        user.username = data.username
    if data.role_id is not None:
        user.role_id = data.role_id
    if data.status is not None:
        user.status = data.status
    if data.new_password:
        # Hash bcrypt trong worker thread để không chặn event loop
        user.password_hash = await get_password_hash_async(data.new_password)

    # Update profile info
    profile = user.profile
    if not profile:
        profile = UserProfile(user_id=user.id)
        db.add(profile)

    if data.phone_number is not None:
        profile.phone_number = data.phone_number
    if data.gender is not None:
        profile.gender = data.gender
    if data.date_of_birth is not None:
        profile.date_of_birth = data.date_of_birth
    if data.bio is not None:
        profile.bio = data.bio

    await db.commit()
    
    # Reload fresh
    user = await admin_repository.get_user_by_id(db, target_user_id)
    return format_user_list_item(user)
