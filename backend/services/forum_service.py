from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from repositories import forum_repository
from models.forum import ForumPost, ForumComment
from schemas.forum_schema import PostCreate, CommentCreate
from uuid import UUID
import base64
from datetime import datetime, timezone
from typing import Optional
from core.profanity import validate_content_clean, check_profanity

def format_author_info(author, is_anonymous: bool, current_user_id: Optional[UUID] = None):
    if not author:
        return {
            "id": None,
            "full_name": "Người dùng ẩn danh" if is_anonymous else "Unknown",
            "role": "ANONYMOUS" if is_anonymous else "UNKNOWN",
            "avatar_url": None
        }
    if is_anonymous:
        is_self = current_user_id and str(author.id) == str(current_user_id)
        return {
            "id": author.id,
            "full_name": "Người dùng ẩn danh (Bạn)" if is_self else "Người dùng ẩn danh",
            "role": "ANONYMOUS",
            "avatar_url": None
        }
    return {
        "id": author.id,
        "full_name": author.full_name,
        "role": author.role.role_code if author.role else "UNKNOWN",
        "avatar_url": author.profile.avatar_url if author.profile else None
    }

async def get_forum_categories(db: AsyncSession):
    categories = await forum_repository.get_categories(db)
    return [
        {
            "id": c.id,
            "name": c.name,
            "slug": c.slug,
            "description": c.description
        }
        for c in categories
    ]

def _serialize_feed_post(p, comment_count: int, liked_ids: set, current_user_id: Optional[UUID]) -> dict:
    return {
        "id": p.id,
        "category_id": p.category_id,
        "category_name": p.category.name if p.category else "Unknown",
        "title": p.title,
        "short_content": p.content[:150] + "..." if len(p.content) > 150 else p.content,
        "author": format_author_info(p.author, p.is_anonymous, current_user_id),
        "comment_count": comment_count,
        "views_count": p.views_count or 0,
        "likes_count": p.likes_count or 0,
        "is_liked": p.id in liked_ids,
        "is_anonymous": p.is_anonymous,
        "is_owner": bool(current_user_id and str(p.author_id) == str(current_user_id)),
        "status": p.status,
        "created_at": p.created_at
    }

def _encode_cursor(sort_by: str, post: ForumPost, comment_count: int) -> str:
    if sort_by == "most_comments":
        sort_val = str(comment_count)
    elif sort_by == "most_likes":
        sort_val = str(post.likes_count or 0)
    elif sort_by == "most_views":
        sort_val = str(post.views_count or 0)
    else:
        sort_val = ""
    raw = f"{sort_by}|{sort_val}|{post.created_at.isoformat()}|{post.id}"
    return base64.urlsafe_b64encode(raw.encode()).decode()

def _decode_cursor(cursor_str: str) -> tuple[Optional[str], Optional[int], Optional[datetime], Optional[UUID]]:
    try:
        raw = base64.urlsafe_b64decode(cursor_str.encode()).decode()
        parts = raw.split("|")
        # Hỗ trợ định dạng cũ: dt|id
        if len(parts) == 2:
            return "newest", None, datetime.fromisoformat(parts[0]), UUID(parts[1])
        if len(parts) == 4:
            mode = parts[0]
            val = int(parts[1]) if parts[1] else None
            dt = datetime.fromisoformat(parts[2])
            pid = UUID(parts[3])
            return mode, val, dt, pid
        return None, None, None, None
    except Exception:
        return None, None, None, None

async def get_forum_feed(
    db: AsyncSession,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    include_hidden_deleted: bool = False,
    current_user_id: Optional[UUID] = None,
    limit: Optional[int] = None,
    cursor: Optional[str] = None,
    sort_by: str = "newest"
):
    if sort_by not in ("newest", "most_comments", "most_likes", "most_views"):
        sort_by = "newest"

    # Phân trang con trỏ khi client truyền limit hoặc cursor
    paginated = limit is not None or cursor is not None
    if paginated:
        fetch_limit = limit or 20
        c_mode, c_val, cursor_dt, cursor_id = _decode_cursor(cursor) if cursor else (None, None, None, None)
        # Nếu cursor truyền vào khác chế độ sort_by hiện tại, đặt lại con trỏ
        if c_mode and c_mode != sort_by:
            c_val, cursor_dt, cursor_id = None, None, None

        raw_posts = await forum_repository.get_posts(
            db,
            category_id=category_id,
            search=search,
            include_hidden_deleted=include_hidden_deleted,
            limit=fetch_limit + 1,
            cursor_created_at=cursor_dt,
            cursor_id=cursor_id,
            sort_by=sort_by,
            cursor_sort_val=c_val
        )
        has_more = len(raw_posts) > fetch_limit
        posts = raw_posts[:fetch_limit]
    else:
        posts = await forum_repository.get_posts(
            db,
            category_id=category_id,
            search=search,
            include_hidden_deleted=include_hidden_deleted,
            sort_by=sort_by
        )
        has_more = False

    post_ids = [p.id for p in posts]
    liked_ids = await forum_repository.get_user_liked_post_ids(db, current_user_id, post_ids) if current_user_id else set()
    comment_counts = await forum_repository.count_comments_for_posts(db, post_ids)

    results = [
        _serialize_feed_post(p, comment_counts.get(p.id, 0), liked_ids, current_user_id)
        for p in posts
    ]

    next_cursor = _encode_cursor(sort_by, posts[-1], comment_counts.get(posts[-1].id, 0)) if (paginated and has_more and posts) else None

    if paginated:
        return {
            "items": results,
            "next_cursor": next_cursor,
            "has_more": has_more
        }
    return results

