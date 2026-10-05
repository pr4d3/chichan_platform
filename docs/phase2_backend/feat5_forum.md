# Feature Specification 05: Forum & Community (Backend)

---

## 1. Scope & System Overview

- Provides endpoints for an open, safe, and moderated community forum on sex education and digital safety.
- Enables all authenticated roles (`ADMIN`, `INSTRUCTOR`, `STUDENT_PARENT`, `STUDENT_CHILD`) to publish threads and post comments.
- **Exclusive Administrative Moderation:** Enforces strict role isolation — **Only accounts with the `ADMIN` role possess authority to Hide (`HIDDEN`) or Soft-Delete (`DELETED`) inappropriate threads and comments**.

---

## 2. Layered Architecture Design

```text
[HTTP Client Request]
          │
          ▼
[1. Controller / Router Layer (forum_router.py & admin_forum_router.py)]
    - Handles requests for categories, post feeds, thread details, creation, and moderation.
    - Validates inputs via Pydantic schemas.
    - Applies authorization guards:
        + Public: Category and post feed retrieval.
        + Authenticated (All Roles): Thread publication and commenting.
        + RoleGuard(["ADMIN"]): Content status moderation (Hide/Delete).
    - Delegates to Service Layer and formats responses.
          │
          ▼
[2. Service Layer (forum_service.py & moderation_service.py)]
    - get_forum_feed(category_id, search, limit, offset): Retrieves published threads (status = 'PUBLISHED').
    - get_post_detail_with_comments(post_id): Assembles post detail and nested comment tree, omitting hidden/deleted replies.
    - create_post(author_id, post_data): Initializes new thread with default status 'PUBLISHED'.
    - add_comment(author_id, post_id, comment_data): Appends comment or nested reply (parent_comment_id).
    - moderate_post_status(admin_id, post_id, target_status): ADMIN Only — Transitions status to HIDDEN or DELETED with moderated_by audit log.
    - moderate_comment_status(admin_id, comment_id, target_status): ADMIN Only — Moderates comment with audit record.
          │
          ▼
[3. Repository Layer (forum_repository.py & moderation_repository.py)]
    - Queries forum_categories, forum_posts, forum_comments, and users tables via ORM.
          │
          ▼
[Database: Supabase PostgreSQL]
```

---

## 3. Business Logic & Moderation Invariants

1. **Public Content Visibility:**
   - Standard users (`STUDENT_PARENT`, `STUDENT_CHILD`, `INSTRUCTOR`): Queries enforce `WHERE status = 'PUBLISHED'`.
   - `ADMIN`: May query audit logs including `HIDDEN` and `DELETED` records.
2. **Soft-Delete Discipline:**
   - Content moderated by administrators is not deleted from disk. Instead, `status` updates to `HIDDEN` or `DELETED`, recording `moderated_by = admin_id`.
3. **Threaded Comment Structure (Nested Comments):**
   - Top-level comment: `parent_comment_id = null`.
   - Nested reply: `parent_comment_id = parent_comment_id_reference`.

---

## 4. API Endpoint Index

### 4.1. Community Interaction Flow

| # | Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/forum/categories` | Public | List discussion categories |
| 2 | `GET` | `/api/v1/forum/posts` | Public | List discussion threads (supports category filter, search, pagination) |
| 3 | `GET` | `/api/v1/forum/posts/{post_id}` | Public | Retrieve post details and nested comment tree |
| 4 | `POST` | `/api/v1/forum/posts` | Authenticated (All Roles) | Publish a new discussion thread |
| 5 | `POST` | `/api/v1/forum/posts/{post_id}/comments` | Authenticated (All Roles) | Post a comment or nested reply |

### 4.2. Administrative Moderation Flow

| # | Method | Endpoint | Authorization | Description |
| :-: | :--- | :--- | :--- | :--- |
| 6 | `PUT` | `/api/v1/admin/forum/posts/{post_id}/moderate` | **ADMIN Only** | Hide (`HIDDEN`) or Delete (`DELETED`) a thread |
| 7 | `PUT` | `/api/v1/admin/forum/comments/{comment_id}/moderate` | **ADMIN Only** | Hide (`HIDDEN`) or Delete (`DELETED`) a comment |

---

## 5. Detailed Request & Response Specifications

### 5.1. Create Forum Post (`POST /api/v1/forum/posts`)

- **Headers:** `Authorization: Bearer <access_token>`
- **Request Body (JSON):**

```json
{
  "category_id": 1,
  "title": "How to initiate open puberty conversations with adolescents?",
  "content": "My son is 13 years old and experiencing emotional transitions..."
}
```

- **Successful Response (201 Created):**

```json
{
  "success": true,
  "message": "Discussion thread published successfully",
  "data": {
    "post_id": "post_uuid_301",
    "title": "How to initiate open puberty conversations with adolescents?",
    "status": "PUBLISHED",
    "created_at": "2026-09-18T10:00:00Z"
  }
}
```

---

### 5.2. Admin Content Moderation (`PUT /api/v1/admin/forum/posts/{post_id}/moderate`)

- **Authorization:** **ADMIN Only** (`RoleGuard(["ADMIN"])`)
- **Request Body (JSON):**

```json
{
  "status": "HIDDEN"
}
```

- **Successful Response (200 OK):**

```json
{
  "success": true,
  "message": "Post status updated to HIDDEN",
  "data": {
    "post_id": "post_uuid_301",
    "status": "HIDDEN",
    "moderated_by": "admin_uuid_999"
  }
}
```
