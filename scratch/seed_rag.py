import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import sys
sys.path.append("backend")
import services.gemini_service as gemini

load_dotenv("backend/.env")
db_url = os.getenv("DATABASE_URL")
if "asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")

SEXTORTION_KNOWLEDGE = [
    {
        "category": "SEXTORTION_SAFETY",
        "topic": "Ứng phó khi bị tống tiền bằng hình ảnh nhạy cảm (Sextortion)",
        "content_chunk": "Khi bị đe dọa phát tán hình ảnh nhạy cảm (Sextortion), nguyên tắc sống còn là TUYỆT ĐỐI KHÔNG chuyển tiền và KHÔNG gửi thêm hình ảnh. Kẻ tống tiền sẽ không bao giờ xóa ảnh sau khi nhận tiền mà sẽ tiếp tục tống tiền với số tiền lớn hơn. Hãy giữ bình tĩnh, chụp lại toàn bộ màn hình tin nhắn, số tài khoản, thông tin đối tượng làm bằng chứng và liên hệ ngay Tổng đài Quốc gia Bảo vệ Trẻ em 111 hoặc cơ quan Công an."
    },
    {
        "category": "SEXTORTION_SAFETY",
        "topic": "Khung pháp lý xử lý hành vi tống tiền và phát tán ảnh riêng tư",
        "content_chunk": "Hành vi đe dọa tung ảnh nhạy cảm để đòi tiền phạm vào Điều 170 Bộ luật Hình sự về 'Tội cưỡng đoạt tài sản' với khung hình phạt tù từ 1 đến 20 năm. Hành vi phát tán hình ảnh riêng tư không có sự đồng ý vi phạm nghiêm trọng Luật An ninh mạng và Điều 155 Bộ luật Hình sự (Tội làm nhục người khác). Nạn nhân được pháp luật bảo vệ tối đa và giữ bí mật đời tư danh tính khi tố cáo."
    }
]

async def seed_knowledge():
    engine = create_async_engine(db_url, connect_args={"statement_cache_size": 0})
    async with engine.begin() as conn:
        for item in SEXTORTION_KNOWLEDGE:
            res = await conn.execute(
                text("SELECT id FROM ai_knowledge_vectors WHERE topic = :topic"),
                {"topic": item["topic"]}
            )
            if not res.scalar():
                print(f"Generating embedding for: {item['topic']}")
                emb = await gemini.generate_embedding(item["content_chunk"])
                emb_str = str(emb)
                await conn.execute(
                    text("""
                        INSERT INTO ai_knowledge_vectors (id, category, topic, content_chunk, embedding, created_at)
                        VALUES (gen_random_uuid(), :category, :topic, :content_chunk, :embedding, NOW())
                    """),
                    {
                        "category": item["category"],
                        "topic": item["topic"],
                        "content_chunk": item["content_chunk"],
                        "embedding": emb_str
                    }
                )
                print(f"Inserted knowledge chunk: {item['topic']}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_knowledge())
