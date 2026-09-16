from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from repositories import quiz_repository, course_repository, user_repository
from models.quiz import Quiz, QuizQuestion, QuizQuestionOption, QuizSubmission
from models.lesson_progress import LessonProgress
from schemas.quiz_schema import (
    QuizCreateOrUpdate, QuizStudentDetail, QuestionStudentView, OptionStudentView,
    QuizSubmitRequest, QuizSubmitResponseData, QuestionResultDetail,
    QuizAdminDetail, QuestionAdminView, OptionAdminView
)
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, List, Dict

async def get_quiz_student_view(
    db: AsyncSession,
    user_id: UUID,
    quiz_id: Optional[UUID] = None,
    lesson_id: Optional[UUID] = None,
    course_id: Optional[UUID] = None,
    is_final: bool = False
) -> Optional[QuizStudentDetail]:
    quiz: Optional[Quiz] = None
    if quiz_id:
        quiz = await quiz_repository.get_quiz_by_id(db, quiz_id)
    elif lesson_id:
        quiz = await quiz_repository.get_quiz_by_lesson_id(db, lesson_id)
    elif is_final and course_id:
        quiz = await quiz_repository.get_final_quiz_by_course_id(db, course_id)

    if not quiz:
        return None

    # Nạp tối đa 50 lượt nộp gần nhất DUY NHẤT một lần, tái sử dụng cho check cooldown
    # (tránh fetch toàn bộ lịch sử nộp bài 2-4 lần mỗi request)
    submissions = await quiz_repository.get_user_submissions(db, user_id, quiz.id, limit=50)
    is_locked, remaining_seconds, attempts_left = await quiz_repository.check_user_cooldown(
        db, user_id, quiz.id, quiz.max_attempts, quiz.cooldown_minutes, submissions=submissions
    )

    best_sub = await quiz_repository.get_user_best_submission(db, user_id, quiz.id)
    best_score = best_sub.score if best_sub else None
    # Kiểm tra "đã từng đỗ" bằng aggregate phía DB thay vì quét toàn bộ danh sách submissions
    has_passed = await quiz_repository.has_user_passed_quiz(db, user_id, quiz.id)

    student_questions = []
    for q in quiz.questions:
        opts = [
            OptionStudentView(
                id=opt.id,
                option_text=opt.option_text,
                order_index=opt.order_index
            )
            for opt in q.options
        ]
        student_questions.append(
            QuestionStudentView(
                id=q.id,
                question_text=q.question_text,
                order_index=q.order_index,
                options=opts
            )
        )

    return QuizStudentDetail(
        id=quiz.id,
        course_id=quiz.course_id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        description=quiz.description,
        passing_score=quiz.passing_score,
        show_correct_answers=quiz.show_correct_answers,
        max_attempts=quiz.max_attempts,
        cooldown_minutes=quiz.cooldown_minutes,
        total_questions=len(quiz.questions),
        questions=student_questions,
        is_locked=is_locked,
        remaining_cooldown_seconds=remaining_seconds,
        attempts_left=attempts_left,
        best_score=best_score,
        has_passed=has_passed
    )

async def submit_quiz(
    db: AsyncSession,
    user_id: UUID,
    quiz_id: UUID,
    data: QuizSubmitRequest
) -> QuizSubmitResponseData:
    quiz = await quiz_repository.get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Bài kiểm tra không tồn tại.")

    # Check anti-spam cooldown lockout (nạp trước danh sách submissions để tái sử dụng bên dưới)
    submissions = await quiz_repository.get_user_submissions(db, user_id, quiz.id, limit=50)
    is_locked, remaining_seconds, attempts_left = await quiz_repository.check_user_cooldown(
        db, user_id, quiz.id, quiz.max_attempts, quiz.cooldown_minutes, submissions=submissions
    )
    if is_locked:
        minutes = max(1, (remaining_seconds + 59) // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Bạn đã sử dụng hết {quiz.max_attempts} lượt thử không đạt. Vui lòng ôn lại bài học và chờ {minutes} phút trước khi thử lại."
        )

    # Grade the submission
    user_answers_map: Dict[UUID, UUID] = {item.question_id: item.selected_option_id for item in data.answers}
    total_questions = len(quiz.questions)
    correct_count = 0
    results: List[QuestionResultDetail] = []

    for q in quiz.questions:
        selected_opt_id = user_answers_map.get(q.id)
        correct_opt = next((opt for opt in q.options if opt.is_correct), None)
        is_correct = (selected_opt_id is not None and correct_opt is not None and selected_opt_id == correct_opt.id)

        if is_correct:
            correct_count += 1

        res_item = QuestionResultDetail(
            question_id=q.id,
            selected_option_id=selected_opt_id,
            is_correct=is_correct if quiz.show_correct_answers else None,
            correct_option_id=correct_opt.id if (quiz.show_correct_answers and correct_opt) else None,
            explanation=q.explanation if quiz.show_correct_answers else None
        )
        results.append(res_item)

    score = int(round((correct_count / total_questions * 100))) if total_questions > 0 else 0
    passed = score >= quiz.passing_score

    # Record submission
    answers_record = [
        {"question_id": str(item.question_id), "selected_option_id": str(item.selected_option_id)}
        for item in data.answers
    ]
    submission = QuizSubmission(
        user_id=user_id,
        quiz_id=quiz.id,
        score=score,
        passed=passed,
        answers=answers_record
    )
    await quiz_repository.save_submission(db, submission)

    # Re-check cooldown after this submission: chèn submission vừa nộp vào đầu danh sách
    # đã nạp trước đó (mới nhất trước) thay vì fetch lại toàn bộ từ DB
    updated_locked, updated_remaining, updated_attempts = await quiz_repository.check_user_cooldown(
        db, user_id, quiz.id, quiz.max_attempts, quiz.cooldown_minutes,
        submissions=[submission] + submissions
    )

    is_lesson_completed = False
    is_course_just_completed = False

    # Handle completion logic if passed
    if passed:
        # 1. Lesson Quiz Passed -> complete lesson
        if quiz.lesson_id:
            prog = LessonProgress(user_id=user_id, lesson_id=quiz.lesson_id, is_completed=True)
            await course_repository.save_lesson_progress(db, prog)
            is_lesson_completed = True

            # Also check if course has reached 100% lessons
            course = await course_repository.get_course_by_id(db, quiz.course_id)
            total_lessons = len(course.lessons)
            completed_lessons = await course_repository.get_completed_lessons_count(db, user_id, quiz.course_id)
            has_final_quiz = await quiz_repository.get_final_quiz_by_course_id(db, quiz.course_id) is not None

            enrollment = await course_repository.get_enrollment(db, user_id, quiz.course_id)
            if enrollment and completed_lessons >= total_lessons and not has_final_quiz:
                if enrollment.status != "COMPLETED":
                    enrollment.status = "COMPLETED"
                    enrollment.completed_at = datetime.now(timezone.utc)
                    await course_repository.update_course(db, enrollment)
                    is_course_just_completed = True

        # 2. Final Course Quiz Passed -> complete course enrollment
        else:
            enrollment = await course_repository.get_enrollment(db, user_id, quiz.course_id)
            if enrollment:
                if enrollment.status != "COMPLETED":
                    enrollment.status = "COMPLETED"
                    enrollment.completed_at = datetime.now(timezone.utc)
                    await course_repository.update_course(db, enrollment)
                    is_course_just_completed = True

    msg = (
        f"Chúc mừng bạn đã xuất sắc vượt qua bài kiểm tra với số điểm {score}%!"
        if passed
        else f"Bạn đạt {score}%. Điểm đạt yêu cầu là {quiz.passing_score}%. Hãy ôn lại bài học và thử lại nhé!"
    )

    return QuizSubmitResponseData(
        quiz_id=quiz.id,
        score=score,
        passed=passed,
        passing_score=quiz.passing_score,
        show_correct_answers=quiz.show_correct_answers,
        attempts_left=updated_attempts,
        is_locked=updated_locked,
        remaining_cooldown_seconds=updated_remaining,
        message=msg,
        results=results if quiz.show_correct_answers else None,
        is_lesson_completed=is_lesson_completed,
        is_course_just_completed=is_course_just_completed
    )

