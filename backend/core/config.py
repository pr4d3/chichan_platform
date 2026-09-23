from pathlib import Path

from dotenv import load_dotenv
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Neo đường dẫn .env vào thư mục backend/ để chạy `uvicorn main:app` từ đâu cũng đúng
# (trước đây load_dotenv() đọc theo CWD — chạy từ repo root sẽ âm thầm dùng toàn bộ
# giá trị mặc định: DB localhost, SECRET_KEY mặc định, AI_API_KEY rỗng).
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Security
    # Chấp nhận cả JWT_SECRET_KEY (tên cũ trong docs deploy Render) như một alias.
    SECRET_KEY: str = Field(
        default="your-super-secret-key-change-me-in-production",
        validation_alias=AliasChoices("SECRET_KEY", "JWT_SECRET_KEY"),
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALLOWED_ORIGINS: str = "*"

    # AI (Gemini)
    AI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # SQL logging của SQLAlchemy (bật qua ECHO=true khi cần debug, mặc định tắt)
    ECHO: bool = False

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()


def validate_settings() -> list[tuple[str, str]]:
    """Kiểm tra cấu hình runtime khi khởi động.

    Trả về danh sách (mức_log, mô_tả_vấn_đề). Hiện CHỈ WARN — sau một chu kỳ deploy
    ổn định trên Render, chuyển các mục CRITICAL thành raise RuntimeError
    (fail-loud) theo kế hoạch refactor phase 3.
    """
    problems: list[tuple[str, str]] = []

    if settings.SECRET_KEY == "your-super-secret-key-change-me-in-production":
        problems.append((
            "critical",
            "SECRET_KEY đang dùng giá trị mặc định không an toàn — JWT có thể bị làm giả. "
            "Hãy đặt SECRET_KEY (hoặc tên cũ JWT_SECRET_KEY) trên môi trường deploy.",
        ))

    if not settings.DATABASE_URL.startswith("postgresql+asyncpg://"):
        problems.append((
            "critical",
            "DATABASE_URL phải dùng scheme postgresql+asyncpg:// (driver async) — "
            "scheme khác sẽ lỗi khi mở kết nối.",
        ))

    if not settings.AI_API_KEY:
        problems.append((
            "warning",
            "AI_API_KEY chưa đặt — các tính năng AI (roleplay, embedding) sẽ lỗi khi gọi.",
        ))

    if settings.ALLOWED_ORIGINS.strip() == "*":
        problems.append((
            "warning",
            "ALLOWED_ORIGINS='*' — CORS mở cho mọi origin và allow_credentials bị tắt. "
            "App hiện gọi API bằng header Bearer (không cookie cross-origin) nên vẫn chạy "
            "bình thường, nhưng cấu hình này sẽ chặn các thiết kế cookie HttpOnly trong "
            "tương lai. Hãy liệt kê domain production cụ thể.",
        ))

    return problems
