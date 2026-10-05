# Feature Specification 02: User Profile & Progress Tracking (Frontend UI/UX)

---

## 1. Scope & Technical Objectives

- Deliver an intuitive, personalized **User Profile** page accessible to all authenticated users.
- Provide a dedicated **Learning Progress** tracking workspace for learners:
  - Visual course cards annotated with completion percentage gauges.
  - Granular state filtering (`In Progress` vs. `Completed`).
  - Context-aware navigation triggers: "Continue Learning" (resumes current lesson) or "View Outro & Certificate" (upon 100% completion).

---

## 2. Next.js Routing Architecture

```text
frontend/src/app/
└── (public)/
    └── profile/
        ├── page.tsx                    # Profile root route (/profile)
        └── components/
            ├── ProfileInfoCard.tsx     # Account details view & edit modal
            ├── CourseProgressList.tsx  # Enrolled course gallery & progress gauges
            └── EditProfileModal.tsx    # Modal dialog for profile mutations
```

---

## 3. UI/UX Interface Specifications

### 3.1. Profile Shell Layout (`/profile`)

Divided into two primary sections:

1. **Profile Hero Header:**
   - Large user avatar with click-to-upload action.
   - Full Name and Registered Email.
   - **Demographic Role Badge:**
     - `Parent` (Pastel Blue tone).
     - `Student` (Pastel Green tone).
     - `Instructor` (Pastel Amber tone).
     - `Admin` (Pastel Violet tone).
2. **Tabbed Content Container:**
   - **Tab 1: "My Courses" (Default view for learners)**.
   - **Tab 2: "Account Settings" (Profile management)**.

---

### 3.2. Tab 1: "My Courses" (Curriculum Progress Tracking)

#### A. Status Filter Toggles:
- `All` | `In Progress` (`IN_PROGRESS`) | `Completed` (`COMPLETED`).

#### B. Course Progress Card:
Each enrolled curriculum displays in a structured grid card:
- **Thumbnail Image:** Rounded aesthetic with subtle shadow.
- **Course Title:** Bold, accessible typography.
- **Progress Gauge:**
  - Gradient progress bar indicating completion percentage.
  - Progress label: e.g., `60% completed (6 of 10 lessons completed)`.
- **Status Badge:**
  - Amber badge: `In Progress`.
  - Green badge: `Completed`.
- **Context-Aware Action Button:**
  - If `status = IN_PROGRESS` $\rightarrow$ Primary CTA: **"Continue Learning"** (Navigates directly to `/courses/[id]/learn`).
  - If `status = COMPLETED` $\rightarrow$ Outline CTA: **"View Outro & Certificate"** (Navigates to `/courses/[id]/certificate`).

#### C. Empty State:
- Displays when zero courses are enrolled: includes an illustration with copy *"You have not enrolled in any courses yet"* and a CTA button *"Explore Courses"* linking to the course catalog.

---

### 3.3. Tab 2: "Account Settings" (Profile Form)

Structured profile management form:
- Full Name (`full_name`)
- Username (`username` — read-only)
- Email (`email` — read-only)
- Gender (`Male`, `Female`, `Other`)
- Date of Birth (Calendar date picker)
- Contact Number (`phone_number`)
- Biography (`bio` — multi-line textarea)
- **Primary CTA:** "Save Changes" (Triggers `PUT /api/v1/users/profile` and displays a feedback toast notification).

---

## 4. UI Components & Tokens

| Component | Purpose / Usage |
| :--- | :--- |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Seamless navigation between course progress and profile forms |
| `Avatar`, `AvatarImage`, `AvatarFallback` | Avatar rendering with fallback initials |
| `Progress` / Gauge primitives | Visual indicator of course completion percentages |
| `Badge` | Semantic role codes and enrollment states |
| `Card`, `CardContent` | Elevation containers for course items |
