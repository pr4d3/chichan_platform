import asyncio
import os
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.append(backend_dir)

# Dùng chung nguồn cấu hình duy nhất với app (core.config) thay vì parse .env bằng tay
from core.config import settings

DATABASE_URL = settings.DATABASE_URL

print(f"Connecting to database: {DATABASE_URL[:35]}...")

# Các chỉ mục bổ sung 2026-09: tối ưu các truy vấn nóng (forum feed, dashboard, admin list).
# Đồng bộ với phần cuối của database/schema.sql — xem phần "Thêm 2026-09".
INDEXES = [
    # Forum: danh sách bình luận theo bài viết + đếm bình luận feed (trước đây là seq scan từng bài)
    ("idx_forum_comments_post_status", "CREATE INDEX IF NOT EXISTS idx_forum_comments_post_status ON forum_comments(post_id, status, created_at);"),
    # Forum: đệ quy tìm bình luận con khi xóa/kiểm duyệt (CTE parent_comment_id)
    ("idx_forum_comments_parent", "CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id);"),
    # Forum feed: sắp xếp created_at DESC + lọc status
    ("idx_forum_posts_status_created", "CREATE INDEX IF NOT EXISTS idx_forum_posts_status_created ON forum_posts(status, created_at DESC);"),
    # Forum feed khi lọc theo chuyên mục
    ("idx_forum_posts_category_status_created", "CREATE INDEX IF NOT EXISTS idx_forum_posts_category_status_created ON forum_posts(category_id, status, created_at DESC);"),
    # Dashboard: đếm/thống kê enrollment theo khóa học (UNIQUE(user_id, course_id) cũ không phục vụ lookup theo course_id)
    ("idx_course_enrollments_course", "CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id, status);"),
    # Khóa học: danh sách bài học theo course_id + thứ tự order_index (selectinload Course.lessons)
    ("idx_lessons_course_order", "CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, order_index);"),
    # Dashboard giảng viên + kiểm tra quyền sở hữu khóa học
    ("idx_courses_instructor", "CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);"),
    # Admin: đếm người dùng theo vai trò (GROUP BY role_code join users)
    ("idx_users_role", "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);"),
    # Admin: sắp xếp danh sách người dùng mới nhất trước
    ("idx_users_created_at", "CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);"),
    # Job dọn dẹp user_sessions hết hạn chạy mỗi 6 giờ (xem backend/main.py)
    ("idx_user_sessions_expires_at", "CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);"),
]

async def apply_indexes():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        for name, ddl in INDEXES:
            print(f"Creating index {name}...")
            await conn.execute(text(ddl))

    await engine.dispose()
    print("All performance indexes created successfully!")

if __name__ == "__main__":
    asyncio.run(apply_indexes())
