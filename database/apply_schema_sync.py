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

# Đồng bộ schema 2026-09: các cột dưới đây được thêm vào Supabase bằng ALTER TABLE tay
# trước đây nên còn nullable, trong khi SQLAlchemy models khai báo NOT NULL — siết lại
# cho khớp. Trạng thái đích khai báo trong database/schema.sql.
# Xem docs/refactor_maintainability_scale.md (mục DEBT — khuyến nghị Alembic).
# Bảng forum_post_likes: bảo hiểm tạo nếu chưa có (no-op trên live — bảng đã tồn tại),
# giữ đúng quy ước script apply_*.py tự tạo bảng của mình.
CREATE_LIKES_TABLE = """
CREATE TABLE IF NOT EXISTS forum_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);
"""

# (table, column, giá trị backfill literal) — backfill chạy trước SET NOT NULL để script
# không bao giờ chết nửa chừng nếu dữ liệu tương lai có NULL (trên live hiện tại: 0 dòng NULL, no-op)
NULL_BACKFILLS = [
    ("forum_posts", "is_anonymous", "FALSE"),
    ("forum_posts", "views_count", "0"),
    ("forum_posts", "likes_count", "0"),
    ("forum_comments", "is_anonymous", "FALSE"),
    ("ai_scenarios", "first_message_sender", "'USER'"),
]

# Guard idempotent: chỉ ALTER khi cột còn nullable — chạy lại an toàn bao nhiêu lần cũng được
GUARD_QUERY = text(
    "SELECT is_nullable FROM information_schema.columns "
    "WHERE table_schema = 'public' AND table_name = :t AND column_name = :c"
)


async def apply_schema_sync():
    # statement_cache_size=0: bắt buộc cho Supabase Transaction Pooler (như core/database.py)
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"statement_cache_size": 0},
    )
    async with engine.begin() as conn:
        print("[Bước 0] Đảm bảo bảng forum_post_likes tồn tại (IF NOT EXISTS)...")
        await conn.execute(text(CREATE_LIKES_TABLE))

        print("[Bước 1] Backfill phòng hờ các giá trị NULL...")
        for table, column, literal in NULL_BACKFILLS:
            result = await conn.execute(
                text(f"UPDATE {table} SET {column} = {literal} WHERE {column} IS NULL")
            )
            print(f"  - {table}.{column}: {result.rowcount} dòng backfill")

        print("[Bước 2] Siết NOT NULL (guard idempotent)...")
        altered = skipped = 0
        for table, column, _ in NULL_BACKFILLS:
            row = (await conn.execute(GUARD_QUERY, {"t": table, "c": column})).fetchone()
            if row is None:
                print(f"  [Cảnh báo] {table}.{column} không tồn tại — bỏ qua (chưa áp schema.sql?)")
            elif row.is_nullable == "NO":
                print(f"  [Bỏ qua] {table}.{column} đã là NOT NULL")
                skipped += 1
            else:
                await conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN {column} SET NOT NULL"))
                print(f"  [OK] Đã siết {table}.{column} thành NOT NULL")
                altered += 1

    await engine.dispose()
    print(f"\nHoàn tất: {altered} cột siết mới, {skipped}/5 cột đã NOT NULL từ trước.")


if __name__ == "__main__":
    asyncio.run(apply_schema_sync())
