# Chichan Platform 🌱

> Học về giới tính không có gì phải ngại — hỏi thẳng, học cho chắc, luyện trước khi gặp thật.

Một nền tảng e-learning tiếng Việt về giáo dục giới tính, làm trong khuôn khổ đề tài NCKH
THPT Giồng Ông Tố: **khóa học** có video + quiz + chứng chỉ, **diễn đàn** ẩn danh có kiểm
duyệt, và một phòng **roleplay với AI** để luyện phản xạ trước các tình huống nhạy cảm
thật sự — tất cả trong một monorepo Next.js + FastAPI.

---

## 📖 Chuyện bắt đầu từ một câu hỏi không dám hỏi

Tuổi teen có hàng nghìn câu hỏi về cơ thể, relationship, và những thứ trường lớp ngại giảng.
Google thì ra đủ thứ — phần lớn không phù hợp lứa tuổi, còn lại thì sai. Hỏi người lớn thì
ngại. Im lặng thì nguy.

Bọn mình muốn một chỗ **an toàn** để:

- **Học** bài bản: khóa học ngắn gọn, có video, quiz kiểm tra, học xong nhận chứng chỉ.
- **Hỏi** không sợ: diễn đàn cho phép đăng ẩn danh, phía có admin kiểm duyệt để không
  ai bị hỏi han thái quá.
- **Luyện** trước khi gặp thật: đây là phần "cháy" nhất — bạn vào phòng chat với AI đóng
  vai người thật (người lạ trên mạng chủ động nhắn tin, kẻ xấu tống tiền ảnh nhạy cảm,
  bác sĩ tư vấn...). Trả lời đúng cách thì điểm lên, sai thì nhân vật phản ứng theo —
  giống game nhập vai, nhưng mỗi quyết định đều là kỹ năng sống còn.

AI ở đây là Google Gemini, stream từng chữ kèm cảm xúc + điểm số, và tra cứu tri thức
RAG (pgvector) để trả lời có cơ sở chứ không bịa.

---

## 🎓 Học được gì sau đợt cày này?

Project nhỏ nhưng "du đi" đủ loại vết. Những bài học xương máu, ai làm sản phẩm thật
sẽ gặp sớm muộn:

1. **Đừng tin `NEXT_PUBLIC_*`.** Next.js + Turbopack nhúng giá trị đó vào bundle NGAY LÚC
   BUILD — kiểm chứng thực nghiệm thì **cả server chunk cũng bị inline**. Build ở đâu,
   môi trường đó "đóng băng" vĩnh viễn. Giải pháp: resolve URL API lúc runtime qua một
   route handler `/api/app-config`, kèm script guard fail build nếu có ai tái diễn.
2. **LLM stream × DB connection là cặp bài trùng.** Endpoint chat trả `StreamingResponse`
   nhưng nhận vào session **factory** chứ không phải session của request — nếu không,
   connection PostgreSQL bị giữ mở suốt 1-2 phút trong khi Gemini... gõ chữ.
3. **N+1 và list không giới hạn giết app từ từ.** Feed diễn đàn đếm comment từng bài một,
   mọi list `.all()` không LIMIT. Sửa bằng 1 `GROUP BY` + phân trang — nhưng ngày deploy
   bundle cũ vẫn đang chạy ngoài kia, nên cần **compat shim**: không truyền `limit` thì
   trả đúng shape cũ y hệt.
4. **bcrypt trên event loop = đóng băng cả server.** Hash mật khẩu chuyển sang
   `asyncio.to_thread`, event loop thở lại.
5. **Schema drift là có thật, không phải truyền thuyết.** Live database có bảng + cột mà
   `schema.sql` không hề biết (quyết định ALTER tay lúc nửa đêm = nợ kỹ thuật). Xử lý: script
   idempotent (backfill → guard → `SET NOT NULL`), verify bằng introspection so models ↔
   live. Migration tool (Alembic) thì để dành — viết rõ điều kiện đủ mới adopt trong docs.
