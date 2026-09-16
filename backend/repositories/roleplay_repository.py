from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text, update, func
from sqlalchemy.orm import selectinload, joinedload
from models.ai_scenario import AIScenario
from models.ai_session import AISession
from models.ai_message import AIMessage
from models.ai_knowledge_vector import AIKnowledgeVector
from models.ai_game_evaluation import AIGameEvaluation
from uuid import UUID
from typing import List, Optional

# --- Scenarios ---
async def get_active_scenarios(db: AsyncSession) -> List[AIScenario]:
    result = await db.execute(
        select(AIScenario)
        .where(AIScenario.is_active == True)
        .order_by(AIScenario.id)
    )
    return list(result.scalars().all())

async def get_scenario_by_id(db: AsyncSession, scenario_id: int) -> Optional[AIScenario]:
    result = await db.execute(
        select(AIScenario).where(AIScenario.id == scenario_id)
    )
    return result.scalars().first()

# --- Sessions ---
async def create_session(db: AsyncSession, session: AISession) -> AISession:
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

async def get_session_by_id(db: AsyncSession, session_id: UUID) -> Optional[AISession]:
    result = await db.execute(
        select(AISession)
        .options(
            joinedload(AISession.scenario),
            joinedload(AISession.user)
        )
        .where(AISession.id == session_id)
    )
    return result.scalars().first()

async def abandon_active_sessions(db: AsyncSession, user_id: UUID, scenario_id: int) -> None:
    """Hủy toàn bộ phiên ACTIVE cũ của user với kịch bản bằng 1 UPDATE nguyên tử có WHERE status
    (tránh read-modify-write đụng độ khi tạo phiên mới liên tục)."""
    await db.execute(
        update(AISession)
        .where(
            and_(
                AISession.user_id == user_id,
                AISession.scenario_id == scenario_id,
                AISession.status == "ACTIVE"
            )
        )
        .values(status="ABANDONED")
    )
    await db.commit()

async def update_session_score_atomic(db: AsyncSession, session_id: UUID, delta: int) -> int:
    """Cập nhật điểm số nguyên tử: cộng dồn + clip 0..100 ngay trong SQL rồi RETURNING giá trị mới.
    Tránh mất cập nhật (lost update) khi 2 lượt chat nhanh liên tiếp trên cùng phiên."""
    result = await db.execute(
        update(AISession)
        .where(AISession.id == session_id)
        .values(
            current_score=func.greatest(0, func.least(100, AISession.current_score + delta)),
            updated_at=func.now()
        )
        .returning(AISession.current_score)
    )
    return result.scalar_one()

async def update_session(db: AsyncSession, session: AISession) -> AISession:
    await db.commit()
    await db.refresh(session)
    return session

# --- Messages ---
async def create_message(db: AsyncSession, message: AIMessage) -> AIMessage:
    db.add(message)
    await db.flush() # Chỉ flush để có ID và tạo quan hệ, commit sau cùng của phiên dịch vụ
    return message

async def get_session_messages(db: AsyncSession, session_id: UUID, limit: Optional[int] = None) -> List[AIMessage]:
    query = (
        select(AIMessage)
        .where(AIMessage.session_id == session_id)
        .order_by(AIMessage.created_at.asc())
    )
    if limit:
        # Nếu giới hạn, ta lấy tin nhắn mới nhất nhưng xếp xuôi dòng thời gian
        subquery = (
            select(AIMessage)
            .where(AIMessage.session_id == session_id)
            .order_by(AIMessage.created_at.desc())
            .limit(limit)
        ).subquery()
        # SELECT * FROM subquery ORDER BY created_at ASC
        query = select(AIMessage).select_from(subquery).order_by(subquery.c.created_at.asc())
        
    result = await db.execute(query)
    return list(result.scalars().all())

async def count_session_messages(db: AsyncSession, session_id: UUID) -> int:
    """Đếm TỔNG số tin nhắn của phiên (không nạp dữ liệu) — dùng tính total_turns
    khi phần lịch sử nạp về đã bị giới hạn cho prompt."""
    result = await db.execute(
        select(func.count(AIMessage.id)).where(AIMessage.session_id == session_id)
    )
    return result.scalar() or 0

# --- Evaluations ---
async def create_evaluation(db: AsyncSession, evaluation: AIGameEvaluation) -> AIGameEvaluation:
    db.add(evaluation)
    await db.commit()
    await db.refresh(evaluation)
    return evaluation

async def get_evaluation_by_session_id(db: AsyncSession, session_id: UUID) -> Optional[AIGameEvaluation]:
    result = await db.execute(
        select(AIGameEvaluation)
        .options(
            joinedload(AIGameEvaluation.scenario),
            joinedload(AIGameEvaluation.user)
        )
        .where(AIGameEvaluation.session_id == session_id)
    )
    return result.scalars().first()

# --- pgvector Cosine similarity RAG Search ---
async def search_similar_knowledge(
    db: AsyncSession,
    embedding: List[float],
    category: str,
    limit: int = 2
) -> List[dict]:
    """Tìm kiếm nội dung tương đồng ngữ nghĩa trong kho tri thức sử dụng pgvector"""
    embedding_str = str(embedding)
    
    # Sử dụng raw SQL với toán tử <=> của pgvector để tìm kiếm khoảng cách Cosine nhỏ nhất
    query = text("""
        SELECT id, category, topic, content_chunk, (embedding <=> :embedding) AS distance
        FROM ai_knowledge_vectors
        WHERE category = :category
        ORDER BY embedding <=> :embedding
        LIMIT :limit
    """)
    
    result = await db.execute(
        query,
        {
            "embedding": embedding_str,
            "category": category,
            "limit": limit
        }
    )
    
    # Định dạng kết quả thành danh sách dict để service dễ sử dụng
    chunks = []
    for row in result:
        chunks.append({
            "id": row[0],
            "category": row[1],
            "topic": row[2],
            "content_chunk": row[3],
            "distance": row[4]
        })
    return chunks
