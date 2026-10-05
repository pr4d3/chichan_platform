# Architectural Refactor: Maintainability & Scale (10K → 1M Users)

> Status: **Implemented in codebase** (`dev` branch).  
> Companion refactor: Environment-independent builds — see `docs/refactor_env_independent_build.md`.

---

## 1. Context & Objectives

A comprehensive three-dimensional audit (Component Architecture, Frontend Performance, Backend Scalability) identified critical bottlenecks across the platform:

- **Component Proliferation:** 10 of 14 components in `components/` were single-use, while ~160 JSX instances were duplicated across pages (10 modal backdrops with inconsistent styling, 38 badge pills, 13 loading spinners, 14 skeletons, 5 duplicated stat tiles, 17 form rows, and 12 identical call-to-action buttons).
- **Frontend Performance Bottlenecks:** Dual-loaded external web fonts, heavy libraries (`jspdf`, `gsap`) bundled in the critical rendering path, unbounded forum listings, and full-page re-renders triggered on every SSE chat token in the AI simulation room.
- **Backend Scalability Inefficiencies:** Unbounded `.all()` queries across listing endpoints, 8 missing relational indexes, N+1 query patterns across forum, landing, dashboard, and learning flows, synchronous bcrypt execution blocking the asyncio event loop, missing SSE connection heartbeats, and non-atomic score updates.

### Target Objective
Standardize reusable UI primitives, relocate feature-scoped components to feature modules, optimize bundle weight and rendering efficiency, and prepare backend endpoints to handle 10,000 to 1,000,000 users without altering user-facing functionality.

---

## 2. Frontend — Component Reorganization

### 2.1. Standardized UI Primitives: `frontend/src/components/ui/`

Introduced 11 custom-crafted primitives with a clean barrel export (`index.ts`), avoiding bloated third-party component suites:

| Primitive | Absorbed Patterns | Technical Details |
|---|---|---|
| `Modal` | 10 custom backdrops + 6 close buttons | Configurable `size`, `dismissible`, `panelClassName`, and `backdropClassName`; avoids portal rendering to preserve CSS cascades; handles Escape key, backdrop clicks, and document body scroll-locking. |
| `Badge` | ~38 pill badges | Standardizes base styling (`rounded-full px-2.5 py-0.5 text-[10px] font-bold`); supports `tone`, `size="xs"`, `uppercase`, `solid`, `dot`, and `icon`. |
| `Spinner` | 13 loading spinners | Sizes `sm`, `md`, `lg` (`w-4/8/12`), tones `primary`, `white`, `muted`, and accessible `role="status"`. |
| `EmptyState` | 8 custom empty/error blocks | Tones `error` and `neutral`; accepts primary action as `Button` or `Link`. |
| `SkeletonBlock` + `SkeletonText` | ~20 manual skeleton blocks | Built with `bg-on-surface/10 animate-pulse` and standardized border radii. |
| `Button` | 12 CTA pills + 4 submitting buttons | Variants `primary`, `danger`, `ghost`; native `loading` state rendering embedded spinner; polymorphic `href` support. |
| `StatTile` | 5 duplicated dashboard stat cards | Glass container styling with configurable semantic icon chips; gracefully handles loading skeletons when value is undefined. |
| `Card` | ~19 white container cards | Tones `solid`, `glass`, `subtle`; standard padding variants (`none`, `4`, `5`, `8`). |
| `FormRow` | 17+ label and control pairs | Built-in required asterisk markers, validation hints, and warning tones. |
| `EyebrowLabel` | 15 uppercase micro-labels | Typography helper for 9px, 10px, 11px microcopy across tables and section headers. |
| `PageLoader` | 6 full-page loading screens | Large animated spinner with accessible pulse caption. |

### 2.2. Feature-Scoped Component Relocation

Single-use components were migrated out of the global `components/` directory into their respective feature directories:

| Component | Target Location | Rationale |
|---|---|---|
| `QuizEditorModal`, `QuizPlayer` | `src/features/quiz/` | Cross-cutting quiz domain used across Instructor Dashboard and Learning Flow. |
| `VideoPlayer`, `CourseGraduationModal` | `src/app/courses/[courseId]/learn/_components/` | Strictly scoped to the distraction-free learning player. |
| `Header`, `Footer` | `src/app/(public)/_components/` | Scoped to the public route group layout shell. |
| `HeroTypingTitle`, `HeroVisualShowcase`, `ThreeStepJourney`, `FeaturedRoleplaySection` | `src/app/(public)/_home/` | Specific to the landing page experience. |

True shared components remain in `components/`: `CourseCard`, `Skeleton`, `illustrations/`, and `roleplay/GuideScriptViewer`.

---

## 3. Frontend — Performance & Rendering Optimizations

