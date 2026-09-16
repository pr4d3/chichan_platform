from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from repositories import settings_repository
from uuid import UUID

async def get_all_settings_list(db: AsyncSession):
    return await settings_repository.get_all_settings(db)

async def update_site_setting(db: AsyncSession, key_name: str, value_content: str, description: str = None):
    updated = await settings_repository.update_setting(db, key_name, value_content, description)
    return {
        "key_name": updated.key_name,
        "updated_at": updated.updated_at
    }

async def get_home_page_data(db: AsyncSession):
    from repositories import course_repository, forum_repository
    
    banner_title = await settings_repository.get_setting_by_key(db, "home_hero_title")
    banner_sub = await settings_repository.get_setting_by_key(db, "home_hero_subtitle")
    
    hero_title = banner_title.value_content if banner_title else "Nền tảng Giáo dục Giới tính Trực tuyến An toàn & Khoa học"
    hero_sub = banner_sub.value_content if banner_sub else "Đồng hành cùng thanh thiếu niên và phụ huynh Việt Nam xây dựng nhận thức đúng đắn."
    
    # Giới hạn ngay tại DB (limit) thay vì tải toàn bộ rồi slice trong Python
    courses_parent = await course_repository.get_courses(db, "PARENT", limit=6)
    parent_list = []
    for c in courses_parent:
        parent_list.append({
            "id": str(c.id),
            "title": c.title,
            "thumbnail_url": c.thumbnail_url,
            "instructor_name": c.instructor.full_name if c.instructor else "Unknown",
            "total_lessons": len(c.lessons) if c.lessons else 0
        })

    courses_child = await course_repository.get_courses(db, "CHILD", limit=6)
    child_list = []
    for c in courses_child:
        child_list.append({
            "id": str(c.id),
            "title": c.title,
            "thumbnail_url": c.thumbnail_url,
            "instructor_name": c.instructor.full_name if c.instructor else "Unknown",
            "total_lessons": len(c.lessons) if c.lessons else 0
        })

    posts = await forum_repository.get_posts(db, include_hidden_deleted=False, limit=4)
    # Đếm bình luận cho cả nhóm bài viết trong 1 truy vấn GROUP BY (tránh N+1 query từng bài)
    comment_counts = await forum_repository.count_comments_for_posts(db, [p.id for p in posts])
    recent_posts = []
    for p in posts:
        comment_count = comment_counts.get(p.id, 0)
        is_anon = p.is_anonymous
        author_name = "Người dùng ẩn danh" if is_anon else (p.author.full_name if p.author else "Unknown")
        author_avatar = None if is_anon else (p.author.profile.avatar_url if p.author and p.author.profile else None)
        short_content = (p.content[:140] + "...") if len(p.content) > 140 else p.content
        recent_posts.append({
            "id": str(p.id),
            "title": p.title,
            "short_content": short_content,
            "category_name": p.category.name if p.category else "Thảo luận chung",
            "author_name": author_name,
            "author_avatar": author_avatar,
            "is_anonymous": is_anon,
            "likes_count": p.likes_count or 0,
            "comment_count": comment_count,
            "created_at": p.created_at
        })
        
    return {
        "hero_banner": {
            "title": hero_title,
            "subtitle": hero_sub
        },
        "parent_courses": parent_list,
        "child_courses": child_list,
        "recent_forum_posts": recent_posts
    }

async def get_about_us_data(db: AsyncSession):
    title_setting = await settings_repository.get_setting_by_key(db, "about_us_research_title")
    purpose_setting = await settings_repository.get_setting_by_key(db, "about_us_research_purpose")
    method_setting = await settings_repository.get_setting_by_key(db, "about_us_methodology")
    authors_setting = await settings_repository.get_setting_by_key(db, "about_us_authors_json")
    
    import json
    authors = []
    if authors_setting:
        try:
            authors = json.loads(authors_setting.value_content)
        except:
            authors = [{"name": "Nhóm Nghiên cứu Khoa học", "role": "Tác giả & Phát triển Nền tảng", "contact": "research.sexed@example.edu.vn"}]
    else:
        authors = [{"name": "Nhóm Nghiên cứu Khoa học", "role": "Tác giả & Phát triển Nền tảng", "contact": "research.sexed@example.edu.vn"}]
        
    return {
        "research_title": title_setting.value_content if title_setting else "Nghiên cứu và Ứng dụng Nền tảng E-learning trong Phổ biến Kiến thức Giáo dục Giới tính tại Việt Nam",
        "research_purpose": purpose_setting.value_content if purpose_setting else "Đề tài hướng tới việc xóa bỏ các rào cản tâm lý e ngại, cung cấp nguồn học liệu chuẩn y khoa, giúp thanh thiếu niên chủ động bảo vệ bản thân và phụ huynh có kỹ năng đồng hành cùng con.",
        "methodology": method_setting.value_content if method_setting else "Kết hợp học tập trực tuyến cá nhân hóa theo nhóm đối tượng và diễn đàn trao đổi an toàn.",
        "authors": authors
    }
