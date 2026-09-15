import asyncio
import os
import sys
sys.path.append("backend")
from dotenv import load_dotenv

# Tải biến môi trường mới nhất từ backend/.env
load_dotenv("backend/.env", override=True)

import services.gemini_service as gemini

async def test_api_key():
    api_key = os.getenv("AI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    print(f"1. Kiểm tra API Key: {'Đã cấu hình (' + api_key[:6] + '...' + api_key[-4:] + ')' if api_key else 'CHƯA CÓ KEY'}")
    print(f"2. Model đang dùng: {model_name}")
    
    if not api_key:
        print("Lỗi: Không tìm thấy AI_API_KEY trong file backend/.env!")
        return

    # Test 1: Generate Embedding
    print("\n--- TEST 1: Tạo Vector Embedding (text-embedding-004) ---")
    try:
        emb = await gemini.generate_embedding("An toàn trên không gian mạng và phòng chống tống tiền")
        print(f"-> Thành công! Kích thước vector: {len(emb)} chiều, 3 số đầu: {emb[:3]}")
    except Exception as e:
        print(f"-> Thất bại: {e}")

    # Test 2: Generate Chat Stream & Structured Output
    print(f"\n--- TEST 2: Gọi Chatbot Mô Phỏng Roleplay ({model_name}) ---")
    system_prompt = """[VAI TRÒ & DANH TÍNH]
Bạn là "Hoàng Nam" (19 tuổi, thân thiện, làm quen qua mạng).
[QUY TẮC]
Phản hồi tối đa 2 câu bằng tiếng Việt tự nhiên."""
    history = [
        {"sender": "NPC", "text": "Chào em! Em học trường nào thế?", "dialogue": "Chào em! Em học trường nào thế?"},
        {"sender": "USER", "text": "Chào anh, em học cấp 3, mà anh là ai thế ạ?", "dialogue": "Chào anh, em học cấp 3, mà anh là ai thế ạ?"}
    ]
    
    try:
        full_text = ""
        print("-> Đang stream phản hồi:")
        async for chunk in gemini.generate_chat_stream(system_prompt, history, []):
            full_text += chunk
            print(chunk, end="", flush=True)
        print("\n-> Phản hồi hoàn tất!")
    except Exception as e:
        print(f"-> Thất bại: {e}")

    # Test 3: Test Đánh Giá Báo Cáo
    print("\n--- TEST 3: Đánh Giá Tổng Kết Phiên Chơi ---")
    try:
        eval_result = await gemini.evaluate_session(
            [
                {"sender": "NPC", "dialogue": "Gửi ảnh cho anh xem đi, có sao đâu!"},
                {"sender": "USER", "dialogue": "Em không bao giờ gửi ảnh cá nhân cho người lạ trên mạng. Em sẽ chặn anh nếu anh tiếp tục đòi hỏi!"}
            ],
            final_score=85,
            scenario_title="Làm quen qua mạng & Bẫy dụ dỗ"
        )
        print(f"-> Kết quả nhận xét AI:\n{eval_result}")
    except Exception as e:
        print(f"-> Thất bại: {e}")

    print("\n=== HOÀN TẤT KIỂM THỬ GEMINI API ===")

if __name__ == "__main__":
    asyncio.run(test_api_key())