| Area | Implementation Highlights |
|---|---|
| **Typography & Fonts** | Removed duplicate Material Symbols imports and unused CSS classes. Migrated body typography to **Plus Jakarta Sans** via `next/font/google` (pre-hosted Latin + Vietnamese subsets, zero render-blocking layout shifts). |
| **Bundle Splitting** | Dynamic asynchronous loading for `jspdf` and `html-to-image` in `handleDownloadPdf` (reduces initial certificate bundle by ~350 KB). Isolated GSAP to `HeroVisualShowcase` with `next/dynamic(ssr: false)`. Replaced GSAP typing in `HeroTypingTitle` with lightweight pure JavaScript timing (~40 lines). Converted `GuideScriptViewer`, `VideoPlayer`, `QuizPlayer`, and `CourseGraduationModal` to dynamic chunks. Removed unused dependencies (`html2canvas`) and consolidated icons onto Phosphor. |
| **Rendering Efficiency** | In the AI roleplay room, decoupled `MessageList` (memoized via `React.memo` across streaming chunks) from `ChatInput` (uncontrolled ref-based input), eliminating 900+ lines of page re-renders per keystroke. Standardized message keys to persistent UUIDs (`m.id ?? m.clientId`). Implemented requestAnimationFrame throttled auto-scrolling. In the forum, memoized `ForumPostRow` and debounced search filters (350ms). Memoized `AuthContext` value and callbacks. |
| **Data Fetching** | Replaced mock forum pagination with active infinite scrolling using `IntersectionObserver` (`limit=12&offset`) with `fetchEpoch` concurrency protections. Implemented server-side pagination for instructor student tables. Enabled concurrent runtime configuration pre-fetching. Added `loading="lazy"` and `decoding="async"` to all below-the-fold media elements. |

---

## 4. Backend — Scalability & Invariant Protections

### 4.1. Relational Database Indexes (`database/apply_indexes.py`)

Added 10 missing indexes to eliminate full-table scans across high-frequency operations:
- `forum_comments(post_id, status, created_at)`: Eliminates per-post comment lookup table scans.
- `course_enrollments(course_id, status)`: Resolves full scans during instructor cohort progress audits.
- `user_sessions(expires_at)`: Optimizes scheduled expired-session garbage collection.
- Additional composite indexes targeting `courses`, `lessons`, and `ai_messages`.

### 4.2. Pagination with Backward-Compatibility Shims

| Endpoint | Previous Behavior | Scaled Implementation |
|---|---|---|
| `GET /forum/posts` | Unbounded `.all()` query + N+1 comment count | Paginated via `limit` (default 20, max 50) and `offset`. Comment counts aggregated in a single `GROUP BY`. **Shim:** Requests without pagination parameters preserve original list shape. |
| `GET /instructor/.../students` | Unbounded query + N+1 per student | Paginated with `{students, pagination: {total, page, limit, total_pages}}`. |
| `GET /forum/posts/{id}` (Comments) | Unbounded | Added optional `limit` parameter for future cursor-based streaming. |

### 4.3. N+1 Query Elimination

- **Landing Page (`/general/home`):** Enforces SQL-level limits (`LIMIT 6/6/4`) instead of querying all records and slicing in Python. Forum comment counts resolved in a single `GROUP BY`.
- **Instructor Dashboard:** Replaced 4 sequential `COUNT` queries with a single query utilizing `FILTER (WHERE ...)`. Course statistics use a unified `GROUP BY course_id`. Student progress leverages 2 bulk grouped queries.
- **Learning Player:** Replaced sequential lesson progress queries with bulk maps (`get_lesson_progress_map` and `get_passed_quiz_ids`).
- **Profile (`/users/my-courses`):** Consolidated completed lesson counts into a single `GROUP BY` query.
- **Lesson Reordering:** Replaced 2N sequential update queries with an ownership verification check followed by a single `executemany` bulk `UPDATE`.

### 4.4. Async, SSE, and Concurrency Hardening

- **Offloaded Password Hashing:** Wrapped synchronous `bcrypt` computations inside `asyncio.to_thread` (`verify_password_async`, `get_password_hash_async`) to prevent event-loop blocking during burst registration traffic.
- **Resilient SSE Streaming:** Configured explicit reverse-proxy headers (`Cache-Control: no-cache`, `X-Accel-Buffering: no`, `Connection: keep-alive`). Injected periodic `: ping` heartbeat frames every 15s to keep connections alive across cloud load balancers.
- **Atomic Score Updates:** Replaced read-modify-write patterns with atomic database calculations: `UPDATE ai_sessions SET current_score = greatest(0, least(100, current_score + :delta)) RETURNING current_score`.
- **Background Summary Tasks:** Safeguarded asynchronous memory summarization tasks using a concurrency-limiting `asyncio.Semaphore(4)` with retained task references to avoid premature garbage collection.
- **Context Window Safeguards:** Capped detailed session message history retrieval to 200 items. Dynamic context prompts now bound evaluation history to the most recent 40–60 messages plus `recent_summary`, preventing context window overflow.
- **Expired Session Cleanup:** Registered a recurring background lifespan worker executing every 6 hours to prune expired records from `user_sessions`.

---

## 5. Deployment Verification & Runbook

1. **Apply Relational Indexes:** Execute `python database/apply_indexes.py` against the production Supabase database.
2. **Deployment Sequencing:** Deploy the **Backend (Render) first**, followed by the **Frontend (Vercel)**. The backend compatibility shims ensure zero downtime or payload divergence for active client sessions.
3. **Execution Verification:**
   - `python -c "import main"` exits with code 0.
   - `node scripts/check-frontend.mjs` passes with zero violations.
   - Frontend TypeScript compilation (`tsc --noEmit`) passes with zero errors.
