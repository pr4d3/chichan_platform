# Feature Specification 05: Forum & Community (Database)

---

## 1. Scope & Technical Objectives

- Provide an open, safe, and moderated community forum for learners, parents, and educators to discuss sensitive sex education and safety topics.
- Enforce strict content moderation invariants: **Only `ADMIN` users hold authority to Hide or Delete posts and comments**.

---

## 2. Business Logic

### 2.1. Participation & Interaction Rules

- Authenticated users across all four roles (`ADMIN`, `INSTRUCTOR`, `STUDENT_PARENT`, `STUDENT_CHILD`) can:
  - Create new discussion threads (`Posts`) categorized by domain topics.
  - Submit comments and replies to peer discussions.
  - View public discussions in `PUBLISHED` status.

### 2.2. Exclusive Administrative Moderation

- **Exclusive Authority:** Only accounts with the `ADMIN` role can update content status to `HIDDEN` or `DELETED`.
- Instructors and students cannot hide or delete third-party content.
- Soft-Delete Discipline: When content is marked `HIDDEN` or `DELETED`:
  - It is instantly filtered from public view.
  - The record is preserved in the database to maintain audit trails and support research analytics into online discourse safety.

---

## 3. Database Schema Design

### 3.1. Table: `forum_categories` (Topic Categorization)

Structures discussion categories (e.g., Reproductive Anatomy, Puberty Psychology, Digital Safety).

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | Unique category identifier |
| `name` | String (Varchar 100) | Unique, Not Null | Category title |
| `slug` | String (Varchar 100) | Unique, Not Null | URL-safe slug |
| `description` | Text | Nullable | Guidelines and thematic description |
| `created_at` | Timestamp | Not Null, Default: Current Time | Creation timestamp |

---

### 3.2. Table: `forum_posts` (Discussion Threads)

Persists community forum threads.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique post identifier |
| `category_id` | Integer | Foreign Key -> `forum_categories(id)`, Not Null | Associated discussion category |
| `author_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null | Post author |
| `title` | String (Varchar 255) | Not Null | Thread title |
| `content` | Text / LongText | Not Null | Thread body |
| `status` | String (Varchar 20) | Not Null, Default: `PUBLISHED` | State: `PUBLISHED`, `HIDDEN`, `DELETED` |
| `moderated_by` | BigInteger / UUID | Foreign Key -> `users(id)`, Nullable | Admin moderating the thread |
| `created_at` | Timestamp | Not Null, Default: Current Time | Creation timestamp |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last update timestamp |

---

### 3.3. Table: `forum_comments` (Thread Replies & Discussions)

Tracks replies and threaded discussions within posts.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique comment identifier |
| `post_id` | BigInteger / UUID | Foreign Key -> `forum_posts(id)`, Not Null, Cascade Delete | Target thread |
| `author_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null | Comment author |
| `parent_comment_id` | BigInteger / UUID | Foreign Key -> `forum_comments(id)`, Nullable | Parent comment for nested reply threads |
| `content` | Text | Not Null | Comment text |
| `status` | String (Varchar 20) | Not Null, Default: `PUBLISHED` | State: `PUBLISHED`, `HIDDEN`, `DELETED` |
| `moderated_by` | BigInteger / UUID | Foreign Key -> `users(id)`, Nullable | Admin moderating the comment |
| `created_at` | Timestamp | Not Null, Default: Current Time | Creation timestamp |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last update timestamp |

---

## 4. Entity Relationships & Invariants

1. **`forum_categories` → `forum_posts` (1 : N):** Categories contain multiple discussion threads.
2. **`users` → `forum_posts` (1 : N):** Users may create multiple forum threads.
3. **`forum_posts` → `forum_comments` (1 : N):** Posts accumulate replies.
4. **`forum_comments` → `forum_comments` (1 : N Self-Reference):** Supports nested conversational responses.
5. **`users(ADMIN)` → `moderated_by`:** Maintains clear audit logging of administrative moderation actions.
