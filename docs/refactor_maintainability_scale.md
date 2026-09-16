# REFACTOR: MAINTAINABILITY + SCALE (10K → 1M USERS)

> Trạng thái: **đã triển khai xong trong code** (nhánh `dev`, chưa deploy, chưa commit).
> Kèm theo: refactor env-independent build — xem `docs/refactor_env_independent_build.md` (Phase 3 còn gate).

---

## 1. BỐI CẢNH & MỤC TIÊU

Audit 3 chiều (components / frontend-perf / backend-scale) chỉ ra:

- `components/` là bãi đổ: **10/14 component chỉ dùng 1 lần**, trong khi ~160 vị trí JSX
  bị hardcode lặp (10 modal backdrop với 6 recipe style lệch nhau, 38 badge, 13 spinner,
  14 skeleton, 5 stat tile copy-paste, 17 form row, 12 nút CTA giống hệt nhau).
- Frontend chặn hiệu năng: font load 2 lần không ai dùng, `jspdf`/`gsap` nằm bundle đầu,
  forum list unbounded, trang chat game re-render toàn trang theo từng keystroke/token SSE.
- Backend không scale: gần mọi list endpoint `.all()` không giới hạn, 8 index thiếu,
  N+1 ở forum/home/dashboard/learn, bcrypt trên event loop, SSE thiếu heartbeat,
  score update non-atomic.

Mục tiêu: tách UI primitive dùng chung, sắp xếp component theo feature, tối ưu bundle +
render frontend, và chuẩn bị backend cho 10k–1M users — **giữ nguyên hành vi người dùng**.

---

## 2. FRONTEND — TỔ CHỨC LẠI COMPONENT

### 2.1. UI primitives mới: `frontend/src/components/ui/`

11 primitive + barrel `index.ts`, hand-rolled (không thêm dependency), "use client":

| Primitive | Hấp thụ | Ghi chú |
|---|---|---|
| `Modal` | 10 backdrop + 6 nút X viết tay | open/onClose/size/dismissible, panelClassName/backdropClassName ghi đè; **không dùng portal** (giữ CSS cascade như cũ); Esc + click backdrop + body scroll-lock. Phát hiện: class `animate-fade-in`/`animate-scale-up` cũ là **class chết** (không có định nghĩa trong repo) — Modal dùng keyframe riêng |
| `Badge` | ~38 pill/badge | base `rounded-full px-2.5 py-0.5 text-[10px] font-bold`; màu truyền qua `tone`/`className` (giữ nguyên bảng màu từng trang); `size="xs"`, `uppercase`, `solid`, `dot`, `icon` |
| `Spinner` | 13 spinner tay, 3 recipe mâu thuẫn | size sm/md/lg (w-4/8/12), tone primary/white/muted, `role="status"` |
| `EmptyState` | 8 block lỗi/empty | tone error (tile đỏ) / neutral (duotone); action = Button hoặc Link; `glass` |
| `SkeletonBlock` + `SkeletonText` | ~20 skeleton tay + dead export base `Skeleton` | default `bg-on-surface/10 animate-pulse`; rounded md/full/xl |
| `Button` | 12 CTA pill + 4 nút-submit-kèm-spinner | variant primary/danger/ghost; `loading` render Spinner + disabled; `href` → Link |
| `StatTile` | 5 tile copy-paste dashboard | glass container + icon chip (primary/secondary/tertiary); value undefined → skeleton |
| `Card` | ~19 container trắng | tone solid/glass/subtle; p none/4/5/8 |
| `FormRow` | 17+ label+asterisk+control | tone warn cho field amber; hint |
| `EyebrowLabel` | 15 micro-label uppercase | size 9/10/11px; as span/p/th/label |
| `PageLoader` | 6 màn hình load full-page | Spinner lg + caption nhấp nháy "Đang tải..." |

Nguyên tắc áp dụng: **nơi khớp mới áp** — nút style `rounded-xl`, pill recipe lạ… được
giữ nguyên thay vì ép vào primitive (tránh lệch giao diện).

### 2.2. Component đơn-dụng về đúng feature folder

