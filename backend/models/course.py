from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.database import Base
from sqlalchemy.sql import func
import uuid

class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    short_description = Column(String(500))
    description = Column(String)
    thumbnail_url = Column(String(500))
    target_audience = Column(String(20), nullable=False, default="BOTH")
    learning_objectives = Column(String)
    outro_content = Column(String)
    is_published = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    instructor = relationship("User", lazy="joined")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index", lazy="selectin")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan", lazy="selectin")

