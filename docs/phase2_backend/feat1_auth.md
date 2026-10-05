# Feature Specification 01: Authentication & Authorization (Backend)

---

## 1. Scope & System Overview

- Manages identity verification, authentication, and Role-Based Access Control (RBAC).
- Supports learner demographic role assignment (`STUDENT_PARENT` and `STUDENT_CHILD`).
- Manages dual-token JWT access sessions paired with persisted refresh token records.
- Provides authorization dependencies enforcing access boundaries across the four system roles: `ADMIN`, `INSTRUCTOR`, `STUDENT_PARENT`, `STUDENT_CHILD`.

---

## 2. Layered Architecture Design

```text
[HTTP Client Request]
          │
          ▼
[1. Controller / Router Layer (auth_router.py)]
    - Validates incoming payload shapes via Pydantic schemas.
    - Applies authentication and RBAC dependency guards.
    - Delegates domain logic to Service Layer and formats HTTP responses.
          │
          ▼
[2. Service Layer (auth_service.py)]
    - Password hashing and verification via asynchronous bcrypt.
    - Issues and decodes JWT access tokens.
    - Manages refresh token lifecycles in user_sessions.
    - Enforces role verification rules.
          │
          ▼
[3. Repository Layer (auth_repository.py / user_repository.py)]
    - Executes database CRUD operations via SQLAlchemy ORM.
    - Directly manages users, roles, and user_sessions tables.
          │
          ▼
[Database: Supabase PostgreSQL]
```

---

## 3. Security Architecture & Authentication Lifecycle

1. **Password Hashing:** Passwords are encrypted using salted `bcrypt` hashes prior to storage in `users.password_hash`.
2. **Dual-Token Session Flow:**
   - **Access Token:** Cryptographically signed JWT containing `sub` (User UUID) and `role` (Role Code). Expiration: **60 minutes**. Transmitted via standard `Authorization: Bearer <token>` HTTP headers.
   - **Refresh Token:** Cryptographically random UUID token persisted in `user_sessions`. Expiration: **30 days**. Used to seamlessly rotate access tokens without user re-authentication.
3. **Route Authorization Guards (`RoleGuard`):**
   - FastAPI dependencies extract and verify bearer tokens from request headers.
   - Asserts caller role against endpoint permission sets. Rejects unauthorized access with `HTTP 403 Forbidden`.

---

## 4. API Endpoint Index

| # | HTTP Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/v1/auth/register` | Public | Register learner account (`STUDENT_PARENT` or `STUDENT_CHILD`) |
| 2 | `POST` | `/api/v1/auth/login` | Public | Authenticate user; returns Access Token and Refresh Token |
| 3 | `POST` | `/api/v1/auth/refresh-token` | Public | Rotates access token using a valid refresh token |
| 4 | `POST` | `/api/v1/auth/logout` | Authenticated | Revokes active session and invalidates refresh token |
| 5 | `GET` | `/api/v1/auth/me` | Authenticated | Returns identity profile of currently authenticated user |
| 6 | `POST` | `/api/v1/admin/users/assign-role` | **ADMIN Only** | Provisions instructor status or modifies user roles |

---

## 5. Detailed Request & Response Specifications

### 5.1. User Registration (`POST /api/v1/auth/register`)

- **Execution Flow:** `auth_router.py` $\rightarrow$ `auth_service.register_user()` $\rightarrow$ `user_repository.create_user()`
- **Request Body (JSON):**

```json
{
  "username": "parent_an",
  "email": "an.nguyen@example.com",
  "password": "SecurePassword123@",
  "full_name": "Nguyen Van An",
  "role_code": "STUDENT_PARENT"
}
```

- **Successful Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "usr_uuid_001",
    "username": "parent_an",
    "email": "an.nguyen@example.com",
    "role": "STUDENT_PARENT"
  }
}
```

- **Error Codes:**
  - `400 Bad Request`: Email or Username already registered; or invalid `role_code` (self-service registration for `ADMIN` or `INSTRUCTOR` is prohibited).

---

### 5.2. User Login (`POST /api/v1/auth/login`)

- **Execution Flow:** `auth_router.py` $\rightarrow$ `auth_service.authenticate_user()` $\rightarrow$ `user_repository.get_by_email_or_username()`, `auth_repository.create_session()`
- **Request Body (JSON):**

```json
{
  "username_or_email": "an.nguyen@example.com",
  "password": "SecurePassword123@"
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "ref_uuid_token_123",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "usr_uuid_001",
      "full_name": "Nguyen Van An",
      "role": "STUDENT_PARENT"
    }
  }
}
```

- **Error Codes:**
  - `401 Unauthorized`: Invalid credentials.
  - `403 Forbidden`: Account is suspended (`status = BANNED`).

---

### 5.3. Rotate Access Token (`POST /api/v1/auth/refresh-token`)

- **Execution Flow:** `auth_router.py` $\rightarrow$ `auth_service.refresh_access_token()` $\rightarrow$ `auth_repository.get_session_by_refresh_token()`
- **Request Body (JSON):**

```json
{
  "refresh_token": "ref_uuid_token_123"
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_new...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

### 5.4. User Logout (`POST /api/v1/auth/logout`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body (JSON):**

```json
{
  "refresh_token": "ref_uuid_token_123"
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5.5. Retrieve Current Profile (`GET /api/v1/auth/me`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "usr_uuid_001",
    "username": "parent_an",
    "email": "an.nguyen@example.com",
    "full_name": "Nguyen Van An",
    "role": "STUDENT_PARENT",
    "status": "ACTIVE"
  }
}
```

---

### 5.6. Modify Role Privileges (`POST /api/v1/admin/users/assign-role`)

- **Authorization:** **ADMIN Only** (`RoleGuard(["ADMIN"])`)
- **Request Body (JSON):**

```json
{
  "target_user_id": "usr_uuid_002",
  "new_role_code": "INSTRUCTOR"
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "User role updated successfully"
}
```
