import asyncio
import os
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.append(backend_dir)

# Dùng chung nguồn cấu hình duy nhất với app (core.config) thay vì parse .env bằng tay
from core.config import settings

DATABASE_URL = settings.DATABASE_URL

print(f"Connecting to database: {DATABASE_URL[:35]}...")

async def apply_quiz_tables():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        print("Creating table quizzes...")
        await conn.execute(text("""
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
        """))

        print("Creating table quiz_questions...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS quiz_questions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                explanation TEXT,
                order_index INTEGER NOT NULL DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))

        print("Creating table quiz_question_options...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS quiz_question_options (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
                option_text TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL DEFAULT FALSE,
                order_index INTEGER NOT NULL DEFAULT 1
            );
        """))

        print("Creating table quiz_submissions...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS quiz_submissions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
                score INTEGER NOT NULL,
                passed BOOLEAN NOT NULL DEFAULT FALSE,
                answers JSONB,
                submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """))

        print("Creating indexes...")
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_quizzes_course_lesson ON quizzes(course_id, lesson_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_order ON quiz_questions(quiz_id, order_index);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_quiz_options_question_order ON quiz_question_options(question_id, order_index);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id, submitted_at DESC);"))

    await engine.dispose()
    print("All quiz tables and indexes created successfully!")

if __name__ == "__main__":
    asyncio.run(apply_quiz_tables())