def build_comment_tree(comments: list[ForumComment], parent_id: UUID = None, current_user_id: Optional[UUID] = None) -> list[dict]:
    comments_by_id = {c.id: c for c in comments}
    nodes = []
    for c in comments:
        if c.parent_comment_id == parent_id:
            parent_comment = comments_by_id.get(c.parent_comment_id)
            reply_to_author = format_author_info(parent_comment.author, parent_comment.is_anonymous, current_user_id) if parent_comment else None

            node = {
                "id": c.id,
                "parent_comment_id": c.parent_comment_id,
                "content": c.content,
                "status": c.status,
                "is_anonymous": c.is_anonymous,
                "created_at": c.created_at,
                "author": format_author_info(c.author, c.is_anonymous, current_user_id),
                "reply_to_author": reply_to_author,
                "replies": build_comment_tree(comments, c.id, current_user_id)
            }
            nodes.append(node)
    return nodes

async def get_post_detail_with_comments(db: AsyncSession, post_id: UUID, include_hidden_deleted: bool = False, current_user_id: Optional[UUID] = None):
    post = await forum_repository.get_post_by_id(db, post_id)
    if not post or post.status == "DELETED":
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
        
    if not include_hidden_deleted and post.status != "PUBLISHED":
        raise HTTPException(status_code=404, detail="Bài viết không tồn tại hoặc đã bị ẩn.")
        
    # Check if current user liked the post
    is_liked = await forum_repository.is_post_liked_by_user(db, post_id, current_user_id) if current_user_id else False
    
    comments = await forum_repository.get_post_comments(db, post_id, include_hidden_deleted)
    comments_tree = build_comment_tree(comments, None, current_user_id)
    
    return {
        "id": post.id,
        "category_id": post.category_id,
        "category_name": post.category.name if post.category else "Unknown",
        "title": post.title,
        "content": post.content,
        "status": post.status,
        "views_count": post.views_count or 0,
        "likes_count": post.likes_count or 0,
        "is_liked": is_liked,
        "is_anonymous": post.is_anonymous,
        "is_owner": bool(current_user_id and str(post.author_id) == str(current_user_id)),
        "created_at": post.created_at,
        "author": format_author_info(post.author, post.is_anonymous, current_user_id),
        "comments": comments_tree
    }

async def record_post_view(db: AsyncSession, post_id: UUID):
    # Chỉ 1 UPDATE ... RETURNING duy nhất, không nạp toàn bộ graph bài viết (comments/likes/author)
    views_count = await forum_repository.increment_post_views(db, post_id)
    if views_count is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
    return {
        "post_id": post_id,
        "views_count": views_count
    }

async def toggle_post_like(db: AsyncSession, user_id: UUID, post_id: UUID):
    post = await forum_repository.get_post_by_id(db, post_id)
    if not post or post.status == "DELETED":
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
        
    liked, likes_count = await forum_repository.toggle_post_like(db, post_id, user_id)
    return {
        "post_id": post_id,
        "liked": liked,
        "likes_count": likes_count
    }

