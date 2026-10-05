# Feature Specification 06: General Pages & CMS Settings (Backend)

---

## 1. Scope & System Overview

- Provides aggregated payloads for primary public endpoints:
  1. **Home Page API (`/api/v1/general/home`):** Aggregates hero banner copy, audience-specific featured course collections (`Parent` and `Adolescent`), and recent community forum discussions.
  2. **About Us API (`/api/v1/general/about-us`):** Delivers scientific research background, pedagogical methodology, contributor acknowledgments, and institutional disclosures.
- Provides administrative CMS endpoints (`site_settings`) enabling `ADMIN` users to manage content dynamically without redeployment.

---

## 2. Layered Architecture Design

```text
[HTTP Client Request]
          │
          ▼
[1. Controller / Router Layer (general_router.py & settings_router.py)]
    - Public: Home Page and About Us aggregations.
    - RoleGuard(["ADMIN"]): CMS configuration management.
    - Delegates to Service Layer and formats responses.
          │
          ▼
[2. Service Layer (general_service.py & settings_service.py)]
    - get_home_page_data():
        + Retrieves hero banner copy from site_settings.
        + Queries top parent courses (target_audience IN ('PARENT', 'BOTH')).
        + Queries top adolescent courses (target_audience IN ('CHILD', 'BOTH')).
        + Fetches recent active forum threads (status = 'PUBLISHED').
    - get_about_us_data():
        + Assembles scientific methodology, author details, and contact copy.
    - update_site_setting(admin_id, key_name, value_content):
        + ADMIN Only — Updates dynamic copy and configuration records.
          │
          ▼
[3. Repository Layer (settings_repository.py, course_repository.py, forum_repository.py)]
    - Queries site_settings, courses, and forum_posts tables via ORM.
          │
          ▼
[Database: Supabase PostgreSQL]
```

---

## 3. API Endpoint Index

### 3.1. Public Aggregation Endpoints

| # | Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/general/home` | Public | Aggregated payload for the platform landing page |
| 2 | `GET` | `/api/v1/general/about-us` | Public | Scientific research overview, disclosures, and team credits |

### 3.2. Administrative CMS Endpoints

| # | Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 3 | `GET` | `/api/v1/admin/settings` | **ADMIN Only** | List all dynamic CMS configuration entries |
| 4 | `PUT` | `/api/v1/admin/settings/{key_name}` | **ADMIN Only** | Modify a specific dynamic CMS configuration value |

---

## 4. Detailed Request & Response Specifications

### 4.1. Retrieve Home Page Data (`GET /api/v1/general/home`)

- **Execution Flow:** `general_router.py` $\rightarrow$ `general_service.get_home_page_data()`
- **Successful Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "hero_banner": {
      "title": "A Safe, Scientific Digital Sex Education Platform",
      "subtitle": "Guiding Vietnamese youth and parents toward healthy awareness and mutual understanding."
    },
    "parent_courses": [
      {
        "id": "crs_uuid_102",
        "title": "Guiding Adolescents Through Puberty Transitions",
        "thumbnail_url": "https://storage.example.com/thumb_parent.png",
        "instructor_name": "Dr. Tran Thi Mai",
        "total_lessons": 8
      }
    ],
    "child_courses": [
      {
        "id": "crs_uuid_101",
        "title": "Comprehensive Adolescent Puberty Education",
        "thumbnail_url": "https://storage.example.com/thumb_child.png",
        "instructor_name": "Dr. Tran Thi Mai",
        "total_lessons": 10
      }
    ],
    "recent_forum_posts": [
      {
        "id": "post_uuid_301",
        "title": "How to initiate open puberty conversations with adolescents?",
        "category_name": "Adolescent Psychology",
        "author_name": "Nguyen Van An",
        "comment_count": 12,
        "created_at": "2026-09-18T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.2. Update Site Setting (`PUT /api/v1/admin/settings/{key_name}`)

- **Authorization:** **ADMIN Only** (`RoleGuard(["ADMIN"])`)
- **Request Body (JSON):**

```json
{
  "value_content": "contact.chichan@example.edu.vn"
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "Setting updated successfully"
}
```
