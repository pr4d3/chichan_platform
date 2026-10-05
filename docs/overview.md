# PROJECT OVERVIEW: CHICHAN PLATFORM

_(Dự án Nghiên cứu Khoa học về Giáo dục Giới tính tại Việt Nam — THPT Giồng Ông Tố)_

---

## 1. GIỚI THIỆU TỔNG QUAN (PROJECT VISION)

- **Tên dự án:** ChiChan Platform (Nền tảng Giáo dục Giới tính & Phòng vệ Số Trực tuyến).
- **Mục tiêu:** Xây dựng một nền tảng học tập trực tuyến (e-learning) chuẩn mực, thân thiện, khoa học, giúp phổ biến kiến thức giáo dục giới tính cho người Việt Nam và xóa bỏ rào cản e ngại.
- **Đối tượng thụ hưởng:**
  - **Trẻ em / Vị thành niên (`STUDENT_CHILD`):** Tiếp cận kiến thức sinh lý tuổi dậy thì trực quan, an toàn và rèn luyện kỹ năng tự bảo vệ bản thân qua các tình huống mô phỏng.
  - **Phụ huynh (`STUDENT_PARENT`):** Trang bị kỹ năng lắng nghe, thấu hiểu và phương pháp đồng hành, trò chuyện về giới tính cùng con trẻ.
- **Điểm nhấn đột phá:** **Trung tâm Mô phỏng AI Roleplay (Interactive AI Simulation Hub)** sử dụng kỹ thuật Dynamic Context Engine, Prompting & RAG giúp người học rèn luyện phản xạ thực tế qua 4 kịch bản nhập vai tương tác.

---

## 2. SƠ ĐỒ KIẾN TRÚC HỆ THỐNG TỔNG THỂ (SYSTEM ARCHITECTURE DIAGRAM)

