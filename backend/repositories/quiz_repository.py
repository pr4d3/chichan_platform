from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete
from models.quiz import Quiz, QuizQuestion, QuizQuestionOption, QuizSubmission
from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple

async def get_quiz_by_id(db: AsyncSession, quiz_id: UUID) -> Optional[Quiz]:
    stmt = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_quiz_by_lesson_id(db: AsyncSession, lesson_id: UUID) -> Optional[Quiz]:
    stmt = select(Quiz).where(Quiz.lesson_id == lesson_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_final_quiz_by_course_id(db: AsyncSession, course_id: UUID) -> Optional[Quiz]:
    stmt = select(Quiz).where(and_(Quiz.course_id == course_id, Quiz.lesson_id == None))
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_all_quizzes_by_course(db: AsyncSession, course_id: UUID) -> List[Quiz]:
    stmt = select(Quiz).where(Quiz.course_id == course_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def save_quiz(db: AsyncSession, quiz: Quiz) -> Quiz:
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return quiz

async def delete_quiz(db: AsyncSession, quiz: Quiz) -> None:
    await db.delete(quiz)
    await db.commit()

async def save_submission(db: AsyncSession, submission: QuizSubmission) -> QuizSubmission:
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return submission

async def get_user_submissions(db: AsyncSession, user_id: UUID, quiz_id: UUID, limit: int = None) -> List[QuizSubmission]:
    stmt = (
        select(QuizSubmission)
        .where(and_(QuizSubmission.user_id == user_id, QuizSubmission.quiz_id == quiz_id))
        .order_by(QuizSubmission.submitted_at.desc())
    )
    # Giới hạn số dòng nạp về (None = không giới hạn, giữ hành vi cũ)
    if limit:
        stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def has_user_passed_quiz(db: AsyncSession, user_id: UUID, quiz_id: UUID) -> bool:
    """Kiểm tra đã từng đỗ quiz chưa bằng aggregate bool_or phía DB (không nạp toàn bộ lịch sử nộp bài)"""
    stmt = select(func.bool_or(QuizSubmission.passed)).where(
        and_(QuizSubmission.user_id == user_id, QuizSubmission.quiz_id == quiz_id)
    )
    result = await db.execute(stmt)
    return bool(result.scalar())

async def get_passed_quiz_ids(db: AsyncSession, user_id: UUID, quiz_ids: List[UUID]) -> set:
    """Trả về tập các quiz_id mà user đã từng đỗ — 1 truy vấn GROUP BY cho nhiều quiz
    (thay vòng lặp nạp toàn bộ submissions của từng quiz)."""
    if not quiz_ids:
        return set()
    stmt = (
        select(QuizSubmission.quiz_id)
        .where(
            and_(
                QuizSubmission.user_id == user_id,
                QuizSubmission.quiz_id.in_(quiz_ids),
                QuizSubmission.passed == True
            )
        )
        .group_by(QuizSubmission.quiz_id)
    )
    result = await db.execute(stmt)
    return set(result.scalars().all())

async def get_user_best_submission(db: AsyncSession, user_id: UUID, quiz_id: UUID) -> Optional[QuizSubmission]:
    stmt = (
        select(QuizSubmission)
        .where(and_(QuizSubmission.user_id == user_id, QuizSubmission.quiz_id == quiz_id))
        .order_by(QuizSubmission.score.desc(), QuizSubmission.submitted_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def check_user_cooldown(
    db: AsyncSession,
    user_id: UUID,
    quiz_id: UUID,
    max_attempts: int = 3,
    cooldown_minutes: int = 15,
    submissions: Optional[List[QuizSubmission]] = None
) -> Tuple[bool, int, int]:
    """
    Coursera-style anti-spam retry check:
    Returns (is_locked, remaining_cooldown_seconds, attempts_left)
    """
    # Cho phép truyền sẵn danh sách submissions (mới nhất trước) để tái sử dụng,
    # tránh phải fetch lại từ DB nhiều lần trong cùng một request.
    if submissions is None:
        submissions = await get_user_submissions(db, user_id, quiz_id, limit=50)
    if not submissions:
        return False, 0, max_attempts

    # Check if the user has already passed
    has_passed = any(s.passed for s in submissions)
    if has_passed:
        return False, 0, max_attempts

    now = datetime.now(timezone.utc)
    cooldown_delta = timedelta(minutes=cooldown_minutes)

    # Gather consecutive failed submissions without a pass
    recent_failures: List[QuizSubmission] = []
    for sub in submissions:
        if not sub.passed:
            recent_failures.append(sub)
        else:
            break

    if len(recent_failures) < max_attempts:
        attempts_left = max_attempts - len(recent_failures)
        return False, 0, attempts_left

    # The user has failed >= max_attempts times consecutively
    # Check the timestamp of the last attempt that triggered the lockout
    last_sub = recent_failures[0]
    time_since_last = now - last_sub.submitted_at

    if time_since_last < cooldown_delta:
        remaining_seconds = int((cooldown_delta - time_since_last).total_seconds())
        return True, max(1, remaining_seconds), 0
    else:
        # Cooldown has expired, reset attempts
        return False, 0, max_attempts
