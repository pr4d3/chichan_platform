# Feature Specification 02: User Profile & Progress Tracking (Database)

---

## 1. Scope & Technical Objectives

- **User Profiles:** Manage auxiliary learner metadata (avatar URI, birth date, gender, bio) decoupled from core authentication records.
- **Progress Tracking:** Persist longitudinal educational journeys for both parent and adolescent learners, tracking enrolled courses, completed lesson units, dynamic percentage completion, and graduation eligibility.

---

## 2. Business Logic

### 2.1. Profile Management

- Each account in `users` maps to exactly one profile record in `user_profiles` (1 : 1).
- Learners may update display name, avatar URL, date of birth, gender, and personal biography.

### 2.2. Course Progress Calculation & Lifecycle

- **Enrollment:** Initializing a course registers a record in `course_enrollments`.
- **Lesson Completion:** Finishing a lesson or quiz appends a completion mark in `lesson_progress`.
- **Progress Formula:**
  $$\text{Progress (\%)} = \left( \frac{\text{Completed Lessons in Course}}{\text{Total Lessons in Course}} \right) \times 100$$
- **Enrollment Lifecycle States:**
  - `IN_PROGRESS`: Course progress is strictly between 1% and 99%.
  - `COMPLETED`: Progress reaches 100%, qualifying the learner for the graduation outro view and certificate issuance.

---

## 3. Database Schema Design

### 3.1. Table: `user_profiles` (Extended Learner Metadata)

Maintains non-authentication profile details.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique profile identifier |
| `user_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Unique, Not Null, Cascade Delete | 1 : 1 link to user identity |
| `avatar_url` | String (Varchar 500) | Nullable | Stored avatar image URI |
| `gender` | String (Varchar 20) | Nullable | Gender identity: `MALE`, `FEMALE`, `OTHER` |
| `date_of_birth` | Date | Nullable | Birth date for demographic personalization |
| `phone_number` | String (Varchar 20) | Nullable | Contact number |
| `bio` | Text | Nullable | Brief learner biography |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last profile update timestamp |

---

### 3.2. Table: `course_enrollments` (Enrollment & Progress Status)

Tracks learner participation in educational courses.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique enrollment identifier |
| `user_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null, Cascade Delete | Enrolled learner |
| `course_id` | BigInteger / UUID | Foreign Key -> `courses(id)`, Not Null, Cascade Delete | Target course |
| `enrolled_at` | Timestamp | Not Null, Default: Current Time | Course start timestamp |
| `completed_at` | Timestamp | Nullable | Graduation timestamp (100% completion) |
| `status` | String (Varchar 20) | Not Null, Default: `IN_PROGRESS` | State: `IN_PROGRESS`, `COMPLETED` |
| **Unique Constraint** | Composite Unique | `UNIQUE(user_id, course_id)` | Prevents duplicate enrollments |

---

### 3.3. Table: `lesson_progress` (Lesson-Level Progress Telemetry)

Detailed record of completed educational units within a course.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique completion record identifier |
| `user_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null, Cascade Delete | Learner identifier |
| `lesson_id` | BigInteger / UUID | Foreign Key -> `lessons(id)`, Not Null, Cascade Delete | Completed lesson unit |
| `is_completed` | Boolean | Not Null, Default: `true` | Completion flag |
| `completed_at` | Timestamp | Not Null, Default: Current Time | Completion timestamp |
| **Unique Constraint** | Composite Unique | `UNIQUE(user_id, lesson_id)` | Prevents duplicate completion records |

---

## 4. Entity Relationships & Invariants

1. **`users` ↔ `user_profiles` (1 : 1):** Every user account maintains a single dedicated profile record.
2. **`users` → `course_enrollments` (1 : N):** A learner may enroll in multiple courses concurrently.
3. **`users` → `lesson_progress` (1 : N):** Individual lesson completions are persisted per user.
