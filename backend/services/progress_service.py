from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from repositories import course_repository
from models.course_enrollment import CourseEnrollment
from models.lesson_progress import LessonProgress
from uuid import UUID
from datetime import datetime, timezone

async def get_user_progress_list(db: AsyncSession, user_id: UUID):
    enrollments = await course_repository.get_user_enrollments(db, user_id)

    # Tránh N+1: đếm số bài học hoàn thành của TẤT CẢ khóa học trong 1 truy vấn GROUP BY
    course_ids = [enroll.course.id for enroll in enrollments]
    completed_counts = await course_repository.get_completed_lessons_counts_for_courses(db, user_id, course_ids)

    progress_list = []
    for enroll in enrollments:
        course = enroll.course
        total_lessons = len(course.lessons)

        completed_lessons = completed_counts.get(course.id, 0)

        progress_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        
        progress_list.append({
            "course_id": course.id,
            "course_title": course.title,
            "thumbnail_url": course.thumbnail_url,
            "status": enroll.status,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "progress_percentage": round(progress_pct, 2),
            "enrolled_at": enroll.enrolled_at,
            "completed_at": enroll.completed_at
        })
        
    return progress_list

async def mark_lesson_as_completed(db: AsyncSession, user_id: UUID, course_id: UUID, lesson_id: UUID):
    enrollment = await course_repository.get_enrollment(db, user_id, course_id)
    if not enrollment:
        raise HTTPException(status_code=400, detail="Học viên chưa đăng ký tham gia khóa học này.")
        
    lesson = await course_repository.get_lesson_by_id(db, lesson_id)
    if not lesson or lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài học hoặc khóa học tương ứng.")
        
    progress = LessonProgress(user_id=user_id, lesson_id=lesson_id, is_completed=True)
    await course_repository.save_lesson_progress(db, progress)
    
    course = await course_repository.get_course_by_id(db, course_id)
    total_lessons = len(course.lessons)
    completed_lessons = await course_repository.get_completed_lessons_count(db, user_id, course_id)
    
    progress_pct = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
    
    is_course_just_completed = False
    if progress_pct >= 100.0 and enrollment.status != "COMPLETED":
        enrollment.status = "COMPLETED"
        enrollment.completed_at = datetime.now(timezone.utc)
        await course_repository.update_course(db, enrollment)
        is_course_just_completed = True
    else:
        await db.commit()
        
    return {
        "course_id": course_id,
        "lesson_id": lesson_id,
        "progress_percentage": round(progress_pct, 2),
        "course_status": enrollment.status,
        "is_course_just_completed": is_course_just_completed
    }
