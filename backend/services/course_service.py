import re
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from repositories import course_repository, user_repository, quiz_repository
from models.course import Course
from models.lesson import Lesson
from models.course_enrollment import CourseEnrollment
from schemas.course_schema import CourseCreate, LessonCreate
from uuid import UUID
from datetime import datetime, timezone

def normalize_video_identifier(url: str | None) -> str | None:
    if not url:
        return None
    trimmed = url.strip()
    if not trimmed:
        return None
    # YouTube ID extraction (watch?v=..., youtu.be/..., shorts/..., embed/...)
    yt_match = re.search(r'(?:youtu\.be/|youtube\.com/(?:embed/|v/|watch\?v=|watch\?.+&v=|shorts/))([\w-]{11})', trimmed, re.IGNORECASE)
    if yt_match:
        return yt_match.group(1)
    
    # Vimeo ID extraction
    vimeo_match = re.search(r'vimeo\.com/(\d+)', trimmed, re.IGNORECASE)
    if vimeo_match:
        return vimeo_match.group(1)
        
    return trimmed

async def get_public_courses(db: AsyncSession, target_audience: str = None):
    courses = await course_repository.get_courses(db, target_audience)
    
    results = []
    for c in courses:
        results.append({
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "short_description": c.short_description,
            "thumbnail_url": c.thumbnail_url,
            "target_audience": c.target_audience,
            "total_lessons": len(c.lessons) if c.lessons else 0,
            "instructor_name": c.instructor.full_name if c.instructor else "Unknown"
        })
    return results

async def get_course_intro(db: AsyncSession, course_id: UUID, current_user = None):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    is_enrolled = False
    if current_user:
        enrollment = await course_repository.get_enrollment(db, current_user.id, course_id)
        if enrollment:
            is_enrolled = True
            
    quizzes = await quiz_repository.get_all_quizzes_by_course(db, course_id)
    lesson_quiz_map = {q.lesson_id: q for q in quizzes if q.lesson_id is not None}

    syllabus = []
    for lesson in course.lessons:
        l_quiz = lesson_quiz_map.get(lesson.id)
        syllabus.append({
            "id": lesson.id,
            "order_index": lesson.order_index,
            "title": lesson.title,
            "content_type": lesson.content_type,
            "duration_minutes": lesson.duration_minutes,
            "has_quiz": l_quiz is not None or lesson.content_type == "QUIZ",
            "quiz_id": l_quiz.id if l_quiz else None
        })
        
    return {
        "course_id": course.id,
        "title": course.title,
        "slug": course.slug,
        "short_description": course.short_description,
        "description": course.description,
        "thumbnail_url": course.thumbnail_url,
        "target_audience": course.target_audience,
        "learning_objectives": course.learning_objectives,
        "instructor": {
            "id": course.instructor_id,
            "full_name": course.instructor.full_name if course.instructor else "Unknown",
            "avatar_url": course.instructor.profile.avatar_url if course.instructor and course.instructor.profile else None,
            "bio": course.instructor.profile.bio if course.instructor and course.instructor.profile else None
        },
        "total_lessons": len(course.lessons),
        "is_enrolled": is_enrolled,
        "outro_content": course.outro_content,
        "syllabus": syllabus
    }

async def enroll_course(db: AsyncSession, user_id: UUID, course_id: UUID):
    existing = await course_repository.get_enrollment(db, user_id, course_id)
    if existing:
        return {
            "course_id": course_id,
            "status": existing.status,
            "enrolled_at": existing.enrolled_at
        }
        
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    enrollment = CourseEnrollment(user_id=user_id, course_id=course_id, status="IN_PROGRESS")
    created = await course_repository.create_enrollment(db, enrollment)
    return {
        "course_id": created.course_id,
        "status": created.status,
        "enrolled_at": created.enrolled_at
    }

async def get_course_learning_room(db: AsyncSession, user_id: UUID, course_id: UUID):
    enrollment = await course_repository.get_enrollment(db, user_id, course_id)
    if not enrollment:
        raise HTTPException(status_code=400, detail="Học viên chưa đăng ký tham gia khóa học này.")
        
    course = await course_repository.get_course_by_id(db, course_id)
    total_lessons = len(course.lessons)
    completed_lessons = await course_repository.get_completed_lessons_count(db, user_id, course_id)
    
    progress_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    
    quizzes = await quiz_repository.get_all_quizzes_by_course(db, course_id)
    lesson_quiz_map = {q.lesson_id: q for q in quizzes if q.lesson_id is not None}
    final_quiz = next((q for q in quizzes if q.lesson_id is None), None)

    # Tránh N+1: tiến độ bài học lấy 1 lần cho cả khóa, kết quả quiz lấy 1 lần cho tất cả quiz
    progress_map = await course_repository.get_lesson_progress_map(db, user_id, course_id)
    all_quiz_ids = [q.id for q in quizzes]
    passed_quiz_ids = await quiz_repository.get_passed_quiz_ids(db, user_id, all_quiz_ids) if all_quiz_ids else set()

    is_final_quiz_passed = final_quiz.id in passed_quiz_ids if final_quiz else False

    lessons_data = []
    for lesson in course.lessons:
        is_completed = progress_map.get(lesson.id, False)

        l_quiz = lesson_quiz_map.get(lesson.id)
        is_quiz_passed = l_quiz.id in passed_quiz_ids if l_quiz else False

        lessons_data.append({
            "lesson_id": lesson.id,
            "order_index": lesson.order_index,
            "title": lesson.title,
            "content_type": lesson.content_type,
            "video_url": lesson.video_url,
            "content_body": lesson.content_body,
            "is_completed": is_completed,
            "has_quiz": l_quiz is not None,
            "quiz_id": l_quiz.id if l_quiz else None,
            "is_quiz_passed": is_quiz_passed
        })

    return {
        "course_id": course.id,
        "course_title": course.title,
        "progress_percentage": round(progress_pct, 2),
        "lessons": lessons_data,
        "has_final_quiz": final_quiz is not None,
        "final_quiz_id": final_quiz.id if final_quiz else None,
        "is_final_quiz_passed": is_final_quiz_passed
    }


