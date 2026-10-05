# Feature Specification 02: User Profile & Progress Tracking (Backend)

---

## 1. Scope & System Overview

- Provides endpoints for managing personal profile information (`user_profiles`).
- Manages and monitors course learning progress for learners (`STUDENT_PARENT` and `STUDENT_CHILD`):
  - Returns enrolled course lists annotated with completion percentages.
  - Records lesson completion status in `lesson_progress`.
  - Automatically updates course enrollment status to `COMPLETED` when 100% of course lesson units are finished.

---

## 2. Layered Architecture Design

```text
[HTTP Client Request]
          │
          ▼
[1. Controller / Router Layer (user_router.py)]
    - Handles requests to read/modify profile, query course progress, and mark lessons complete.
    - Extracts authenticated user identity from JWT via auth middleware.
    - Validates payloads with Pydantic schemas.
    - Delegates to Service Layer and formats responses.
          │
          ▼
[2. Service Layer (user_service.py & progress_service.py)]
    - get_profile(user_id): Combines records from users and user_profiles.
    - update_profile(user_id, data): Validates and persists profile updates.
    - get_user_progress_list(user_id): Computes progress percentage per enrolled course.
    - mark_lesson_as_completed(user_id, course_id, lesson_id):
        + Records lesson completion in lesson_progress.
        + Computes: (Completed Lessons / Total Lessons) * 100.
        + If 100%, transitions course_enrollments.status to 'COMPLETED' with completed_at timestamp.
          │
          ▼
[3. Repository Layer (user_repository.py & progress_repository.py)]
    - Executes ORM queries across users, user_profiles, course_enrollments, lesson_progress, and lessons.
          │
          ▼
[Database: Supabase PostgreSQL]
```

---

## 3. Business Logic & Progress Calculation

1. **Automatic Profile Initialization:** Upon user registration, a linked empty record is initialized in `user_profiles`.
2. **Progress Calculation Formula:**
   $$\text{Progress (\%)} = \left( \frac{\text{Count}(\text{completed lessons in course})}{\text{Count}(\text{total lessons in course})} \right) \times 100$$
3. **Course Completion Signal:** When the final lesson in a course is completed, the API response includes `is_course_just_completed: true` to prompt the frontend to navigate to the Course Outro / Certificate view.

---

## 4. API Endpoint Index

| # | HTTP Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/users/profile` | Authenticated | Retrieve current user's profile |
| 2 | `PUT` | `/api/v1/users/profile` | Authenticated | Update current user's profile metadata |
| 3 | `GET` | `/api/v1/users/my-courses` | Learners (`PARENT` / `CHILD`) | List enrolled courses and completion metrics |
| 4 | `POST` | `/api/v1/users/courses/{course_id}/lessons/{lesson_id}/complete` | Learners (`PARENT` / `CHILD`) | Record lesson completion & recompute progress |

---

## 5. Detailed Request & Response Specifications

### 5.1. Retrieve Profile (`GET /api/v1/users/profile`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user_id": "usr_uuid_001",
    "username": "parent_an",
    "email": "an.nguyen@example.com",
    "full_name": "Nguyen Van An",
    "role": "STUDENT_PARENT",
    "avatar_url": "https://supabase-storage-url/avatar.png",
    "gender": "MALE",
    "date_of_birth": "1988-05-20",
    "phone_number": "0901234567",
    "bio": "Parent interested in supporting my adolescent children through puberty."
  }
}
```

---

### 5.2. Update Profile (`PUT /api/v1/users/profile`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body (JSON):**

```json
{
  "full_name": "Nguyen Van An",
  "avatar_url": "https://supabase-storage-url/new-avatar.png",
  "gender": "MALE",
  "date_of_birth": "1988-05-20",
  "phone_number": "0901234567",
  "bio": "Updated biography."
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user_id": "usr_uuid_001",
    "full_name": "Nguyen Van An",
    "avatar_url": "https://supabase-storage-url/new-avatar.png"
  }
}
```

---

### 5.3. List Enrolled Courses (`GET /api/v1/users/my-courses`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "course_id": "crs_uuid_101",
      "title": "Puberty Health & Emotional Wellbeing",
      "slug": "puberty-health-wellbeing",
      "thumbnail_url": "https://storage.example.com/thumb.jpg",
      "status": "IN_PROGRESS",
      "total_lessons": 5,
      "completed_lessons": 3,
      "progress_percentage": 60.0,
      "enrolled_at": "2026-09-15T08:00:00Z",
      "completed_at": null
    }
  ]
}
```

---

### 5.4. Mark Lesson Completed (`POST /api/v1/users/courses/{course_id}/lessons/{lesson_id}/complete`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "Lesson marked as completed",
  "data": {
    "course_id": "crs_uuid_101",
    "lesson_id": "lsn_uuid_205",
    "is_completed": true,
    "current_progress_percentage": 100.0,
    "course_status": "COMPLETED",
    "is_course_just_completed": true
  }
}
```
