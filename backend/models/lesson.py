from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
from sqlalchemy.sql import func
import uuid

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content_type = Column(String(20), nullable=False, default="HYBRID")
    video_url = Column(String(500))
    content_body = Column(String)
    order_index = Column(Integer, nullable=False, default=1)
    duration_minutes = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    course = relationship("Course", back_populates="lessons")
    quiz = relationship("Quiz", back_populates="lesson", uselist=False, cascade="all, delete-orphan", lazy="selectin")

