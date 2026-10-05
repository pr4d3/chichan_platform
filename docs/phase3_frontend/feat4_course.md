# Feature Specification 04: Course & Content Management (Frontend UI/UX)

---

## 1. Scope & Technical Objectives

- Deliver an engaging, stigma-free sex education e-learning experience adhering to modern LMS standards.
- Realize the standardized 3-step course journey:
  1. **Step 1: Course Intro (`/courses/[id]/intro`)** — Syllabus outline, learning outcomes, and enrollment trigger.
  2. **Step 2: Course Learning (`/courses/[id]/learn`)** — Distraction-free full-screen player (video stream, medical reading, progress-tracked sidebar).
  3. **Step 3: Course Outro (`/courses/[id]/certificate`)** — Graduation celebration, knowledge synthesis, research survey, and verifiable certificate.
- Support demographic segmentation: `Parent` vs. `Adolescent / Child`.

---

## 2. Next.js Routing Architecture

```text
frontend/src/app/
├── (public)/
│   └── courses/
│       ├── page.tsx                        # Public Course Catalog (/courses)
│       └── [courseId]/
│           ├── intro/
│           │   └── page.tsx                # Step 1: Course Intro (/courses/[id]/intro)
│           └── certificate/
│               └── page.tsx                # Step 3: Graduation & Certificate (/courses/[id]/certificate)
└── courses/[courseId]/learn/               # Step 2: Outside route group (No Header/Footer chrome)
    ├── page.tsx                            # Full-screen learning player (/courses/[id]/learn)
    └── _components/
        ├── VideoPlayer.tsx                 # Video player component
        └── CourseGraduationModal.tsx       # Graduation modal
```

---

## 3. UI/UX Interface Specifications (3-Step Flow)

### 3.1. Step 1: Course Intro (`/courses/[id]/intro`)

#### A. Left Column (Course Details):
- **Demographic Badge:** `Parent Curriculum` or `Student Curriculum`.
- **Course Title:** Prominent H1 typography.
- **Detailed Description:** Learning objectives, scientific references, and key takeaways formatted with checkmark lists.
- **Syllabus Accordion:** Interactive syllabus listing lesson units, content types (Video / Text), and estimated durations.
- **Instructor Profile Card:** Author portrait, credentials, and institutional affiliation.

#### B. Right Column (Sticky Enrollment Card):
- Course thumbnail with subtle elevation.
- Aggregate metrics: Total lessons, estimated duration.
- **Primary CTA Trigger:**
  - If not enrolled: **"Start Learning"** (Invokes `POST /enroll` and navigates directly to the learning player).
  - If already enrolled: **"Continue Learning"** (Resumes active lesson in player).

---

### 3.2. Step 2: Course Learning Player (`/courses/[id]/learn`)

*Distraction-free environment omitting global navigation bars to maximize learner focus.*

#### A. Top Bar:
- Return arrow button linking back to course catalog or profile.
- Current course title.
- Overall progress gauge (e.g., `60% completed`).

#### B. Main Instructional Canvas:
- **Video Units:** Responsive 16:9 player with playback rate controls (0.75x, 1x, 1.25x, 1.5x).
- **Text & Visual Units:** Medically verified instructional text with clear typography, anatomical diagrams, and safety tips.
- **Bottom Action Bar:**
  - "Previous Lesson" button.
  - Primary CTA: **"Mark Completed & Continue"** (Invokes `POST .../complete`, marks unit completed, and advances to the next unit).
  - **Graduation Transition:** Completing the final lesson triggers graduation effects and redirects to the Outro page.

#### C. Syllabus Navigation Sidebar:
- Ordered list of all lesson units:
  - Completed: **Green checkmark icon**.
  - Active: **Highlighted primary border**.
  - Incomplete: **Neutral indicator**.
- Clickable units permit instant navigation between syllabus sections.

---

### 3.3. Step 3: Course Outro & Certificate (`/courses/[id]/certificate`)

*Accessible strictly upon achieving 100% completion across all course units.*

#### Interface Elements:
1. **Celebration Banner:** Confetti trigger and congratulatory headline.
2. **Pedagogical Summary:** Core behavioral takeaways reinforcing boundary defense, self-care, and mutual empathy.
3. **Verifiable Certificate:** Interactive certificate display bearing the student's name, completion date, and verification code (`CHICHAN-<hash>`), with direct PDF export capabilities.
4. **Scientific Research Feedback Survey:** Optional questionnaire collecting learner feedback to support the high school scientific study.
5. **Navigation Anchors:** "Return to Profile" or "Explore Other Courses".

---

## 4. UI Components & Tokens

| Component | Purpose / Usage |
| :--- | :--- |
| `Accordion`, `AccordionItem` | Expandable course syllabus outline |
| `Progress` / Gauge primitives | Real-time unit completion percentage |
| `Button` | Next/previous lesson controls and enrollment triggers |
| `Badge` | Demographic badges and completion indicators |
| `Dialog`, `DialogContent` | Graduation popups and quiz submission modals |