async def get_course_outro(db: AsyncSession, user_id: UUID, course_id: UUID):
    enrollment = await course_repository.get_enrollment(db, user_id, course_id)
    if not enrollment or enrollment.status != "COMPLETED":
        raise HTTPException(status_code=403, detail="Bạn chưa hoàn thành tất cả các bài học trong khóa học này.")
        
    course = await course_repository.get_course_by_id(db, course_id)
    student = await user_repository.get_user_by_id(db, str(user_id))

    # Format unique certificate code: e.g. SEXED-ABC123XY
    cert_hash = str(enrollment.id).replace("-", "")[:8].upper()
    cert_code = f"SEXED-{cert_hash}"

    return {
        "course_id": course.id,
        "course_title": course.title,
        "student_name": student.full_name if student else "Học viên SexED",
        "instructor_name": course.instructor.full_name if course.instructor else "Ban Chuyên Môn SexED",
        "completed_at": enrollment.completed_at,
        "certificate_code": cert_code,
        "outro_content": course.outro_content or "Chúc mừng bạn đã hoàn thành khóa học!",
        "research_survey_url": "https://forms.gle/research_feedback_sexed"
    }

# Course Management
async def create_new_course(db: AsyncSession, instructor_id: UUID, course_data: CourseCreate):
    course = Course(
        instructor_id=instructor_id,
        title=course_data.title,
        slug=course_data.slug,
        short_description=course_data.short_description,
        description=course_data.description,
        thumbnail_url=course_data.thumbnail_url,
        target_audience=course_data.target_audience,
        learning_objectives=course_data.learning_objectives,
        outro_content=course_data.outro_content,
        is_published=False
    )
    created = await course_repository.create_course(db, course)
    return {
        "course_id": created.id,
        "slug": created.slug
    }

async def update_existing_course(db: AsyncSession, instructor_id: UUID, course_id: UUID, course_data: CourseCreate, is_admin: bool = False):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")
        
    course.title = course_data.title
    course.slug = course_data.slug
    course.short_description = course_data.short_description
    course.description = course_data.description
    course.thumbnail_url = course_data.thumbnail_url
    course.target_audience = course_data.target_audience
    course.learning_objectives = course_data.learning_objectives
    course.outro_content = course_data.outro_content
    
    updated = await course_repository.update_course(db, course)
    return {
        "course_id": updated.id,
        "slug": updated.slug
    }

async def delete_existing_course(db: AsyncSession, instructor_id: UUID, course_id: UUID, is_admin: bool = False):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")
        
    await course_repository.delete_course(db, course)

# Lessons
async def add_lesson_to_course(db: AsyncSession, instructor_id: UUID, course_id: UUID, lesson_data: LessonCreate, is_admin: bool = False):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")
        
    lesson = Lesson(
        course_id=course_id,
        title=lesson_data.title,
        content_type=lesson_data.content_type,
        video_url=normalize_video_identifier(lesson_data.video_url),
        content_body=lesson_data.content_body,
        order_index=lesson_data.order_index,
        duration_minutes=lesson_data.duration_minutes
    )
    
    created = await course_repository.create_lesson(db, lesson)
    return {
        "lesson_id": created.id,
        "title": created.title
    }

async def update_lesson_in_course(db: AsyncSession, instructor_id: UUID, course_id: UUID, lesson_id: UUID, lesson_data: LessonCreate, is_admin: bool = False):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")
        
    lesson = await course_repository.get_lesson_by_id(db, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học.")
        
    lesson.title = lesson_data.title
    lesson.content_type = lesson_data.content_type
    lesson.video_url = normalize_video_identifier(lesson_data.video_url)
    lesson.content_body = lesson_data.content_body
    lesson.order_index = lesson_data.order_index
    lesson.duration_minutes = lesson_data.duration_minutes
    
    await course_repository.update_lesson(db, lesson)
    return {
        "lesson_id": lesson.id,
        "title": lesson.title
    }

async def delete_lesson_from_course(db: AsyncSession, instructor_id: UUID, course_id: UUID, lesson_id: UUID, is_admin: bool = False):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
        
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")
        
    lesson = await course_repository.get_lesson_by_id(db, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học.")
        
    await course_repository.delete_lesson(db, lesson)

async def reorder_lessons_in_course(db: AsyncSession, instructor_id: UUID, course_id: UUID, lesson_ids: list[UUID], is_admin: bool = False):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")

    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")

    # 1 executemany UPDATE + 1 commit duy nhất thay vì SELECT/UPDATE/commit cho từng bài học
    await course_repository.reorder_lessons(db, course_id, lesson_ids)
    return True
