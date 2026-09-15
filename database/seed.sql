-- ============================================================================
-- PROJECT: SEXED PLATFORM (EDUSEX VN)
-- SUPABASE FULL SEED SCRIPT (DATA + ACCOUNTS + COURSES + FORUM + SETTINGS)
-- Password for all seed accounts: 123456
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ==========================================
-- 1. CLEANUP & RESET (Optional / Safe)
-- ==========================================
TRUNCATE TABLE lesson_progress CASCADE;
TRUNCATE TABLE course_enrollments CASCADE;
TRUNCATE TABLE lessons CASCADE;
TRUNCATE TABLE courses CASCADE;
TRUNCATE TABLE forum_comments CASCADE;
TRUNCATE TABLE forum_posts CASCADE;
TRUNCATE TABLE forum_categories CASCADE;
TRUNCATE TABLE user_sessions CASCADE;
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE site_settings CASCADE;
-- ==========================================
-- 2. SEED ROLES
-- ==========================================
INSERT INTO roles (id, role_code, role_name, description)
VALUES (
        1,
        'ADMIN',
        'Quản trị viên',
        'Quản trị hệ thống, cấp quyền giảng viên, kiểm duyệt diễn đàn'
    ),
    (
        2,
        'INSTRUCTOR',
        'Giảng viên',
        'Giảng viên, tạo và quản lý khóa học, bài giảng'
    ),
    (
        3,
        'STUDENT_PARENT',
        'Phụ huynh',
        'Học viên đối tượng Phụ huynh, học nội dung đồng hành cùng con'
    ),
    (
        4,
        'STUDENT_CHILD',
        'Trẻ nhỏ',
        'Học viên đối tượng Trẻ nhỏ, tiếp cận bài học sinh động'
    ) ON CONFLICT (id) DO
UPDATE
SET role_name = EXCLUDED.role_name;
-- Điều chỉnh sequence của bảng roles
SELECT setval(
        'roles_id_seq',
        (
            SELECT MAX(id)
            FROM roles
        )
    );
-- ==========================================
-- 3. SEED USERS & PROFILES (Password: 123456)
-- Hash: $2b$12$wUFmsMz9qzVOisDjoVIkUe09FbhpOpt0zq9AtynI9iqyGyFr7oe6.
-- ==========================================
-- 1. Admin
INSERT INTO users (
        id,
        role_id,
        username,
        email,
        password_hash,
        full_name,
        status
    )
VALUES (
        'a0000000-0000-0000-0000-000000000001',
        1,
        'admin',
        'admin@edusex.vn',
        '$2b$12$wUFmsMz9qzVOisDjoVIkUe09FbhpOpt0zq9AtynI9iqyGyFr7oe6.',
        'Quản Trị Viên Hệ Thống',
        'ACTIVE'
    ),
    -- 2. Instructor (Giảng viên / Nhà nghiên cứu)
    (
        'b0000000-0000-0000-0000-000000000002',
        2,
        'dr_lananh',
        'lananh@edusex.vn',
        '$2b$12$wUFmsMz9qzVOisDjoVIkUe09FbhpOpt0zq9AtynI9iqyGyFr7oe6.',
        'TS. BS. Nguyễn Lan Anh',
        'ACTIVE'
    ),
    -- 3. Phụ huynh (Parent)
    (
        'c0000000-0000-0000-0000-000000000003',
        3,
        'phuhuynh_mai',
        'parent@edusex.vn',
        '$2b$12$wUFmsMz9qzVOisDjoVIkUe09FbhpOpt0zq9AtynI9iqyGyFr7oe6.',
        'Trần Thị Mai',
        'ACTIVE'
    ),
    -- 4. Trẻ em / Học sinh (Child)
    (
        'd0000000-0000-0000-0000-000000000004',
        4,
        'hocsinh_minh',
        'child@edusex.vn',
        '$2b$12$wUFmsMz9qzVOisDjoVIkUe09FbhpOpt0zq9AtynI9iqyGyFr7oe6.',
        'Nguyễn Tuấn Minh',
        'ACTIVE'
    ) ON CONFLICT (id) DO NOTHING;
-- User Profiles
INSERT INTO user_profiles (
        id,
        user_id,
        avatar_url,
        gender,
        date_of_birth,
        phone_number,
        bio
    )
