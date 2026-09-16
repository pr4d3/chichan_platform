from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, update, delete
from sqlalchemy.orm import selectinload, joinedload, aliased
from models.forum import ForumCategory, ForumPost, ForumComment, ForumPostLike
from models.user import User
from uuid import UUID

async def get_categories(db: AsyncSession) -> list[ForumCategory]:
    result = await db.execute(select(ForumCategory).order_by(ForumCategory.name))
    return result.scalars().all()

async def get_category_by_id(db: AsyncSession, category_id: int) -> ForumCategory:
    result = await db.execute(select(ForumCategory).where(ForumCategory.id == category_id))
    return result.scalars().first()

async def get_posts(
    db: AsyncSession,
    category_id: int = None,
    search: str = None,
    include_hidden_deleted: bool = False,
    limit: int = None,
    offset: int = None
) -> list[ForumPost]:
    query = (
        select(ForumPost)
        .options(
            joinedload(ForumPost.category),
            joinedload(ForumPost.author).joinedload(User.role),
            joinedload(ForumPost.author).joinedload(User.profile)
        )
        .order_by(ForumPost.created_at.desc())
    )

    if not include_hidden_deleted:
        query = query.where(ForumPost.status == "PUBLISHED")
    else:
        query = query.where(ForumPost.status != "DELETED")

    if category_id:
        query = query.where(ForumPost.category_id == category_id)

    if search:
        query = query.where(
            or_(
                ForumPost.title.ilike(f"%{search}%"),
                ForumPost.content.ilike(f"%{search}%")
            )
        )

    # Phân trang tùy chọn: không truyền limit/offset thì trả toàn bộ (giữ hành vi cũ cho site đang live)
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)

    result = await db.execute(query)
    return result.scalars().all()

async def count_posts(db: AsyncSession, category_id: int = None, search: str = None, include_hidden_deleted: bool = False) -> int:
    """Tổng số bài viết khớp bộ lọc feed (dùng cho phân trang, không nạp dữ liệu nặng)"""
    query = select(func.count(ForumPost.id))

    if not include_hidden_deleted:
        query = query.where(ForumPost.status == "PUBLISHED")
    else:
        query = query.where(ForumPost.status != "DELETED")

    if category_id:
        query = query.where(ForumPost.category_id == category_id)

    if search:
        query = query.where(
            or_(
                ForumPost.title.ilike(f"%{search}%"),
                ForumPost.content.ilike(f"%{search}%")
            )
        )

    result = await db.execute(query)
    return result.scalar() or 0

async def count_comments_for_posts(db: AsyncSession, post_ids: list[UUID]) -> dict[UUID, int]:
    """Đếm bình luận chưa bị xóa cho NHIỀU bài viết trong 1 truy vấn (GROUP BY) — thay vòng lặp N+1.
    Loại trừ status = 'DELETED'."""
    if not post_ids:
        return {}
    query = (
        select(ForumComment.post_id, func.count(ForumComment.id))
        .where(
            ForumComment.post_id.in_(post_ids),
            ForumComment.status != "DELETED"
        )
        .group_by(ForumComment.post_id)
    )
    result = await db.execute(query)
    return {post_id: count for post_id, count in result.all()}

async def get_post_by_id(db: AsyncSession, post_id: UUID) -> ForumPost:
    result = await db.execute(
        select(ForumPost)
        .options(
            joinedload(ForumPost.category),
            joinedload(ForumPost.author).joinedload(User.role),
            joinedload(ForumPost.author).joinedload(User.profile)
        )
        .where(ForumPost.id == post_id)
    )
    return result.scalars().first()

async def create_post(db: AsyncSession, post: ForumPost) -> ForumPost:
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post

async def update_post(db: AsyncSession, post: ForumPost) -> ForumPost:
    await db.commit()
    await db.refresh(post)
    return post

async def increment_post_views(db: AsyncSession, post_id: UUID) -> int | None:
    """Tăng lượt xem bằng 1 UPDATE ... RETURNING duy nhất (không nạp graph bài viết).
    Trả về None nếu bài viết không tồn tại hoặc đã bị xóa."""
    stmt = (
        update(ForumPost)
        .where(
            ForumPost.id == post_id,
            ForumPost.status != "DELETED"
        )
        .values(views_count=ForumPost.views_count + 1)
        .returning(ForumPost.views_count)
    )
    result = await db.execute(stmt)
    views_count = result.scalar_one_or_none()
    await db.commit()
    return views_count

