# Frontend — ChiChan Platform

Next.js 16 (App Router) + Tailwind CSS v4. All routes are client components; see `CLAUDE.md` at the repository root for code conventions.

## Getting Started

```bash
npm install
npm run dev      # Runs on http://localhost:3000 — no .env required for local development
npm run build    # Executes scripts/check-frontend.mjs (env guard) prior to next build
```

## Directory Structure (`src/`)

```
src/
├── proxy.ts                       # Next.js 16 proxy (replaces middleware.ts) — route guards based on cookies
├── app/
│   ├── layout.tsx                 # Root layout: font + ToastProvider + AuthProvider (no chrome)
│   ├── (public)/                  # GROUP — Public pages with Header + Footer
│   │   ├── layout.tsx             #    Mounts Header and Footer
│   │   ├── page.tsx               #    Home page (/)
│   │   ├── _components/           #    Header, Footer (scoped to public group)
│   │   ├── _home/                 #    Landing sections (Hero, ThreeStepJourney, Showcase...)
│   │   ├── about/  profile/  invalid/
│   │   ├── courses/               #    /courses and /courses/[courseId]/intro|certificate
│   │   ├── forum/                 #    /forum and /forum/[postId]
│   │   └── game/                  #    /game and /game/[sessionId] (SSE roleplay chat)
│   ├── (auth)/                    # GROUP — /login and /register (split-screen layout)
│   ├── (dashboard)/dashboard/     # GROUP — /dashboard, /dashboard/students, /dashboard/users (Admin/Instructor sidebar)
│   ├── courses/[courseId]/learn/  # OUTSIDE group — Distraction-free full-screen learning player (no chrome)
│   │   └── _components/           #    VideoPlayer, CourseGraduationModal
│   └── api/app-config/            # Route Handler: Resolves runtime API base URL
├── components/                    # Shared library: ui/ (11 primitives), CourseCard, Skeleton,
│                                  # roleplay/GuideScriptViewer, illustrations/
├── features/quiz/                 # QuizEditorModal + QuizPlayer (cross-cutting: dashboard and learning)
├── context/                       # AuthContext, ToastContext
├── config/                        # branding.ts
└── lib/                           # api.ts, runtime-config.ts
```

### Layout Chrome by Route Group

| Location | Path | Surrounding Chrome |
|---|---|---|
| `(public)/` | `/`, `/about`, `/courses/*`, `/forum/*`, `/game/*`, `/profile` | Global Header + Footer |
| `(auth)/` | `/login`, `/register` | Split-screen illustration layout + form |
| `(dashboard)/` | `/dashboard`, `/dashboard/students`, `/dashboard/users` | Administrative Sidebar (`ADMIN` / `INSTRUCTOR`) |
| Outside group | `/courses/[courseId]/learn` | None — Full-screen learning player |

Parenthesized folder names `(group)` denote **route groups**: they do not appear in the browser URL and exist solely to organize shared layouts. Standard folders (`dashboard/`, `courses/`) represent actual URL segments.

### Build Guard (`scripts/check-frontend.mjs`)

Executed automatically during `npm run build`, this guard enforces three core invariants:
1. Rejects any `NEXT_PUBLIC_*` variable used for backend API URLs in `src/`.
2. Prohibits hardcoded deployment hosts (`onrender.com`) outside the temporary migration allowlist.
3. Asserts the SSE roleplay invariant: the interactive simulation room must resolve endpoints dynamically via `getApiBaseUrl()`.

## API Base URL & Environment Decoupling

The frontend build artifact is completely decoupled from build-time environment variables: a single build can be deployed across Development, Staging/Preview, and Production environments without recompilation.

- **Local Development:** Zero configuration needed. The client defaults to `http://127.0.0.1:8000/api/v1`.
- **Runtime Resolution:** The browser invokes `/api/app-config` once on startup. This server-side Route Handler reads `process.env.API_BASE_URL` at runtime and is cached in-memory and in `localStorage` by `src/lib/runtime-config.ts`.
- **Server Environment Variable:** `API_BASE_URL` (server-side only, **without** `NEXT_PUBLIC_` prefix) configured in Vercel (Production and Preview scopes), e.g., `https://chichan-api.onrender.com/api/v1`.
- **Strict Prohibition of `NEXT_PUBLIC_*`:** Next.js inlines `NEXT_PUBLIC_*` values directly into client and server bundles during `next build`. Once baked in, bundles cannot react to environment changes. The build guard will fail the build immediately if violated.

## Deployment

Refer to the deployment runbooks:
- [Vercel Frontend Deployment Guide](../docs/deployment/vercel.md)
- [Render Backend Deployment Guide](../docs/deployment/render.md)
