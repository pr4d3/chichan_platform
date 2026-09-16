from pydantic import BaseModel
from typing import Optional, Union
from uuid import UUID
from datetime import datetime

class OverviewStats(BaseModel):
    total_courses: int
    total_students_enrolled: int
    total_completed_students: int
    average_completion_rate: float
    total_lessons_published: int

class OverviewStatsResponse(BaseModel):
    success: bool
    data: OverviewStats

class InstructorCourseData(BaseModel):
    course_id: UUID
    title: str
    target_audience: str
    is_published: bool
    total_lessons: int
    total_enrolled: int
    completed_count: int
    in_progress_count: int
    created_at: datetime

class InstructorCoursesResponse(BaseModel):
    success: bool
    data: list[InstructorCourseData]

class StudentProgressData(BaseModel):
    student_id: UUID
    full_name: str
    email: str
    role: str
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    progress_percentage: float
    completed_lessons_count: int

class CourseStudentsProgressData(BaseModel):
    course_id: UUID
    course_title: str
    total_students: int
    students: list[StudentProgressData]

class CourseStudentsProgressResponse(BaseModel):
    success: bool
    data: CourseStudentsProgressData

class StudentsPaginationInfo(BaseModel):
    # Cấu trúc pagination mirror trang admin users (total, page, limit, total_pages)
    total: int
    page: int
    limit: int
    total_pages: int

class CourseStudentsPaginatedData(BaseModel):
    # Shape phân trang mới của GET /instructor/dashboard/courses/{course_id}/students
    # (chỉ dùng khi client truyền page/limit)
    students: list[StudentProgressData]
    pagination: StudentsPaginationInfo

class CourseStudentsPaginatedResponse(BaseModel):
    success: bool
    data: CourseStudentsPaginatedData