```text
                                  [NGƯỜI DÙNG / TRÌNH DUYỆT]
                                               │
                                               ▼
                     ┌──────────────────────────────────────────────────┐
                     │          FRONTEND CLIENT (Vercel Cloud)          │
                     │          Next.js (App Router) + TailwindCSS      │
                     │  - Trang chủ & Giới thiệu nghiên cứu             │
                     │  - Khóa học (Intro -> Learn -> Outro)            │
                     │  - Profile học viên & Dashboard giảng viên       │
                     │  - Diễn đàn cộng đồng (Kiểm duyệt Admin)         │
                     │  - Giao diện 4 phòng chơi AI Roleplay            │
                     └─────────────┬──────────────────────┬─────────────┘
                                   │                      │
                  (REST API / JWT) │                      │ (Real-time SSE Stream)
                                   ▼                      ▼
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│       MAIN WEB BACKEND (Render Cloud)        │  │     AI ROLEPLAY SERVICE (Render Cloud)       │
│        Python FastAPI (Layered Arch)         │  │    Python FastAPI + Dynamic Context Engine   │
│  - Auth & RBAC (4 Roles)                     │  │  - Sliding Window (4-6 turns) + Summary      │
│  - User Profile & Progress Tracking          │  │  - 4 Persona System Prompts (In-char Refusal)│
│  - Instructor Dashboard & Analytics          │  │  - JSON Schema Structured Outputs            │
│  - Courses & Lessons Management              │  │  - RAG Retriever (pgvector Cosine Search)    │
│  - Forum & Admin Moderation Flow             │  │  - Real-time State & Score Tracking          │
└──────────────────────┬───────────────────────┘  └──────────────────────┬───────────────────────┘
                       │                                                 │
                       │ 🔐 DÙNG CHUNG JWT AUTH (SSO)                    │
                       │ (Cùng Secret Key & Phân quyền Role)             │
                       │                                                 │
                       └──────────────────────┬──────────────────────────┘
                                              │
                                              ▼ (Transaction Pooler: Port 6543)
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                           CENTRAL DATABASE CLOUD (Supabase PostgreSQL)                         │
│                                                                                                │
│  [Nhóm Bảng Web Chính]                     [Nhóm Bảng AI Roleplay & RAG]                       │
│  - roles, users, user_sessions             - ai_scenarios (4 Kịch bản phòng chơi)              │
│  - user_profiles                           - ai_sessions (Lưu State & Memory Summary)          │
│  - courses, lessons                        - ai_messages (Lịch sử chat & Cảm xúc)              │
│  - course_enrollments, lesson_progress     - ai_knowledge_vectors (pgvector HNSW Index)        │
│  - forum_categories, posts, comments       - ai_game_evaluations (Số liệu nghiên cứu khoa học) │
│  - site_settings                                                                               │
└─────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                              │
                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                       CLOUD MEDIA STORAGE (Supabase Storage / Cloudinary)                      │
│  - Avatar người dùng & Giảng viên           - Thumbnail bài giảng & Kịch bản                   │
│  - Video bài giảng giáo dục giới tính       - Tài liệu đính kèm & File log nén                 │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. KIẾN TRÚC VAI TRÒ & PHÂN QUYỀN (ROLES & PERMISSIONS)

Hệ thống quản lý 4 nhóm vai trò độc lập (Role-Based Access Control - RBAC):

1. **`ADMIN` (Quản trị viên):**
   - Quản lý người dùng, cấp quyền Giảng viên.
   - Cấu hình nội dung hệ thống.
   - **Độc quyền kiểm duyệt:** Là vai trò **duy nhất** có quyền Ẩn (`HIDDEN`) hoặc Xóa (`DELETED`) các bài viết và bình luận trên Diễn đàn.
2. **`INSTRUCTOR` (Giảng viên / Nhà nghiên cứu):**
   - Tạo và quản lý khóa học, bài giảng; chỉ định đối tượng học (`PARENT`, `CHILD`, `BOTH`).
   - Theo dõi tiến độ học tập và danh sách học viên trên Dashboard phục vụ nghiên cứu khoa học.
3. **`STUDENT_PARENT` (Học viên - Phụ huynh):**
   - Tham gia các khóa học định hướng cho phụ huynh hoặc cộng đồng.
   - Luyện tập kỹ năng giao tiếp với con qua phòng chơi AI Roleplay Đổi vai.
   - Tham gia thảo luận và hỏi đáp trên Diễn đàn.
4. **`STUDENT_CHILD` (Học viên - Trẻ nhỏ):**
   - Tiếp cận các khóa học được thiết kế riêng cho độ tuổi học sinh.
   - Rèn luyện kỹ năng phòng tránh xâm hại qua phòng chơi AI Roleplay An toàn mạng.
   - Tham gia học tập và thảo luận an toàn trên Diễn đàn.

---

## 4. CẤU TRÚC ĐIỀU HƯỚNG TRANG & PHÒNG CHƠI (SITEMAP)

- **Trang Công khai (Public Pages):**
  - `Trang Chủ (Home Page - /)`: Giới thiệu thông điệp, chuyển đổi khóa học theo tab Phụ huynh / Trẻ nhỏ, diễn đàn mới nhất.
  - `Trang Giới thiệu (About Us - /about)`: Trình bày chi tiết đề tài nghiên cứu khoa học, sứ mệnh y khoa và đội ngũ tác giả.
  - `Trang Xác thực (Auth - /login, /register)`: Đăng ký (chọn role Phụ huynh hoặc Trẻ nhỏ), Đăng nhập, Đăng xuất.
- **Trang Khóa học (3-Page Course Flow):**
  - `Course Intro (/courses/[id]/intro)`: Đề cương, mục tiêu khóa học, thông tin giảng viên và nút đăng ký bắt đầu học.
  - `Course Learning (/courses/[id]/learn)`: Không gian học tập tập trung (Video player, tài liệu đọc, checklist hoàn thành bài học).
  - `Course Outro (/courses/[id]/outro)`: Trang chúc mừng hoàn thành 100% (Tổng kết kiến thức cốt lõi, link khảo sát nghiên cứu).
- **Phân hệ Trò chơi Tương tác AI (AI Roleplay Hub - /game):**
  - `Phòng 1: Kẻ ẩn danh & Ranh giới an toàn`: Luyện kỹ năng nhận diện nguy cơ và từ chối xâm hại mạng.
  - `Phòng 2: Anh/Chị Cố vấn tuổi mới lớn`: Bác sĩ tâm lý giải đáp thắc mắc thầm kín chuẩn y khoa 100%.
  - `Phòng 3: Đổi vai thấu hiểu`: Dành riêng cho Phụ huynh luyện cách mở lời tâm sự cùng con.
  - `Phòng 4: Giải cứu tình huống học đường`: Hỗ trợ bạn bè bị bắt nạt/khủng hoảng tuổi dậy thì.
- **Trang Cá nhân & Quản trị:**
  - `User Profile (/profile)`: Quản lý thông tin cá nhân và theo dõi % tiến độ các khóa học đang tham gia.
  - `Instructor Dashboard (/dashboard)`: Bảng điều khiển dành riêng cho Giảng viên (Thống kê KPIs, Bảng khóa học, Danh sách học viên).
- **Trang Diễn đàn Cộng đồng:**
  - `Forum Page (/forum, /forum/[postId])`: Đăng bài thảo luận, bình luận phân cấp (Tích hợp menu kiểm duyệt Ẩn/Xóa độc quyền cho Admin).

---

## 5. TECH STACK & HẠ TẦNG CLOUD (CHẠY THỰC TẾ 24/7)

### 5.1. Application Stack & Kiến trúc

- **Kiến trúc Backend Web:** **Layered Architecture (Kiến trúc phân tầng)**
  - _Controller/Router Layer_ $\rightarrow$ _Service Layer_ $\rightarrow$ _Repository Layer_ $\rightarrow$ _Database_.
- **Kiến trúc Phân hệ AI:** **Dynamic Context Engine + SSE Protocol**
  - Quản lý trí nhớ ngắn hạn (Sliding Window 4–6 turns + Summary), ép kiểu phản hồi **JSON Schema (Structured Outputs)** triệt tiêu lan man và ảo giác.
- **Backend Framework:** `Python` với `FastAPI` (Async I/O, SSE Streaming, Swagger/OpenAPI tự động).
- **Authentication:** `JWT (JSON Web Tokens)` kết hợp thuật toán băm mật khẩu `bcrypt` — **Chia sẻ JWT đồng nhất (SSO)** giữa Web Platform và AI Service.
- **Database ORM:** `SQLAlchemy` quản lý Schema và Migration.
- **Frontend Phase 2 (MVP Vận hành):** `HTML5` + `CSS` (Giao diện cơ bản kiểm thử kết nối API).
- **Frontend Phase 3 (Hoàn thiện UI/UX):** `Next.js (App Router)` + `TailwindCSS` + `Shadcn/ui` (Giao diện hiện đại, tối ưu SEO và trải nghiệm người dùng).

### 5.2. Hạ tầng Đám mây (Cloud Infrastructure)

- **Backend Cloud Hosting:** `Render (render.com Web Service)`
  - Kết nối tự động qua GitHub Repository (Root Directory: `backend/`).
  - Cung cấp sẵn chứng chỉ bảo mật HTTPS tự động: `https://[ten-service].onrender.com`.
