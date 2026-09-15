import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv("backend/.env")
db_url = os.getenv("DATABASE_URL")
if "asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

async def check_columns():
    engine = create_async_engine(db_url, connect_args={"statement_cache_size": 0})
    async with engine.begin() as conn:
        res = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ai_scenarios';
        """))
        print("Columns in ai_scenarios:")
        for row in res.fetchall():
            print(f" - {row[0]}: {row[1]}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_columns())
