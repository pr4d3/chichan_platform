# Feature Specification 04: Course & Content Management (Database)

---

## 1. Scope & Technical Objectives

- Model educational structures from coarse to granular: **Course** $\rightarrow$ **Lesson Units**.
- Support the standardized 3-step learning journey: **Intro $\rightarrow$ Learning Player $\rightarrow$ Outro**.
- Enforce audience targeting: `PARENT`, `CHILD`, or `BOTH`.

---

## 2. Business Logic

### 2.1. Target Audience Segmentation

When creating or modifying courses, instructors specify a targeted audience (`target_audience`):
1. `PARENT`: Exclusively accessible to `STUDENT_PARENT` accounts.
2. `CHILD`: Exclusively accessible to `STUDENT_CHILD` accounts.
3. `BOTH`: Universal curriculum open to all learners.

*(Privileged `ADMIN` and `INSTRUCTOR` roles maintain unrestricted access across all curricula for verification and review).*

### 2.2. Three-Step Course Experience Flow

1. **Course Intro Page (`/courses/[courseId]/intro`):**
   - High-level overview: Title, banner image, syllabus outline, targeted audience, author biography.
   - Primary Action: "Start Learning" (Creates a record in `course_enrollments` if not already enrolled, then navigates to the learning player).
2. **Learning Player (`/courses/[courseId]/learn`):**
   - Distraction-free environment: Sidebar syllabus outline and active lesson view (video lecture, rich text, diagrams).
   - Primary Action: "Mark Lesson Completed" (Updates `lesson_progress`).
   - Auto-advance: Seamless transition to subsequent lesson units upon completion.
3. **Course Outro Page (`/courses/[courseId]/certificate`):**
   - Unlock Threshold: Accessible strictly upon achieving 100% completion across all course lesson units.
   - Contents: Congratulations banner, core knowledge synthesis, scientific study feedback survey, and downloadable certificate.

---

## 3. Database Schema Design

### 3.1. Table: `courses` (Course Metadata & Syllabus)

Persists high-level curriculum details and Intro/Outro copy.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique course identifier |
| `instructor_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null | Authoring instructor |
| `title` | String (Varchar 255) | Not Null | Course title |
| `slug` | String (Varchar 255) | Unique, Not Null | URL-safe slug (e.g. `puberty-health-and-safety`) |
| `short_description` | String (Varchar 500) | Nullable | Preview card summary |
| `description` | Text | Nullable | Comprehensive course overview (Intro view) |
| `thumbnail_url` | String (Varchar 500) | Nullable | Course card banner URI |
| `target_audience` | String (Varchar 20) | Not Null, Default: `BOTH` | Segmentation: `PARENT`, `CHILD`, `BOTH` |
| `outro_content` | Text | Nullable | Graduation synthesis message (Outro view) |
| `is_published` | Boolean | Not Null, Default: `false` | Publication visibility state |
| `created_at` | Timestamp | Not Null, Default: Current Time | Creation timestamp |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last update timestamp |

---

### 3.2. Table: `lessons` (Detailed Lesson Units)

Stores instructional units delivered within the learning player.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique lesson identifier |
| `course_id` | BigInteger / UUID | Foreign Key -> `courses(id)`, Not Null, Cascade Delete | Parent course |
| `title` | String (Varchar 255) | Not Null | Lesson title |
| `content_type` | String (Varchar 20) | Not Null, Default: `HYBRID` | Media format: `VIDEO`, `TEXT`, `HYBRID` |
| `video_url` | String (Varchar 500) | Nullable | Video lecture URI |
| `content_body` | Text / LongText | Nullable | Lesson text, diagrams, and educational explanations |
| `order_index` | Integer | Not Null, Default: 1 | Lesson sequence order within syllabus |
| `duration_minutes` | Integer | Nullable | Estimated completion time in minutes |
| `created_at` | Timestamp | Not Null, Default: Current Time | Creation timestamp |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last update timestamp |

---

## 4. Entity Relationships & Invariants

1. **`users` (Instructor) → `courses` (1 : N):** An instructor can author multiple distinct courses.
2. **`courses` → `lessons` (1 : N):** A course comprises ordered lesson units. Deleting a course cascades to delete all associated lesson records.
3. **`lessons` → `lesson_progress` (1 : N):** Each lesson accumulates completion records from multiple student accounts.
