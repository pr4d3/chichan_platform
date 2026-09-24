from fastapi import APIRouter, Depends, status, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from core.dependencies import get_current_user, RoleGuard
from models.user import User
from schemas.user_schema import UserProfileResponse, UserProfileUpdate, UserProfileUpdateResponse, MyCoursesResponse, LessonCompleteResponse
from services import user_service, progress_service
from uuid import UUID

router = APIRouter(prefix="/api/v1/users", tags=["Users & Progress"])

@router.get("/profile", response_model=UserProfileResponse, status_code=status.HTTP_200_OK)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    profile = await user_service.get_profile(db, current_user.id)
    return UserProfileResponse(success=True, data=profile)

@router.put("/profile", response_model=UserProfileUpdateResponse, status_code=status.HTTP_200_OK)
async def update_profile(profile_data: UserProfileUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    updated = await user_service.update_profile(db, current_user.id, profile_data)
    return UserProfileUpdateResponse(
        success=True,
        message="Cập nhật hồ sơ thành công",
        data=updated
    )

@router.get("/my-courses", response_model=MyCoursesResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(RoleGuard(["STUDENT_PARENT", "STUDENT_CHILD"]))])
async def get_my_courses(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    progress_list = await progress_service.get_user_progress_list(db, current_user.id)
    return MyCoursesResponse(success=True, data=progress_list)

@router.post("/courses/{course_id}/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse, status_code=status.HTTP_200_OK, dependencies=[Depends(RoleGuard(["STUDENT_PARENT", "STUDENT_CHILD"]))])
async def complete_lesson(course_id: UUID, lesson_id: UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await progress_service.mark_lesson_as_completed(db, current_user.id, course_id, lesson_id)
    return LessonCompleteResponse(
        success=True,
        message="Ghi nhận tiến độ bài học thành công",
        data=result
    )

import os
import uuid
import io
try:
    from PIL import Image, ImageOps
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

UPLOAD_AVATARS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "avatars")
os.makedirs(UPLOAD_AVATARS_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

from fastapi.responses import Response, RedirectResponse

@router.get("/{user_id}/avatar", status_code=status.HTTP_200_OK)
async def get_user_avatar(user_id: UUID, db: AsyncSession = Depends(get_db)):
    avatar_bytes, avatar_url = await user_service.get_avatar_bytes(db, user_id)
    if avatar_bytes:
        return Response(
            content=avatar_bytes,
            media_type="image/webp",
            headers={
                "Cache-Control": "public, max-age=86400",
                "Content-Type": "image/webp"
            }
        )
    if avatar_url:
        if avatar_url.startswith("http://") or avatar_url.startswith("https://"):
            return RedirectResponse(url=avatar_url)
        local_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), avatar_url.lstrip("/"))
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return Response(
                    content=f.read(),
                    media_type="image/webp",
                    headers={"Cache-Control": "public, max-age=86400"}
                )
    return RedirectResponse(url="https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc")

@router.post("/avatar", status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG hoặc WEBP."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kích thước tệp vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn."
        )

    try:
        if HAS_PIL:
            image = Image.open(io.BytesIO(contents))
            image = ImageOps.exif_transpose(image)
            if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
                image = image.convert("RGBA")
            else:
                image = image.convert("RGB")

            # Center crop to square
            w, h = image.size
            min_dim = min(w, h)
            left = (w - min_dim) // 2
            top = (h - min_dim) // 2
            image = image.crop((left, top, left + min_dim, top + min_dim))
            image = image.resize((400, 400), Image.Resampling.LANCZOS)

            # Encode WebP bytes for database storage
            output_buffer = io.BytesIO()
            image.save(output_buffer, "WEBP", quality=85)
            avatar_bytes = output_buffer.getvalue()
        else:
            avatar_bytes = contents

        # Save to disk as well
        filename = f"{uuid.uuid4().hex}.webp"
        save_path = os.path.join(UPLOAD_AVATARS_DIR, filename)
        with open(save_path, "wb") as f:
            f.write(avatar_bytes)

        # Database URL pointing to the user's avatar streaming endpoint
        avatar_url = f"/api/v1/users/{current_user.id}/avatar"
        await user_service.update_avatar(db, current_user.id, avatar_url, avatar_data=avatar_bytes)

        return {
            "success": True,
            "message": "Tải lên ảnh đại diện thành công",
            "data": {
                "avatar_url": avatar_url
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể xử lý tệp ảnh. Vui lòng thử lại với ảnh khác."
        )

