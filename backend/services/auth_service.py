from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from models.user import User
from models.role import Role
from models.session import UserSession
from schemas.auth_schema import UserRegister, UserLogin
from repositories import user_repository, auth_repository
from core import security
from core.config import settings
from datetime import datetime, timezone, timedelta

async def register_user(db: AsyncSession, user_data: UserRegister):
    role = await user_repository.get_role_by_code(db, user_data.role_code)
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role code.")

    if " " in user_data.password or "\t" in user_data.password or "\n" in user_data.password:
        raise HTTPException(status_code=400, detail="Mật khẩu không được chứa khoảng trắng.")

    clean_email = user_data.email.strip()
    clean_username = user_data.username.strip()
    clean_full_name = user_data.full_name.strip()

    existing_user = await user_repository.get_user_by_email_or_username(db, clean_email)
    if not existing_user:
        existing_user = await user_repository.get_user_by_email_or_username(db, clean_username)

    if existing_user:
        raise HTTPException(status_code=400, detail="Email or Username already exists.")

    hashed_password = await security.get_password_hash_async(user_data.password)
    
    new_user = User(
        role_id=role.id,
        username=clean_username,
        email=clean_email,
        password_hash=hashed_password,
        full_name=clean_full_name
    )
    
    created_user = await user_repository.create_user(db, new_user)
    
    return {
        "user_id": created_user.id,
        "username": created_user.username,
        "email": created_user.email,
        "role": role.role_code
    }

async def authenticate_user(db: AsyncSession, login_data: UserLogin, user_agent: str = None, ip_address: str = None):
    clean_identifier = login_data.username_or_email.strip() if login_data.username_or_email else ""
    user = await user_repository.get_user_by_email_or_username(db, clean_identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    
    if not await security.verify_password_async(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
        
    if user.status == "BANNED":
        raise HTTPException(status_code=403, detail="Tài khoản của bạn đã bị khóa.")
        
    if user.status == "INACTIVE":
        raise HTTPException(status_code=403, detail="Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.")

    # Load role
    role_result = await db.execute(select(Role).where(Role.id == user.role_id))
    user_role = role_result.scalars().first()
    
    access_token = security.create_access_token(subject=user.id, role_code=user_role.role_code)
    refresh_token_str = security.create_refresh_token()
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    session = UserSession(
        user_id=user.id,
        refresh_token=refresh_token_str,
        user_agent=user_agent,
        ip_address=ip_address,
        expires_at=expires_at
    )
    
    await auth_repository.create_session(db, session)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "Bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "role": user_role.role_code,
            "avatar_url": user.profile.avatar_url if user.profile else None
        }
    }

async def logout_user(db: AsyncSession, refresh_token: str):
    success = await auth_repository.delete_session(db, refresh_token)
    if not success:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

async def send_forgot_password_email(db: AsyncSession, email: str) -> bool:
    from services import email_service
    clean_email = email.strip().lower()
    user = await user_repository.get_user_by_email_or_username(db, clean_email)
    
    # Chuẩn OWASP: Không tiết lộ sự tồn tại của tài khoản trong hệ thống
    if not user:
        print(f"\n" + "=" * 70)
        print(f" [DEV MODE] YÊU CẦU QUÊN MẬT KHẨU: '{clean_email}'")
        print(f" ⚠️  Email này KHÔNG TỒN TẠI trong cơ sở dữ liệu.")
        print(f" ℹ️  Theo chuẩn OWASP, hệ thống vẫn trả về 200 cho client để tránh bị dò quét user.")
        print("=" * 70 + "\n")
        return True
        
    if user.status in ("BANNED", "INACTIVE"):
        print(f"\n[DEV MODE] Tài khoản '{clean_email}' đang ở trạng thái {user.status}. Bỏ qua gửi email.\n")
        return True

    reset_token = security.create_password_reset_token(str(user.id), user.email, user.password_hash)
    await email_service.send_reset_password_email(user.email, user.full_name, reset_token)
    return True

async def verify_reset_token(db: AsyncSession, token: str) -> dict:
    from jose import JWTError
    from uuid import UUID

    try:
        payload = security.decode_password_reset_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
        )

    if payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loại mã xác thực không hợp lệ."
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thông tin mã xác thực không đầy đủ."
        )

    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã người dùng không hợp lệ."
        )

    user = await user_repository.get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản người dùng không tồn tại."
        )

    # Kiểm tra hash sample: nếu mật khẩu đã bị đổi sau khi token được cấp, token lập tức vô hiệu
    token_hash_sample = payload.get("hash_sample", "")
    current_hash_sample = user.password_hash[:12] if user.password_hash else ""
    if token_hash_sample != current_hash_sample:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết đặt lại mật khẩu này đã được sử dụng trước đó. Vui lòng tạo yêu cầu mới nếu cần."
        )

    return {
        "valid": True,
        "email": user.email,
        "full_name": user.full_name
    }

async def reset_password(db: AsyncSession, token: str, new_password: str) -> bool:
    from jose import JWTError
    from uuid import UUID

    # 1. Xác thực token
    try:
        payload = security.decode_password_reset_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
        )

    if payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loại mã xác thực không hợp lệ."
        )

    user_id_str = payload.get("sub")
    try:
        user_uuid = UUID(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã người dùng không hợp lệ."
        )

    user = await user_repository.get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tài khoản người dùng không tồn tại."
        )

    # 2. Kiểm tra token đã dùng chưa (One-time use)
    token_hash_sample = payload.get("hash_sample", "")
    current_hash_sample = user.password_hash[:12] if user.password_hash else ""
    if token_hash_sample != current_hash_sample:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liên kết này đã được sử dụng để đổi mật khẩu trước đó. Vui lòng tạo yêu cầu mới."
        )

    # 3. Kiểm tra định dạng mật khẩu mới
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải có tối thiểu 6 ký tự."
        )
    if " " in new_password or "\t" in new_password or "\n" in new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu không được chứa khoảng trắng."
        )
    has_letter = any(c.isalpha() for c in new_password)
    has_digit = any(c.isdigit() for c in new_password)
    if not has_letter or not has_digit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải chứa cả chữ cái và chữ số."
        )

    # 4. Cập nhật mật khẩu mới (băm bcrypt)
    user.password_hash = await security.get_password_hash_async(new_password)
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # 5. Thu hồi toàn bộ phiên đăng nhập cũ để đảm bảo an toàn tuyệt đối
    await auth_repository.delete_all_user_sessions(db, user.id)
    return True