async def create_or_update_quiz(
    db: AsyncSession,
    instructor_id: UUID,
    course_id: UUID,
    data: QuizCreateOrUpdate,
    is_admin: bool = False
) -> QuizAdminDetail:
    course = await course_repository.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Khóa học không tồn tại.")
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học này.")

    # Find existing quiz for this lesson or final quiz for course
    existing_quiz: Optional[Quiz] = None
    if data.lesson_id:
        existing_quiz = await quiz_repository.get_quiz_by_lesson_id(db, data.lesson_id)
    else:
        existing_quiz = await quiz_repository.get_final_quiz_by_course_id(db, course_id)

    if existing_quiz:
        # Delete old quiz to recreate cleanly
        await quiz_repository.delete_quiz(db, existing_quiz)

    # Create new Quiz
    quiz = Quiz(
        course_id=course_id,
        lesson_id=data.lesson_id,
        title=data.title,
        description=data.description,
        passing_score=data.passing_score,
        show_correct_answers=data.show_correct_answers,
        max_attempts=data.max_attempts,
        cooldown_minutes=data.cooldown_minutes
    )

    for q_data in data.questions:
        question = QuizQuestion(
            question_text=q_data.question_text,
            explanation=q_data.explanation,
            order_index=q_data.order_index
        )
        for opt_data in q_data.options:
            option = QuizQuestionOption(
                option_text=opt_data.option_text,
                is_correct=opt_data.is_correct,
                order_index=opt_data.order_index
            )
            question.options.append(option)
        quiz.questions.append(question)

    saved = await quiz_repository.save_quiz(db, quiz)
    return await get_quiz_admin_view(db, saved.id)

async def get_quiz_admin_view(db: AsyncSession, quiz_id: UUID) -> QuizAdminDetail:
    quiz = await quiz_repository.get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài kiểm tra.")

    questions_admin = []
    for q in quiz.questions:
        options_admin = [
            OptionAdminView(
                id=opt.id,
                option_text=opt.option_text,
                is_correct=opt.is_correct,
                order_index=opt.order_index
            )
            for opt in q.options
        ]
        questions_admin.append(
            QuestionAdminView(
                id=q.id,
                question_text=q.question_text,
                explanation=q.explanation,
                order_index=q.order_index,
                options=options_admin
            )
        )

    return QuizAdminDetail(
        id=quiz.id,
        course_id=quiz.course_id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        description=quiz.description,
        passing_score=quiz.passing_score,
        show_correct_answers=quiz.show_correct_answers,
        max_attempts=quiz.max_attempts,
        cooldown_minutes=quiz.cooldown_minutes,
        questions=questions_admin,
        created_at=quiz.created_at,
        updated_at=quiz.updated_at
    )

async def delete_quiz(db: AsyncSession, instructor_id: UUID, quiz_id: UUID, is_admin: bool = False) -> None:
    quiz = await quiz_repository.get_quiz_by_id(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Bài kiểm tra không tồn tại.")

    course = await course_repository.get_course_by_id(db, quiz.course_id)
    if not is_admin and course.instructor_id != instructor_id:
        raise HTTPException(status_code=403, detail="Bạn không sở hữu khóa học chứa bài kiểm tra này.")

    await quiz_repository.delete_quiz(db, quiz)
