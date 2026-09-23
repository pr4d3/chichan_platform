from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db, AsyncSessionLocal
from core.dependencies import get_current_user, RoleGuard
from models.user import User
from schemas.roleplay_schema import (
    ScenarioResponse, SessionResponse, SessionCreateRequest, ChatRequest,
    SessionDetailResponse, EvaluationResponse, ActiveSessionCheckResponse
)
import services.roleplay_service as service
from uuid import UUID
from typing import List

router = APIRouter(prefix="/api/v1/roleplay", tags=["AI Roleplay Hub"])

@router.get("/scenarios", response_model=List[ScenarioResponse], status_code=status.HTTP_200_OK)
async def list_scenarios(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy danh sách tất cả kịch bản phòng chơi AI đang hoạt động"""
    return await service.list_scenarios(db)

@router.get("/scenarios/{scenario_id}/active-session", response_model=ActiveSessionCheckResponse, status_code=status.HTTP_200_OK)
async def check_active_session(
    scenario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Kiểm tra xem người dùng hiện tại có phiên chơi dở dang (ACTIVE) ở kịch bản này không"""
    session = await service.get_active_session(db, current_user.id, scenario_id)
    if session:
        return ActiveSessionCheckResponse(
            has_active_session=True,
            session=SessionResponse.model_validate(session)
        )
    return ActiveSessionCheckResponse(has_active_session=False, session=None)

@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Khởi tạo một phiên chơi game mô phỏng AI mới"""
    session = await service.create_new_session(db, current_user.id, request.scenario_id)
    return session

@router.get("/sessions/{session_id}", response_model=SessionDetailResponse, status_code=status.HTTP_200_OK)
async def get_session_detail(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Chi tiết phiên chơi và lịch sử hội thoại của phòng game"""
    detail = await service.get_session_detail(db, session_id, current_user.id)
    
    # Kiểm tra phân quyền: Chỉ chính chủ chơi hoặc INSTRUCTOR / ADMIN mới được xem
    session_data = detail.get("session", {}) if isinstance(detail, dict) else getattr(detail, "session", {})
    session_user_id = session_data.get("user_id") if isinstance(session_data, dict) else getattr(session_data, "user_id", None)
    user_role = current_user.role.role_code
    
    if session_user_id and session_user_id != current_user.id and user_role not in ["ADMIN", "INSTRUCTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập dữ liệu phiên chơi này"
        )
        
    return SessionDetailResponse(success=True, data=detail)

@router.post("/sessions/{session_id}/chat")
async def chat_stream(
    session_id: UUID,
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Gửi tin nhắn chat đến NPC và nhận luồng stream phản hồi SSE từ AI"""
    # Sử dụng AsyncSessionLocal để tự mở/đóng kết nối trong generator SSE,
    # tránh giữ session DB mở quá lâu trong lúc LLM đang stream.
    generator = service.chat_sse_stream(
        db_factory=AsyncSessionLocal,
        session_id=session_id,
        user_id=current_user.id,
        message_text=request.message
    )
    # Bọc heartbeat: phát ': ping' mỗi ~15s khi im lặng để proxy/CDN không ngắt stream
    generator = service.add_sse_heartbeat(generator)
    # Header chống buffer/idle-timeout của proxy (Render/CDN)
    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    }
    return StreamingResponse(generator, media_type="text/event-stream", headers=headers)

@router.post("/sessions/{session_id}/abandon", response_model=SessionResponse, status_code=status.HTTP_200_OK)
async def abandon_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Hủy bỏ màn chơi hiện tại giữa chừng (mark status = ABANDONED)"""
    session = await service.abandon_active_session(db, session_id, current_user.id)
    return session

@router.delete("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa vĩnh viễn phiên chơi nếu đúng chính chủ"""
    deleted = await service.delete_session(db, session_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phiên chơi không tồn tại hoặc bạn không có quyền xóa"
        )
    return {"success": True, "message": "Đã xóa phiên chơi thành công"}

@router.get("/evaluations/{session_id}", response_model=EvaluationResponse, status_code=status.HTTP_200_OK)
async def get_evaluation(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy báo cáo tổng kết và nhận xét học thuật khoa học của AI về màn chơi"""
    eval_record = await service.get_evaluation(db, session_id, current_user.id)
    
    # Kiểm tra phân quyền: Chỉ chính chủ chơi hoặc INSTRUCTOR / ADMIN mới được xem báo cáo
    if eval_record.user_id != current_user.id and current_user.role.role_code not in ["ADMIN", "INSTRUCTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xem báo cáo đánh giá của phiên chơi này"
        )
        
    return eval_record
