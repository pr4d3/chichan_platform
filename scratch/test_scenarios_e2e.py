import asyncio
import os
import sys
sys.path.append("backend")
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

load_dotenv("backend/.env")
db_url = os.getenv("DATABASE_URL")
if "asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

from services import roleplay_service as service
import repositories.roleplay_repository as repo
from models.role import Role
from models.profile import UserProfile
from models.user import User
from models.ai_scenario import AIScenario
from models.ai_session import AISession
from models.ai_message import AIMessage
from models.ai_game_evaluation import AIGameEvaluation

async def test_scenarios():
    engine = create_async_engine(db_url, connect_args={"statement_cache_size": 0})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        print("=== 1. TEST LIST SCENARIOS ===")
        scenarios = await service.list_scenarios(db)
        print(f"Total active scenarios: {len(scenarios)}")
        for s in scenarios:
            print(f" - [{s.room_code}] {s.title} | NPC: {s.npc_name} | First sender: {s.first_message_sender}")

        print("\n=== 2. TEST USER LOOKUP ===")
        res = await db.execute(text("SELECT id, email, role_id FROM users LIMIT 1;"))
        user_row = res.fetchone()
        if not user_row:
            print("No user found in DB to test session creation!")
            return
        user_id = user_row[0]
        print(f"Testing with user: {user_id} ({user_row[1]})")

        print("\n=== 3. TEST SESSION CREATION FOR TH1 (ROOM_STRANGER - NPC First) ===")
        th1 = next(s for s in scenarios if s.room_code == "ROOM_STRANGER")
        s1 = await service.create_new_session(db, user_id, th1.id)
        detail1 = await service.get_session_detail(db, s1.id, user_id)
        print(f"Session 1 ID: {s1.id} | Status: {s1.status} | Messages count: {len(detail1['messages'])}")
        if detail1["messages"]:
            first_msg = detail1["messages"][0]
            print(f"First message sender: {first_msg['sender']} | Dialogue: {first_msg['dialogue'][:50]}...")
            assert first_msg["sender"] == "NPC"
            print("=> TH1 NPC FIRST MESSAGE VERIFIED!")

        print("\n=== 4. TEST SESSION CREATION FOR TH2 (ROOM_SEXTORTION - NPC First) ===")
        th2 = next(s for s in scenarios if s.room_code == "ROOM_SEXTORTION")
        s2 = await service.create_new_session(db, user_id, th2.id)
        detail2 = await service.get_session_detail(db, s2.id, user_id)
        print(f"Session 2 ID: {s2.id} | Status: {s2.status} | Messages count: {len(detail2['messages'])}")
        if detail2["messages"]:
            first_msg = detail2["messages"][0]
            print(f"First message sender: {first_msg['sender']} | Dialogue: {first_msg['dialogue'][:50]}...")
            assert first_msg["sender"] == "NPC"
            print("=> TH2 NPC FIRST MESSAGE VERIFIED!")

        print("\n=== 5. TEST SESSION CREATION FOR TH3 (ROOM_DOCTOR - USER First) ===")
        th3 = next(s for s in scenarios if s.room_code == "ROOM_DOCTOR")
        s3 = await service.create_new_session(db, user_id, th3.id)
        detail3 = await service.get_session_detail(db, s3.id, user_id)
        print(f"Session 3 ID: {s3.id} | Status: {s3.status} | Messages count: {len(detail3['messages'])}")
        assert len(detail3["messages"]) == 0
        print("=> TH3 USER FIRST MESSAGE (0 initial messages) VERIFIED!")

    await engine.dispose()
    print("\nALL VERIFICATIONS PASSED!")

if __name__ == "__main__":
    asyncio.run(test_scenarios())