| Component | Vị trí mới |
|---|---|
| `QuizEditorModal`, `QuizPlayer` | `src/features/quiz/` (feature xuyên cắt: soạn ở dashboard, chơi ở learning) |
| `VideoPlayer`, `CourseGraduationModal` | `src/app/courses/[courseId]/learn/_components/` |
| `Header`, `Footer` | `src/app/(public)/_components/` (app-shell riêng của nhóm (public)) |
| `HeroTypingTitle`, `HeroVisualShowcase`, `ThreeStepJourney`, `FeaturedRoleplaySection` | `src/app/(public)/_home/` (landing-only) |

Giữ lại shared thật sự: `CourseCard` (2 trang), `Skeleton` (6 trang), `illustrations/StepIllustrations`
(3 component), `roleplay/GuideScriptViewer` (2 trang game). Folder tiền tố `_` là private
folder App Router — không tạo route. `components/` giờ chỉ còn shared library.

---

## 3. FRONTEND — HIỆU NĂNG

| Việc | Chi tiết |
|---|---|
| **Font** | Xóa Material Symbols load 2 lần (link blocking + @import) + class chết `.material-symbols-outlined` (0 nơi dùng); bỏ Inter (next/font, `--font-inter` không ai tham chiếu); body font chuyển **Plus Jakarta Sans qua `next/font/google`** (subset latin + vietnamese, tự host, không blocking) — token `--font-sans` = `var(--font-jakarta)`. `globals.css` chỉ còn `@import "tailwindcss"` |
| **Bundle** | `jspdf` + `html-to-image` chuyển dynamic import trong `handleDownloadPdf` (trang chứng chỉ bớt ~350KB first-load); gsap chỉ còn trong `HeroVisualShowcase` và bị bọc `next/dynamic(ssr:false)` → rơi ra chunk trễ; `HeroTypingTitle` viết lại bằng `setTimeout` thuần (~40 dòng, giữ đúng timeline cũ) — **bỏ gsap khỏi typing**; `GuideScriptViewer` (413 dòng + ảnh) dynamic ở cả 2 trang game; `VideoPlayer`/`QuizPlayer`/`CourseGraduationModal` dynamic trên learn; `canvas-confetti` `await import()` ngay trước khi bắn; `QuizEditorModal` dynamic trên dashboard; **gỡ 2 dependency chết: `html2canvas` (0 import), `lucide-react` (port hết 19 icon sang Phosphor — hết thời 2 icon library song song)** |
| **Render** | Trang chat game: tách `MessageList` (React.memo theo messages/streaming/thinking) + `ChatInput` (uncontrolled qua ref — keystroke không re-render trang 925 dòng); key message đổi từ index sang `m.id ?? m.clientId` (UUID); auto-scroll throttle rAF; `gsap.quickTo` + guard `matchMedia("(pointer: fine)")` cho hero tilt (mobile không còn mousemove churn); forum: `ForumPostRow` memo + optimistic like chỉ re-render 1 row, `SearchBox` con giữ state gõ (debounce 350ms), `CommentItem` memo + `flattenReplies` useMemo; users: `UserSearchBox` con tương tự; dashboard: Promise.all 2 fetch tuần tự, 7 effect auto-grow textarea → onInput set height trực tiếp; `AuthContext` value useMemo + callbacks useCallback |
| **Data** | Forum feed: infinite-scroll scaffolding chết được **sống hóa** — `limit=12&offset` + IntersectionObserver thật (rootMargin 400px) + fetchEpoch chống race khi đổi filter; dashboard students phân trang server (pager copy mẫu users đã có sẵn); `runtime-config` warm-start: fetch `/api/app-config` chạy song song hydration thay vì chặn request đầu tiên; `loading="lazy" decoding="async"` cho các `<img>` dưới fold |

Đã khôi phục bởi verifier (bắt được 2 regression của agent game): badge
"NPC nhắn trước / Bạn nhắn trước" + gender trên thẻ tình huống, và màn hình lỗi khi tải
phiên chơi thất bại (dựng lại bằng `EmptyState`).

---

## 4. BACKEND — SCALE (10K → 1M USERS)

### 4.1. Database indexes — `database/apply_indexes.py` (MỚI)

10 index còn thiếu (9 từ audit + `user_sessions(expires_at)` cho cleanup job), style
theo `apply_quizzes.py` (import `settings`, `CREATE INDEX IF NOT EXISTS`, idempotent).
Đã append y hệt vào cuối `database/schema.sql`.

