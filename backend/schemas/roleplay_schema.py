from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List

# --- Pydantic Schema cho Structured Output của Gemini API ---
class GeminiRoleplayOutput(BaseModel):
    dialogue: str = Field(..., description="Lời thoại của nhân vật gửi cho người chơi (Tối đa 2-3 câu, dưới 50 từ)")
    action: str = Field(..., description="Mô tả hành động/cử chỉ đặt trong dấu sao (VD: *nghi ngờ nhìn bạn*)")
    emotion: str = Field(..., description="Trạng thái cảm xúc: neutral | suspicious | anxious | friendly | angry | touched")
    score_change: int = Field(..., description="Điểm thay đổi tại lượt này (phạm vi từ -30 đến +30)")
    trigger_event: str = Field(..., description="Sự kiện đặc biệt: none | danger_alert | safe_exit | mission_success | close_heart | open_heart | problem_resolved | blackmailed")

# --- API Request/Response Schemas ---
class ScenarioResponse(BaseModel):
    id: int
    room_code: str
    title: str
    npc_name: str
    npc_avatar_url: Optional[str] = None
    initial_score: int
    target_audience: str
    is_active: bool
    description: Optional[str] = None
    guide_script: Optional[str] = None
    first_message_sender: Optional[str] = "USER"
    opening_message: Optional[str] = None
    gender_info: Optional[str] = None

    class Config:
        from_attributes = True

class SessionCreateRequest(BaseModel):
    scenario_id: int

class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    scenario_id: int
    current_score: int
    current_emotion: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SessionDetailResponse(BaseModel):
    success: bool
    data: dict

class ChatRequest(BaseModel):
    message: str

class EvaluationResponse(BaseModel):
    id: UUID
    session_id: UUID
    user_id: UUID
    scenario_id: int
    final_score: int
    result_outcome: str
    total_turns: int
    duration_seconds: int
    ai_feedback_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
