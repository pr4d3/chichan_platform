# FEATURE 04: COURSE & CONTENT MANAGEMENT (BACKEND SPECS)

---

## 1. MÔ TẢ TỔNG QUAN

- Quản lý toàn bộ vòng đời của Khóa học (Course) và Bài học (Lesson).
- Cung cấp API phục vụ đầy đủ luồng trải nghiệm 3 trang:
  1. **Course Intro API:** Cung cấp thông tin đề cương, mục tiêu và nút đăng ký học.
  2. **Course Learning API:** Cung cấp danh sách bài học, nội dung chi tiết bài đang học, video/văn bản.
  3. **Course Outro API:** Cung cấp nội dung tổng kết khi học viên hoàn thành 100% khóa học.
- Xử lý logic lọc nội dung theo đối tượng hướng đến (**Target Audience Filtering**): `PARENT`, `CHILD`, `BOTH`.
- Cung cấp bộ API quản trị CRUD (Thêm, Sửa, Xóa, Sắp xếp bài học) dành cho Giảng viên (`INSTRUCTOR`) và Quản trị viên (`ADMIN`).

---

## 2. PHÂN TẦNG KIẾN TRÚC (LAYERED ARCHITECTURE DESIGN)
```

[HTTP Request from Client]
⬇
[1. Controller / Router Layer (course_router.py & lesson_router.py)] - Tiếp nhận Request xem danh sách, chi tiết Intro/Learning/Outro và các thao tác CRUD. - Validate dữ liệu đầu vào (DTOs/Pydantic Schemas). - Áp dụng Middleware: Phân quyền theo Role hoặc kiểm tra trạng thái đăng nhập. - Gọi xuống Service Layer và trả về HTTP Response chuẩn.
⬇
[2. Service Layer (course_service.py & lesson_service.py)] - `get_public_courses(audience_filter)`: Lọc khóa học đã xuất bản (`is_published = true`) theo đối tượng. - `get_course_intro(course_id, current_user)`: Trả về thông tin giới thiệu, danh sách bài học và trạng thái đăng ký của user hiện tại. - `enroll_course(user_id, course_id)`: Ghi nhận học viên tham gia khóa học vào `course_enrollments`. - `get_course_learning_room(user_id, course_id)`: Kiểm tra quyền học viên, lấy danh mục bài học kèm trạng thái đã học của từng bài. - `get_course_outro(user_id, course_id)`: Kiểm tra điều kiện hoàn thành 100% trước khi mở khóa nội dung Outro. - `create_or_update_course(...)`: Giảng viên tạo/sửa thông tin khóa học do mình sở hữu. - `manage_lessons(...)`: Thêm, sửa, sắp xếp thứ tự (`order_index`), xóa bài học.
⬇
[3. Repository Layer (course_repository.py & lesson_repository.py)] - Tương tác trực tiếp với Database qua SQLAlchemy ORM trên các bảng: `courses`, `lessons`, `course_enrollments`, `lesson_progress`.
⬇
[Database: Supabase PostgreSQL]

````

---

## 3. QUY TRÌNH NGHIỆP VỤ & PHÂN QUYỀN (BUSINESS LOGIC)

1. **Quy tắc lọc theo Role học viên:**
   - Người dùng có vai trò `STUDENT_PARENT` chỉ xem và học được các khóa học có `target_audience IN ('PARENT', 'BOTH')`.
   - Người dùng có vai trò `STUDENT_CHILD` chỉ xem và học được các khóa học có `target_audience IN ('CHILD', 'BOTH')`.
2. **Quy tắc bảo vệ trang Outro:**
   - Endpoint `/api/v1/courses/{course_id}/outro` bắt buộc phải kiểm tra trong `course_enrollments`: Nếu `status != 'COMPLETED'` $\rightarrow$ trả về lỗi `403 Forbidden` ("Bạn chưa hoàn thành tất cả các bài học trong khóa học này").
3. **Quy tắc quản lý của Giảng viên:**
   - Giảng viên chỉ được phép chỉnh sửa/xóa bài học hoặc khóa học do chính mình tạo ra (`instructor_id == current_user_id`).

---

## 4. DANH SÁCH API ENDPOINTS

### 4.1. Dành cho Học viên & Công khai (Learning Flow)

| STT | Method | Endpoint | Quyền truy cập | Mục đích |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/courses` | Public | Lấy danh sách khóa học (Hỗ trợ lọc theo `target_audience`) |
| 2 | `GET` | `/api/v1/courses/{course_id}/intro` | Public / Đã đăng nhập | Lấy thông tin trang **Intro** (Đề cương, Giới thiệu) |
| 3 | `POST` | `/api/v1/courses/{course_id}/enroll` | Học viên (`PARENT` / `CHILD`) | Đăng ký bắt đầu học khóa học |
| 4 | `GET` | `/api/v1/courses/{course_id}/learn` | Học viên đã đăng ký | Lấy dữ liệu không gian trang **Learning** |
| 5 | `GET` | `/api/v1/courses/{course_id}/lessons/{lesson_id}` | Học viên đã đăng ký | Lấy chi tiết nội dung 1 bài học (Video/Văn bản) |
| 6 | `GET` | `/api/v1/courses/{course_id}/outro` | Học viên đã hoàn thành 100% | Lấy nội dung tổng kết trang **Outro** |