VALUES (
        'a1000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        'FEMALE',
        '1990-01-01',
        '0901234567',
        'Ban Quản trị & Điều phối Nghiên cứu Khoa học EduSex VN'
    ),
    (
        'b1000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300',
        'FEMALE',
        '1985-05-15',
        '0912345678',
        'Tiến sĩ - Bác sĩ Sản Phụ khoa & Chuyên gia Tâm lý Vị thành niên với hơn 15 năm kinh nghiệm.'
    ),
    (
        'c1000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000003',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        'FEMALE',
        '1988-10-20',
        '0923456789',
        'Phụ huynh có 2 con đang trong độ tuổi dậy thì (11 và 14 tuổi), mong muốn đồng hành khoa học cùng con.'
    ),
    (
        'd1000000-0000-0000-0000-000000000004',
        'd0000000-0000-0000-0000-000000000004',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
        'MALE',
        '2012-08-12',
        '0934567890',
        'Học sinh lớp 8, thích tìm hiểu kiến thức khoa học và phát triển bản thân an toàn.'
    ) ON CONFLICT (id) DO NOTHING;
-- ==========================================
-- 4. SEED FORUM CATEGORIES
-- ==========================================
INSERT INTO forum_categories (id, name, slug, description)
VALUES (
        1,
        'Hỏi đáp cùng Giáo viên',
        'hoi-dap-cung-giao-vien',
        'Giải đáp các thắc mắc về tâm sinh lý, sức khỏe sinh sản và kiến thức giới tính từ thầy cô'
    ),
    (
        2,
        'Góc Phụ huynh & Đồng hành',
        'goc-phu-huynh',
        'Không gian trao đổi kinh nghiệm nuôi dạy con, trò chuyện về tâm sinh lý dậy thì'
    ),
    (
        3,
        'Tâm sự Tuổi dậy thì',
        'tam-su-day-thi',
        'Chia sẻ những băn khoăn thầm kín của thanh thiếu niên trong môi trường an toàn'
    ),
    (
        4,
        'Kỹ năng An toàn & Phòng vệ',
        'ky-nang-an-toan',
        'Các phương pháp nhận diện nguy cơ xâm hại và kỹ năng bảo vệ bản thân trên mạng'
    ) ON CONFLICT (id) DO
UPDATE
SET name = EXCLUDED.name;
SELECT setval(
        'forum_categories_id_seq',
        (
            SELECT MAX(id)
            FROM forum_categories
        )
    );
-- ==========================================
-- 5. SEED FORUM POSTS & COMMENTS
-- ==========================================
INSERT INTO forum_posts (
        id,
        category_id,
        author_id,
        title,
        content,
        status
    )
VALUES (
        'f0000000-0000-0000-0000-000000000001',
        1,
        'c0000000-0000-0000-0000-000000000003',
        'Làm thế nào để bắt đầu nói chuyện giới tính với con gái 11 tuổi?',
        'Chào bác sĩ, con gái tôi năm nay 11 tuổi và bắt đầu có những thay đổi về cơ thể. Tôi rất muốn nói chuyện với con nhưng còn khá lúng túng không biết nên mở đầu từ đâu để con không cảm thấy e ngại. Xin bác sĩ cho tôi lời khuyên!',
        'PUBLISHED'
    ),
    (
        'f0000000-0000-0000-0000-000000000002',
        3,
        'd0000000-0000-0000-0000-000000000004',
        'Có phải thay đổi giọng nói ở tuổi dậy thì là bình thường không ạ?',
        'Em chào các thầy cô bác sĩ. Dạo này giọng của em lúc trầm lúc bổng rất lạ và bạn bè hay trêu. Em hơi lo lắng không biết đây có phải là hiện tượng bình thường khi dậy thì không ạ?',
        'PUBLISHED'
    ),
    (
        'f0000000-0000-0000-0000-000000000003',
        4,
        'b0000000-0000-0000-0000-000000000002',
        'Cảnh báo: Nhận diện các hành vi dụ dỗ nguy hiểm trên không gian mạng',
        'Kính gửi các bậc phụ huynh và các em học sinh. Hiện nay có nhiều đối tượng lợi dụng mạng xã hội để tiếp cận và dụ dỗ gửi hình ảnh nhạy cảm. Chúng ta cần ghi nhớ quy tắc: KHÔNG CHIA SẺ HÌNH ẢNH CƠ THỂ CHO BẤT KỲ AI TRÊN MẠNG!',
        'PUBLISHED'
    ) ON CONFLICT (id) DO NOTHING;
