import asyncio
import os
import sys
import random
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Bổ sung thư mục backend vào sys.path để import cấu hình và database
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.append(backend_dir)

# Dùng chung nguồn cấu hình duy nhất với app (core.config) thay vì parse .env bằng tay
from core.config import settings

DATABASE_URL = settings.DATABASE_URL
AI_API_KEY = settings.AI_API_KEY

print(f"DATABASE_URL found: {DATABASE_URL[:40]}...")
if AI_API_KEY:
    print("AI_API_KEY found.")
else:
    print("AI_API_KEY not found in .env. Will seed dummy embeddings (zero-vectors).")

# Danh sách kịch bản game (ai_scenarios)
scenarios = [
    {
        "room_code": "ROOM_STRANGER",
        "title": "Kẻ ẩn danh & Ranh giới an toàn",
        "npc_name": "Quân Kool",
        "npc_avatar_url": "/avatars/quan_kool.png",
        "initial_score": 50,
        "target_audience": "CHILD",
        "is_active": True
    },
    {
        "room_code": "ROOM_DOCTOR",
        "title": "Anh/Chị Cố vấn tuổi mới lớn",
        "npc_name": "BS. Minh Trang",
        "npc_avatar_url": "/avatars/bs_minh_trang.png",
        "initial_score": 50,
        "target_audience": "CHILD",
        "is_active": True
    },
    {
        "room_code": "ROOM_TEEN_CHILD",
        "title": "Đổi vai thấu hiểu",
        "npc_name": "Bảo Khang",
        "npc_avatar_url": "/avatars/bao_khang.png",
        "initial_score": 50,
        "target_audience": "PARENT",
        "is_active": True
    },
    {
        "room_code": "ROOM_BULLYING",
        "title": "Giải cứu tình huống học đường",
        "npc_name": "Linh Chi",
        "npc_avatar_url": "/avatars/linh_chi.png",
        "initial_score": 50,
        "target_audience": "CHILD",
        "is_active": True
    }
]

# Tri thức RAG y khoa & an toàn (ai_knowledge_vectors)
knowledge_seeds = [
    {
        "category": "ONLINE_SAFETY",
        "topic": "Quy tắc 5 ngón tay",
        "content_chunk": "Quy tắc 5 ngón tay giúp trẻ nhận biết ranh giới giao tiếp: Ngón cái (gần gũi nhất - bố mẹ, anh chị em ruột được ôm hôn), ngón trỏ (thầy cô, bạn bè được nắm tay), ngón giữa (người quen được bắt tay), ngón áp út (người xa lạ chỉ vẫy tay), ngón út (người hoàn toàn lạ mặt không được chạm vào người, nếu cố ý phải hét to và bỏ chạy)."
    },
    {
        "category": "ONLINE_SAFETY",
        "topic": "Bảo mật thông tin cá nhân trên mạng",
        "content_chunk": "Trẻ em tuyệt đối không được chia sẻ thông tin cá nhân như địa chỉ nhà, trường học, số điện thoại, mật khẩu tài khoản hoặc gửi hình ảnh cá nhân cho người lạ quen qua mạng xã hội, dù họ có tự xưng là bạn cùng lứa hay tặng quà trong game."
    },
    {
        "category": "PUBERTY_ANATOMY",
        "topic": "Mộng tinh và dậy thì ở nam giới",
        "content_chunk": "Mộng tinh (xuất tinh khi ngủ) là hiện tượng sinh lý bình thường khi nam giới bước vào tuổi dậy thì (khoảng 11-15 tuổi). Đây là dấu hiệu cho thấy tinh hoàn đã bắt đầu sản xuất tinh trùng và cơ thể đang phát triển hoàn toàn khỏe mạnh."
    },
    {
        "category": "PUBERTY_ANATOMY",
        "topic": "Kinh nguyệt ở nữ giới",
        "content_chunk": "Kinh nguyệt là hiện tượng chảy máu tử cung định kỳ hàng tháng ở nữ giới tuổi dậy thì (bắt đầu khoảng 10-15 tuổi). Chu kỳ trung bình là 28-35 ngày, kéo dài 3-7 ngày. Đây là hiện tượng sinh lý bình thường báo hiệu khả năng sinh sản của cơ thể đã bắt đầu phát triển."
    },
    {
        "category": "COMMUNICATION_SKILLS",
        "topic": "Lắng nghe tích cực con cái",
        "content_chunk": "Khi trò chuyện với con cái tuổi dậy thì, cha mẹ cần lắng nghe không phán xét, tôn trọng quyền riêng tư, tránh dùng giọng điệu ra lệnh hoặc cấm đoán, thay vào đó hãy đặt câu hỏi mở và chia sẻ trải nghiệm cá nhân của mình để tạo dựng sự tin tưởng."
    },
    {
        "category": "COMMUNICATION_SKILLS",
        "topic": "Cách hỗ trợ bạn bè bị bắt nạt học đường",
        "content_chunk": "Khi phát hiện bạn bè bị bắt nạt hoặc trêu chọc ác ý, học sinh cần bày tỏ sự đồng cảm, khẳng định lỗi không phải ở bạn, hỗ trợ bạn ghi lại bằng chứng và cùng bạn báo cáo với giáo viên chủ nhiệm hoặc chuyên gia tâm lý học đường để được trợ giúp kịp thời."
    }
]

