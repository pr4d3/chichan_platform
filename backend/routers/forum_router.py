from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user, RoleGuard, get_optional_user
from models.user import User
from models.role import Role
from schemas.forum_schema import (
    CategoryListResponse, PostListResponse, PostListCursorResponse, PostDetailResponse, PostCreate, PostCreateResponse,
    CommentCreate, CommentCreateResponse, PostModerateAction, CommentModerateAction,
    ModerateResponse, LikeToggleResponse
)
from services import forum_service
from uuid import UUID
from typing import Optional, Union

router = APIRouter(tags=["Forum & Community"])

@router.get("/api/v1/forum/categories", response_model=CategoryListResponse, status_code=status.HTTP_200_OK)
async def get_categories(db: AsyncSession = Depends(get_db)):
    categories = await forum_service.get_forum_categories(db)
    return CategoryListResponse(success=True, data=categories)

@router.get("/api/v1/forum/posts", response_model=Union[PostListCursorResponse, PostListResponse], status_code=status.HTTP_200_OK)
async def get_posts(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: Optional[int] = Query(None, ge=1, le=50, description="Số bài viết trên một trang (tối đa 50)"),
    cursor: Optional[str] = Query(None, description="Con trỏ để lấy trang tiếp theo"),
    sort_by: str = Query("newest", description="Tiêu chí sắp xếp: newest, most_comments, most_likes, most_views"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    is_admin = current_user and current_user.role and current_user.role.role_code == "ADMIN"
    current_user_id = current_user.id if current_user else None
    posts = await forum_service.get_forum_feed(
        db, category_id, search,
        include_hidden_deleted=is_admin,
        current_user_id=current_user_id,
        limit=limit,
        cursor=cursor,
        sort_by=sort_by
    )
    if isinstance(posts, dict):
        return PostListCursorResponse(success=True, data=posts)
    return PostListResponse(success=True, data=posts)

@router.get("/api/v1/forum/posts/{post_id}", response_model=PostDetailResponse, status_code=status.HTTP_200_OK)
async def get_post_detail(post_id: UUID, current_user: Optional[User] = Depends(get_optional_user), db: AsyncSession = Depends(get_db)):
    is_admin = current_user and current_user.role and current_user.role.role_code == "ADMIN"
    current_user_id = current_user.id if current_user else None
    detail = await forum_service.get_post_detail_with_comments(db, post_id, include_hidden_deleted=is_admin, current_user_id=current_user_id)
    return PostDetailResponse(success=True, data=detail)

@router.post("/api/v1/forum/posts/{post_id}/view", status_code=status.HTTP_200_OK)
async def record_post_view(post_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await forum_service.record_post_view(db, post_id)
    return {
        "success": True,
        "message": "Đã ghi nhận lượt xem",
        "data": result
    }

@router.post("/api/v1/forum/posts", response_model=PostCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await forum_service.create_new_post(db, current_user.id, post_data)
    return PostCreateResponse(
        success=True,
        message="Đăng bài thảo luận thành công",
        data=result
    )

@router.post("/api/v1/forum/posts/{post_id}/like", response_model=LikeToggleResponse, status_code=status.HTTP_200_OK)
async def toggle_post_like(post_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await forum_service.toggle_post_like(db, current_user.id, post_id)
    return LikeToggleResponse(
        success=True,
        message="Thao tác like thành công",
        data=result
    )

@router.post("/api/v1/forum/posts/{post_id}/comments", response_model=CommentCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(post_id: UUID, comment_data: CommentCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await forum_service.create_new_comment(db, current_user.id, post_id, comment_data)
    return CommentCreateResponse(
        success=True,
        message="Gửi bình luận thành công",
        data=result
    )

@router.delete("/api/v1/forum/posts/{post_id}", status_code=status.HTTP_200_OK)
async def delete_post(post_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    is_admin = current_user and current_user.role and current_user.role.role_code == "ADMIN"
    result = await forum_service.delete_post_by_owner(db, current_user.id, is_admin, post_id)
    return {
        "success": True,
        "message": "Xóa bài viết thành công",
        "data": result
    }

@router.delete("/api/v1/forum/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def delete_comment(comment_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    is_admin = current_user and current_user.role and current_user.role.role_code == "ADMIN"
    result = await forum_service.delete_comment_by_owner(db, current_user.id, is_admin, comment_id)
    return {
        "success": True,
        "message": "Xóa bình luận thành công",
        "data": result
    }

@router.put("/api/v1/admin/forum/posts/{post_id}/moderate", response_model=ModerateResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(RoleGuard(["ADMIN"]))])
async def moderate_post(post_id: UUID, mod_data: PostModerateAction, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    target_status = "HIDDEN" if mod_data.action == "HIDE" else "DELETED" if mod_data.action == "DELETE" else "PUBLISHED"
    result = await forum_service.moderate_post_status(db, current_user.id, post_id, target_status)
    return ModerateResponse(
        success=True,
        message="Đã cập nhật trạng thái bài viết thành công"
    )

@router.put("/api/v1/admin/forum/comments/{comment_id}/moderate", response_model=ModerateResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(RoleGuard(["ADMIN"]))])
async def moderate_comment(comment_id: UUID, mod_data: CommentModerateAction, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    target_status = "HIDDEN" if mod_data.action == "HIDE" else "DELETED" if mod_data.action == "DELETE" else "PUBLISHED"
    result = await forum_service.moderate_comment_status(db, current_user.id, comment_id, target_status)
    return ModerateResponse(
        success=True,
        message="Đã cập nhật trạng thái bình luận thành công"
    )

@router.post("/api/v1/admin/forum/clean-profanity", status_code=status.HTTP_200_OK, dependencies=[Depends(RoleGuard(["ADMIN"]))])
async def clean_profanity(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await forum_service.auto_clean_profane_content(db, moderator_id=current_user.id)
    return {
        "success": True,
        "message": "Đã quét toàn bộ diễn đàn và tự động xoá nội dung chứa từ ngữ thô tục",
        "data": result
    }
