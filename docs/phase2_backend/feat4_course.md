# Feature Specification 04: Course & Content Management (Backend)

---

## 1. Scope & System Overview

- Manages the complete lifecycle of educational **Courses** and **Lesson Units**.
- Implements endpoints supporting the standardized 3-step learning flow:
  1. **Course Intro API:** Syllabus outline, objectives, and enrollment initialization.
  2. **Course Learning API:** Navigation sidebar, granular lesson content, and video streams.
  3. **Course Outro API:** Graduation synthesis and certificate eligibility validation.
- Enforces demographic audience targeting (**Target Audience Filtering**): `PARENT`, `CHILD`, `BOTH`.
- Provides CRUD and curriculum authoring endpoints for `INSTRUCTOR` and `ADMIN` roles.

---

## 2. Layered Architecture Design

```text
[HTTP Client Request]
          │
          ▼
[1. Controller / Router Layer (course_router.py & lesson_router.py)]
    - Handles requests for public listings, Intro/Learning/Outro views, and authoring CRUD.
    - Validates payload schemas with Pydantic.
    - Applies authentication and RBAC dependency guards.
    - Delegates to Service Layer and formats responses.
          │
          ▼
[2. Service Layer (course_service.py & lesson_service.py)]
    - get_public_courses(audience_filter): Filters published courses (is_published = true).
    - get_course_intro(course_id, current_user): Returns overview, syllabus, and enrollment status.
    - enroll_course(user_id, course_id): Persists learner enrollment in course_enrollments.
    - get_course_learning_room(user_id, course_id): Validates enrollment and returns lesson progress map.
    - get_course_outro(user_id, course_id): Asserts 100% completion before unlocking outro narrative.
    - create_or_update_course(...): Instructor authoring with ownership checks.
    - manage_lessons(...): Reordering (order_index), creation, and updates.
          │
          ▼
[3. Repository Layer (course_repository.py & lesson_repository.py)]
    - Executes ORM queries across courses, lessons, course_enrollments, and lesson_progress.
          │
          ▼
[Database: Supabase PostgreSQL]
```

---

## 3. Business Logic & RBAC Invariants

1. **Target Audience Filtering:**
   - Learners with `STUDENT_PARENT` role access courses where `target_audience IN ('PARENT', 'BOTH')`.
   - Learners with `STUDENT_CHILD` role access courses where `target_audience IN ('CHILD', 'BOTH')`.
2. **Outro View Protection:**
   - `/api/v1/courses/{course_id}/outro` verifies that `course_enrollments.status == 'COMPLETED'`. Incomplete progress rejects with `HTTP 403 Forbidden` ("You must complete all lessons before accessing course outro").
3. **Instructor Curriculum Ownership:**
   - Instructors can only modify or delete courses and lessons where `instructor_id == current_user_id`. `ADMIN` maintains global authoring privileges.

---

## 4. API Endpoint Index

### 4.1. Learner & Public Flow (3-Step Learning Journey)

| # | Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/courses` | Public | List published courses (supports `target_audience` filtering) |
| 2 | `GET` | `/api/v1/courses/{course_id}/intro` | Public / Authenticated | Retrieve Course Intro metadata and syllabus outline |
| 3 | `POST` | `/api/v1/courses/{course_id}/enroll` | Learners (`PARENT` / `CHILD`) | Enroll in course and initialize progress |
| 4 | `GET` | `/api/v1/courses/{course_id}/learn` | Enrolled Learners | Retrieve learning player data and lesson syllabus |
| 5 | `GET` | `/api/v1/courses/{course_id}/lessons/{lesson_id}` | Enrolled Learners | Retrieve active lesson content (video/text) |
| 6 | `GET` | `/api/v1/courses/{course_id}/outro` | Completed Learners (100%) | Retrieve Outro congratulations and certificate data |

### 4.2. Authoring & Management Flow

| # | Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 7 | `POST` | `/api/v1/courses` | `INSTRUCTOR`, `ADMIN` | Create a new course |
| 8 | `PUT` | `/api/v1/courses/{course_id}` | `INSTRUCTOR`, `ADMIN` | Update course metadata / publish status |
| 9 | `DELETE`| `/api/v1/courses/{course_id}` | `INSTRUCTOR`, `ADMIN` | Delete a course |
| 10 | `POST` | `/api/v1/courses/{course_id}/lessons` | `INSTRUCTOR`, `ADMIN` | Add lesson unit to course |
| 11 | `PUT` | `/api/v1/courses/{course_id}/lessons/{lesson_id}` | `INSTRUCTOR`, `ADMIN` | Update lesson unit content |
| 12 | `DELETE`| `/api/v1/courses/{course_id}/lessons/{lesson_id}` | `INSTRUCTOR`, `ADMIN` | Delete a lesson unit |

---

## 5. Detailed Request & Response Specifications

### 5.1. Course Intro View (`GET /api/v1/courses/{course_id}/intro`)

- **Execution Flow:** `course_router.py` $\rightarrow$ `course_service.get_course_intro()` $\rightarrow$ `course_repository.get_course_detail()`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "course_id": "crs_uuid_101",
    "title": "Comprehensive Adolescent Puberty Education",
    "slug": "puberty-education-adolescents",
    "description": "Foundational curriculum covering biological and psychological puberty transitions...",
    "thumbnail_url": "https://storage.example.com/thumb1.png",
    "target_audience": "CHILD",
    "instructor": {
      "id": "usr_uuid_ins_01",
      "full_name": "Dr. Tran Thi Mai",
      "avatar_url": "https://storage.example.com/avatar_mai.png"
    },
    "total_lessons": 10,
    "is_enrolled": false,
    "syllabus": [
      {
        "id": "lsn_uuid_201",
        "order_index": 1,
        "title": "Lesson 1: Understanding Physical Body Changes",
        "duration_minutes": 15
      },
      {
        "id": "lsn_uuid_202",
        "order_index": 2,
        "title": "Lesson 2: Personal Hygiene and Daily Care",
        "duration_minutes": 20
      }
    ]
  }
}
```

---

### 5.2. Course Outro View (`GET /api/v1/courses/{course_id}/outro`)

- **Execution Flow:** `course_router.py` $\rightarrow$ `course_service.get_course_outro()` $\rightarrow$ Validates 100% progress in `course_enrollments`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "course_id": "crs_uuid_101",
    "title": "Comprehensive Adolescent Puberty Education",
    "completed_at": "2026-09-10T14:30:00Z",
    "certificate_code": "CHICHAN-A9B8C7D6E5F4",
    "outro_content": "Congratulations on completing the curriculum! You now possess essential self-care and boundary defense knowledge.",
    "survey_url": "https://forms.gle/research-feedback"
  }
}
```