async def get_embedding(text_content, api_key):
    """Gọi Gemini API để lấy vector embedding 768 chiều. Trả về vector zero nếu thất bại."""
    if not api_key:
        return [0.0] * 768
    
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.embed_content(
            model="text-embedding-004",
            contents=text_content
        )
        if response and response.embeddings:
            return response.embeddings[0].values
    except Exception as e:
        print(f"Error generating embedding for '{text_content[:20]}...': {e}")
    
    return [0.0] * 768

async def main():
    # Khởi tạo engine tạm thời để apply schema
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Enabling pgvector extension...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        
        print("Creating table ai_scenarios...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_scenarios (
                id SERIAL PRIMARY KEY,
                room_code VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                npc_name VARCHAR(100) NOT NULL,
                npc_avatar_url VARCHAR(500),
                initial_score INTEGER NOT NULL DEFAULT 50,
                target_audience VARCHAR(20) NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT true
            );
        """))
        
        print("Creating table ai_sessions...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_sessions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                scenario_id INTEGER NOT NULL REFERENCES ai_scenarios(id) ON DELETE CASCADE,
                current_score INTEGER NOT NULL DEFAULT 50,
                current_emotion VARCHAR(30) NOT NULL DEFAULT 'neutral',
                recent_summary TEXT,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating table ai_messages...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
                sender VARCHAR(10) NOT NULL,
                dialogue TEXT NOT NULL,
                action VARCHAR(255),
                emotion VARCHAR(30),
                score_change INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating table ai_knowledge_vectors...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_knowledge_vectors (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                category VARCHAR(50) NOT NULL,
                topic VARCHAR(150) NOT NULL,
                content_chunk TEXT NOT NULL,
                embedding vector(768) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating table ai_game_evaluations...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_game_evaluations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                session_id UUID UNIQUE NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                scenario_id INTEGER NOT NULL REFERENCES ai_scenarios(id) ON DELETE CASCADE,
                final_score INTEGER NOT NULL,
                result_outcome VARCHAR(50) NOT NULL,
                total_turns INTEGER NOT NULL,
                duration_seconds INTEGER NOT NULL,
                ai_feedback_summary TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        print("Creating indexes...")
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_messages_session_created ON ai_messages(session_id, created_at DESC);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_status ON ai_sessions(user_id, status);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_evaluations_scenario ON ai_game_evaluations(scenario_id, result_outcome);"))
        
        # Tạo HNSW index cho pgvector
        try:
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_vectors_embedding ON ai_knowledge_vectors USING hnsw (embedding vector_cosine_ops);"))
            print("HNSW index created successfully.")
        except Exception as e:
            print(f"Warning: Could not create HNSW index, falling back to IVFFlat: {e}")
            try:
                await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_vectors_embedding ON ai_knowledge_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 1);"))
                print("IVFFlat index created as fallback.")
            except Exception as ex:
                print(f"Warning: Could not create any vector index: {ex}")

        # Seed scenarios
        print("Seeding scenarios...")
        for sc in scenarios:
            await conn.execute(text("""
                INSERT INTO ai_scenarios (room_code, title, npc_name, npc_avatar_url, initial_score, target_audience, is_active)
                VALUES (:room_code, :title, :npc_name, :npc_avatar_url, :initial_score, :target_audience, :is_active)
                ON CONFLICT (room_code) DO UPDATE 
                SET title = EXCLUDED.title, npc_name = EXCLUDED.npc_name, npc_avatar_url = EXCLUDED.npc_avatar_url, 
                    initial_score = EXCLUDED.initial_score, target_audience = EXCLUDED.target_audience;
            """), sc)

    # Seed knowledge vectors (RAG)
    print("Generating embeddings and seeding knowledge base...")
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM ai_knowledge_vectors;"))
        
        for k in knowledge_seeds:
            emb = await get_embedding(k["content_chunk"], AI_API_KEY)
            k_data = {
                "category": k["category"],
                "topic": k["topic"],
                "content_chunk": k["content_chunk"],
                "embedding": str(emb)
            }
            await conn.execute(text("""
                INSERT INTO ai_knowledge_vectors (category, topic, content_chunk, embedding)
                VALUES (:category, :topic, :content_chunk, :embedding);
            """), k_data)
            
    await engine.dispose()
    print("Database Phase 4 Schema setup and seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
