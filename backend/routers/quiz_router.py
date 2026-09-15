from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.dependencies import get_current_user, RoleGuard
from models.user import User
from models.role import Role
from schemas.quiz_schema import (
    QuizCreateOrUpdate, QuizResponse, QuizAdminResponse,
    QuizSubmitRequest, QuizSubmitResponse
)
from schemas.auth_schema import StandardResponse
from services import quiz_service
from repositories import quiz_repository
from uuid import UUID
from typing import List, Optional

router = APIRouter(tags=["Quizzes & Assessments"])

# --- Student Endpoints ---

@router.get("/api/v1/courses/{course_id}/lessons/{lesson_id}/quiz", response_model=QuizResponse, status_code=status.HTTP_200_OK)
async def get_lesson_quiz(
    course_id: UUID,
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    quiz_data = await quiz_service.get_quiz_student_view(
        db=db,
        user_id=current_user.id,
        lesson_id=lesson_id,
        course_id=course_id
    )
    if not quiz_data:
        return QuizResponse(success=True, message="Bài học này chưa có Quiz.", data=None)
    return QuizResponse(success=True, data=quiz_data)

@router.get("/api/v1/courses/{course_id}/final-quiz", response_model=QuizResponse, status_code=status.HTTP_200_OK)
async def get_final_quiz(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    quiz_data = await quiz_service.get_quiz_student_view(
        db=db,
        user_id=current_user.id,
        course_id=course_id,
        is_final=True
    )
    if not quiz_data:
        return QuizResponse(success=True, message="Khóa học này không có bài kiểm tra cuối khóa.", data=None)
    return QuizResponse(success=True, data=quiz_data)

@router.post("/api/v1/quizzes/{quiz_id}/submit", response_model=QuizSubmitResponse, status_code=status.HTTP_200_OK)
async def submit_quiz(
    quiz_id: UUID,
    submit_data: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await quiz_service.submit_quiz(db, current_user.id, quiz_id, submit_data)
    return QuizSubmitResponse(
        success=True,
        message=result.message,
        data=result
    )


# --- Instructor / Admin Endpoints ---

@router.get("/api/v1/courses/{course_id}/quizzes/manage", status_code=status.HTTP_200_OK)
async def get_course_quizzes_for_management(
    course_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    quizzes = await quiz_repository.get_all_quizzes_by_course(db, course_id)
    summary_list = []
    for q in quizzes:
        summary_list.append({
            "quiz_id": q.id,
            "lesson_id": q.lesson_id,
            "is_final": q.lesson_id is None,
            "title": q.title,
            "passing_score": q.passing_score,
            "show_correct_answers": q.show_correct_answers,
            "max_attempts": q.max_attempts,
            "cooldown_minutes": q.cooldown_minutes,
            "total_questions": len(q.questions)
        })
    return {"success": True, "data": summary_list}

@router.get("/api/v1/courses/{course_id}/quizzes/{quiz_id}/manage", response_model=QuizAdminResponse, status_code=status.HTTP_200_OK)
async def get_single_quiz_for_management(
    course_id: UUID,
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    detail = await quiz_service.get_quiz_admin_view(db, quiz_id)
    return QuizAdminResponse(success=True, data=detail)

@router.post("/api/v1/courses/{course_id}/quizzes", response_model=QuizAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_quiz(
    course_id: UUID,
    quiz_data: QuizCreateOrUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    role_result = await db.execute(select(Role).where(Role.id == current_user.role_id))
    user_role = role_result.scalars().first()
    is_admin = user_role and user_role.role_code == "ADMIN"
    if not is_admin and (not user_role or user_role.role_code != "INSTRUCTOR"):
        raise HTTPException(status_code=403, detail="Không đủ quyền thực hiện thao tác này.")

    result = await quiz_service.create_or_update_quiz(
        db=db,
        instructor_id=current_user.id,
        course_id=course_id,
        data=quiz_data,
        is_admin=is_admin
    )
    return QuizAdminResponse(
        success=True,
        message="Lưu bài kiểm tra thành công.",
        data=result
    )

@router.delete("/api/v1/quizzes/{quiz_id}", response_model=StandardResponse, status_code=status.HTTP_200_OK)
async def delete_quiz(
    quiz_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    role_result = await db.execute(select(Role).where(Role.id == current_user.role_id))
    user_role = role_result.scalars().first()
    is_admin = user_role and user_role.role_code == "ADMIN"
    if not is_admin and (not user_role or user_role.role_code != "INSTRUCTOR"):
        raise HTTPException(status_code=403, detail="Không đủ quyền thực hiện thao tác này.")

    await quiz_service.delete_quiz(db, current_user.id, quiz_id, is_admin=is_admin)
    return StandardResponse(success=True, message="Xóa bài kiểm tra thành công.")
