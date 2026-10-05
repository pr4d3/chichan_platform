# Feature Specification 03: Instructor Dashboard (Backend)

---

## 1. Scope & System Overview

- Provides analytical and cohort management APIs for `INSTRUCTOR` and `ADMIN` roles.
- Equips educators and scientific researchers with:
  - High-level KPIs: Total courses under management, cumulative enrollment counts, and cohort completion rates.
  - Course portfolio management.
  - Granular learner progress tracking per course (percentage completion, enrollment timestamps, and graduation dates) to evaluate educational intervention outcomes.

---

## 2. Layered Architecture Design

```text
[HTTP Client Request (Instructor / Admin)]
                    │
                    ▼
[1. Controller / Router Layer (dashboard_router.py)]
    - Extracts current_user_id and role_code from Bearer JWT.
    - Applies RBAC Guard enforcing ["INSTRUCTOR", "ADMIN"] roles.
    - Validates pagination and filter query parameters.
    - Delegates to Service Layer and formats responses.
                    │
                    ▼
[2. Service Layer (dashboard_service.py)]
    - get_instructor_overview_stats(instructor_id, is_admin):
        + Aggregates total courses authored.
        + Aggregates cumulative course enrollments.
        + Computes average completion percentage across courses.
    - get_instructor_courses(instructor_id, is_admin):
        + Returns courses annotated with active and graduated learner counts.
    - get_course_students_progress(instructor_id, course_id, is_admin):
        + Enforces course ownership checks.
        + Returns student roster with individual progress metrics and timestamps.
                    │
                    ▼
[3. Repository Layer (dashboard_repository.py)]
    - Executes optimized SQL queries (FILTER, GROUP BY, aggregations).
    - Queries courses, course_enrollments, lesson_progress, users, and user_profiles.
                    │
                    ▼
[Database: Supabase PostgreSQL]
```

---

## 3. RBAC & Data Isolation Rules

1. **Role-Based Data Scoping:**
   - **`INSTRUCTOR`:** Queries automatically apply `instructor_id = current_user_id`. Instructors cannot inspect courses or cohorts authored by peers.
   - **`ADMIN`:** Global oversight across all instructors, with optional `instructor_id` query parameters for targeted inspection.
2. **Mean Completion Rate Formula:**
   $$\text{Mean Completion Rate (\%)} = \left( \frac{\text{Count}(\text{enrollments with status = 'COMPLETED'})}{\text{Count}(\text{total enrollments})} \right) \times 100$$

---

## 4. API Endpoint Index

| # | HTTP Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/instructor/dashboard/overview` | `INSTRUCTOR`, `ADMIN` | High-level cohort KPIs and summary statistics |
| 2 | `GET` | `/api/v1/instructor/dashboard/courses` | `INSTRUCTOR`, `ADMIN` | List instructor's authored courses and enrollment metrics |
| 3 | `GET` | `/api/v1/instructor/dashboard/courses/{course_id}/students` | `INSTRUCTOR`, `ADMIN` | Detailed learner roster and individual progress metrics |

---

## 5. Detailed Request & Response Specifications

### 5.1. Overview KPIs (`GET /api/v1/instructor/dashboard/overview`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total_courses": 5,
    "total_students_enrolled": 142,
    "total_completed_students": 68,
    "average_completion_rate": 47.88,
    "total_lessons_published": 38
  }
}
```

---

### 5.2. List Instructor Courses (`GET /api/v1/instructor/dashboard/courses`)

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
      "target_audience": "BOTH",
      "is_published": true,
      "total_lessons": 8,
      "active_students": 74,
      "completed_students": 68
    }
  ]
}
```

---

### 5.3. Course Student Roster & Progress (`GET /api/v1/instructor/dashboard/courses/{course_id}/students`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Query Parameters:** `page` (default: 1), `limit` (default: 20, max: 100)
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "students": [
      {
        "user_id": "usr_uuid_001",
        "full_name": "Nguyen Van An",
        "email": "an.nguyen@example.com",
        "avatar_url": "https://storage.example.com/avatar.png",
        "progress_percentage": 100.0,
        "status": "COMPLETED",
        "enrolled_at": "2026-09-01T08:00:00Z",
        "completed_at": "2026-09-10T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 142,
      "page": 1,
      "limit": 20,
      "total_pages": 8
    }
  }
}
```
