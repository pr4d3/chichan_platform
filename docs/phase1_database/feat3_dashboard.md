# Feature Specification 03: Instructor Dashboard (Database)

---

## 1. Scope & Technical Objectives

- Dedicated workspace for users holding `INSTRUCTOR` (and `ADMIN`) privileges.
- Capabilities for Educators / Researchers:
  - Review status and metadata of authored courses.
  - Track learner cohorts enrolled across courses.
  - Inspect completion rates and progress distributions to support scientific research into digital sex education efficacy.

---

## 2. Business Logic

### 2.1. Access Scope

- **`INSTRUCTOR` (Educator):** Restricted to viewing analytics, course listings, and student cohorts for courses where `instructor_id = current_user_id`.
- **`ADMIN` (Administrator):** Global platform access across all instructors, courses, and cohorts.

### 2.2. Core Performance Indicators (KPIs & Metrics)

1. **Cohort Overview Metrics:**
   - Active courses authored.
   - Total course enrollments.
   - Mean completion rate (`% Completion Rate`).
2. **Course-Level Analytics:**
   - Active learners (`IN_PROGRESS`).
   - Graduated learners (`COMPLETED`).
   - Timestamps for course initialization and graduation.

---

## 3. Database Schema Design

*The Dashboard primarily executes aggregations over `courses`, `course_enrollments`, `lesson_progress`, and `users`. To ensure seamless querying, the following relationships are established:*

### 3.1. Foreign Key Linkage in `courses`

The `courses` table maintains an explicit author reference:
- `instructor_id` (`Foreign Key -> users(id)`): Designates the educator responsible for curriculum maintenance.

### 3.2. Qualitative Observations: `instructor_student_notes` (Optional Research Extension)

To capture qualitative observational data for pedagogical papers:

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | BigInteger / UUID | Primary Key | Unique note identifier |
| `instructor_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null | Educator authoring the observation |
| `student_id` | BigInteger / UUID | Foreign Key -> `users(id)`, Not Null | Target learner |
| `course_id` | BigInteger / UUID | Foreign Key -> `courses(id)`, Not Null | Associated course |
| `note_content` | Text | Not Null | Qualitative evaluation notes |
| `created_at` | Timestamp | Not Null, Default: Current Time | Creation timestamp |

---

## 4. Primary Aggregation Patterns

1. **Instructor Course Portfolio:**
   - Filter `courses` where `instructor_id = current_user_id`.
2. **Student Enrollment Roster:**
   - Join `course_enrollments`, `users`, and `user_profiles` filtered by `course_id`.
3. **Learner Completion Rate:**
   - Dynamic count of completed `lesson_progress` records divided by total course `lessons`.