async def get_user_liked_post_ids(db: AsyncSession, user_id: UUID, post_ids: list[UUID]) -> set[UUID]:
    if not post_ids or not user_id:
        return set()
    stmt = select(ForumPostLike.post_id).where(
        ForumPostLike.user_id == user_id,
        ForumPostLike.post_id.in_(post_ids)
    )
    result = await db.execute(stmt)
    return set(result.scalars().all())

async def is_post_liked_by_user(db: AsyncSession, post_id: UUID, user_id: UUID) -> bool:
    if not user_id:
        return False
    stmt = select(func.count(ForumPostLike.id)).where(
        ForumPostLike.post_id == post_id,
        ForumPostLike.user_id == user_id
    )
    result = await db.execute(stmt)
    return (result.scalar() or 0) > 0

async def toggle_post_like(db: AsyncSession, post_id: UUID, user_id: UUID) -> tuple[bool, int]:
    stmt = select(ForumPostLike).where(
        ForumPostLike.post_id == post_id,
        ForumPostLike.user_id == user_id
    )
    res = await db.execute(stmt)
    existing_like = res.scalars().first()
    
    if existing_like:
        await db.delete(existing_like)
        await db.execute(
            update(ForumPost)
            .where(ForumPost.id == post_id)
            .values(likes_count=func.greatest(0, ForumPost.likes_count - 1))
        )
        liked = False
    else:
        new_like = ForumPostLike(post_id=post_id, user_id=user_id)
        db.add(new_like)
        await db.execute(
            update(ForumPost)
            .where(ForumPost.id == post_id)
            .values(likes_count=ForumPost.likes_count + 1)
        )
        liked = True
        
    await db.commit()
    
    count_stmt = select(ForumPost.likes_count).where(ForumPost.id == post_id)
    count_res = await db.execute(count_stmt)
    current_likes = count_res.scalar() or 0
    return liked, current_likes

# Comments
async def get_post_comments(db: AsyncSession, post_id: UUID, include_hidden_deleted: bool = False, limit: int = None) -> list[ForumComment]:
    query = (
        select(ForumComment)
        .options(
            joinedload(ForumComment.author).joinedload(User.role),
            joinedload(ForumComment.author).joinedload(User.profile)
        )
        .where(ForumComment.post_id == post_id)
        .order_by(ForumComment.created_at.asc())
    )
    if not include_hidden_deleted:
        query = query.where(ForumComment.status == "PUBLISHED")
    else:
        query = query.where(ForumComment.status != "DELETED")

    # Giới hạn tùy chọn: mặc định None = trả toàn bộ như cũ
    if limit:
        query = query.limit(limit)

    result = await db.execute(query)
    return result.scalars().all()

async def get_comment_by_id(db: AsyncSession, comment_id: UUID) -> ForumComment:
    result = await db.execute(select(ForumComment).where(ForumComment.id == comment_id))
    return result.scalars().first()

async def create_comment(db: AsyncSession, comment: ForumComment) -> ForumComment:
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment

async def update_comment(db: AsyncSession, comment: ForumComment) -> ForumComment:
    await db.commit()
    await db.refresh(comment)
    return comment

async def get_descendant_comment_ids(db: AsyncSession, comment_id: UUID) -> list[UUID]:
    comment_alias = aliased(ForumComment)
    cte = (
        select(ForumComment.id)
        .where(ForumComment.id == comment_id)
        .cte(name="comment_descendants", recursive=True)
    )
    cte = cte.union_all(
        select(comment_alias.id)
        .where(comment_alias.parent_comment_id == cte.c.id)
    )
    result = await db.execute(select(cte.c.id))
    return list(result.scalars().all())

async def update_comments_status(db: AsyncSession, comment_ids: list[UUID], status: str, moderated_by: UUID) -> None:
    if not comment_ids:
        return
    stmt = (
        update(ForumComment)
        .where(ForumComment.id.in_(comment_ids))
        .values(status=status, moderated_by=moderated_by)
    )
    await db.execute(stmt)
    await db.commit()
