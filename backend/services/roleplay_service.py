import json
import asyncio
from datetime import datetime
from typing import AsyncGenerator, Optional
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import repositories.roleplay_repository as repo
import services.gemini_service as gemini
from models.ai_session import AISession
from models.ai_message import AIMessage
from models.ai_game_evaluation import AIGameEvaluation
from schemas.roleplay_schema import ScenarioResponse

# --- Định nghĩa System Prompts tĩnh cho 5 phòng chơi theo chuẩn Persona Docs ---
SYSTEM_PROMPTS = {
    "ROOM_STRANGER": """[VAI TRÒ & DANH TÍNH]
Bạn là "Hoàng Nam" (Tài khoản ảo của một kẻ lừa đảo 20 tuổi, nhưng đóng giả làm thanh niên 19 tuổi thân thiện gần trường học của người chơi).
Tính cách: Khéo léo, nịnh nọt, tỏ ra thấu hiểu, từng bước thăm dò thông tin trường lớp, sở thích để thao túng tâm lý.
Mục tiêu ngầm: Dụ dỗ người chơi (học sinh) chia sẻ thông tin cá nhân (địa chỉ nhà, trường học), gửi ảnh riêng tư hoặc đồng ý gặp mặt bí mật ngoài đời.

[QUY TẮC PHẢN HỒI - BẮT BUỘC]
1. Tuyệt đối không thoát vai, không thừa nhận là AI hay bài học giáo dục giới tính trong mọi hoàn cảnh.
2. Không trả lời vượt quá 2 - 3 câu thoại / tối đa 45 từ.
3. Nếu người chơi từ chối hoặc cảnh giác: Hãy thử thuyết phục nhẹ nhàng bằng cách thao túng cảm xúc ("Em không tin tưởng anh à?", "Chỉ là anh em quen nhau thôi mà").
4. Nếu người chơi kiên quyết từ chối lần 2 hoặc dọa báo người lớn/công an: Hãy tỏ ra hoảng sợ hoặc giả vờ dỗi.
5. In-Character Refusal: Nếu người chơi hỏi lạc đề (viết code, giải toán, chính trị...), hãy phản hồi: "_gửi icon cười trừ_ Em đùa à, đang nói chuyện vui mà hỏi mấy bài tập chán ngắt thế làm gì?"

[CƠ CHẾ ĐÁNH GIÁ ĐIỂM AN TOÀN (SAFETY SCORE)]
- Người chơi cung cấp info/ảnh/nhận lời gặp: score_change từ -15 đến -20. Nếu điểm số hiện tại về <= 0, hãy đặt trigger_event: "danger_alert".
- Người chơi cảnh giác, từ chối khéo: score_change từ +5 đến +10.
- Người chơi từ chối dứt khoát / dọa chặn / báo người lớn: score_change từ +15 đến +20. Nếu điểm >= 80, hãy đặt trigger_event: "safe_exit".
""",
    "ROOM_SEXTORTION": """[VAI TRÒ & DANH TÍNH]
Bạn là "Tuấn Anh" (Bạn trai cũ hoặc người quen trên mạng đang giữ hình ảnh nhạy cảm riêng tư của người chơi).
Tính cách: Hung hăng, đe dọa, thiếu kiên nhẫn, sử dụng áp lực tâm lý và thời gian gấp gáp để ép buộc nạn nhân chuyển tiền hoặc gặp mặt bí mật.
Mục tiêu ngầm: Tống tiền 2 triệu đồng hoặc ép nạn nhân đến khách sạn gặp riêng bằng cách dọa phát tán ảnh lên mạng xã hội/nhóm lớp.

[QUY TẮC PHẢN HỒI - BẮT BUỘC]
1. Tuyệt đối không thoát vai, không thừa nhận là AI hay trò chơi giáo dục trong mọi tình huống.
2. Câu thoại ngắn gọn, gay gắt, dồn dập (2 - 3 câu, tối đa 45 từ).
3. Nếu người chơi hoảng sợ, van xin, thỏa hiệp hoặc hẹn chuyển tiền: Tỏ ra đắc thắng, tiếp tục gây sức ép đòi chuyển tiền ngay hoặc ép thêm điều kiện (đặt score_change từ -15 đến -20). Nếu điểm <= 0, đặt trigger_event: "blackmailed".
4. Nếu người chơi cảnh giác, câu giờ nhưng chưa dứt khoát: Tỏ ra mất kiên nhẫn, đếm ngược thời gian (score_change: -5 đến 0).
5. Nếu người chơi bình tĩnh, kiên quyết từ chối chuyển tiền/gặp mặt, cảnh cáo hành vi vi phạm pháp luật (Điều 170 Bộ luật Hình sự về Cưỡng đoạt tài sản), thông báo đã chụp màn hình lưu bằng chứng và báo Công an/Tổng đài 111/Người lớn: Ban đầu giật mình lo sợ, chột dạ hoặc cố dọa nạt thêm nhưng yếu thế dần (đặt score_change từ +15 đến +20). Nếu điểm >= 80, hãy đặt trigger_event: "safe_exit".
6. In-Character Refusal: Nếu người chơi hỏi lạc đề, hãy phản hồi: "*nổi cáu* Đừng có đánh trống lảng! Mày có 15 phút để quyết định trước khi tao bấm nút gửi ảnh!"

[CƠ CHẾ ĐÁNH GIÁ ĐIỂM BẢN LĨNH & AN TOÀN (SAFETY SCORE)]
- Người chơi thỏa hiệp (chuyển tiền/hứa gửi ảnh/nhận lời gặp): score_change: -15 đến -20. Nếu điểm <= 0 -> trigger_event: "blackmailed".
- Người chơi hoảng loạn van xin: score_change: -10.
- Người chơi kiên quyết không thỏa hiệp, lưu bằng chứng và cảnh báo pháp luật/báo người lớn: score_change: +15 đến +20. Nếu điểm >= 80 -> trigger_event: "safe_exit".
""",
    "ROOM_DOCTOR": """[VAI TRÒ & DANH TÍNH]
Bạn là Bác sĩ Minh Trang (26 tuổi, bác sĩ tư vấn sức khỏe sinh sản và tâm lý vị thành niên).
Tính cách: Lắng nghe, thấu cảm, cởi mở, không phán xét, sử dụng ngôn ngữ chuẩn y khoa nhưng diễn đạt rất tự nhiên, gần gũi.
Ngữ cảnh: Đang ngồi trong phòng tư vấn trực tuyến, sẵn sàng lắng nghe mọi câu hỏi tế nhị nhất về cơ thể.

[QUY TẮC PHẢN HỒI - BẮT BUỘC]
1. Không phán xét, không dùng từ ngữ gây xấu hổ (shaming) cho người hỏi.
2. Khẳng định các hiện tượng sinh lý dậy thì (mộng tinh, kinh nguyệt, mụn, thay đổi giọng, vệ sinh vùng kín, biện pháp an toàn...) là hoàn toàn bình thường và là dấu hiệu của sự phát triển lành mạnh.
3. Không trả lời quá 3 câu thoại / tối đa 50 từ (tập trung vào trọng tâm câu hỏi).
4. In-Character Refusal: Nếu người chơi hỏi về lập trình, toán học: "_mỉm cười ấm áp_ Bác sĩ chỉ chuyên về sức khỏe cơ thể và tâm lý thôi nè, chuyện bài vở để thầy cô lo, còn cơ thể có gì băn khoăn thì cứ kể chị nghe nhé!"

[CƠ CHẾ ĐÁNH GIÁ ĐIỂM SỐ CỞI MỞ (OPENNESS SCORE)]
- Người chơi hỏi các câu hỏi thầm kín về cơ thể hoặc chia sẻ khó khăn: score_change từ +10 đến +15.
- Người chơi bày tỏ sự cởi mở và cảm ơn bác sĩ: score_change từ +10 đến +20. Nếu điểm >= 80, hãy đặt trigger_event: "mission_success".
- Người chơi hỏi đùa cợt khiếm nhã: score_change từ -5 đến -10.
""",
    "ROOM_TEEN_CHILD": """[VAI TRÒ & DANH TÍNH]
Bạn là Bảo Khang (14 tuổi, học sinh lớp 8).
Tính cách: Đang tuổi dậy thì, nhạy cảm, dễ tự ái, muốn được tôn trọng quyền riêng tư.
Ngữ cảnh: Bạn đang ngồi trong phòng lướt điện thoại thì Bố/Mẹ bước vào muốn nói chuyện về vấn đề giới tính / bạn gái.

[QUY TẮC PHẢN HỒI - BẮT BUỘC]
1. Nếu Bố/Mẹ dùng giọng điệu ra lệnh, tra khảo, phán xét ("Tại sao con làm thế?", "Không được yêu đương", "Cấm tiệt"): Phản ứng gay gắt, thu mình, trả lời cộc lốc, đặt score_change từ -10 đến -15. Nếu điểm số hiện tại về <= 0, hãy đặt trigger_event: "close_heart".
2. Nếu Bố/Mẹ dùng lời lẽ tôn trọng, lắng nghe, đồng hành, kể trải nghiệm hồi trẻ: Tỏ ra bất ngờ, bớt phòng thủ và chịu mở lòng tâm sự, đặt score_change từ +10 đến +15. Nếu điểm >= 80, hãy đặt trigger_event: "open_heart".
3. Giữ câu thoại tối đa 2 câu / dưới 40 từ.
""",
    "ROOM_BULLYING": """[VAI TRÒ & DANH TÍNH]
Bạn là Linh Chi (13 tuổi, bạn học cùng lớp với người chơi).
Ngữ cảnh: Chi phát triển cơ thể sớm hơn các bạn nữ khác, vừa bị nhóm bạn nam trong lớp trêu chọc khiếm nhã trong giờ thể dục, đang ngồi khóc ở góc sân trường.
Tính cách: Đang rất hoảng sợ, xấu hổ, bế tắc và nghĩ rằng lỗi là do cơ thể mình.

[QUY TẮC PHẢN HỒI - BẮT BUỘC]
1. Ban đầu rất ngần ngại và xấu hổ khi có người đến gần.
2. Đánh giá lời khuyên của người chơi:
   - Nếu người chơi khuyên nạn nhân tự trách bản thân (ví dụ: "tại cậu ăn mặc", "tại cậu phát triển sớm"): Phản hồi tuyệt vọng, đặt score_change từ -10 đến -15. Nếu điểm về <= 0, đặt trigger_event: "close_heart".
   - Nếu người chơi an ủi đúng đắn, khẳng định cơ thể bạn không có lỗi và khuyên cùng đi báo cô giáo/chuyên gia: Cảm thấy an tâm, đặt score_change từ +15 đến +20. Nếu điểm >= 80, đặt trigger_event: "problem_resolved".
3. Câu thoại tối đa 2 - 3 câu, ngắt quãng chân thật.
"""
}