### 4.2. Dành cho Giảng viên & Admin (Management Flow)

| STT | Method | Endpoint | Quyền truy cập | Mục đích |
| :---: | :--- | :--- | :--- | :--- |
| 7 | `POST` | `/api/v1/courses` | `INSTRUCTOR`, `ADMIN` | Tạo mới khóa học |
| 8 | `PUT` | `/api/v1/courses/{course_id}` | `INSTRUCTOR`, `ADMIN` | Cập nhật thông tin khóa học / Xuất bản |
| 9 | `DELETE`| `/api/v1/courses/{course_id}` | `INSTRUCTOR`, `ADMIN` | Xóa khóa học |
| 10 | `POST` | `/api/v1/courses/{course_id}/lessons` | `INSTRUCTOR`, `ADMIN` | Thêm bài học mới vào khóa |
| 11 | `PUT` | `/api/v1/courses/{course_id}/lessons/{lesson_id}` | `INSTRUCTOR`, `ADMIN` | Cập nhật nội dung bài học |
| 12 | `DELETE`| `/api/v1/courses/{course_id}/lessons/{lesson_id}` | `INSTRUCTOR`, `ADMIN` | Xóa một bài học |

---

## 5. ĐẶC TẢ CHI TIẾT REQUEST & RESPONSE (CÁC ENDPOINT QUAN TRỌNG)

