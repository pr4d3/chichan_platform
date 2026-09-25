from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Any
from uuid import UUID

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=150)
    role_code: str = Field(..., pattern="^(STUDENT_PARENT|STUDENT_CHILD)$")

    @field_validator("password")
    @classmethod
    def validate_password_no_spaces(cls, v: str) -> str:
        if " " in v or "\t" in v or "\n" in v:
            raise ValueError("Mật khẩu không được chứa khoảng trắng.")
        return v

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class UserBase(BaseModel):
    id: UUID
    full_name: str
    role: str

class TokenResponseData(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_in: int
    user: Optional[UserBase] = None

class TokenResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: TokenResponseData

class UserResponseData(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    full_name: str
    role: str
    status: str

class UserResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: UserResponseData

class StandardResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetTokenRequest(BaseModel):
    token: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

    @field_validator("new_password")
    @classmethod
    def validate_password_rules(cls, v: str) -> str:
        if " " in v or "\t" in v or "\n" in v:
            raise ValueError("Mật khẩu không được chứa khoảng trắng.")
        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)
        if not has_letter or not has_digit:
            raise ValueError("Mật khẩu phải chứa cả chữ cái và chữ số.")
        return v

