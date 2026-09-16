from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, update, bindparam
from sqlalchemy.orm import selectinload, joinedload
from models.course import Course
from models.lesson import Lesson
from models.course_enrollment import CourseEnrollment
from models.lesson_progress import LessonProgress
from models.user import User
from uuid import UUID

async def get_courses(db: AsyncSession, audience_filter: str = None, limit: int = None) -> list[Course]:
    query = (
        select(Course)
        .options(
            selectinload(Course.lessons),
            joinedload(Course.instructor).joinedload(User.role),
            joinedload(Course.instructor).joinedload(User.profile)
        )
        .where(Course.is_published == True)
    )
    if audience_filter:
        query = query.where(Course.target_audience.in_([audience_filter, "BOTH"]))
    # Giới hạn ngay tại DB thay vì .all() rồi slice trong Python (trang chủ chỉ cần vài khóa đầu)
    if limit:
        query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_course_by_id(db: AsyncSession, course_id: UUID) -> Course:
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.lessons),
            joinedload(Course.instructor).joinedload(User.role),
            joinedload(Course.instructor).joinedload(User.profile)
        )
        .where(Course.id == course_id)
    )
    return result.scalars().first()

async def create_course(db: AsyncSession, course: Course) -> Course:
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course

async def update_course(db: AsyncSession, course: Course) -> Course:
    await db.commit()
    await db.refresh(course)
    return course

async def delete_course(db: AsyncSession, course: Course) -> None:
    await db.delete(course)
    await db.commit()

# Enrollments & Progress
async def get_enrollment(db: AsyncSession, user_id: UUID, course_id: UUID) -> CourseEnrollment:
    result = await db.execute(
        select(CourseEnrollment).where(
            and_(CourseEnrollment.user_id == user_id, CourseEnrollment.course_id == course_id)
        )
    )
    return result.scalars().first()

async def create_enrollment(db: AsyncSession, enrollment: CourseEnrollment) -> CourseEnrollment:
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

async def get_user_enrollments(db: AsyncSession, user_id: UUID) -> list[CourseEnrollment]:
    result = await db.execute(
        select(CourseEnrollment)
        .options(
            joinedload(CourseEnrollment.course).selectinload(Course.lessons),
            joinedload(CourseEnrollment.course).joinedload(Course.instructor).joinedload(User.role),
            joinedload(CourseEnrollment.course).joinedload(Course.instructor).joinedload(User.profile)
        )
        .where(CourseEnrollment.user_id == user_id)
    )
    return result.scalars().all()

async def get_completed_lessons_count(db: AsyncSession, user_id: UUID, course_id: UUID) -> int:
    result = await db.execute(
        select(func.count(LessonProgress.id))
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .where(
            and_(
                LessonProgress.user_id == user_id,
                LessonProgress.is_completed == True,
                Lesson.course_id == course_id
            )
        )
    )
    return result.scalar() or 0

async def get_lesson_progress(db: AsyncSession, user_id: UUID, lesson_id: UUID) -> LessonProgress:
    result = await db.execute(
        select(LessonProgress).where(
            and_(LessonProgress.user_id == user_id, LessonProgress.lesson_id == lesson_id)
        )
    )
    return result.scalars().first()

async def get_lesson_progress_map(db: AsyncSession, user_id: UUID, course_id: UUID) -> dict:
    """Tiến độ TẤT CẢ bài học của user trong khóa học — 1 truy vấn duy nhất,
    trả map lesson_id -> is_completed (thay vòng lặp query từng bài học)."""
    result = await db.execute(
        select(LessonProgress.lesson_id, LessonProgress.is_completed)
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .where(
            and_(
                LessonProgress.user_id == user_id,
                Lesson.course_id == course_id
            )
        )
    )
    return {lesson_id: bool(is_completed) for lesson_id, is_completed in result.all()}

async def get_completed_lessons_counts_for_courses(db: AsyncSession, user_id: UUID, course_ids: list[UUID]) -> dict:
    """Số bài học hoàn thành của user cho NHIỀU khóa học — 1 truy vấn GROUP BY,
    trả map course_id -> completed_count (thay vòng lặp N+1 per enrollment)."""
    if not course_ids:
        return {}
    result = await db.execute(
        select(Lesson.course_id, func.count(LessonProgress.id))
        .join(LessonProgress, LessonProgress.lesson_id == Lesson.id)
        .where(
            and_(
                LessonProgress.user_id == user_id,
                LessonProgress.is_completed == True,
                Lesson.course_id.in_(course_ids)
            )
        )
        .group_by(Lesson.course_id)
    )
    return {course_id: count for course_id, count in result.all()}

async def save_lesson_progress(db: AsyncSession, progress: LessonProgress) -> LessonProgress:
    existing = await get_lesson_progress(db, progress.user_id, progress.lesson_id)
    if existing:
        existing.is_completed = progress.is_completed
        existing.completed_at = func.now()
        db.add(existing)
        progress = existing
    else:
        db.add(progress)
    await db.flush()
    return progress

# Lesson management
async def get_lesson_by_id(db: AsyncSession, lesson_id: UUID) -> Lesson:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    return result.scalars().first()

async def create_lesson(db: AsyncSession, lesson: Lesson) -> Lesson:
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson

async def update_lesson(db: AsyncSession, lesson: Lesson) -> Lesson:
    await db.commit()
    await db.refresh(lesson)
    return lesson

async def reorder_lessons(db: AsyncSession, course_id: UUID, lesson_ids: list[UUID]) -> None:
    """Cập nhật order_index hàng loạt bằng 1 executemany UPDATE + duy nhất 1 commit
    (tránh SELECT + UPDATE + COMMIT cho từng bài học). Bỏ qua lesson không thuộc khóa học."""
    if not lesson_ids:
        return
    stmt = (
        update(Lesson)
        .where(
            and_(
                Lesson.id == bindparam("lid"),
                Lesson.course_id == course_id  # guard: chỉ đụng bài học của khóa này
            )
        )
        .values(order_index=bindparam("idx"))
    )
    await db.execute(
        stmt,
        [{"lid": lesson_id, "idx": idx + 1} for idx, lesson_id in enumerate(lesson_ids)]
    )
    await db.commit()

async def delete_lesson(db: AsyncSession, lesson: Lesson) -> None:
    await db.delete(lesson)
    await db.commit()
