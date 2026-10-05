# Project Overview: ChiChan Platform

*(Scientific Research Initiative on Digital Sex Education & Self-Defense — Giong Ong To High School)*

---

## 1. Project Vision

- **Project Name:** ChiChan Platform (Online Sex Education & Digital Safety Platform).
- **Mission:** Build a standardized, accessible, and scientifically grounded e-learning platform to popularize sex education and digital safety for Vietnamese youth while eliminating communication barriers and stigma.
- **Target Beneficiaries:**
  - **Children & Adolescents (`STUDENT_CHILD`):** Access intuitive, age-appropriate reproductive health and puberty education; develop proactive self-defense instincts through real-time interactive simulation rooms.
  - **Parents (`STUDENT_PARENT`):** Equip parents with empathetic communication methods, active listening skills, and guidance strategies to comfortably converse with their children about sensitive developmental topics.
- **Flagship Innovation:** **Interactive AI Roleplay Simulation Hub** leveraging Dynamic Context Windows, Structured Outputs, and pgvector RAG to train real-world behavioral reflexes across calibrated scenarios.

---

## 2. System Architecture

```text
                                  [USER / CLIENT BROWSER]
                                             │
                                             ▼
                   ┌──────────────────────────────────────────────────┐
                   │          FRONTEND CLIENT (Vercel Cloud)          │
                   │          Next.js 16 (App Router) + Tailwind v4   │
                   │  - Landing page & research background            │
                   │  - 3-step course flow (Intro -> Learn -> Outro)  │
                   │  - Learner profile & Instructor analytics        │
                   │  - Community forum (Moderated & Anonymous)       │
                   │  - AI Roleplay simulator rooms                   │
                   └─────────────┬──────────────────────┬─────────────┘
                                 │                      │
                (REST API / JWT) │                      │ (Real-time SSE Stream)
                                 ▼                      ▼
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│       MAIN WEB BACKEND (Render Cloud)        │  │     AI ROLEPLAY SERVICE (Render Cloud)       │
│        Python FastAPI (Layered Arch)         │  │    Python FastAPI + Dynamic Context Engine   │
│  - Auth & RBAC (4 Distinct Roles)            │  │  - Sliding Window (4-6 turns) + Summary      │
│  - User Profile & Progress Tracking          │  │  - Persona System Prompts                    │
│  - Instructor Dashboard & Analytics          │  │  - JSON Schema Structured Outputs            │
│  - Courses & Lessons Management              │  │  - RAG Retriever (pgvector Cosine Search)    │
│  - Forum Moderation (Admin Screening)        │  │  - Real-time State & Score Tracking          │
└──────────────────────┬───────────────────────┘  └──────────────────────┬───────────────────────┘
                       │                                                 │
                       │ 🔐 SHARED JWT AUTH (SSO)                        │
                       │ (Common Secret Key & Role Claims)               │
                       │                                                 │
                       └──────────────────────┬──────────────────────────┘
                                              │
                                              ▼ (Transaction Pooler: Port 6543)
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           CENTRAL DATABASE CLOUD (Supabase PostgreSQL)                         │
│                                                                                                │
│  [Core Web Tables]                         [AI Roleplay & RAG Tables]                          │
│  - roles, users, user_sessions             - ai_scenarios (Scenario configurations)            │
│  - user_profiles                           - ai_sessions (State & memory summaries)           │
│  - courses, lessons                        - ai_messages (Chat logs, emotion tags, score)      │
│  - course_enrollments, lesson_progress     - ai_knowledge_vectors (pgvector HNSW Index)        │
│  - forum_categories, posts, comments       - ai_game_evaluations (Scientific study metrics)    │
│  - site_settings                                                                               │
└─────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       CLOUD MEDIA STORAGE (Supabase Storage / Cloudinary)                      │
│  - User & Instructor avatars                - Lesson & Scenario thumbnails                     │
│  - Educational lecture videos               - Attached documents & downloadable resources      │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Roles & Permissions (RBAC)

The system implements Role-Based Access Control across four distinct roles:

1. **`ADMIN` (System Administrator):**
   - User account lifecycle management and Instructor privilege provisioning.
   - Global platform configuration and content settings.
   - **Exclusive Moderation:** Holds sole authority to hide (`HIDDEN`) or delete (`DELETED`) inappropriate community forum posts and comments.
2. **`INSTRUCTOR` (Educator / Researcher):**
   - Authoring and organizing courses and lessons; assigning targeted audiences (`PARENT`, `CHILD`, `BOTH`).
   - Monitoring learner completion metrics and cohort engagement data on the instructor dashboard for research analysis.
3. **`STUDENT_PARENT` (Parent Learner):**
   - Enrolling in parent-focused courses and community modules.
   - Practicing parent-child communication in specialized AI roleplay scenarios.
   - Participating in community forum discussions.
4. **`STUDENT_CHILD` (Adolescent Learner):**
   - Accessing age-tailored puberty and reproductive health curricula.
   - Training digital self-defense and anti-grooming skills in AI roleplay scenarios.
   - Engaging in safe, anonymous Q&A on the moderated forum.

---

## 4. Application Sitemap & Core Flows

- **Public Pages:**
  - `Home (/)`: Mission statement, dynamic audience tabs (Parent vs. Child), latest community discussions.
  - `About Us (/about)`: Scientific research methodology, medical advisor disclosures, and author credits.
  - `Authentication (/login, /register)`: Dual-audience registration (Parent or Child), login, password recovery.
- **Course Lifecycle (3-Stage Flow):**
  - `Course Intro (/courses/[id]/intro)`: Curriculum outline, learning objectives, instructor bio, enrollment CTA.
  - `Course Learning (/courses/[id]/learn)`: Focused learning workspace (video player, reading notes, progress checklist).
  - `Course Outro & Graduation (/courses/[id]/outro, /certificate)`: Course completion celebration, certificate generation (`CHICHAN-<hash>`), feedback survey.
- **AI Roleplay Simulation Hub (`/game`):**
  - `Room 1: Stranger Danger & Boundaries`: Recognizing manipulation, refusing secret meetings, protecting privacy.
  - `Room 2: Cyber Extortion & Sextortion`: Resisting blackmail, collecting evidence, engaging adult support.
  - `Room 3: Adolescent Health Consultation`: Medically grounded confidential Q&A with virtual physician.
  - `Room 4: Empathy & Family Dialogue`: Safe practice space for parents opening dialogues with teens.
- **User Dashboard & Community:**
  - `User Profile (/profile)`: Personal settings, enrolled course progress tracking.
  - `Instructor Dashboard (/dashboard)`: Course analytics, enrollment KPIs, student rosters.
  - `Community Forum (/forum, /forum/[postId])`: Threaded peer discussions, anonymous posting option, admin moderation controls.

---

## 5. Technical Architecture & Cloud Infrastructure

### 5.1. Application Stack

- **Backend Architecture:** Strict Layered Architecture (`routers` $\rightarrow$ `services` $\rightarrow$ `repositories` $\rightarrow$ `models`).
- **AI Engine:** Dynamic Context Engine with Server-Sent Events (SSE). Employs sliding-window conversational memory (4–6 turns) plus automated summarization, constrained by structured JSON outputs for deterministic evaluation.
- **Core Frameworks:** FastAPI (Python 3.11+, asynchronous I/O, OpenAPI docs) and Next.js 16 (App Router, Turbopack, Tailwind CSS v4).
- **Authentication:** Stateless JWT bearer tokens with `bcrypt` password hashing, shared uniformly between core APIs and AI services (SSO).
- **Data Persistence:** SQLAlchemy 2.0 async engine with PostgreSQL and `pgvector`.

### 5.2. Cloud Infrastructure

- **Backend Service:** Render (`render.com`), continuous deployment via GitHub triggers (`backend/` root directory).
- **Frontend Hosting:** Vercel (`vercel.com`), global edge delivery with runtime API resolution (`/api/app-config`).
- **Database Engine:** Supabase PostgreSQL with Transaction Pooler (`port 6543`), supporting concurrent connection scaling and sub-15ms vector similarity queries.
- **Static Assets:** Supabase Storage / Cloudinary for course videos, avatars, and scenario art.

---

## 6. Project Roadmap

- **Phase 1 (Completed):** Complete relational database schema design across 22 normalized tables.
- **Phase 2 (Completed):** Production-ready core backend service using FastAPI layered architecture on Render.
- **Phase 3 (Completed):** Modern Next.js 16 App Router frontend with mobile-first responsive design on Vercel.
- **Phase 4 (Completed):** AI Roleplay microservice with real-time SSE streaming, dynamic scoring, and pgvector RAG integration.
