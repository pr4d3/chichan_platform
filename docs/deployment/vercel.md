# KẾ HOẠCH TRIỂN KHAI FRONTEND LÊN CLOUD VERCEL (DEPLOYMENT PLAN)

---

## 1. MỤC TIÊU VÀ KIẾN TRÚC KẾT NỐI (ARCHITECTURE)

- Triển khai ứng dụng Frontend **Next.js (App Router) + TailwindCSS + Shadcn/ui** lên nền tảng **Vercel**.
- Thiết lập kết nối toàn cầu giữa Frontend (Vercel) và Backend (Render) thông qua giao thức bảo mật HTTPS/CORS.

```
[Người dùng truy cập]
         ⬇
[Frontend trên Vercel: https://sex-education.vercel.app]
         ⬇ (Gọi HTTPS REST API kèm Bearer Token)
[Backend trên Render: https://sex-education-api.onrender.com]
         ⬇ (Kết nối Transaction Pooler Port 6543)
[Database trên Supabase Cloud (PostgreSQL)]
```

---

## 2. DANH SÁCH BIẾN MÔI TRƯỜNG CẦN THIẾT (VERCEL ENVIRONMENT VARIABLES)

Cấu hình các biến sau tại phần **Settings $\rightarrow$ Environment Variables** trên Vercel:

| Tên biến (Key)             | Mục đích                              | Ví dụ giá trị                                   |
| :------------------------- | :------------------------------------ | :---------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Đường dẫn gốc API Backend trên Render | `https://sex-education-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_SITE_URL`     | Tên miền chính thức của Frontend      | `https://sex-education.vercel.app`              |

---

## 3. CẤU HÌNH LIÊN KẾT CORS TRÊN BACKEND RENDER (QUAN TRỌNG)

Để trình duyệt không chặn các lệnh gọi API từ Vercel sang Render (lỗi CORS Policy), trên Dashboard của **Render (Backend)** cần cập nhật biến môi trường:

- **Tên biến:** `ALLOWED_ORIGINS`
- **Giá trị:** `https://sex-education.vercel.app` _(hoặc `_` trong giai đoạn chạy thử nghiệm)\*.

---

## 4. CÁC BƯỚC TRIỂN KHAI TỪNG BƯỚC TRÊN VERCEL (STEP-BY-STEP)

1. **Bước 1: Đăng nhập Vercel**
   - Truy cập `vercel.com` và đăng nhập bằng tài khoản **GitHub**.
2. **Bước 2: Import Repository dự án**
   - Bấm **Add New...** $\rightarrow$ Chọn **Project**.
   - Chọn Repository của dự án bạn đang làm việc.
3. **Bước 3: Cấu hình Thư mục gốc (Root Directory)**
   - Tại mục **Root Directory**, bấm nút **Edit** và chọn thư mục `frontend` (theo cấu trúc thư mục của bạn).
   - **Framework Preset:** Vercel sẽ tự động nhận diện là `Next.js`.
4. **Bước 4: Nhập Biến môi trường (Environment Variables)**
   - Thêm biến `NEXT_PUBLIC_API_BASE_URL` với giá trị là đường dẫn API Render của bạn.
5. **Bước 5: Bấm Deploy**
   - Vercel sẽ tự động build ứng dụng Next.js và phát hành đường dẫn chính thức dạng: `https://[ten-du-an].vercel.app`.

---

## 5. BẢNG KIỂM TRA NGHIỆM THU TOÀN HỆ THỐNG (END-TO-END ACCEPTANCE CHECKLIST)

Sau khi hoàn tất cả 3 thành phần trên Cloud:

- [ ] **1. Tải trang:** Truy cập `https://[ten-du-an].vercel.app` hiển thị Trang Chủ mượt mà dưới 1 giây.
- [ ] **2. Luồng Đăng ký / Đăng nhập:**
  - Đăng ký tài khoản Phụ huynh tại `/register` $\rightarrow$ Nhận Toast thông báo thành công $\rightarrow$ Kiểm tra thấy bản ghi xuất hiện trong bảng `users` trên **Supabase**.
  - Đăng nhập tại `/login` $\rightarrow$ Tự động lưu Token và chuyển về trang `/profile`.
- [ ] **3. Luồng Học tập 3 trang:**
  - Vào `/courses` $\rightarrow$ Chọn 1 khóa học $\rightarrow$ Mở trang **Intro** $\rightarrow$ Bấm "Bắt đầu học" $\rightarrow$ Chuyển sang trang **Learning**.
  - Bấm "Đánh dấu hoàn thành" từng bài học $\rightarrow$ Đạt 100% $\rightarrow$ Hệ thống tự động chuyển sang trang **Outro** chúc mừng.
- [ ] **4. Luồng Diễn đàn & Kiểm duyệt Admin:**
  - Dùng tài khoản Học viên đăng bài và bình luận $\rightarrow$ Dữ liệu hiển thị ngay trên diễn đàn.
  - Dùng tài khoản `ADMIN` đăng nhập $\rightarrow$ Nút 3 chấm kiểm duyệt xuất hiện $\rightarrow$ Bấm "Ẩn bài viết" $\rightarrow$ Bài viết lập tức biến mất khỏi danh sách công khai.
- [ ] **5. Luồng Giảng viên Dashboard:**
  - Dùng tài khoản `INSTRUCTOR` đăng nhập $\rightarrow$ Truy cập `/dashboard` $\rightarrow$ Các thẻ số liệu KPIs và bảng danh sách học viên hiển thị chính xác.

```

---

## 🎉 TỔNG KẾT TOÀN DIỆN DỰ ÁN

Chúng ta đã hoàn thành **100% hệ thống tài liệu và kế hoạch kiến trúc** từ đầu đến cuối cho cả 3 Phase:

```

chichan/
├── docs/
│ ├── overview.md # Tổng quan dự án, Kiến trúc RBAC & Tech Stack
│ ├── phase1_database/ # 6 File Schema (12 bảng cơ sở dữ liệu trên Supabase)
│ │ ├── feat1_auth.md
│ │ ├── feat2_user.md
│ │ ├── feat3_dashboard.md
│ │ ├── feat4_course.md
│ │ ├── feat5_forum.md
│ │ └── feat6_general_page.md
│ ├── phase2_backend/ # 6 File API Specs (Layered Architecture) + Deploy Render
│ │ ├── feat1_auth.md
│ │ ├── feat2_user.md
│ │ ├── feat3_dashboard.md
│ │ ├── feat4_course.md
│ │ ├── feat5_forum.md
│ │ ├── feat6_general_page.md
│ │ └── deployment_render.md
│ └── phase3_frontend/ # 6 File UI/UX Specs (Next.js + Tailwind + Shadcn) + Deploy Vercel
│ ├── feat1_auth.md
│ ├── feat2_user.md
│ ├── feat3_dashboard.md
│ ├── feat4_course.md
│ ├── feat5_forum.md
│ ├── feat6_general_page.md
│ └── deployment_vercel.md
├── backend/ # Nơi bạn thực thi code Backend
└── frontend/ # Nơi bạn thực thi code Frontend

```

```