> ⚠️ **BẮT BUỘC chạy 1 lần trước/khi deploy**: `python database/apply_indexes.py`
> (từ repo root, dùng `backend/.env`). Không chạy cũng không chết — chỉ chậm như cũ.

Nghiêm trọng nhất: `forum_comments(post_id, status, created_at)` và
`course_enrollments(course_id, status)` — cả hai bị quét trong vòng lặp per-row hiện nay.

### 4.2. Pagination + hợp đồng API (có compat shim cho bundle cũ đang live)

| Endpoint | Trước | Sau |
|---|---|---|
| `GET /forum/posts` | `.all()` unbounded + N+1 count comment per post | `limit` (default 20, max 50) + `offset`; count comment 1 `GROUP BY`. **Shim**: không truyền limit/offset → trả list cũ y hệt; truyền → `{items, total, limit, offset}` |
| `GET /instructor/.../students` | unbounded + N+1 per student | `page`/`limit` (≤100) mirror admin users: `{students, pagination:{total,page,limit,total_pages}}`; không truyền → list cũ |
| `GET /forum/posts/{id}` comments | unbounded | thêm `limit` optional (mặc định None = như cũ — chưa bật) |

Frontend đã cập nhật khớp: forum (limit=12 + infinite scroll), students (page/limit + pager).
**Nhờ shim, deploy backend trước frontend là an toàn** (chiều ngược lại forum/students sẽ
lệch shape cho đến khi backend lên).

### 4.3. Hết N+1 (response shape giữ nguyên 100%)

- **Home** (`/general/home`): LIMIT ngay trong SQL (6/6/4) thay `.all()` + slice Python;
  comment counts của 4 post = 1 `GROUP BY`.
- **Instructor dashboard**: stats overview 4 COUNT tuần tự → 1 query `FILTER (WHERE …)`;
  courses-with-stats 1 `GROUP BY course_id` thay count per course (cả admin mode);
  students-progress 2 grouped query thay N+1 per student.
- **Learn page**: 2 awaits mỗi lesson → `get_lesson_progress_map` + `get_passed_quiz_ids`
  (2 query cho cả course).
- **Profile** (`/users/my-courses`): completed counts 1 `GROUP BY` cho mọi enrollment.
- **Admin stats**: 1 `GROUP BY (role_code, status)` suy ra total/active/inactive/roles.
- **Quiz**: submissions nạp 1 lần (cap 50 mới nhất) + pass qua `bool_or` aggregate, không
  fetch full-list 4 lần mỗi lượt tương tác.
- **reorder lessons**: 1 ownership check + 1 executemany UPDATE + 1 commit (trước: 2N query, N commit).
- **record_post_view**: bỏ load post graph — 1 `UPDATE … RETURNING`.

### 4.4. Async/SSE/DB bền hơn

- **bcrypt ra khỏi event loop**: `verify_password_async`/`get_password_hash_async` qua
  `asyncio.to_thread` (auth register/login, admin đổi mật khẩu).
- **SSE**: headers `Cache-Control: no-cache`, `X-Accel-Buffering: no`, `Connection: keep-alive`
  (chống proxy buffer/idle-timeout); heartbeat `: ping` mỗi 15s khi chờ event; parse loop
  regex chỉ scan phần buffer mới + yield theo chunk.
- **Score atomic**: `UPDATE … greatest(0, least(100, current_score + :delta)) RETURNING`
  — hết mất điểm khi double-submit; swap ABANDONED cũng 1 UPDATE có WHERE.
- **Background summary tasks**: giữ reference (tránh GC) + `Semaphore(4)` giới hạn đồng
  thời + `logger.exception`.
- **Message cap**: session detail limit 200; prompt eval/summary cap 40–60 tin nhắn gần
  nhất + `recent_summary` (trước: full history, prompt phình vô hạn).
- **Pool**: `pool_size=10, max_overflow=10, pool_timeout=30` (explicit, quan sát được).
- **`user_sessions` cleanup**: task trong lifespan chạy 6h/lần xóa row hết hạn (bảng trước
  đây phình vô hạn); index `expires_at` phục vụ job.

### 4.5. Đã xác minh

- `py_compile` OK trên 24 file backend đã sửa; `python -c "import main"` exit 0.
- `check-frontend.mjs` PASS; `tsc --noEmit` 0 lỗi; ESLint đối chiếu baseline HEAD:
  **không phát sinh lỗi mới, tổng vấn đề giảm 192 → 183**.
