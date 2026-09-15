from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from core.database import Base
from sqlalchemy.sql import func
import uuid

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=True)
    passing_score = Column(Integer, nullable=False, default=80)
    show_correct_answers = Column(Boolean, nullable=False, default=True)
    max_attempts = Column(Integer, nullable=False, default=3)
    cooldown_minutes = Column(Integer, nullable=False, default=15)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    course = relationship("Course", back_populates="quizzes")
    lesson = relationship("Lesson", back_populates="quiz")
    questions = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.order_index",
        lazy="selectin"
    )
    submissions = relationship("QuizSubmission", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    order_index = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    options = relationship(
        "QuizQuestionOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuizQuestionOption.order_index",
        lazy="selectin"
    )


class QuizQuestionOption(Base):
    __tablename__ = "quiz_question_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    order_index = Column(Integer, nullable=False, default=1)

    question = relationship("QuizQuestion", back_populates="options")


class QuizSubmission(Base):
    __tablename__ = "quiz_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, nullable=False, default=False)
    answers = Column(JSONB, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")
    quiz = relationship("Quiz", back_populates="submissions")