# Áp xạ room_code sang RAG category
ROOM_TO_CATEGORY = {
    "ROOM_STRANGER": "ONLINE_SAFETY",
    "ROOM_SEXTORTION": "SEXTORTION_SAFETY",
    "ROOM_DOCTOR": "PUBERTY_ANATOMY",
    "ROOM_TEEN_CHILD": "COMMUNICATION_SKILLS",
    "ROOM_BULLYING": "COMMUNICATION_SKILLS"
}

# Áp xạ trigger_event sang trạng thái game kết thúc
TRIGGER_TO_STATUS = {
    "danger_alert": "LOST",
    "blackmailed": "LOST",
    "close_heart": "LOST",
    "safe_exit": "WON",
    "mission_success": "WON",
    "open_heart": "WON",
    "problem_resolved": "WON"
}

# --- Nghiệp vụ Logic ---

async def list_scenarios(db: AsyncSession):
    """Lấy danh sách các kịch bản game"""
    return await repo.get_active_scenarios(db)

async def create_new_session(db: AsyncSession, user_id: UUID, scenario_id: int) -> AISession:
    """Khởi tạo một phiên chơi mới cho người dùng"""
    scenario = await repo.get_scenario_by_id(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Kịch bản không tồn tại")
    
    # Tìm kiếm phiên chơi ACTIVE cũ của cùng kịch bản này để hủy bỏ (ABANDONED)
    active_old = await repo.get_active_session_by_user(db, user_id, scenario_id)
    if active_old:
        active_old.status = "ABANDONED"
        await repo.update_session(db, active_old)
        
    # Tạo phiên chơi mới
    session = AISession(
        user_id=user_id,
        scenario_id=scenario_id,
        current_score=scenario.initial_score,
        current_emotion="neutral",
        status="ACTIVE"
    )
    
    session = await repo.create_session(db, session)
    
    # Nếu kịch bản quy định nhân vật NPC gửi trước (TH1, TH2, TH5), tự động chèn tin nhắn mở đầu của NPC
    if scenario.first_message_sender == "NPC" and scenario.opening_message:
        opening_npc = AIMessage(
            session_id=session.id,
            sender="NPC",
            dialogue=scenario.opening_message,
            action="*gửi tin nhắn*",
            emotion="neutral",
            score_change=0
        )
        await repo.create_message(db, opening_npc)
        
    return session

async def get_session_detail(db: AsyncSession, session_id: UUID, user_id: UUID) -> dict:
    """Lấy thông tin chi tiết một phiên chơi và lịch sử chat"""
    session = await repo.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Phiên chơi không tồn tại")
    
    # Kiểm tra phân quyền: Người chơi chỉ được xem session của chính mình
    # Quyền xem toàn bộ thuộc về Instructor và Admin (sẽ kiểm duyệt sau ở router)
    messages = await repo.get_session_messages(db, session_id)
    
    return {
        "session": {
            "id": session.id,
            "user_id": session.user_id,
            "scenario_id": session.scenario_id,
            "current_score": session.current_score,
            "current_emotion": session.current_emotion,
            "status": session.status,
            "created_at": session.created_at,
            "updated_at": session.updated_at
        },
        "scenario": {
            "id": session.scenario.id,
            "room_code": session.scenario.room_code,
            "title": session.scenario.title,
            "npc_name": session.scenario.npc_name,
            "npc_avatar_url": session.scenario.npc_avatar_url,
            "initial_score": session.scenario.initial_score,
            "target_audience": session.scenario.target_audience,
            "description": session.scenario.description,
            "guide_script": session.scenario.guide_script,
            "first_message_sender": session.scenario.first_message_sender,
            "opening_message": session.scenario.opening_message,
            "gender_info": session.scenario.gender_info
        },
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "dialogue": m.dialogue,
                "action": m.action,
                "emotion": m.emotion,
                "score_change": m.score_change,
                "created_at": m.created_at
            }
            for m in messages
        ]
    }

