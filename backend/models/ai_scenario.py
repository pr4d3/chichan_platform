from sqlalchemy import Column, Integer, String, Boolean
from core.database import Base

class AIScenario(Base):
    __tablename__ = "ai_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    npc_name = Column(String(100), nullable=False)
    npc_avatar_url = Column(String(500), nullable=True)
    initial_score = Column(Integer, nullable=False, default=50)
    target_audience = Column(String(20), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    description = Column(String, nullable=True)
    guide_script = Column(String, nullable=True)
    first_message_sender = Column(String(20), nullable=False, default="USER")
    opening_message = Column(String, nullable=True)
    gender_info = Column(String(50), nullable=True)
