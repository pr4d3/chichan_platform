from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class InstructorInfo(BaseModel):
    id: UUID
    full_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class SyllabusLesson(BaseModel):
    id: UUID
    order_index: int
    title: str
    content_type: str = "HYBRID"
    duration_minutes: Optional[int] = None
    has_quiz: bool = False
    quiz_id: Optional[UUID] = None

class CourseIntroData(BaseModel):
    course_id: UUID
    title: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    target_audience: str
    learning_objectives: Optional[str] = None
    instructor: InstructorInfo
    total_lessons: int
    is_enrolled: bool
    outro_content: Optional[str] = None
    syllabus: list[SyllabusLesson]

class CourseIntroResponse(BaseModel):
    success: bool
    data: CourseIntroData

class CourseCreate(BaseModel):
    title: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    short_description: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    target_audience: str = Field("BOTH", pattern="^(PARENT|CHILD|BOTH)$")
    learning_objectives: Optional[str] = None
    outro_content: Optional[str] = None

class CourseCreateResponseData(BaseModel):
    course_id: UUID
    slug: str

class CourseCreateResponse(BaseModel):
    success: bool
    message: str
    data: CourseCreateResponseData

class CoursePublicData(BaseModel):
    id: UUID
    title: str
    slug: str
    short_description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    target_audience: str
    total_lessons: int
    instructor_name: str

class CourseListResponse(BaseModel):
    success: bool
    data: list[CoursePublicData]

class CourseEnrollResponseData(BaseModel):
    course_id: UUID
    status: str
    enrolled_at: datetime

class CourseEnrollResponse(BaseModel):
    success: bool
    message: str
    data: CourseEnrollResponseData

class LearningRoomLesson(BaseModel):
    lesson_id: UUID
    order_index: int
    title: str
    content_type: str
    video_url: Optional[str] = None
    content_body: Optional[str] = None
    is_completed: bool
    has_quiz: bool = False
    quiz_id: Optional[UUID] = None
    is_quiz_passed: bool = False

class CourseLearningData(BaseModel):
    course_id: UUID
    course_title: str
    progress_percentage: float
    lessons: list[LearningRoomLesson]
    has_final_quiz: bool = False
    final_quiz_id: Optional[UUID] = None
    is_final_quiz_passed: bool = False


class CourseLearningResponse(BaseModel):
    success: bool
    data: CourseLearningData

class CourseOutroData(BaseModel):
    course_id: UUID
    course_title: str
    student_name: str
    instructor_name: str
    completed_at: datetime
    certificate_code: str
    outro_content: Optional[str] = None
    research_survey_url: Optional[str] = None

class CourseOutroResponse(BaseModel):
    success: bool
    data: CourseOutroData

class LessonCreate(BaseModel):
    title: str = Field(..., max_length=255)
    content_type: str = Field("HYBRID", pattern="^(VIDEO|TEXT|HYBRID|QUIZ)$")
    video_url: Optional[str] = Field(None, max_length=500)
    content_body: Optional[str] = None
    order_index: int = 1
    duration_minutes: Optional[int] = None

class LessonReorder(BaseModel):
    lesson_ids: list[UUID]
