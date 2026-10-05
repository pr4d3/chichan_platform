# FEATURE 06: GENERAL PAGES (BACKEND SPECS)

---

## 1. MÔ TẢ TỔNG QUAN

- Cung cấp dữ liệu tổng hợp cho hai trang tĩnh/công khai quan trọng của hệ thống:
  1. **Trang Chủ (Home Page API):** Tổng hợp dữ liệu hiển thị Hero Banner, danh sách khóa học nổi bật phân theo 2 tab đối tượng (`Phụ huynh` và `Trẻ nhỏ`), cùng 3-5 bài thảo luận mới nhất trên Diễn đàn.
  2. **Trang Giới thiệu (About Us API):** Cung cấp thông tin đề tài nghiên cứu khoa học, sứ mệnh giáo dục giới tính, danh sách nhóm nghiên cứu và thông tin liên hệ.
- Cung cấp API quản lý cấu hình hệ thống (`site_settings`) dành riêng cho `ADMIN` để dễ dàng cập nhật nội dung nghiên cứu mà không cần sửa code.

---

## 2. PHÂN TẦNG KIẾN TRÚC (LAYERED ARCHITECTURE DESIGN)

```
[HTTP Request from Client]
            ⬇
[1. Controller / Router Layer (general_router.py & settings_router.py)]
    - Tiếp nhận Request lấy dữ liệu Home Page, About Us và cập nhật cài đặt hệ thống.
    - Public với các endpoint đọc dữ liệu trang Home và About Us.
    - RoleGuard(["ADMIN"]) đối với các endpoint cập nhật cấu hình hệ thống (`site_settings`).
    - Gọi xuống Service Layer và trả về HTTP Response chuẩn.
            ⬇
[2. Service Layer (general_service.py & settings_service.py)]
    - `get_home_page_data()`:
        + Truy vấn banner/khẩu hiệu chính từ `site_settings`.
        + Lấy 4-6 khóa học nổi bật dành cho Phụ huynh (`target_audience IN ('PARENT', 'BOTH')`).
        + Lấy 4-6 khóa học nổi bật dành cho Trẻ nhỏ (`target_audience IN ('CHILD', 'BOTH')`).
        + Lấy 4 bài thảo luận mới nhất trên diễn đàn (`forum_posts` có `status = 'PUBLISHED'`).
    - `get_about_us_data()`:
        + Tổng hợp thông tin đề tài nghiên cứu, mục tiêu khoa học, thông tin tác giả/giảng viên.
    - `update_site_setting(admin_id, key_name, value_content)`:
        + **Chỉ Admin** - Cập nhật nội dung mô tả, banner, thông tin liên hệ.
            ⬇
[3. Repository Layer (settings_repository.py, course_repository.py, forum_repository.py)]
    - Thao tác trực tiếp với Database qua ORM trên các bảng: `site_settings`, `courses`, `forum_posts`.
            ⬇
[Database: Supabase PostgreSQL]
```

---

## 3. DANH SÁCH API ENDPOINTS

### 3.1. Dành cho Người dùng & Công khai (Public Flow)

| STT | Method | Endpoint                   | Quyền truy cập | Mục đích                                        |
| :-: | :----- | :------------------------- | :------------- | :---------------------------------------------- |
|  1  | `GET`  | `/api/v1/general/home`     | Public         | Lấy toàn bộ dữ liệu tổng hợp cho Trang Chủ      |
|  2  | `GET`  | `/api/v1/general/about-us` | Public         | Lấy thông tin bài nghiên cứu khoa học & đội ngũ |

### 3.2. Dành cho Quản trị viên (Admin Configuration Flow)

| STT | Method | Endpoint                            | Quyền truy cập | Mục đích                                |
| :-: | :----- | :---------------------------------- | :------------- | :-------------------------------------- |
|  3  | `GET`  | `/api/v1/admin/settings`            | **Chỉ ADMIN**  | Lấy danh sách toàn bộ cấu hình hệ thống |
|  4  | `PUT`  | `/api/v1/admin/settings/{key_name}` | **Chỉ ADMIN**  | Cập nhật nội dung cấu hình hệ thống     |