- Verifier bắt và sửa: đếm kép `+2` trong `chat_sse_stream`; 2 UI regression trang game (xem mục 3).

---

## 5. DEPLOY AN TOÀN

1. **Chạy `python database/apply_indexes.py`** (Supabase thật) — trước hoặc ngay sau deploy.
2. Thứ tự deploy an toàn: **backend (Render) trước, frontend (Vercel) sau** — compat shim
   đảm bảo bundle cũ vẫn chạy với backend mới. Merge `dev` → `main` deploy cả hai gần như
   đồng thời → rủi ro thực tế gần bằng 0.
3. Nhờ next/font, build frontend cần mạng lần đầu (download font); sau đó cache.
4. Không đổi URL Render / không route SSE qua Vercel Function (bất biến từ đợt trước).

## 6. DEBT GHI NHẬN (cố tình bỏ qua, làm sau)

- `AISession.messages` lazy `selectin` ở model — mọi `get_session_by_id` vẫn kéo toàn bộ
  tin nhắn (debt cũ, cần cân nhắc cascade delete-orphan trước khi đổi).
- Embedding cache LRU cho RAG (tiết kiệm Gemini call) — cần quyết định chi phí/quality.
- Keyset pagination + comment paginate UI; partition `ai_knowledge_vectors` theo category.
- Dashboard page 1627 dòng nên tách `CourseEditForm`/`CreateCourseModal` thành component
  con (state colocation) — lớn, làm đợt sau.
- Thêm token `--color-error` vào `@theme` và chuyển `EmptyState` từ `text-red-600` sang
  `text-error`.
- Edge case hiếm: cooldown quiz giờ đánh giá `has_passed` trên 50 lượt mới nhất.
- Students list giờ sort `User.created_at DESC` (trước: thứ tự không xác định) — hiển thị
  có thể khác thứ tự cũ.
- **Chưa có migration tool (Alembic)** — schema đổi bằng SQL tay: sửa `schema.sql` + script
  one-off `database/apply_*.py` + ALTER tay trên live. Drift thật đã xảy ra 1 lần: bảng
  `forum_post_likes` + 10 cột tồn tại trên live nhưng `schema.sql` thiếu, 5 cột nullable lệch
  models (đã đồng bộ đợt 2026-09 bằng `database/apply_schema_sync.py` — idempotent: backfill
  → guard → `SET NOT NULL`). Chưa adopt ngay vì: 22 bảng, dữ liệu rất nhỏ, 1 env production,
  schema đổi thưa — script idempotent + introspection đủ dùng. Khi nào nên adopt: staging/prod
  tách biệt cần migrate tuần tự; schema đổi thường xuyên (≥1 lần/tuần); dữ liệu lớn khiến
  ALTER tay rủi ro downtime; ≥2 dev đổi schema song song. Các bước khi adopt: (1) `alembic init`
  template async lấy `DATABASE_URL` từ `core.config`; (2) khi live ↔ models đã khớp, sinh
  baseline `--autogenerate`, đối chiếu tay rồi `alembic stamp head` (không chạy baseline vào
  live); (3) quy ước mới: mỗi đổi schema = 1 revision + cập nhật `schema.sql` làm tài liệu
  tham chiếu full-state; (4) cập nhật mục "Database: manual SQL, no Alembic" trong CLAUDE.md.
- **Router phá tầng kiến trúc (task riêng, chưa làm)**: 4 router query DB thẳng — `select(Role)`
  ×18 chỗ (course_router ×13, dashboard ×3, quiz ×2, auth ×1) + gọi repository bỏ qua service
  (course_router ×7 dòng 63-250, quiz_router:78) — vi phạm tầng routers→services→repositories
  mà CLAUDE.md tự đặt. Hướng sửa: đẩy logic xuống service/repository, tái dùng `RoleGuard`;
  churn lớn (~20+ chỗ, cần test API tay) — làm đợt riêng, không trộn với dọn tree.
- Nhỏ: `user_repository.py:6` import schema ngược chiều (repository → schemas, 1 dòng — chấp
  nhận được); Dockerfile còn vết HF Spaces (user 1000, EXPOSE 7860) trong khi deploy Render —
  vô hại, dọn khi chạm tới.
