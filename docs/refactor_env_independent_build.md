# KẾ HOẠCH REFACTOR: TÁCH BIẾN MÔI TRƯỜNG KHỎI QUÁ TRÌNH BUILD

> Trạng thái: **Phase 1 + Phase 2 đã triển khai xong trong code** (nhánh `dev`, chưa deploy).
> Phase 3 còn lại có gate bắt buộc trên dashboard Vercel/Render — xem mục 7 & 8.

---

## 1. BỐI CẢNH & MỤC TIÊU

Hệ thống đang chạy live: **backend trên Render, frontend trên Vercel, database trên Supabase**.

Vấn đề: URL của backend bị **nhúng cứng vào bundle client NGAY LÚC `next build`** qua biến
`NEXT_PUBLIC_API_BASE_URL`. Hệ quả:

- Build ở đâu, môi trường đó "đóng băng" vào sản phẩm — máy dev build sẽ nhúng
  `127.0.0.1:8000` (`.env.local` đang trỏ local) → site chết hoàn toàn với người thật.
- Không có biến nào khi build → âm thầm nhúng URL Render production cứng trong code.
- Một bản build không thể dùng chung cho nhiều môi trường (dev / preview / production).
- Sau build, thay đổi env **không có tác dụng** — docs chính thức của Next 16 xác nhận:
  app "will no longer respond to changes to these environment variables".

**Mục tiêu**: *build một lần, chạy ở mọi nơi* — artifact build giống hệt nhau bất kể env;
mọi giá trị cấu hình chỉ được đọc **lúc runtime**; thiếu env phải báo lỗi rõ ràng, không
âm thầm nhúng URL prod.

---

## 2. HIỆN TRẠNG ĐÃ KIỂM KÊ (TRƯỚC REFACTOR)

| # | Vị trí | Cơ chế | Vấn đề |
|---|--------|--------|--------|
| 1 | `frontend/src/lib/api.ts:3` | `NEXT_PUBLIC_API_BASE_URL \|\| NEXT_PUBLIC_API_URL \|\| "https://sex-education-api.onrender.com/api/v1"` | Inline lúc build + fallback prod cứng |
| 2 | `frontend/src/app/(public)/game/[sessionId]/page.tsx:241-245` | Bản sao y hệt chuỗi trên, dùng cho SSE chat | Điểm thứ hai phải đồng bộ |
| 3 | `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` trỏ `127.0.0.1` | Build local = nhúng localhost |
| 4 | `backend/main.py:37` | Literal cứng `https://sex-ed-gray.vercel.app` trong CORS | Đổi domain frontend phải sửa code backend |
| 5 | `backend/services/gemini_service.py` (4 chỗ) | `os.getenv("AI_API_KEY")`, `os.getenv("GEMINI_MODEL", ...)` vượt quyền ngoài `config.py` | Nguồn cấu hình trùng lặp |
| 6 | `backend/core/config.py:6,23` | `load_dotenv()` + `env_file=".env"` theo CWD | Chạy uvicorn từ repo root → âm thầm dùng toàn bộ default (DB localhost, SECRET_KEY mặc định!) |
| 7 | `docs/deployment/render.md` | Hướng dẫn đặt `JWT_SECRET_KEY`/`JWT_ALGORITHM` | **Code đọc `SECRET_KEY`/`ALGORITHM`** → ai làm theo docs sẽ có JWT ký bằng key mặc định (làm giả được) |
| 8 | `database/apply_phase4.py`, `apply_quizzes.py` | Tự parse `.env` bằng tay | Nguồn cấu hình thứ 3, có thể trỏ sang DB khác app |
| 9 | `backend/Dockerfile:22` | Port `7860` cứng trong CMD | Render inject `$PORT` → image không tôn trọng |
| 10 | `docs/deployment/vercel.md` | `NEXT_PUBLIC_SITE_URL` | Biến chết — không có code nào đọc |