INSERT INTO forum_comments (id, post_id, author_id, content, status)
VALUES (
        'f1000000-0000-0000-0000-000000000011',
        'f0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'Chào chị Mai! Ở độ tuổi 11, chị có thể bắt đầu từ những câu chuyện tự nhiên hàng ngày như chọn trang phục lót, giải thích về sự phát triển tự nhiên của cơ thể một cách tích cực và khen ngợi con đang lớn lên khỏe mạnh. Chị có thể tham khảo thêm khóa học "Nghệ Thuật Trò Chuyện Giới Tính Cùng Con" trên nền tảng nhé!',
        'PUBLISHED'
    ),
    (
        'f1000000-0000-0000-0000-000000000012',
        'f0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'Chào em Minh! Hiện tượng này gọi là vỡ giọng (voice change), rất phổ biến ở các bạn nam tuổi dậy thì do thanh quản và dây thanh âm phát triển nhanh. Sau vài tháng giọng em sẽ ổn định và nam tính hơn, em hoàn toàn yên tâm nhé!',
        'PUBLISHED'
    ) ON CONFLICT (id) DO NOTHING;
-- ==========================================
-- 6. SEED COURSES & LESSONS
-- ==========================================
-- Course 1: Dành cho Học sinh / Trẻ em (CHILD)
INSERT INTO courses (
        id,
        instructor_id,
        title,
        slug,
        short_description,
        description,
        thumbnail_url,
        target_audience,
        outro_content,
        is_published
    )
VALUES (
        'e0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000002',
        'Khám Phá Cơ Thể & Tự Tin Tuổi Dậy Thì',
        'kham-pha-co-the-tu-tin-tuoi-day-thi',
        'Trang bị kiến thức khoa học, sinh động về những thay đổi thể chất và tâm lý tuổi dậy thì, giúp các em tự tin lớn khôn.',
        'Khóa học được thiết kế đặc biệt cho học sinh từ 9-16 tuổi với hình ảnh minh họa thân thiện, dễ hiểu. Khóa học giúp các em hiểu rõ những biến đổi của cơ thể, biết cách vệ sinh cá nhân đúng cách và hình thành ranh giới an toàn cho bản thân.',
        'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600',
        'CHILD',
        'Chúc mừng bạn đã xuất sắc hoàn thành khóa học! Hãy luôn nhớ rằng cơ thể bạn là duy nhất và đáng trân trọng. Vui lòng dành 2 phút làm khảo sát ngắn để giúp nhóm nghiên cứu hoàn thiện nội dung nhé!',
        TRUE
    ),
    -- Course 2: Dành cho Phụ huynh (PARENT)
    (
        'e0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000002',
        'Nghệ Thuật Đồng Hành & Trò Chuyện Giới Tính Cùng Con',
        'nghe-thuat-dong-hanh-tro-chuyen-gioi-tinh-cung-con',
        'Cung cấp phương pháp sư phạm y khoa giúp phụ huynh gỡ bỏ rào cản e ngại, trở thành điểm tựa tin cậy cho con trẻ.',
        'Nhiều bậc phụ huynh cảm thấy lúng túng khi con hỏi về tình dục hay những thay đổi giới tính. Khóa học này trang bị các kịch bản trò chuyện thực tế theo từng mốc lứa tuổi, cách xử lý tình huống nhạy cảm và kỹ năng bảo vệ con trên môi trường internet.',
        'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=600',
        'PARENT',
        'Cảm ơn quý phụ huynh đã đồng hành cùng chương trình! Sự thấu hiểu của cha mẹ là lá chắn an toàn nhất cho con trẻ.',
        TRUE
    ),
    -- Course 3: Dành cho Cả hai / Toàn diện (BOTH)
    (
        'e0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000002',
        'Kỹ Năng Phòng Chống Xâm Hại & An Toàn Thân Thể Toàn Diện',
        'ky-nang-phong-chong-xam-hai-an-toan-than-the',
        'Quy tắc ranh giới cơ thể, nhận diện hành vi nguy cơ và quy trình xử lý khẩn cấp khi gặp tình huống nguy hiểm.',
        'Khóa học trang bị quy tắc 5 ngón tay mở rộng, nhận diện các hình thức xâm hại thân thể và xâm hại trực tuyến, nguyên tắc "NÓI KHÔNG - RỜI ĐI - KỂ LẠI" cùng các số hotline trợ giúp khẩn cấp quốc gia (111).',
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600',
        'BOTH',
        'Bạn đã hoàn thành khóa học an toàn! Hãy thực hành các kỹ năng này mỗi ngày để bảo vệ chính mình và những người xung quanh.',
        TRUE
    ) ON CONFLICT (id) DO NOTHING;
