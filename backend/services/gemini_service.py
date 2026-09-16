from typing import List, AsyncGenerator
from google import genai
from google.genai import types
from schemas.roleplay_schema import GeminiRoleplayOutput
from core.config import settings

# Cache client instance
_client = None

def get_client() -> genai.Client:
    """Khởi tạo Client của Gemini lazily bằng AI_API_KEY"""
    global _client
    if _client is not None:
        return _client
    
    # Đọc khóa API từ Settings (nguồn cấu hình duy nhất)
    api_key = settings.AI_API_KEY
    if not api_key:
        raise ValueError("AI_API_KEY chưa được cấu hình trong file .env!")
    
    _client = genai.Client(api_key=api_key)
    return _client

async def generate_embedding(text_content: str) -> List[float]:
    """Tạo vector nhúng 768 chiều sử dụng model gemini-embedding-001"""
    try:
        client = get_client()
        response = await client.aio.models.embed_content(
            model="gemini-embedding-001",
            contents=text_content,
            config=types.EmbedContentConfig(output_dimensionality=768)
        )
        if response and response.embeddings:
            return response.embeddings[0].values
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return [0.0] * 768
    return [0.0] * 768

async def generate_chat_stream(
    system_prompt: str,
    history_messages: List[dict],
    context_chunks: List[str]
) -> AsyncGenerator[str, None]:
    """Gọi Gemini API và stream luồng phản hồi dưới dạng JSON"""
    client = get_client()
    model_name = settings.GEMINI_MODEL

    # Ráp ngữ cảnh tri thức RAG (nếu có) vào hệ thống
    rag_context = ""
    if context_chunks:
        rag_context = "\n[TRI THỨC Y KHOA & QUY TẮC AN TOÀN HỖ TRỢ - RAG]\n"
        for chunk in context_chunks:
            rag_context += f"- {chunk}\n"
        rag_context += "\nHãy dùng thông tin trên để hỗ trợ câu trả lời đúng đắn, khoa học nhất.\n"
        
    full_system_prompt = system_prompt + rag_context
    
    # Chuyển đổi lịch sử chat sang định dạng của Gemini SDK
    contents = []
    for msg in history_messages:
        role = "user" if msg["sender"] == "USER" else "model"
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=msg["text"])]
        ))
        
    # Cấu hình Structured Output JSON
    config = types.GenerateContentConfig(
        system_instruction=full_system_prompt,
        temperature=0.6,
        max_output_tokens=300,
        response_mime_type="application/json",
        response_schema=GeminiRoleplayOutput,
    )
    
    # Thực hiện gọi API bất đồng bộ và stream kết quả
    stream_response = await client.aio.models.generate_content_stream(
        model=model_name,
        contents=contents,
        config=config
    )
    async for chunk in stream_response:
        text = chunk.text or ""
        if text:
            yield text

async def summarize_session(history_messages: List[dict]) -> str:
    """Tạo tóm tắt ngắn gọn (recent_summary) về diễn biến hội thoại cũ"""
    try:
        client = get_client()
        model_name = settings.GEMINI_MODEL

        # Tạo chuỗi hội thoại
        chat_log = ""
        for m in history_messages:
            chat_log += f"{m['sender']}: {m['dialogue']}\n"
            
        prompt = f"""
Hãy tóm tắt diễn biến hội thoại sau đây trong tối đa 2 đến 3 câu ngắn gọn.
Tập trung vào phản ứng, thái độ của người chơi (đồng ý, từ chối, nghi ngờ) và mục tiêu hiện tại của NPC.

Hội thoại:
{chat_log}
"""
        response = await client.aio.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=200
            )
        )
        return response.text.strip() if response.text else ""
    except Exception as e:
        print(f"Error summarizing session: {e}")
        return ""

async def evaluate_session(
    history_messages: List[dict],
    final_score: int,
    scenario_title: str
) -> str:
    """Đánh giá chi tiết phản xạ của người chơi ở cuối màn game để viết báo cáo khoa học"""
    try:
        client = get_client()
        model_name = settings.GEMINI_MODEL

        chat_log = ""
        for m in history_messages:
            action_text = f" ({m.get('action')})" if m.get('action') else ""
            chat_log += f"{m['sender']}: {m['dialogue']}{action_text}\n"
            
        prompt = f"""
Bạn là chuyên gia tâm lý học đường và cố vấn an toàn giáo dục giới tính tại Việt Nam.
Hãy viết nhận xét đánh giá tổng kết chi tiết (khoảng 150-200 từ) về màn chơi mô phỏng của người học.

Kịch bản: {scenario_title}
Điểm số đạt được: {final_score}/100
Toàn bộ diễn biến hội thoại:
{chat_log}

CẤU TRÚC ĐÁNH GIÁ (BẮT BUỘC):
1. Hướng đi đã chọn: Xác định rõ người chơi đã hành xử theo hướng nào (Hướng An toàn / Tốt, Hướng Trung gian / Do dự, hay Hướng Nguy hiểm / Xấu).
2. Phân tích phản xạ: Chỉ ra cụ thể những điểm tốt trong cách đối đáp (ví dụ: cảnh giác, kiên quyết từ chối, lưu bằng chứng, lắng nghe thấu cảm, cởi mở) và điểm cần khắc phục.
3. Hậu quả thực tế & Bài học: Giải thích rõ nếu xảy ra ngoài đời thực, cách xử lý này mang lại kết quả hay hậu quả gì cho bản thân và đưa ra 1 nguyên tắc vàng cần ghi nhớ.
4. Giọng điệu ấm áp, tôn trọng, giàu tính giáo dục và bảo vệ người học.
"""
        response = await client.aio.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=600
            )
        )
        return response.text.strip() if response.text else "Chúc mừng bạn đã hoàn thành màn chơi mô phỏng!"
    except Exception as e:
        print(f"Error evaluating session: {e}")
        return "Hoàn thành màn chơi mô phỏng giáo dục giới tính thành công!"