async def create_new_post(db: AsyncSession, author_id: UUID, post_data: PostCreate):
    # Kiểm duyệt từ ngữ thô tục trong tiêu đề và nội dung bài viết
    validate_content_clean(post_data.title, "Tiêu đề bài viết")
    validate_content_clean(post_data.content, "Nội dung bài viết")

    category = await forum_repository.get_category_by_id(db, post_data.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Category not found.")
        
    post = ForumPost(
        category_id=post_data.category_id,
        author_id=author_id,
        title=post_data.title,
        content=post_data.content,
        is_anonymous=post_data.is_anonymous,
        status="PUBLISHED"
    )
    created = await forum_repository.create_post(db, post)
    return {
        "post_id": created.id,
        "title": created.title,
        "status": created.status,
        "is_anonymous": created.is_anonymous,
        "created_at": created.created_at
    }

async def create_new_comment(db: AsyncSession, author_id: UUID, post_id: UUID, comment_data: CommentCreate):
    # Kiểm duyệt từ ngữ thô tục trong bình luận
    validate_content_clean(comment_data.content, "Nội dung bình luận")

    post = await forum_repository.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
        
    if comment_data.parent_comment_id:
        parent = await forum_repository.get_comment_by_id(db, comment_data.parent_comment_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status_code=400, detail="Bình luận cha không hợp lệ.")
            
    comment = ForumComment(
        post_id=post_id,
        author_id=author_id,
        parent_comment_id=comment_data.parent_comment_id,
        content=comment_data.content,
        is_anonymous=comment_data.is_anonymous,
        status="PUBLISHED"
    )
    
    created = await forum_repository.create_comment(db, comment)
    
    from sqlalchemy.orm import joinedload
    from sqlalchemy import select
    from models.user import User
    
    comment_details = await db.execute(
        select(ForumComment)
        .options(
            joinedload(ForumComment.author).joinedload(User.role),
            joinedload(ForumComment.author).joinedload(User.profile)
        )
        .where(ForumComment.id == created.id)
    )
    created = comment_details.scalars().first()
    
    return {
        "comment_id": created.id,
        "post_id": created.post_id,
        "parent_comment_id": created.parent_comment_id,
        "content": created.content,
        "status": created.status,
        "is_anonymous": created.is_anonymous,
        "created_at": created.created_at,
        "author": format_author_info(created.author, created.is_anonymous, author_id)
    }

async def delete_post_by_owner(db: AsyncSession, user_id: UUID, is_admin: bool, post_id: UUID):
    post = await forum_repository.get_post_by_id(db, post_id)
    if not post or post.status == "DELETED":
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
        
    if not is_admin and post.author_id != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bài viết này.")
        
    post.status = "DELETED"
    post.moderated_by = user_id
    await forum_repository.update_post(db, post)
    return {
        "post_id": post.id,
        "status": "DELETED"
    }

async def delete_comment_by_owner(db: AsyncSession, user_id: UUID, is_admin: bool, comment_id: UUID):
    comment = await forum_repository.get_comment_by_id(db, comment_id)
    if not comment or comment.status == "DELETED":
        raise HTTPException(status_code=404, detail="Không tìm thấy bình luận.")
    
    if not is_admin and comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa bình luận này.")
        
    descendant_ids = await forum_repository.get_descendant_comment_ids(db, comment_id)
    await forum_repository.update_comments_status(db, descendant_ids, "DELETED", user_id)
    return {
        "comment_id": comment.id,
        "status": "DELETED"
    }

async def moderate_post_status(db: AsyncSession, admin_id: UUID, post_id: UUID, target_status: str):
    post = await forum_repository.get_post_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
        
    post.status = target_status
    post.moderated_by = admin_id
    await forum_repository.update_post(db, post)
    return {
        "post_id": post.id,
        "status": post.status,
        "moderated_by": post.moderated_by
    }

async def moderate_comment_status(db: AsyncSession, admin_id: UUID, comment_id: UUID, target_status: str):
    comment = await forum_repository.get_comment_by_id(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Không tìm thấy bình luận.")
        
    if target_status in ["DELETED", "HIDDEN"]:
        descendant_ids = await forum_repository.get_descendant_comment_ids(db, comment_id)
        await forum_repository.update_comments_status(db, descendant_ids, target_status, admin_id)
    else:
        comment.status = target_status
        comment.moderated_by = admin_id
        await forum_repository.update_comment(db, comment)

    return {
        "comment_id": comment.id,
        "status": target_status,
        "moderated_by": admin_id
    }

async def auto_clean_profane_content(db: AsyncSession, moderator_id: Optional[UUID] = None) -> dict:
    """
    Quét tự động và xoá (status='DELETED') mọi bài viết / bình luận đang PUBLISHED
    có chứa từ ngữ thô tục trong CSDL.
    moderator_id=None nghĩa là quét định kỳ bởi hệ thống (không ghi nhận người kiểm duyệt).
    """
    profane_post_ids = []
    for post_id, title, content in await forum_repository.get_published_post_texts(db):
        has_bad_title, _ = check_profanity(title)
        has_bad_content, _ = check_profanity(content)
        if has_bad_title or has_bad_content:
            profane_post_ids.append(post_id)

    profane_comment_ids = []
    for comment_id, content in await forum_repository.get_published_comment_texts(db):
        has_bad, _ = check_profanity(content)
        if has_bad:
            profane_comment_ids.append(comment_id)

    await forum_repository.update_posts_status(db, profane_post_ids, "DELETED", moderator_id)
    await forum_repository.update_comments_status(db, profane_comment_ids, "DELETED", moderator_id)

    return {
        "cleaned_posts": len(profane_post_ids),
        "cleaned_comments": len(profane_comment_ids),
        "message": f"Đã quét và tự động xoá {len(profane_post_ids)} bài viết và {len(profane_comment_ids)} bình luận có từ ngữ thô tục."
    }

