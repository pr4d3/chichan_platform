# KẾ HOẠCH TRIỂN KHAI BACKEND LÊN CLOUD RENDER (DEPLOYMENT PLAN)

---

## 1. MỤC TIÊU VÀ LỢI THẾ

- Triển khai ứng dụng Backend Python (FastAPI/SQLAlchemy) thành một **Web Service** trên nền tảng **Render.com**.
- Kết nối tự động 100% với kho lưu trữ GitHub: mỗi khi bạn push code lên nhánh `main`, Render sẽ tự động build và cập nhật phiên bản mới.
- Kết nối an toàn với cơ sở dữ liệu **Supabase PostgreSQL** trên Cloud.

---

## 2. QUY TRÌNH KỸ THUẬT TRÊN RENDER

1. **Cơ chế hoạt động:**
   - Render tự động phát hiện ứng dụng Python qua `requirements.txt` hoặc `Dockerfile`.
   - Cung cấp sẵn đường dẫn HTTPS bảo mật dạng: `https://[ten-service-cua-ban].onrender.com`.
2. **Xử lý thư mục gốc (Root Directory):**
   - Do dự án của bạn chia làm 3 thư mục (`backend/`, `frontend/`, `docs/`), trên Render ta chỉ cần đặt **Root Directory** là `backend` $\rightarrow$ Render sẽ chỉ tập trung đọc mã nguồn trong thư mục này.
3. **Lệnh Build & Lệnh Start:**
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 3. DANH SÁCH BIẾN MÔI TRƯỜNG CẦN CẤU HÌNH (RENDER ENVIRONMENT VARIABLES)

Cấu hình các biến sau tại tab **Environment** trên Dashboard của Render:

| Tên biến (Key)                | Mục đích                                             | Ví dụ giá trị                                                                                 |
| :---------------------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------------------- |
| `PYTHON_VERSION`              | Chỉ định phiên bản Python                            | `3.11.8`                                                                                      |
| `ENVIRONMENT`                 | Chế độ môi trường                                    | `production`                                                                                  |
| `DATABASE_URL`                | Chuỗi kết nối Supabase (Transaction Pooler)          | `postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET_KEY`              | Khóa bí mật ký mã hóa JWT Token                      | `chuoi_bi_mat_ngau_nhien_64_ky_tu_cuc_kho_doan`                                               |
| `JWT_ALGORITHM`               | Thuật toán ký JWT                                    | `HS256`                                                                                       |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Thời hạn của Access Token                            | `60`                                                                                          |
| `ALLOWED_ORIGINS`             | Danh sách tên miền Frontend được phép gọi API (CORS) | `*` (Giai đoạn test) hoặc domain Vercel sau này                                               |

---

## 4. QUY TRÌNH CÁC BƯỚC THỰC HIỆN TRÊN GIAO DIỆN RENDER (STEP-BY-STEP)

1. **Bước 1: Đăng nhập & Tạo Web Service mới**
   - Truy cập `dashboard.render.com`, đăng nhập bằng tài khoản **GitHub**.
   - Bấm nút **New +** ở góc trên bên phải $\rightarrow$ Chọn **Web Service**.
2. **Bước 2: Kết nối GitHub Repository**
   - Chọn kho lưu trữ (Repository) của dự án bạn đang làm việc.
3. **Bước 3: Cấu hình thông số dự án**
   - **Name:** Đặt tên cho Backend (VD: `sex-education-api`).
   - **Region:** Chọn `Singapore` (để tối ưu tốc độ nhanh nhất về Việt Nam).
   - **Branch:** Chọn `main`.
   - **Root Directory:** Nhập `backend`.
   - **Runtime:** Chọn `Python 3`.
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Chọn **Free** ($0/month).
4. **Bước 4: Nhập Biến Môi trường (Environment Variables)**
   - Cuộn xuống phần _Environment Variables_, thêm các cặp Key - Value đã liệt kê ở **Mục 3**.
5. **Bước 5: Hoàn tất & Triển khai**
   - Bấm nút **Create Web Service**.
   - Render sẽ bắt đầu kéo code, cài đặt thư viện và khởi chạy ứng dụng.

---

## 5. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

- [ ] Render hiển thị trạng thái **Live** (Chấm xanh lá cây).
- [ ] Mở đường link `https://[ten-service].onrender.com/docs` hiển thị giao diện tương tác Swagger UI đầy đủ 6 Features.
- [ ] Thực hiện test gọi API Đăng ký (`POST /api/v1/auth/register`) thành công và dữ liệu lập tức hiển thị trên Supabase Table Editor.