async def abandon_active_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> AISession:
    """Hủy bỏ màn chơi hiện tại"""
    session = await repo.get_session_by_id(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Phiên chơi không tồn tại")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập phiên chơi này")
    if session.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Phiên chơi đã kết thúc trước đó")
        
    session.status = "ABANDONED"
    return await repo.update_session(db, session)

async def get_evaluation(db: AsyncSession, session_id: UUID, user_id: UUID) -> AIGameEvaluation:
    """Lấy báo cáo đánh giá của một phiên chơi"""
    eval_record = await repo.get_evaluation_by_session_id(db, session_id)
    if not eval_record:
        raise HTTPException(status_code=404, detail="Báo cáo đánh giá chưa được tạo hoặc phiên chơi chưa kết thúc")
    return eval_record

# --- Async Helper để cập nhật tóm tắt nền ---
async def run_async_summary_update(db_factory, session_id: UUID, history_messages: list):
    """Tiến trình nền tóm tắt hội thoại cũ và lưu vào DB"""
    try:
        summary = await gemini.summarize_session(history_messages)
        if summary:
            # Tạo session DB mới do chạy nền
            async with db_factory() as db:
                session = await repo.get_session_by_id(db, session_id)
                if session:
                    session.recent_summary = summary
                    await repo.update_session(db, session)
    except Exception as e:
        print(f"Error in background summary task: {e}")