Kiểm kê xác nhận toàn bộ `frontend/src` có **đúng 2 điểm** dùng `NEXT_PUBLIC_*` (#1, #2) —
không có bản sao thứ tư.

---

## 3. PHƯƠNG ÁN ĐƯỢC CHỌN

Đã đánh giá 3 phương án (chấm 7 tiêu chí × 5 điểm):

| Phương án | Điểm | Kết luận |
|-----------|-----:|----------|
| **A. Runtime config trong Next app** — Route Handler `/api/app-config` đọc env lúc chạy + singleton `getApiBaseUrl()` | **30/35** | ✅ **Chọn** |
| C. Giữ build-time env nhưng fail-fast | 27/35 | Ghép lọc các ý tốt (guard script, backend validator, AliasChoices) |
| B. Same-origin proxy qua Route Handler | 24/35 | Loại — SSE bắt buộc đi qua Vercel Function (maxDuration 300s sẽ cắt stream Gemini dài), mọi call đều tốn một hop function |

Kiến trúc đích (phương án A + tinh chỉnh):

```
[Client bundle — KHÔNG chứa URL nào]
   │  fetch("/api/app-config", { cache: "no-store" })   ← 1 lần, cache in-memory + localStorage
   ▼
[Route Handler /api/app-config]  force-dynamic, Cache-Control: no-store
   │  đọc process.env.API_BASE_URL  ← lúc RUNTIME (Vercel: lúc Function chạy)
   ▼
{ apiBaseUrl: "https://sex-education-api.onrender.com/api/v1" }
   │
   ▼
[api.request() + SSE chat] → gọi thẳng browser → Render (giữ nguyên CORS/Bearer như cũ)
```

⚠️ **Phát hiện thực nghiệm quan trọng** (đã kiểm chứng bằng build với env giả):
Next 16 + Turbopack inline `process.env.NEXT_PUBLIC_*` **ngay cả trong server bundle**
— tức là đọc "server-side" `NEXT_PUBLIC_*` cũng vẫn bị đóng băng lúc build. Chỉ biến
**không tiền tố** (`API_BASE_URL`) mới là đọc runtime thật. Vì vậy mọi khuyến nghị
"đọc NEXT_PUBLIC_ phía server để lấy runtime" là sai cho phiên bản Next này.

---

## 4. PHASE 1 — FRONTEND (ĐÃ TRIỂN KHAI)

| File | Thay đổi |
|------|----------|
| `frontend/src/lib/runtime-config.ts` | **Mới.** `getApiBaseUrl(): Promise<string>` — singleton cache promise; nhánh server đọc `process.env.API_BASE_URL`; nhánh browser fetch `/api/app-config` 1 lần; **cache last-known-good vào localStorage** (endpoint hỏng → degrade dùng giá trị stale, không chết toàn bộ API); fallback theo `NODE_ENV` (dev → `127.0.0.1:8000`) |
| `frontend/src/app/api/app-config/route.ts` | **Mới.** `GET` với `dynamic = "force-dynamic"` + `Cache-Control: no-store`; thứ tự resolve: `API_BASE_URL` → (legacy `NEXT_PUBLIC_*` — **chỉ trong thời gian migrate**) → dev default → fallback prod migration; chỉ trả cấu hình công khai, không bao giờ trả secret |
| `frontend/src/lib/api.ts` | Xóa dòng 3 (chuỗi `NEXT_PUBLIC_` + literal cứng); `request()` thêm `const BASE_URL = await getApiBaseUrl()` — **0 call-site phải sửa** (get/post/put/delete đã await) |
| `frontend/src/app/(public)/game/[sessionId]/page.tsx` | Xóa khối BASE_URL trùng lặp (241–245); `handleSendMessage` dùng `await getApiBaseUrl()`. **Luồng SSE giữ nguyên đường đi trực tiếp browser → Render** — không qua Vercel Function, không đổi CORS |
| `frontend/src/proxy.ts` | Thêm comment cấm thêm `/api/:path*` vào matcher |
| `frontend/scripts/check-frontend.mjs` | **Mới.** Guard chạy trước `next build`: (1) cấm `NEXT_PUBLIC_API_*`/`NEXT_PUBLIC_SITE_*` trong src; (2) cấm literal onrender.com ngoài allowlist migration; (3) khẳng định bất biến SSE — trang game phải dùng `getApiBaseUrl()` |
| `frontend/package.json` | `build` = `node scripts/check-frontend.mjs && next build` |
| `frontend/.env.local` | Xóa 2 dòng `NEXT_PUBLIC_API_BASE_URL`; chỉ còn ghi chú `API_BASE_URL` tùy chọn (server-only) |
| `frontend/README.md` | Thêm mục "API Base URL / Biến môi trường" |

**Không preload `/api/app-config` ở root layout** — đã loại bỏ ý này sau phản biện:
preload `as="fetch"` không khớp `cache: "no-store"` của fetch runtime sẽ bị bỏ qua và
gây double-fetch.

---

## 5. PHASE 2 — BACKEND (ĐÃ TRIỂN KHAI)

| File | Thay đổi |
|------|----------|
| `backend/core/config.py` | Neo `.env` vào thư mục `backend/` (hết lỗi chạy sai CWD); `SECRET_KEY` nhận **alias `JWT_SECRET_KEY`** (`AliasChoices`) — tên trong docs cũ giờ hợp lệ; thêm `ECHO: bool = False`; thêm `validate_settings()` trả list (mức log, vấn đề) bằng tiếng Việt |
| `backend/main.py` | Lifespan gọi `validate_settings()` → log CRITICAL/WARNING khi boot (chỉ warn — xem gate phase 3); **xóa literal cứng `sex-ed-gray.vercel.app`** khỏi CORS (an toàn ở cả 2 trạng thái `ALLOWED_ORIGINS`: wildcard thay cả list, regex `*.vercel.app` vẫn giữ cho preview) |
| `backend/core/database.py` | `echo=settings.ECHO` (trước là `echo=True` cứng — SQL log ồn ào cả production) |
| `backend/services/gemini_service.py` | 4 chỗ `os.getenv` → `settings.AI_API_KEY` / `settings.GEMINI_MODEL` — `Settings` là nguồn cấu hình duy nhất |
| `backend/Dockerfile` | CMD chạy qua `sh -c ... --port ${PORT:-7860}` — tôn trọng `$PORT` của Render, không cần build lại image |
| `backend/.dockerignore` | **Mới** — loại `.env` khỏi image (không bake secret vào build) |
| `database/apply_phase4.py`, `apply_quizzes.py` | Bỏ parse `.env` bằng tay → import `core.config.settings` |

⚠️ **Hậu quả thật của `ALLOWED_ORIGINS='*'`** (đã xác minh bằng grep: không có fetch nào
dùng `credentials: 'include'` — app gửi `Authorization: Bearer` header nên vẫn chạy bình
thường với wildcard): nó KHÔNG làm sập auth như thường tưởng, nhưng tắt
`allow_credentials` và chặn mọi thiết kế cookie HttpOnly trong tương lai. Validator được
viết theo đúng nghĩa này (mức WARNING, tránh "mù cảnh báo").

---

## 6. MA TRẬN BIẾN MÔI TRƯỜNG SAU REFACTOR

| Biến | Trạng thái | Set ở đâu | Đọc lúc nào |
|------|-----------|-----------|-------------|
| `API_BASE_URL` | **MỚI** (thay `NEXT_PUBLIC_API_BASE_URL`) | Vercel Production + Preview; tùy chọn `frontend/.env.local` | Runtime (route handler) |
| `NEXT_PUBLIC_API_BASE_URL` | **XÓA** (đọc legacy trong code sẽ gỡ ở phase 3) | — xóa khỏi Vercel dashboard sau phase 3 | — |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` | **XÓA** (biến chết) | — | — |
| `DATABASE_URL` | Giữ — **scheme `postgresql+asyncpg://`** | Render + `backend/.env` | Runtime (process start) |
| `SECRET_KEY` | Giữ (chuẩn) — nhận alias `JWT_SECRET_KEY` | Render + `backend/.env` | Runtime |
| `ALGORITHM` | Giữ (mặc định HS256) | Render | Runtime |
| `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` | Giữ | Render | Runtime |
| `ALLOWED_ORIGINS` | Giữ — giờ là **duy nhất** nguồn origin production (literal cứng đã xóa) | Render | Runtime |
| `AI_API_KEY`, `GEMINI_MODEL` | Giữ — đọc qua `settings` duy nhất | Render + `backend/.env` | Runtime |
| `ECHO` | MỚI (mặc định false) | `backend/.env` (debug SQL) | Runtime |
| `JWT_ALGORITHM`, `ENVIRONMENT`, `PYTHON_VERSION` | **XÓA khỏi docs** (code không đọc) | — | — |
| `PORT` | Platform inject — Dockerfile giờ tôn trọng | Render | Runtime |

---

## 7. PHASE 3 — HARDENING (CHƯA LÀM — CÓ GATE)

Thực hiện **sau khi** Phase 1 + 2 đã lên production và verify sạch:

1. **Gate bắt buộc — Vercel:** thêm `API_BASE_URL` scope **Production và Preview**, verify
   trên 1 bản preview rằng `GET /api/app-config` trả đúng URL. Không có gate này, preview
   sẽ 500 toàn bộ API call sau bước 2.
2. Xóa các dòng đọc legacy `NEXT_PUBLIC_*` và hằng `MIGRATION_FALLBACK`/`PROD_FALLBACK`
   trong `route.ts` + `runtime-config.ts` → thiếu `API_BASE_URL` = **500 fail-loud**.
   Thu hẹp allowlist trong `check-frontend.mjs` về rỗng.
3. Xóa `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_URL` khỏi Vercel dashboard.
4. **Gate bắt buộc — backend fail-loud:** sau ≥1 chu kỳ deploy Render không còn log
   CRITICAL, chuyển các mục "critical" trong `validate_settings()` thành
   `raise RuntimeError`. Kiểm tra Render health-check + rollback path trước khi flip.
   **Giữ mức WARNING vĩnh viễn** cho `ALLOWED_ORIGINS='*'` và `AI_API_KEY` trống
   (không được hard-fail boot vì 2 lỗi này).

---

## 8. AN TOÀN TRIỂN KHAI (SITE ĐANG LIVE)

- **Phase 1 an toàn do cấu tạo:** bundle cũ (URL bake sẵn) và bundle mới (fetch config)
  cùng trỏ đúng 1 URL Render → sống hòa bình; Vercel instant rollback là đầy đủ.
  Verify trên preview: `GET /api/app-config` trả URL Render; login/forum/courses/dashboard
  chạy; roleplay chat stream từng token.
- **⚠️ Rủi ro lớn nhất — SECRET_KEY rotation:** nếu Render hiện chỉ đặt `JWT_SECRET_KEY`
  (đúng theo docs cũ) mà chưa từng đặt `SECRET_KEY`, thì deploy alias mới sẽ **đổi khóa ký
  JWT → toàn bộ user bị đăng xuất cưỡng bức** (access 1h + refresh 30d chết cùng lúc).
  **Trước khi merge lên `main`: kiểm tra tên biến thực tế trong tab Environment của
  Render.** Nếu phải chấp nhận rotation: chọn giờ thấp điểm, báo trước, và **tuyệt đối
  không rollback backend** sau khi đã rotate (revert = đăng xuất lần thứ hai, key change
  không đối xứng). Nếu `SECRET_KEY` đã đặt sẵn đúng giá trị → alias là no-op.
- **Bất biến Render URL:** trong suốt quá trình migrate, KHÔNG đổi tên/địa chỉ service
  Render — mọi bundle cũ trước phase 3 đều có URL cũ bake sẵn.
- **Bất biến SSE:** stream chat không bao giờ được route qua đường dẫn tương đối `/api/...`
  (Vercel Function sẽ cắt ở maxDuration/buffer) — `check-frontend.mjs` ép cơ chế này.
- **Preview trỏ thẳng prod:** chưa có staging, mọi preview test roleplay tốn token Gemini
  thật + ghi DB Supabase thật → test bằng tài khoản vứt được.
- **Hành trình migration đã được chứng minh an toàn:** build với `NEXT_PUBLIC_API_BASE_URL`
  giả lập xác nhận giá trị đó KHÔNG xuất hiện trong client bundle (trước đây sẽ bị nhúng);
  nó chỉ nằm trong server chunk qua chuỗi legacy — tái tạo đúng hành vi của bundle cũ
  đang chạy, bị gỡ bỏ hoàn toàn ở phase 3.

---

## 9. KIỂM CHỨNG ĐÃ THỰC HIỆN (LOCAL)

- [x] `node scripts/check-frontend.mjs` → pass
- [x] ESLint trên các file mới → sạch (0 lỗi; ~207 lỗi lint là tồn đọng cũ toàn codebase)
- [x] `npm run build` không có bất kỳ env nào → thành công; `/api/app-config` = Dynamic
- [x] Client bundle: `127.0.0.1` = **0 hit**; `onrender.com` = đúng 1 hit trong chunk
      `runtime-config` (fallback migration có chủ đích)
- [x] Build với `NEXT_PUBLIC_API_BASE_URL` giả → giá trị KHÔNG vào client bundle
- [x] `python -c "import main"` (backend) → OK; `validate_settings()` chạy đúng

Kiểm chứng lại sau phase 3: `grep -r "onrender\|NEXT_PUBLIC_" frontend/src` phải = 0 hit.
