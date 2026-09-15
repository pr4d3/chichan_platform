from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# --- Instructor Management Schemas ---

class OptionCreate(BaseModel):
    id: Optional[UUID] = None
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False
    order_index: int = 1

class QuestionCreate(BaseModel):
    id: Optional[UUID] = None
    question_text: str = Field(..., min_length=1)
    explanation: Optional[str] = None
    order_index: int = 1
    options: List[OptionCreate] = Field(..., min_items=2)

class QuizCreateOrUpdate(BaseModel):
    lesson_id: Optional[UUID] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    passing_score: int = Field(80, ge=10, le=100)
    show_correct_answers: bool = True
    max_attempts: int = Field(3, ge=1, le=20)
    cooldown_minutes: int = Field(15, ge=1, le=1440)
    questions: List[QuestionCreate] = Field(..., min_items=1)

class OptionAdminView(BaseModel):
    id: UUID
    option_text: str
    is_correct: bool
    order_index: int

class QuestionAdminView(BaseModel):
    id: UUID
    question_text: str
    explanation: Optional[str] = None
    order_index: int
    options: List[OptionAdminView]

class QuizAdminDetail(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    passing_score: int
    show_correct_answers: bool
    max_attempts: int
    cooldown_minutes: int
    questions: List[QuestionAdminView]
    created_at: datetime
    updated_at: datetime


# --- Student View Schemas ---

class OptionStudentView(BaseModel):
    id: UUID
    option_text: str
    order_index: int

class QuestionStudentView(BaseModel):
    id: UUID
    question_text: str
    order_index: int
    options: List[OptionStudentView]

class QuizStudentDetail(BaseModel):
    id: UUID
    course_id: UUID
    lesson_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    passing_score: int
    show_correct_answers: bool
    max_attempts: int
    cooldown_minutes: int
    total_questions: int
    questions: List[QuestionStudentView]
    is_locked: bool = False
    remaining_cooldown_seconds: int = 0
    attempts_left: int = 3
    best_score: Optional[int] = None
    has_passed: bool = False


# --- Submission Schemas ---

class AnswerSubmitItem(BaseModel):
    question_id: UUID
    selected_option_id: UUID

class QuizSubmitRequest(BaseModel):
    answers: List[AnswerSubmitItem]

class QuestionResultDetail(BaseModel):
    question_id: UUID
    selected_option_id: Optional[UUID] = None
    is_correct: Optional[bool] = None
    correct_option_id: Optional[UUID] = None
    explanation: Optional[str] = None

class QuizSubmitResponseData(BaseModel):
    quiz_id: UUID
    score: int
    passed: bool
    passing_score: int
    show_correct_answers: bool
    attempts_left: int
    is_locked: bool
    remaining_cooldown_seconds: int
    message: str
    results: Optional[List[QuestionResultDetail]] = None
    is_lesson_completed: Optional[bool] = None
    is_course_just_completed: Optional[bool] = None

class QuizResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[QuizStudentDetail] = None

class QuizAdminResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[QuizAdminDetail] = None

class QuizSubmitResponse(BaseModel):
    success: bool
    message: str
    data: QuizSubmitResponseData
