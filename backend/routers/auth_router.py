from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from schemas.auth_schema import (
    UserRegister,
    UserLogin,
    TokenRefresh,
    TokenResponse,
    StandardResponse,
    UserResponse,
    ForgotPasswordRequest,
    VerifyResetTokenRequest,
    ResetPasswordRequest,
)
from services import auth_service
from core.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=StandardResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    created_user = await auth_service.register_user(db, user_data)
    return StandardResponse(
        success=True,
        message="Đăng ký tài khoản thành công",
        data=created_user
    )

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(request: Request, login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    token_data = await auth_service.authenticate_user(db, login_data, user_agent, ip_address)
    return TokenResponse(
        success=True,
        message="Đăng nhập thành công",
        data=token_data
    )

@router.post("/logout", response_model=StandardResponse, status_code=status.HTTP_200_OK)
async def logout(token_data: TokenRefresh, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await auth_service.logout_user(db, token_data.refresh_token)
    return StandardResponse(
        success=True,
        message="Đăng xuất thành công"
    )

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from models.role import Role
    
    role_result = await db.execute(select(Role).where(Role.id == current_user.role_id))
    user_role = role_result.scalars().first()
    
    return UserResponse(
        success=True,
        data={
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "role": user_role.role_code if user_role else "UNKNOWN",
            "status": current_user.status
        }
    )

@router.post("/forgot-password", response_model=StandardResponse, status_code=status.HTTP_200_OK)
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.send_forgot_password_email(db, req.email)
    return StandardResponse(
        success=True,
        message="Nếu email này tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đi. Vui lòng kiểm tra hộp thư đến hoặc thư rác."
    )

@router.post("/verify-reset-token", response_model=StandardResponse, status_code=status.HTTP_200_OK)
async def verify_token(req: VerifyResetTokenRequest, db: AsyncSession = Depends(get_db)):
    data = await auth_service.verify_reset_token(db, req.token)
    return StandardResponse(
        success=True,
        message="Mã xác thực hợp lệ",
        data=data
    )

@router.post("/reset-password", response_model=StandardResponse, status_code=status.HTTP_200_OK)
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.reset_password(db, req.token, req.new_password)
    return StandardResponse(
        success=True,
        message="Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."
    )