6. **Route group rỗng chỉ là trang trí.** Một group `(learning)` không có `layout.tsx`
   không tạo ra bất kỳ chrome nào — nó chỉ làm path dài thêm 2 cấp. Dọn xong tree mới thấy.
7. **Xóa gì cũng phải có chứng cứ.** 4 ảnh NPC trông "không ai dùng" — hóa ra database
   đang giữ URL của chúng trong `ai_scenarios.npc_avatar_url`. Grep trước khi `rm`,
   luôn luôn.

Chi tiết đầy đủ: [`docs/refactor_maintainability_scale.md`](docs/refactor_maintainability_scale.md)
và [`docs/refactor_env_independent_build.md`](docs/refactor_env_independent_build.md).

---

## 🛠️ Kim chỉ nam kỹ thuật

| Thành phần | Công nghệ |
|---|---|
| Backend | FastAPI (async) · SQLAlchemy 2.0 + asyncpg · JWT (python-jose) |
| Database | Supabase PostgreSQL + **pgvector** (RAG 768-dim) |
| AI | Google Gemini (`google-genai`): embedding + streaming chat có structured output |
| Frontend | Next.js 16 (App Router, Turbopack) · Tailwind v4 (CSS-first) · Phosphor Icons · Plyr |
| Deploy | Backend → Render · Frontend → Vercel · DB → Supabase |

### Cấu trúc monorepo

```
chichan/
├── backend/     # FastAPI: routers → services → repositories → models (+ schemas, core)
├── frontend/    # Next.js 16 App Router — README riêng có sơ đồ src/ chi tiết
├── database/    # schema.sql + seed.sql + script migrate chạy tay (apply_*.py, không Alembic)
├── docs/        # spec theo phase + tài liệu refactor + deployment
└── scratch/     # script debug ad-hoc — không commit
```

### Chạy thử

Backend (cần `backend/.env` — copy từ `backend/.env.example` rồi điền):

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload   # Swagger UI tại /docs
```

Frontend (không cần file env nào để dev):

```powershell
cd frontend
npm install
npm run dev   # http://localhost:3000
```

### Ba quyết định kiến trúc đáng nhớ

- **Backend phân tầng cứng**: `routers → services → repositories → models`. Router mỏng,
  service giữ validation, repository giữ query + commit. Toàn bộ async, UI copy/message
  tiếng Việt.
- **URL API resolve lúc runtime, không lúc build**: client gọi `/api/app-config` lấy base
  URL → một bản build chạy mọi môi trường. Riêng stream chat SSE đi thẳng browser → Render,
  không qua Vercel Function (Function sẽ cắt stream dài).
- **Frontend không có server state**: mọi trang là client component, dữ liệu qua `api.ts`,
  state local + 2 context (Auth, Toast). Đơn giản mà đủ dùng.

---

## 📚 Tài liệu kỹ thuật

| Tài liệu | Nội dung |
|---|---|
| [`docs/overview.md`](docs/overview.md) | Tổng quan dự án, kiến trúc RBAC, roadmap |
| `docs/phase1_database/` → `docs/phase4_ai_roleplay/` | Spec từng feature theo phase (đọc trước khi implement) |
| [`docs/refactor_maintainability_scale.md`](docs/refactor_maintainability_scale.md) | Audit 3 chiều + đợt refactor scale (index, N+1, pagination, async) + debt còn lại |
| [`docs/refactor_env_independent_build.md`](docs/refactor_env_independent_build.md) | Tách env khỏi build — cơ chế runtime config + các bẫy Next 16 |
| [`docs/deployment/render.md`](docs/deployment/render.md) | Deploy backend lên Render từng bước |
| [`docs/deployment/vercel.md`](docs/deployment/vercel.md) | Deploy frontend lên Vercel + checklist nghiệm thu end-to-end |
| [`database/schema.sql`](database/schema.sql) | Full schema 22 bảng (tham chiếu) |

---

<div align="center">

*Kiến thức là Sức mạnh.* 🌿
Đề tài NCKH — THPT Giồng Ông Tố

</div>