-- Lessons for Course 1 (Child Course)
INSERT INTO lessons (
        id,
        course_id,
        title,
        content_type,
        video_url,
        content_body,
        order_index,
        duration_minutes
    )
VALUES (
        '1e550000-0000-0000-0000-000000000001',
        'e0000000-0000-0000-0000-000000000001',
        'Bài 1: Cơ thể chúng ta thay đổi như thế nào khi bước vào tuổi dậy thì?',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Tuổi dậy thì là giai đoạn chuyển tiếp kỳ diệu từ trẻ em sang người trưởng thành. 

1. Đối với bạn nữ: Chiều cao phát triển nhanh, ngực bắt đầu phát triển, xuất hiện kinh nguyệt lần đầu.
2. Đối với bạn nam: Xuất hiện vỡ giọng, yết hầu phát triển, cơ bắp săn chắc hơn, hiện tượng mộng tinh sinh lý.

Tất cả những thay đổi này đều hoàn toàn bình thường và là minh chứng cho thấy cơ thể bạn đang lớn lên khỏe mạnh!',
        1,
        15
    ),
    (
        '1e550000-0000-0000-0000-000000000002',
        'e0000000-0000-0000-0000-000000000001',
        'Bài 2: Vệ sinh cá nhân & Chăm sóc cơ thể đúng chuẩn y khoa',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Trong tuổi dậy thì, tuyến mồ hôi và tuyến bã nhờn hoạt động mạnh mẽ hơn:

- Tắm rửa hàng ngày bằng xà phòng dịu nhẹ.
- Vệ sinh vùng kín đúng cách (rửa từ trước ra sau, giữ khô thoáng).
- Cách sử dụng và thay băng vệ sinh mỗi 3-4 giờ đối với bạn nữ.
- Chăm sóc da mặt sạch sẽ, tránh tự ý nặn mụn gây viêm nhiễm.',
        2,
        20
    ),
    (
        '1e550000-0000-0000-0000-000000000003',
        'e0000000-0000-0000-0000-000000000001',
        'Bài 3: Ranh giới cá nhân & Quy tắc 5 ngón tay bảo vệ bản thân',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Mỗi chúng ta đều có quyền bất khả xâm phạm đối với cơ thể mình:

- Ngón cái (Ôm hôn): Bố mẹ, anh chị em ruột.
- Ngón trỏ (Nắm tay): Thầy cô, bạn bè thân, họ hàng.
- Ngón giữa (Bắt tay): Người quen, hàng xóm.
- Ngón áp út (Vẫy tay): Người mới gặp lần đầu.
- Ngón út (Xua tay / Bỏ chạy): Người lạ có hành vi chạm vào vùng đồ bơi hoặc làm em cảm thấy bất an.',
        3,
        25
    ) ON CONFLICT (id) DO NOTHING;
-- Lessons for Course 2 (Parent Course)
INSERT INTO lessons (
        id,
        course_id,
        title,
        content_type,
        video_url,
        content_body,
        order_index,
        duration_minutes
    )
VALUES (
        '1e550000-0000-0000-0000-000000000011',
        'e0000000-0000-0000-0000-000000000002',
        'Bài 1: Phá vỡ rào cản tâm lý e ngại khi trò chuyện cùng con',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Nhiều phụ huynh lo sợ rằng "vẽ đường cho hươu chạy". Tuy nhiên, nghiên cứu khoa học quốc tế chỉ ra rằng: Nếu cha mẹ không vẽ đường đúng, "hươu sẽ chạy vào đường nguy hiểm".

- Sử dụng thuật ngữ giải phẫu học chuẩn xác thay vì dùng từ lóng che đậy.
- Lắng nghe con không phán xét khi con đặt câu hỏi nhạy cảm.',
        1,
        20
    ),
    (
        '1e550000-0000-0000-0000-000000000012',
        'e0000000-0000-0000-0000-000000000002',
        'Bài 2: Nhận biết dấu hiệu xáo trộn tâm lý và tình cảm học đường',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Tuổi dậy thì đi kèm sự biến động hormone dẫn đến cảm xúc thất thường:

- Dấu hiệu trẻ thu mình, thay đổi thói quen sinh hoạt đột ngột.
- Cách xử lý khi phát hiện con có tình cảm rung động đầu đời với bạn khác giới hoặc đồng giới.
- Thiết lập ranh giới an toàn thay vì cấm đoán cực đoan.',
        2,
        25
    ) ON CONFLICT (id) DO NOTHING;
-- Lessons for Course 3 (Safety Course)
INSERT INTO lessons (
        id,
        course_id,
        title,
        content_type,
        video_url,
        content_body,
        order_index,
        duration_minutes
    )
