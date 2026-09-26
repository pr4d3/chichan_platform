import logging
import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import delete
from core.database import engine, AsyncSessionLocal
from core.config import settings, validate_settings
from models.session import UserSession
from services import forum_service
from routers import auth_router, user_router, course_router, forum_router, dashboard_router, general_router, roleplay_router, admin_router, quiz_router


# Khởi tạo logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Chu kỳ dọn dẹp user_sessions hết hạn: 6 giờ
SESSION_CLEANUP_INTERVAL_SECONDS = 6 * 3600

# Chu kỳ quét tự động nội dung diễn đàn thô tục: 12 giờ
PROFANITY_CLEANUP_INTERVAL_SECONDS = 12 * 3600

async def expired_sessions_cleanup_loop():
    """Vòng lặp nền: xóa các user_sessions đã hết hạn (refresh token hết hạn) mỗi 6 giờ
    để bảng không phình vô hạn."""
    while True:
        await asyncio.sleep(SESSION_CLEANUP_INTERVAL_SECONDS)
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    delete(UserSession).where(UserSession.expires_at < datetime.now(timezone.utc))
                )
                await db.commit()
                if result.rowcount:
                    logger.info(f"Đã dọn dẹp {result.rowcount} phiên đăng nhập (user_sessions) hết hạn.")
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Lỗi khi dọn dẹp user_sessions hết hạn.")

async def profane_forum_content_cleanup_loop():
    """Vòng lặp nền: quét và tự động xoá (status='DELETED') các bài viết/bình luận
    đang hiển thị có từ ngữ thô tục — quét ngay khi khởi động rồi lặp lại mỗi 12 giờ,
    để dọn cả nội dung cũ tồn tại trước khi bộ lọc ra đời."""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await forum_service.auto_clean_profane_content(db)
                logger.info(
                    f"Quét nội dung diễn đàn: xoá {result['cleaned_posts']} bài viết, "
                    f"{result['cleaned_comments']} bình luận chứa từ ngữ thô tục."
                )
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Lỗi khi quét nội dung diễn đàn thô tục.")
        await asyncio.sleep(PROFANITY_CLEANUP_INTERVAL_SECONDS)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Logic chạy khi khởi động server
    logger.info("Starting up SexEd Platform Backend API...")
    # Kiểm tra cấu hình runtime: hiện chỉ WARN để không làm sập deploys hiện có.
    # TODO(phase-3): sau một chu kỳ deploy sạch (không còn log critical), chuyển các
    # mục "critical" thành raise RuntimeError để fail-loud ngay khi khởi động.
    for level, message in validate_settings():
        getattr(logger, level, logger.warning)(message)
    # Tác vụ nền: dọn dẹp user_sessions hết hạn mỗi 6 giờ + quét nội dung thô tục mỗi 12 giờ
    cleanup_task = asyncio.create_task(expired_sessions_cleanup_loop())
    profanity_task = asyncio.create_task(profane_forum_content_cleanup_loop())
    yield
    # Logic chạy khi tắt server
    logger.info("Shutting down API...")
    # Hủy sạch các task dọn dẹp trước khi đóng pool kết nối
    for task in (cleanup_task, profanity_task):
        task.cancel()
    await asyncio.gather(cleanup_task, profanity_task, return_exceptions=True)
    logger.info("Đã dừng các tác vụ dọn dẹp nền.")
    await engine.dispose()

app = FastAPI(
    title="SexEd Platform API",
    description="Backend API for Vietnamese Sex Education Web Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS
# Origin production KHÔNG còn hardcode — lấy duy nhất từ biến môi trường
# ALLOWED_ORIGINS trên Render (đổi domain frontend không phải deploy lại backend).
# Regex *.vercel.app bên dưới giữ lại để các bản preview Vercel dùng được.
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

allow_all = False
if settings.ALLOWED_ORIGINS:
    if settings.ALLOWED_ORIGINS == "*":
        allow_all = True
        origins = ["*"]
    else:
        env_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
        origins.extend(env_origins)

origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=not allow_all,  # must be False if allow_origins is ["*"]
    allow_origin_regex="https://.*\\.vercel\\.app" if not allow_all else None,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Welcome to SexEd Platform API", "status": "OK"}

@app.get("/health", tags=["Health Check"])
async def health():
    return {"status": "healthy", "database": "connected"}

# Include routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(course_router.router)
app.include_router(forum_router.router)
app.include_router(dashboard_router.router)
app.include_router(general_router.router)
app.include_router(roleplay_router.router)
app.include_router(admin_router.router)
app.include_router(quiz_router.router)

# Static files for user uploads (e.g. avatars)
import os
from fastapi.staticfiles import StaticFiles

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "avatars"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

