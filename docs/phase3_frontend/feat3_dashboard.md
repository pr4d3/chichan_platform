# Feature Specification 03: Instructor Dashboard (Frontend UI/UX)

---

## 1. Scope & Technical Objectives

- Deliver an analytical workspace for **Educators and Scientific Researchers** holding `INSTRUCTOR` or `ADMIN` roles.
- Present cohort engagement metrics through high-level KPI tiles.
- Support educators in:
  - Authoring and organizing educational curricula.
  - Inspecting cohort rosters and unit-level completion metrics to evaluate sex education interventions.
- **Route Authorization:** Enforced via route guards; non-privileged roles are redirected to their designated landing views.

---

## 2. Next.js Routing Architecture

```text
frontend/src/app/
└── (dashboard)/
    ├── layout.tsx                      # Dashboard Shell (Collapsible Sidebar + Topbar + Content Canvas)
    └── dashboard/
        ├── page.tsx                    # Overview KPIs & Course Authoring (/dashboard)
        ├── students/
        │   └── page.tsx                # Granular Cohort Progress Tracker (/dashboard/students)
        └── users/
            └── page.tsx                # User Management & Role Provisioning (/dashboard/users - ADMIN Only)
```

---

## 3. UI/UX Interface Specifications

### 3.1. Dashboard Shell Layout (`(dashboard)/layout.tsx`)

- **Fixed Sidebar Navigation:**
  - Platform brand identity.
  - Navigation anchors:
    - *Overview* $\rightarrow$ `/dashboard`
    - *Students* $\rightarrow$ `/dashboard/students`
    - *Users* (Admin Only) $\rightarrow$ `/dashboard/users`
    - *Create New Course* (Prominent Action Trigger)
- **Top Bar:**
  - Instructor Profile: Avatar, Name, and Role Badge.
  - Return links: "Switch to Learner View" or "Home".

---

### 3.2. Overview Dashboard (`/dashboard`)

#### A. Metric Cards Grid (4 KPI Tiles):
1. **Total Courses Authored:** Large numerical value, book icon, subtle indigo background.
2. **Total Learner Enrollments:** Large numerical value, cohort icon, subtle emerald background.
3. **Graduated Learners:** Large numerical value, graduation cap icon, subtle amber background.
4. **Mean Completion Rate:** Percentage metric (e.g., `47.9%`), trend chart icon.

#### B. Course Portfolio Table:
Displays authored courses with key columns:
- **Title:** Bold typography with preview link.
- **Target Demographic:** Color-coded badges (`Parent`, `Student`, `Both`).
- **Lesson Count:** Total units (e.g., `10 lessons`).
- **Enrollment Count:** Total students enrolled.
- **Publication Status:** `Published` (Green) or `Draft` (Slate).
- **Actions Menu:**
  - *Inspect Student Roster* (Navigates to `/dashboard/students`).
  - *Edit Curriculum / Manage Lesson Units*.
  - *Delete Course*.

---

### 3.3. Cohort Progress Tracker (`/dashboard/students`)

#### A. Course Filter Selector:
Dropdown select enabling educators to switch between active curricula (defaults to the first course).

#### B. Student Progress Table:
Presents empirical telemetry for scientific research analysis:
- **Learner:** Avatar, Full Name, and Registered Email.
- **Role Code:** Demographic badge (`Parent` vs. `Student`).
- **Enrollment Date:** Initial course start timestamp.
- **Progress Gauge:** Mini progress bar accompanied by percentage and unit counter (e.g., `60% (6/10)`).
- **Graduation Status:**
  - `In Progress` (Amber badge).
  - `Completed` (Green badge with completion timestamp).

---

## 4. UI Components & Tokens

| Component | Purpose / Usage |
| :--- | :--- |
| `Card`, `CardHeader`, `CardTitle`, `CardContent` | KPI metric cards and summary tiles |
| `Table`, `TableHeader`, `TableRow`, `TableCell` | Course portfolio and student roster tables |
| `Badge` | Publication flags and completion states |
| `Progress` / Gauge primitives | Compact progress bars embedded in data rows |
| `Select`, `SelectTrigger`, `SelectContent` | Course filter dropdown |
| `Dialog`, `DialogContent` | Modal dialogs for course creation and syllabus editing |
