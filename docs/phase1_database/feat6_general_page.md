# Feature Specification 06: General Pages & CMS Settings (Database)

---

## 1. Scope & Technical Objectives

- **Home Page (`/`):** Primary portal introducing the digital sex education initiative, providing audience tabs (`Parent` vs. `Adolescent`), and showcasing featured courses and community discussions.
- **About Us (`/about`):** Details the scientific research methodology, medical advisor disclosures, author acknowledgments, and feedback channels.
- **Site Settings CMS:** Manages platform configuration and static copy dynamically without requiring code modifications.

---

## 2. Business Logic

### 2.1. Home Page Content Aggregation

- **Hero Banner:** Core mission statement with primary Call-to-Action ("Explore Courses" / "Sign Up").
- **Audience Curricula Tabs:**
  - Tab 1: *Parent Curricula* (`courses` filtered by `target_audience IN ('PARENT', 'BOTH')` and `is_published = true`).
  - Tab 2: *Adolescent Curricula* (`courses` filtered by `target_audience IN ('CHILD', 'BOTH')` and `is_published = true`).
- **Community Highlights:** Displays the latest active threads from `forum_posts`.

### 2.2. About Us Methodology

- Details the scientific research project origin at Giong Ong To High School.
- Outlines pedagogical methodology and medical consultation standards.
- Author, advisor, and scientific contributor credits.

---

## 3. Database Schema Design

### 3.1. Table: `site_settings` (Key-Value CMS Configuration)

Stores dynamic textual copy and administrative settings.

| Field Name | Data Type | Constraints | Description / Usage |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto Increment | Unique setting identifier |
| `key_name` | String (Varchar 100) | Unique, Not Null | Configuration key (e.g., `about_us_research_purpose`, `home_hero_title`, `contact_email`) |
| `value_content` | Text / LongText | Not Null | Configuration payload (plain text or markdown) |
| `description` | String (Varchar 255) | Nullable | Admin description of setting purpose |
| `updated_at` | Timestamp | Not Null, Default: Current Time | Last update timestamp |

---

## 4. Phase 1 Core Database Schema Summary

The relational database architecture encompasses 12 core tables:

1. `roles`: Role definitions and RBAC codes.
2. `users`: Identity accounts and cryptographic credentials.
3. `user_sessions`: Active session tokens and client metadata.
4. `user_profiles`: Extended learner profiles.
5. `courses`: Course curricula and Intro/Outro narratives.
6. `lessons`: Granular instructional units.
7. `course_enrollments`: Course enrollment status.
8. `lesson_progress`: Unit-level completion telemetry.
9. `forum_categories`: Community discussion taxonomy.
10. `forum_posts`: Discussion threads.
11. `forum_comments`: Threaded comments and replies.
12. `site_settings`: Dynamic CMS configurations.
