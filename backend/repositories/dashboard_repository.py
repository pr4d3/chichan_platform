from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from sqlalchemy.orm import selectinload, joinedload
from models.course import Course
from models.lesson import Lesson
from models.course_enrollment import CourseEnrollment
from models.lesson_progress import LessonProgress
from models.user import User
from uuid import UUID

async def get_overview_stats(db: AsyncSession, instructor_id: UUID = None) -> dict:
    """Gom 4 truy vấn COUNT tuần tự thành 1 truy vấn duy nhất (dùng FILTER của Postgres)."""
    courses_sub = select(func.count(Course.id))
    lessons_sub = select(func.count(Lesson.id))
    if instructor_id:
        courses_sub = courses_sub.where(Course.instructor_id == instructor_id)
        lessons_sub = (
            lessons_sub
            .join(Course, Course.id == Lesson.course_id)
            .where(Course.instructor_id == instructor_id)
        )
        query = (
            select(
                courses_sub.scalar_subquery(),
                func.count(CourseEnrollment.id),
                func.count(CourseEnrollment.id).filter(CourseEnrollment.status == "COMPLETED"),
                lessons_sub.scalar_subquery()
            )
            .select_from(CourseEnrollment)
            .join(Course, Course.id == CourseEnrollment.course_id)
            .where(Course.instructor_id == instructor_id)
        )
    else:
        query = select(
            courses_sub.scalar_subquery(),
            func.count(CourseEnrollment.id),
            func.count(CourseEnrollment.id).filter(CourseEnrollment.status == "COMPLETED"),
            lessons_sub.scalar_subquery()
        ).select_from(CourseEnrollment)

    result = await db.execute(query)
    row = result.first()
    return {
        "total_courses": row[0] or 0,
        "total_enrolled": row[1] or 0,
        "completed": row[2] or 0,
        "total_lessons": row[3] or 0,
    }

async def get_instructor_courses_with_stats(db: AsyncSession, instructor_id: UUID = None) -> list[dict]:
    query = select(Course).options(selectinload(Course.lessons))
    if instructor_id:
        query = query.where(Course.instructor_id == instructor_id)
    result = await db.execute(query)
    courses = result.scalars().all()

    # Thống kê enrollment cho TẤT CẢ khóa học trong 1 truy vấn GROUP BY (tránh N+1 count từng khóa)
    enrollment_stats: dict = {}
    if courses:
        enroll_res = await db.execute(
            select(
                CourseEnrollment.course_id,
                func.count(CourseEnrollment.id),
                func.sum(case((CourseEnrollment.status == "COMPLETED", 1), else_=0))
            )
            .where(CourseEnrollment.course_id.in_([c.id for c in courses]))
            .group_by(CourseEnrollment.course_id)
        )
        for row in enroll_res.all():
            enrollment_stats[row[0]] = (row[1] or 0, row[2] or 0)

    stats_list = []
    for course in courses:
        total_enrolled, completed_count = enrollment_stats.get(course.id, (0, 0))
        total_enrolled = total_enrolled or 0
        completed_count = completed_count or 0
        in_progress_count = total_enrolled - completed_count

        stats_list.append({
            "course_id": course.id,
            "title": course.title,
            "target_audience": course.target_audience,
            "is_published": course.is_published,
            "total_lessons": len(course.lessons),
            "total_enrolled": total_enrolled,
            "completed_count": completed_count,
            "in_progress_count": in_progress_count,
            "created_at": course.created_at
        })
    return stats_list

def _format_student_stats(enroll: CourseEnrollment, total_lessons: int, completed_count: int) -> dict:
    completed_count = completed_count or 0
    progress_pct = (completed_count / total_lessons * 100) if total_lessons > 0 else 0
    return {
        "student_id": enroll.user_id,
        "full_name": enroll.user.full_name,
        "email": enroll.user.email,
        "role": enroll.user.role.role_code,
        "enrolled_at": enroll.enrolled_at,
        "completed_at": enroll.completed_at,
        "status": enroll.status,
        "progress_percentage": round(progress_pct, 2),
        "completed_lessons_count": completed_count
    }

async def _get_enrollments_with_completed_counts(
    db: AsyncSession,
    course_id: UUID,
    status_filter: str = None,
    limit: int = None,
    offset: int = None
) -> list[dict]:
    """Nạp trang enrollment và tính số bài học hoàn thành của từng học viên
    bằng 2 truy vấn gom nhóm (tránh 1 query COUNT cho mỗi học viên)."""
    query = (
        select(CourseEnrollment)
        .join(User, User.id == CourseEnrollment.user_id)
        .options(joinedload(CourseEnrollment.user).joinedload(User.role))
        .where(CourseEnrollment.course_id == course_id)
        # Thứ tự ổn định để phân trang (mirror trang admin users: mới nhất trước)
        .order_by(User.created_at.desc())
    )
    if status_filter:
        query = query.where(CourseEnrollment.status == status_filter)
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)

    result = await db.execute(query)
    enrollments = result.unique().scalars().all()

    lessons_res = await db.execute(
        select(func.count(Lesson.id)).where(Lesson.course_id == course_id)
    )
    total_lessons = lessons_res.scalar() or 0

    # Số bài học hoàn thành của các học viên trong trang — 1 truy vấn GROUP BY duy nhất
    completed_map: dict = {}
    if enrollments:
        completed_res = await db.execute(
            select(LessonProgress.user_id, func.count(LessonProgress.id))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .where(
                and_(
                    LessonProgress.user_id.in_([e.user_id for e in enrollments]),
                    LessonProgress.is_completed == True,
                    Lesson.course_id == course_id
                )
            )
            .group_by(LessonProgress.user_id)
        )
        for row in completed_res.all():
            completed_map[row[0]] = row[1] or 0

    return [_format_student_stats(enroll, total_lessons, completed_map.get(enroll.user_id, 0)) for enroll in enrollments]

async def get_course_students_progress(db: AsyncSession, course_id: UUID, status_filter: str = None) -> list[dict]:
    """Danh sách ĐẦY ĐỦ học viên của khóa học (hành vi cũ cho site đang live)."""
    return await _get_enrollments_with_completed_counts(db, course_id, status_filter)

async def get_course_students_progress_paginated(
    db: AsyncSession,
    course_id: UUID,
    status_filter: str = None,
    page: int = 1,
    limit: int = 15
) -> tuple[list[dict], int]:
    """Phiên bản phân trang theo mẫu admin users: trả (students_của_trang, tổng_số_học_viên)."""
    count_query = select(func.count(CourseEnrollment.id)).where(CourseEnrollment.course_id == course_id)
    if status_filter:
        count_query = count_query.where(CourseEnrollment.status == status_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * limit
    students = await _get_enrollments_with_completed_counts(db, course_id, status_filter, limit=limit, offset=offset)
    return students, total