---

## 4. ĐẶC TẢ CHI TIẾT REQUEST & RESPONSE

### 4.1. Lấy dữ liệu Trang Chủ (`GET /api/v1/general/home`)

- **Tầng xử lý:** `general_router.py` $\rightarrow$ `general_service.get_home_page_data()` $\rightarrow$ Aggregate từ `settings_repo`, `course_repo`, `forum_repo`
- **Response Thành công (200 OK):**

```json
{
  "success": true,
  "data": {
    "hero_banner": {
      "title": "Nền tảng Giáo dục Giới tính Trực tuyến An toàn & Khoa học",
      "subtitle": "Đồng hành cùng thanh thiếu niên và phụ huynh Việt Nam xây dựng nhận thức đúng đắn."
    },
    "parent_courses": [
      {
        "id": "crs_uuid_102",
        "title": "Đồng hành cùng con vượt qua khủng hoảng tuổi mới lớn",
        "thumbnail_url": "https://img-url/thumb_parent.png",
        "instructor_name": "TS. Bác sĩ Trần Thị Mai",
        "total_lessons": 8
      }
    ],
    "child_courses": [
      {
        "id": "crs_uuid_101",
        "title": "Giáo dục giới tính tuổi dậy thì toàn diện",
        "thumbnail_url": "https://img-url/thumb_child.png",
        "instructor_name": "TS. Bác sĩ Trần Thị Mai",
        "total_lessons": 10
      }
    ],
    "recent_forum_posts": [
      {
        "id": "post_uuid_301",
        "title": "Làm thế nào để nói chuyện cởi mở với con về tuổi dậy thì?",
        "category_name": "Tâm lý tuổi dậy thì",
        "author_name": "Nguyễn Văn An",
        "comment_count": 5,
        "created_at": "2025-01-25T14:20:00Z"
      }
    ]
  }
}
```

---

### 4.2. Lấy dữ liệu Trang Giới thiệu (`GET /api/v1/general/about-us`)

- **Tầng xử lý:** `general_router.py` $\rightarrow$ `general_service.get_about_us_data()` $\rightarrow$ `settings_repository.get_all_about_keys()`
- **Response Thành công (200 OK):**

```json
{
  "success": true,
  "data": {
    "research_title": "Nghiên cứu và Ứng dụng Nền tảng E-learning trong Phổ biến Kiến thức Giáo dục Giới tính tại Việt Nam",
    "research_purpose": "Đề tài hướng tới việc xóa bỏ các rào cản tâm lý e ngại, cung cấp nguồn học liệu chuẩn y khoa, giúp thanh thiếu niên chủ động bảo vệ bản thân và phụ huynh có kỹ năng đồng hành cùng con.",
    "methodology": "Kết hợp học tập trực tuyến cá nhân hóa theo nhóm đối tượng và diễn đàn trao đổi an toàn.",
    "authors": [
      {
        "name": "Nhóm Nghiên cứu Khoa học",
        "role": "Tác giả & Phát triển Nền tảng",
        "contact": "research.chichan@example.edu.vn"
      }
    ]
  }
}
```

---

### 4.3. Admin cập nhật cấu hình hệ thống (`PUT /api/v1/admin/settings/{key_name}`)

- **Header:** `Authorization: Bearer <access_token>` (**Chỉ ADMIN**)
- **Request Body (JSON):**

```json
{
  "value_content": "Nội dung cập nhật mới cho đề tài nghiên cứu khoa học..."
}
```

- **Response Thành công (200 OK):**

```json
{
  "success": true,
  "message": "Cập nhật cấu hình thành công",
  "data": {
    "key_name": "about_us_research_purpose",
    "updated_at": "2025-01-26T09:00:00Z"
  }
}
```