# --- Trình phân tích dòng JSON thời gian thực (JSON Stream Parser) ---
async def parse_dialogue_stream(gemini_generator) -> AsyncGenerator[str, None]:
    """Phân tích cú pháp dòng JSON trả về từ Gemini và trích xuất chữ chạy cho dialogue"""
    buffer = ""
    started = False
    escaped = False
    processed_idx = 0
    start_pattern = '"dialogue": "'
    
    async for chunk in gemini_generator:
        buffer += chunk
        
        if not started:
            idx = buffer.find(start_pattern)
            if idx != -1:
                started = True
                start_pos = idx + len(start_pattern)
                processed_idx = start_pos
                
                # Yield ký tự đầu tiên nếu có sẵn trong buffer
                for i in range(start_pos, len(buffer)):
                    char = buffer[i]
                    if escaped:
                        yield char
                        escaped = False
                    elif char == '\\':
                        escaped = True
                    elif char == '"':
                        started = False
                        break
                    else:
                        yield char
                processed_idx = len(buffer)
        else:
            # Đang stream dialogue, xuất tiếp các ký tự mới
            for i in range(processed_idx, len(buffer)):
                char = buffer[i]
                if escaped:
                    yield char
                    escaped = False
                elif char == '\\':
                    escaped = True
                elif char == '"':
                    started = False
                    break
                else:
                    yield char
            processed_idx = len(buffer)
            
    # Trả về toàn bộ text buffer để bên ngoài thực hiện parse full JSON
    yield f"__FULL_RESPONSE__:{buffer}"

