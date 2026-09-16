from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from core.config import settings

# Khởi tạo Async Engine cho SQLAlchemy (echo điều khiển qua biến ECHO trong .env)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ECHO,
    future=True,
    # Cấu hình pool tường minh (default của SQLAlchemy là 5+10=15 kết nối, không quan sát được
    # và dễ cạn khi các lượt chat SSE hoặc request song song tăng): mỗi instance tối đa 20 kết nối,
    # request chờ checkout tối đa 30s thay vì fail hoặc queue âm thầm.
    pool_size=10,
    max_overflow=10,
    pool_timeout=30,
    connect_args={"statement_cache_size": 0}
)

# Khởi tạo Async Session Maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class cho tất cả các model ORM
Base = declarative_base()

# Dependency để lấy database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