VALUES (
        '1e550000-0000-0000-0000-000000000021',
        'e0000000-0000-0000-0000-000000000003',
        'Bài 1: Vùng nhạy cảm và Nhận diện hành vi xâm hại',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Vùng đồ bơi là vùng riêng tư tuyệt đối của mỗi người. Không ai được phép chạm vào, nhìn vào, hoặc bắt em chạm vào vùng đồ bơi của họ, ngoại trừ bác sĩ khi có sự chứng kiến của cha mẹ.

Nhận diện 4 nhóm hành vi xâm hại: Xâm hại thể chất, lời nói, qua hình ảnh, và quấy rối trực tuyến.',
        1,
        15
    ),
    (
        '1e550000-0000-0000-0000-000000000022',
        'e0000000-0000-0000-0000-000000000003',
        'Bài 2: Nguyên tắc phản ứng 3 bước: NÓI KHÔNG - BỎ ĐI - KỂ LẠI',
        'HYBRID',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        '1. NÓI KHÔNG: Hét to "Không được làm vậy!" một cách dứt khoát.
2. BỎ ĐI: Nhanh chóng chạy đến nơi đông người hoặc tìm kiếm sự trợ giúp.
3. KỂ LẠI: Kể ngay lập tức cho cha mẹ, thầy cô hoặc gọi Tổng đài Quốc gia Bảo vệ Trẻ em 111.

Nhớ rằng: Nếu có chuyện xấu xảy ra, ĐÓ HOÀN TOÀN KHÔNG PHẢI LỖI CỦA BẠN!',
        2,
        20
    ) ON CONFLICT (id) DO NOTHING;
-- ==========================================
-- 7. SEED ENROLLMENTS & PROGRESS (Sample Test Data)
-- ==========================================
-- Phụ huynh đăng ký Course 2 & Course 3
INSERT INTO course_enrollments (id, user_id, course_id, enrolled_at, status)
VALUES (
        '90000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000003',
        'e0000000-0000-0000-0000-000000000002',
        CURRENT_TIMESTAMP,
        'IN_PROGRESS'
    ),
    (
        '90000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000003',
        'e0000000-0000-0000-0000-000000000003',
        CURRENT_TIMESTAMP,
        'IN_PROGRESS'
    ) ON CONFLICT (user_id, course_id) DO NOTHING;
-- Học sinh đăng ký Course 1 & Course 3
INSERT INTO course_enrollments (id, user_id, course_id, enrolled_at, status)
VALUES (
        '90000000-0000-0000-0000-000000000003',
        'd0000000-0000-0000-0000-000000000004',
        'e0000000-0000-0000-0000-000000000001',
        CURRENT_TIMESTAMP,
        'IN_PROGRESS'
    ),
    (
        '90000000-0000-0000-0000-000000000004',
        'd0000000-0000-0000-0000-000000000004',
        'e0000000-0000-0000-0000-000000000003',
        CURRENT_TIMESTAMP,
        'IN_PROGRESS'
    ) ON CONFLICT (user_id, course_id) DO NOTHING;
-- Tiến độ học tập của học sinh ở Course 1 (Đã hoàn thành bài 1)
INSERT INTO lesson_progress (
        id,
        user_id,
        lesson_id,
        is_completed,
        completed_at
    )
VALUES (
        '80000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000004',
        '1e550000-0000-0000-0000-000000000001',
        TRUE,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (user_id, lesson_id) DO NOTHING;
-- ==========================================
-- 8. SEED SITE SETTINGS
-- ==========================================
INSERT INTO site_settings (id, key_name, value_content, description)
VALUES (
        1,
        'platform_name',
        'EduSex VN',
        'Tên nền tảng giáo dục'
    ),
    (
        2,
        'contact_email',
        'hotro@edusex.vn',
        'Email hỗ trợ học viên và phụ huynh'
    ),
    (
        3,
        'emergency_hotline',
        '111',
        'Tổng đài Quốc gia Bảo vệ Trẻ em'
    ),
    (
        4,
        'research_title',
        'Đề tài Nghiên cứu Khoa học Ứng dụng E-learning trong Phổ cập Giáo dục Giới tính tại Việt Nam',
        'Tiêu đề đề tài nghiên cứu'
    ) ON CONFLICT (id) DO
UPDATE
SET value_content = EXCLUDED.value_content;
SELECT setval(
        'site_settings_id_seq',
        (
            SELECT MAX(id)
            FROM site_settings
        )
    );