- **Frontend Cloud Hosting (Phase 3):** `Vercel (vercel.com)`
  - Nền tảng tối ưu nhất thế giới cho Next.js, tự động CI/CD từ GitHub.
- **Database Cloud Engine:** `Supabase (Managed PostgreSQL)`
  - Hoạt động 24/7 trên Cloud, sử dụng cổng **Transaction Pooler (Port 6543)** chịu tải 100–300 người dùng đồng thời.
  - Tích hợp sẵn extension **`pgvector`** phục vụ lưu trữ Vector Embeddings và truy xuất RAG siêu tốc (< 15ms).
- **Asset / Media Storage:** `Supabase Storage` hoặc `Cloudinary` (Lưu trữ ảnh đại diện, thumbnail khóa học, tài liệu và video bài giảng).

---

## 6. LỘ TRÌNH PHÁT TRIỂN (ROADMAP)

- **Phase 1 (Hoàn thành):** Thiết kế toàn bộ Database Schema nền tảng (12 bảng dữ liệu chia theo 6 Feature Docs).
- **Phase 2 (Hoàn thành):** Xây dựng Core Backend (FastAPI theo Layered Architecture) + Deploy Render + HTML/CSS cơ bản kiểm thử toàn hệ thống.
- **Phase 3 (Hoàn thành):** Xây dựng giao diện Frontend hoàn chỉnh (Next.js + TailwindCSS + Shadcn/ui) + Deploy Vercel.
- **Phase 4 (Hoàn thành Docs):** Xây dựng Phân hệ AI Roleplay & RAG Service (SSE Streaming, Dynamic Context Engine, 4 Persona Prompts, Database pgvector).
