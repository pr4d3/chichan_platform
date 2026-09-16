from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from repositories import dashboard_repository, course_repository
from uuid import UUID
import math

async def get_instructor_overview_stats(db: AsyncSession, instructor_id: UUID, is_admin: bool = False):
    # Gom 4 truy vấn COUNT tuần tự thành 1 truy vấn duy nhất (FILTER của Postgres)
    stats = await dashboard_repository.get_overview_stats(db, None if is_admin else instructor_id)
    total_courses = stats["total_courses"]
    total_enrolled = stats["total_enrolled"]
    completed_students = stats["completed"]
    total_lessons = stats["total_lessons"]

    average_completion_rate = (completed_students / total_enrolled * 100) if total_enrolled > 0 else 0.0

    return {
        "total_courses": total_courses,
        "total_students_enrolled": total_enrolled,
        "total_completed_students": completed_students,
        "average_completion_rate": round(average_completion_rate, 2),
        "total_lessons_published": total_lessons
    }

async def get_instructor_courses(db: AsyncSession, instructor_id: UUID, is_admin: bool = False):
    return await dashboard_repository.get_instructor_courses_with_stats(db, None if is_admin else instructor_id)

async def get_course_students_progress(
    db: AsyncSession,
    instructor_id: UUID,
    course_id: UUID,
    status_filter: str = None,
    is_admin: bool = False,
    page: int = None,
    limit: int = None
):
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")

    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Giảng viên cố tình truy cập xem học viên của khóa học không do mình quản lý.")

    # COMPAT SHIM cho site đang live: không truyền page/limit -> trả shape cũ đầy đủ danh sách học viên.
    # Truyền page hoặc limit -> trả shape phân trang mới {students, pagination} mirror trang admin users.
    if page is None and limit is None:
        students = await dashboard_repository.get_course_students_progress(db, course_id, status_filter)
        return {
            "course_id": course.id,
            "course_title": course.title,
            "total_students": len(students),
            "students": students
        }

    # Chuẩn hóa tham số phân trang theo mẫu admin (admin_service.get_users_page)
    if page is None:
        page = 1
    if limit is None:
        limit = 15
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 15

    students, total = await dashboard_repository.get_course_students_progress_paginated(
        db, course_id, status_filter, page=page, limit=limit
    )

    total_pages = math.ceil(total / limit) if total > 0 else 1

    return {
        "students": students,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }
