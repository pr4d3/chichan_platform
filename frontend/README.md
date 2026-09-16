# Frontend — SexEd Platform

Next.js 16 (App Router) + Tailwind v4. Toàn bộ trang là client component; quy ước chi tiết xem `CLAUDE.md` ở repo root.

## Chạy

```bash
npm install
npm run dev      # http://localhost:3000 — không cần file .env nào
npm run build    # chạy scripts/check-frontend.mjs (env guard) trước khi next build
```

## Cấu trúc `src/`

```
src/
├── proxy.ts                       # Next 16 proxy (thay middleware.ts) — guard route theo cookie
├── app/
│   ├── layout.tsx                 # root: font + ToastProvider + AuthProvider (không chrome)
│   ├── (public)/                  # GROUP — mọi trang public, có Header + Footer
│   │   ├── layout.tsx             #    mount Header/Footer
│   │   ├── page.tsx               #    trang chủ /
│   │   ├── _components/           #    Header, Footer (riêng của group này)
│   │   ├── _home/                 #    4 section landing (hero, journey…)
│   │   ├── about/  profile/  invalid/
│   │   ├── courses/               #    /courses + /courses/[courseId]/intro|certificate
│   │   ├── forum/                 #    /forum + /forum/[postId]
│   │   └── game/                  #    /game + /game/[sessionId] (chat SSE)
│   ├── (auth)/                    # GROUP — /login + /register, split-screen illustration
│   ├── (dashboard)/dashboard/     # GROUP — /dashboard|students|users, sidebar ADMIN/INSTRUCTOR
│   ├── courses/[courseId]/learn/  # NGOÀI group — trang học full-screen, không chrome
│   │   └── _components/           #    VideoPlayer, CourseGraduationModal
│   └── api/app-config/            # Route Handler duy nhất (API base URL lúc runtime)
├── components/                    # shared thật sự: ui/ (11 primitive), CourseCard, Skeleton,
│                                  # roleplay/GuideScriptViewer, illustrations/
├── features/quiz/                 # QuizEditorModal + QuizPlayer (dùng xuyên dashboard ↔ learn)
├── context/                       # AuthContext, ToastContext
├── config/                        # branding.ts
└── lib/                           # api.ts, runtime-config.ts
```

### Chrome theo nhóm

| Vị trí | URL | Giao diện bao quanh |
|---|---|---|
| `(public)/` | `/`, `/about`, `/courses/*`, `/forum/*`, `/game/*`, `/profile` | Header + Footer |
| `(auth)/` | `/login`, `/register` | Split-screen illustration + form |
| `(dashboard)/` | `/dashboard`, `/dashboard/students`, `/dashboard/users` | Sidebar (ADMIN/INSTRUCTOR) |
| Ngoài group | `/courses/[courseId]/learn` | Không — full-screen course player |

Folder có ngoặc `(group)` là **route group: không xuất hiện trên URL**, chỉ dùng để gom các trang
dùng chung layout. Folder thường (`dashboard/`, `courses/`) là URL segment thật. Vì vậy URL
`/courses/*` nằm ở 2 chỗ trên cây: trang có Header/Footer trong `(public)/courses/`, riêng trang
học full-screen nằm ngoài group ở `courses/[courseId]/learn/` — URL vẫn liền mạch.

### Guard lúc build

`scripts/check-frontend.mjs` (tự chạy trong `npm run build`) chặn: dùng `NEXT_PUBLIC_*` cho URL
API, literal `onrender.com` ngoài allowlist, và mất `getApiBaseUrl()` trong trang game SSE.
Chi tiết cơ chế: mục "API Base URL" bên dưới + `docs/refactor_env_independent_build.md`.

## API Base URL / Biến môi trường

Frontend **không phụ thuộc biến môi trường lúc build**: cùng một bản `next build` chạy được ở mọi môi trường.

- **Local dev:** không cần file `.env` nào — backend mặc định là `http://127.0.0.1:8000/api/v1`.
- **Cơ chế:** client gọi `/api/app-config` (Route Handler đọc `process.env.API_BASE_URL` lúc chạy) một lần duy nhất, được cache trong `src/lib/runtime-config.ts`.
- **Biến duy nhất:** `API_BASE_URL` (server-only, **không** tiền tố `NEXT_PUBLIC_`) — set trên Vercel (Production + Preview scope) với giá trị URL Render, ví dụ `https://sex-education-api.onrender.com/api/v1`.
- **⚠️ Không bao giờ tái sử dụng `NEXT_PUBLIC_*` cho URL API:** Next.js nhúng giá trị đó vào bundle lúc build, sau build sẽ không phản ứng với thay đổi env. Script `scripts/check-frontend.mjs` (chạy tự động trong `npm run build`) sẽ fail build nếu vi phạm.

## Deploy

Hướng dẫn từng bước: `docs/deployment/vercel.md` (frontend/Vercel) và `docs/deployment/render.md` (backend/Render).
