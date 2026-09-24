-- ============================================================================
-- PROJECT: SEXED PLATFORM
-- SUPABASE DATABASE SCHEMA
-- ============================================================================

-- Bật extension pgcrypto hoặc uuid-ossp (Supabase mặc định hỗ trợ)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. AUTH & USER PROFILES
-- ==========================================

-- Bảng Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Bảng Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng User Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng User Profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    avatar_data BYTEA,
    gender VARCHAR(20),
    date_of_birth DATE,
    phone_number VARCHAR(20),
    bio TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. COURSE & LEARNING PROGRESS
-- ==========================================

-- Bảng Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description VARCHAR(500),
    description TEXT,
    thumbnail_url VARCHAR(500),
    target_audience VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    learning_objectives TEXT,
    outro_content TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Lessons
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'HYBRID',
    video_url VARCHAR(500),
    content_body TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Course Enrollments
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    UNIQUE (user_id, course_id)
);

-- Bảng Lesson Progress
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, lesson_id)
);

-- ==========================================
-- 3. FORUM & COMMUNITY
-- ==========================================

-- Bảng Forum Categories
CREATE TABLE forum_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Forum Posts
CREATE TABLE forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id INTEGER NOT NULL REFERENCES forum_categories(id),
    author_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    views_count INTEGER NOT NULL DEFAULT 0,
    likes_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    moderated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Forum Comments
CREATE TABLE forum_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    parent_comment_id UUID REFERENCES forum_comments(id),
    content TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
    moderated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Forum Post Likes (bổ sung 2026-09: bảng đã tồn tại trên Supabase từ trước
-- nhưng schema.sql trước đây thiếu — đồng bộ qua database/apply_schema_sync.py).
-- Chủ ý dùng gen_random_uuid() (khác style uuid_generate_v4() ở các bảng trên)
-- để khớp y hệt định nghĩa đang chạy trên live; hàm thuộc lõi PostgreSQL 13+.
CREATE TABLE IF NOT EXISTS forum_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (post_id, user_id)
);

-- ==========================================
-- 4. SYSTEM & GENERAL PAGES
-- ==========================================

-- Bảng Site Settings
CREATE TABLE site_settings (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value_content TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. INITIAL SEED DATA
-- ==========================================

-- Insert Roles
INSERT INTO roles (role_code, role_name, description) VALUES
    ('ADMIN', 'Quản trị viên', 'Quản trị hệ thống, cấp quyền giảng viên, kiểm duyệt diễn đàn'),
    ('INSTRUCTOR', 'Giảng viên', 'Giảng viên, tạo và quản lý khóa học, bài giảng'),
    ('STUDENT_PARENT', 'Phụ huynh', 'Học viên đối tượng Phụ huynh, học nội dung đồng hành cùng con'),
    ('STUDENT_CHILD', 'Trẻ nhỏ', 'Học viên đối tượng Trẻ nhỏ, tiếp cận bài học sinh động');

-- ==========================================
-- 6. AI ROLEPLAY & RAG SERVICE
-- ==========================================

-- Bật extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Bảng AI Scenarios (4 kịch bản phòng chơi)
CREATE TABLE IF NOT EXISTS ai_scenarios (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    npc_name VARCHAR(100) NOT NULL,
    npc_avatar_url VARCHAR(500),
    initial_score INTEGER NOT NULL DEFAULT 50,
    target_audience VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Mở rộng 2026-09: mô tả kịch bản + tin nhắn mở đầu (đồng bộ models/ai_scenario.py)
    description TEXT,
    guide_script TEXT,
    first_message_sender VARCHAR(20) NOT NULL DEFAULT 'USER',
    opening_message TEXT,
    gender_info VARCHAR(50)
);

-- Bảng AI Sessions (Lưu phiên chơi của người dùng)
CREATE TABLE IF NOT EXISTS ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER NOT NULL REFERENCES ai_scenarios(id) ON DELETE CASCADE,
    current_score INTEGER NOT NULL DEFAULT 50,
    current_emotion VARCHAR(30) NOT NULL DEFAULT 'neutral',
    recent_summary TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng AI Messages (Lưu lịch sử tin nhắn)
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL,
    dialogue TEXT NOT NULL,
    action VARCHAR(255),
    emotion VARCHAR(30),
    score_change INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng AI Knowledge Vectors (Kho tri thức phục vụ RAG)
CREATE TABLE IF NOT EXISTS ai_knowledge_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    content_chunk TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng AI Game Evaluations (Đánh giá kết quả cuối màn chơi)
CREATE TABLE IF NOT EXISTS ai_game_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER NOT NULL REFERENCES ai_scenarios(id) ON DELETE CASCADE,
    final_score INTEGER NOT NULL,
    result_outcome VARCHAR(50) NOT NULL,
    total_turns INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    ai_feedback_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chỉ mục B-Tree truyền thống
CREATE INDEX IF NOT EXISTS idx_ai_messages_session_created ON ai_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_status ON ai_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_evaluations_scenario ON ai_game_evaluations(scenario_id, result_outcome);

-- Chỉ mục HNSW cho pgvector
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_vectors_embedding ON ai_knowledge_vectors USING hnsw (embedding vector_cosine_ops);

-- ==========================================
-- 5. QUIZZES & ASSESSMENTS (LESSON & FINAL)
-- ==========================================

-- Bảng Quizzes (Hỗ trợ Quiz bài học & Quiz cuối khóa)
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    passing_score INTEGER NOT NULL DEFAULT 80,
    show_correct_answers BOOLEAN NOT NULL DEFAULT TRUE,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    cooldown_minutes INTEGER NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    explanation TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Quiz Question Options
CREATE TABLE IF NOT EXISTS quiz_question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 1
);

-- Bảng Quiz Submissions (Lưu lịch sử nộp bài và kết quả)
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    passed BOOLEAN NOT NULL DEFAULT FALSE,
    answers JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_lesson ON quizzes(course_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_order ON quiz_question_options(question_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id, submitted_at DESC);

-- ==========================================
-- 6. INDEXES TỐI ƯU TRUY VẤN
-- ==========================================
-- Thêm 2026-09: tối ưu truy vấn (xem apply_indexes.py)
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_status ON forum_comments(post_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_status_created ON forum_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category_status_created ON forum_posts(category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);