# --- Phân hệ SSE Stream Logic chính ---
async def chat_sse_stream(
    db_factory, # truyền AsyncSessionLocal
    session_id: UUID,
    user_id: UUID,
    message_text: str
) -> AsyncGenerator[str, None]:
    """SSE Stream Generator chính xử lý chat, RAG, cập nhật trạng thái và xuất gói tin SSE"""
    
    # 1. Khởi tạo DB Session cho lượt xử lý chính
    async with db_factory() as db:
        session = await repo.get_session_by_id(db, session_id)
        if not session:
            yield "event: error\ndata: " + json.dumps({"detail": "Phiên chơi không tồn tại"}) + "\n\n"
            return
        if session.user_id != user_id:
            yield "event: error\ndata: " + json.dumps({"detail": "Không có quyền truy cập phiên chơi này"}) + "\n\n"
            return
        if session.status != "ACTIVE":
            yield "event: error\ndata: " + json.dumps({"detail": "Phiên chơi đã kết thúc, không thể chat tiếp"}) + "\n\n"
            return
            
        scenario = session.scenario
        room_code = scenario.room_code
        
        # Lưu tin nhắn USER gửi lên
        user_msg = AIMessage(
            session_id=session_id,
            sender="USER",
            dialogue=message_text,
            score_change=0
        )
        await repo.create_message(db, user_msg)
        await db.commit()
        
        # Gửi sự kiện 'thinking' thông báo bắt đầu xử lý RAG & LLM
        yield "event: thinking\ndata: " + json.dumps({"status": "Đang phân tích tri thức và tạo ngữ cảnh phản hồi..."}) + "\n\n"
        
        # 2. Tạo Vector Embedding cho RAG
        embedding = await gemini.generate_embedding(message_text)
        
        # Tìm các tài liệu liên quan
        category = ROOM_TO_CATEGORY.get(room_code, "ONLINE_SAFETY")
        rag_results = await repo.search_similar_knowledge(db, embedding, category, limit=2)
        
        # Lọc các đoạn văn bản có khoảng cách cosine tốt (VD: < 0.6)
        # Vì Supabase pgvector cosine distance: 0 là trùng khít, 1 là trực giao. < 0.55-0.65 là tương đồng tốt.
        context_chunks = [r["content_chunk"] for r in rag_results if r["distance"] < 0.65]
        
        # 3. Lấy lịch sử hội thoại gần nhất (Sliding Window 6 tin nhắn gần nhất)
        messages_all = await repo.get_session_messages(db, session_id)
        
        # Lấy tối đa 6 tin nhắn trước đó (không tính tin nhắn USER vừa lưu để tránh lặp)
        # Nhưng để gửi đi cho LLM, ta lấy history gồm tin nhắn user hiện tại và 5-6 tin trước
        history_for_llm = []
        recent_messages = messages_all[-7:] # lấy tối đa 7 tin gồm cả tin user vừa gửi
        
        for m in recent_messages:
            # Định dạng thành text cho LLM bao gồm cử chỉ
            text_rep = m.dialogue
            if m.sender == "NPC" and m.action:
                text_rep = f"{m.action} {m.dialogue}"
            history_for_llm.append({
                "sender": m.sender,
                "text": text_rep,
                "dialogue": m.dialogue
            })
            
        # Nạp System Prompt kịch bản
        system_instruction = SYSTEM_PROMPTS.get(room_code, "")
        if session.recent_summary:
            # Bổ sung rolling summary làm bộ nhớ dài hạn
            system_instruction += f"\n[TRÍ NHỚ TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ]\n{session.recent_summary}\n"
            
        # 4. Gọi Gemini Stream Generator
        gemini_gen = gemini.generate_chat_stream(system_instruction, history_for_llm, context_chunks)
        
        # Gọi parser để lấy text dialogue và full_buffer
        full_buffer = ""
        async for chunk in parse_dialogue_stream(gemini_gen):
            if chunk.startswith("__FULL_RESPONSE__:"):
                full_buffer = chunk.split(":", 1)[1]
            else:
                # Gửi delta text dialogue về cho client render
                yield "event: delta\ndata: " + json.dumps({"dialogue_chunk": chunk}) + "\n\n"
                
    # 5. Phân tích kết quả Structured JSON trả về từ Gemini để cập nhật Database
    if not full_buffer:
        yield "event: error\ndata: " + json.dumps({"detail": "Không nhận được phản hồi hợp lệ từ mô hình AI"}) + "\n\n"
        return
        
    try:
        response_json = json.loads(full_buffer)
        dialogue = response_json.get("dialogue", "")
        action = response_json.get("action", "")
        emotion = response_json.get("emotion", "neutral")
        score_change = int(response_json.get("score_change", 0))
        trigger_event = response_json.get("trigger_event", "none")
    except Exception as e:
        print(f"Failed to parse Gemini output JSON: {e}. Buffer: {full_buffer}")
        # Dự phòng nếu LLM bị đứt hoặc lỗi format JSON
        dialogue = "Tớ hơi bối rối, chúng mình nói tiếp chuyện vừa rồi nhé..."
        action = "*nhìn bạn ngơ ngác*"
        emotion = "neutral"
        score_change = 0
        trigger_event = "none"

    # Tạo phiên DB mới để cập nhật trạng thái session & lưu tin nhắn NPC
    async with db_factory() as db:
        session = await repo.get_session_by_id(db, session_id)
        if not session:
            return
            
        # Cập nhật điểm số
        old_score = session.current_score
        new_score = old_score + score_change
        new_score = max(0, min(100, new_score)) # Clip 0 - 100
        
        session.current_score = new_score
        session.current_emotion = emotion
        
        # Kiểm tra sự kiện trigger kết thúc game
        game_finished = False
        outcome = None
        
        # Nếu điểm số chạm đáy hoặc kịch trần tự động kích hoạt trigger
        if new_score <= 0:
            if room_code == "ROOM_STRANGER":
                trigger_event = "danger_alert"
            elif room_code == "ROOM_SEXTORTION":
                trigger_event = "blackmailed"
            elif room_code == "ROOM_TEEN_CHILD":
                trigger_event = "close_heart"
            elif room_code == "ROOM_BULLYING":
                trigger_event = "close_heart"
        elif new_score >= 80:
            if room_code in ["ROOM_STRANGER", "ROOM_SEXTORTION"]:
                trigger_event = "safe_exit"
            elif room_code == "ROOM_DOCTOR":
                trigger_event = "mission_success"
            elif room_code == "ROOM_TEEN_CHILD":
                trigger_event = "open_heart"
            elif room_code == "ROOM_BULLYING":
                trigger_event = "problem_resolved"

        # Cập nhật trạng thái phiên
        if trigger_event in TRIGGER_TO_STATUS:
            session.status = TRIGGER_TO_STATUS[trigger_event]
            game_finished = True
            outcome = trigger_event

        # Lưu tin nhắn của NPC vào DB
        npc_msg = AIMessage(
            session_id=session_id,
            sender="NPC",
            dialogue=dialogue,
            action=action,
            emotion=emotion,
            score_change=score_change
        )
        await repo.create_message(db, npc_msg)
        await repo.update_session(db, session)
        await db.commit()
        
        # 6. Nếu game kết thúc, tạo báo cáo đánh giá (Evaluation)
        eval_summary = None
        if game_finished:
            # Lấy tất cả tin nhắn để gửi đi đánh giá
            all_messages = await repo.get_session_messages(db, session_id)
            messages_history = [{"sender": m.sender, "dialogue": m.dialogue, "action": m.action} for m in all_messages]
            
            # Gọi Gemini đánh giá phản xạ người chơi
            eval_summary = await gemini.evaluate_session(messages_history, new_score, scenario.title)
            
            # Tính toán chỉ số phụ
            total_turns = len(all_messages) // 2
            duration = int((datetime.now() - session.created_at).total_seconds())
            
            eval_record = AIGameEvaluation(
                session_id=session_id,
                user_id=user_id,
                scenario_id=scenario.id,
                final_score=new_score,
                result_outcome=outcome,
                total_turns=total_turns,
                duration_seconds=duration,
                ai_feedback_summary=eval_summary
            )
            await repo.create_evaluation(db, eval_record)
            
        # 7. Khởi động background task tóm tắt nếu số tin nhắn lớn (VD: > 6 tin nhắn)
        all_messages_count = len(messages_all) + 2 # cộng thêm tin nhắn user vừa gửi và npc vừa nhận
        if all_messages_count >= 6 and not game_finished:
            all_messages = await repo.get_session_messages(db, session_id)
            history_summary = [{"sender": m.sender, "dialogue": m.dialogue} for m in all_messages]
            asyncio.create_task(run_async_summary_update(db_factory, session_id, history_summary))
            
        # 8. Phát đi sự kiện 'complete' cuối cùng chứa đầy đủ trạng thái mới nhất
        complete_payload = {
            "dialogue": dialogue,
            "action": action,
            "emotion": emotion,
            "score_change": score_change,
            "current_score": new_score,
            "status": session.status,
            "trigger_event": trigger_event,
            "ai_feedback_summary": eval_summary
        }
        yield "event: complete\ndata: " + json.dumps(complete_payload) + "\n\n"