### 5.1. Xem thông tin trang Intro (`GET /api/v1/courses/{course_id}/intro`)
- **Tầng xử lý:** `course_router.py` $\rightarrow$ `course_service.get_course_intro()` $\rightarrow$ `course_repository.get_course_detail()`
- **Response Thành công (200 OK):**
```json
{
  "success": true,
  "data": {
    "course_id": "crs_uuid_101",
    "title": "Giáo dục giới tính tuổi dậy thì toàn diện",
    "slug": "giao-duc-gioi-tinh-tuoi-day-thi",
    "description": "Khóa học trang bị kiến thức sinh lý và tâm lý cho độ tuổi 12-16...",
    "thumbnail_url": "https://img-url/thumb1.png",
    "target_audience": "CHILD",
    "instructor": {
      "id": "usr_uuid_ins_01",
      "full_name": "TS. Bác sĩ Trần Thị Mai",
      "avatar_url": "https://img-url/avatar_mai.png"
    },
    "total_lessons": 10,
    "is_enrolled": false,
    "syllabus": [
      { "id": "lsn_uuid_201", "order_index": 1, "title": "Bài 1: Cơ thể chúng ta thay đổi như thế nào?", "duration_minutes": 15 },
      { "id": "lsn_uuid_202", "order_index": 2, "title": "Bài 2: Vệ sinh thân thể đúng cách", "duration_minutes": 20 }
    ]
  }
}
````

---

### 5.2. Đăng ký tham gia khóa học (`POST /api/v1/courses/{course_id}/enroll`)

- **Header:** `Authorization: Bearer <access_token>`
- **Tầng xử lý:** `course_router.py` $\rightarrow$ `course_service.enroll_course()` $\rightarrow$ `course_repository.create_enrollment()`
- **Response Thành công (201 Created):**

```json
{
  "success": true,
  "message": "Đăng ký khóa học thành công! Bạn có thể bắt đầu học ngay bây giờ.",
  "data": {
    "course_id": "crs_uuid_101",
    "status": "IN_PROGRESS",
    "enrolled_at": "2025-01-20T10:00:00Z"
  }
}
```

---

### 5.3. Xem nội dung trang Learning (`GET /api/v1/courses/{course_id}/learn`)

- **Header:** `Authorization: Bearer <access_token>`
- **Tầng xử lý:** `course_router.py` $\rightarrow$ `course_service.get_course_learning_room()` $\rightarrow$ `course_repository.get_lessons_with_user_progress()`
- **Response Thành công (200 OK):**

```json
{
  "success": true,
  "data": {
    "course_id": "crs_uuid_101",
    "course_title": "Giáo dục giới tính tuổi dậy thì toàn diện",
    "progress_percentage": 20.0,
    "lessons": [
      {
        "lesson_id": "lsn_uuid_201",
        "order_index": 1,
        "title": "Bài 1: Cơ thể chúng ta thay đổi như thế nào?",
        "content_type": "VIDEO",
        "video_url": "https://video-stream-url/lesson1.mp4",
        "content_body": "<p>Nội dung hướng dẫn tóm tắt bài 1...</p>",
        "is_completed": true
      },
      {
        "lesson_id": "lsn_uuid_202",
        "order_index": 2,
        "title": "Bài 2: Vệ sinh thân thể đúng cách",
        "content_type": "TEXT",
        "video_url": null,
        "content_body": "<p>Nội dung chi tiết bài đọc số 2...</p>",
        "is_completed": false
      }
    ]
  }
}
```

---

### 5.4. Xem nội dung trang Outro (`GET /api/v1/courses/{course_id}/outro`)

- **Header:** `Authorization: Bearer <access_token>`
- **Tầng xử lý:** `course_router.py` $\rightarrow$ `course_service.get_course_outro()` $\rightarrow$ `course_repository.verify_completion()`
- **Response Thành công (200 OK):**

```json
{
  "success": true,
  "data": {
    "course_id": "crs_uuid_101",
    "course_title": "Giáo dục giới tính tuổi dậy thì toàn diện",
    "completed_at": "2025-01-22T15:40:00Z",
    "outro_content": "Chúc mừng bạn đã xuất sắc hoàn thành toàn bộ khóa học! Hy vọng những kiến thức khoa học này sẽ là hành trang vững chắc giúp bạn tự tin bảo vệ và thấu hiểu bản thân.",
    "research_survey_url": "https://forms.gle/research_feedback_chichan"
  }
}
```

- **Mã lỗi thường gặp:**
  - `403 Forbidden`: Học viên chưa hoàn thành đủ 100% bài học trong khóa.

---

### 5.5. Tạo khóa học mới - Giảng viên (`POST /api/v1/courses`)

- **Header:** `Authorization: Bearer <access_token>` (`INSTRUCTOR`, `ADMIN`)
- **Request Body (JSON):**

```json
{
  "title": "Kỹ năng tự bảo vệ và phòng chống xâm hại",
  "slug": "ky-nang-tu-bao-ve-va-phong-chong-xam-hai",
  "short_description": "Trang bị các kỹ năng nhận biết và phòng tránh nguy cơ xâm hại tình dục.",
  "description": "Mô tả chi tiết nội dung toàn diện khóa học...",
  "thumbnail_url": "https://supabase-storage/thumb2.png",
  "target_audience": "CHILD",
  "outro_content": "Bạn đã hoàn thành khóa học kỹ năng tự bảo vệ an toàn!"
}
```

- **Response Thành công (201 Created):**

```json
{
  "success": true,
  "message": "Tạo khóa học thành công",
  "data": {
    "course_id": "crs_uuid_103",
    "slug": "ky-nang-tu-bao-ve-va-phong-chong-xam-hai"
  }
}
```
