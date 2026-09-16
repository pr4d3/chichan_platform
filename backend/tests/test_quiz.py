import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


from core.database import AsyncSessionLocal
from models.course import Course
from models.lesson import Lesson
from models.user import User
from models.quiz import Quiz
from services import quiz_service
from schemas.quiz_schema import QuizCreateOrUpdate, QuestionCreate, OptionCreate, QuizSubmitRequest, AnswerSubmitItem

async def test_quiz_flow():
    async with AsyncSessionLocal() as db:
        # Find an instructor and a course
        course_stmt = select(Course).limit(1)
        course_res = await db.execute(course_stmt)
        course = course_res.scalars().first()
        if not course:
            print("No course found in database to test with.")
            return

        instructor_id = course.instructor_id
        course_id = course.id
        lesson = course.lessons[0] if course.lessons else None

        print(f"Found course: {course.title} (ID: {course_id})")
        if lesson:
            print(f"Testing Lesson Quiz creation on lesson: {lesson.title} (ID: {lesson.id})")

            # 1. Create a Lesson Quiz
            lesson_quiz_data = QuizCreateOrUpdate(
                lesson_id=lesson.id,
                title=f"Quiz kiểm tra: {lesson.title}",
                description="Trả lời các câu hỏi để kiểm tra độ hiểu bài",
                passing_score=80,
                show_correct_answers=True,
                max_attempts=3,
                cooldown_minutes=15,
                questions=[
                  QuestionCreate(
                    question_text="Vùng kín cơ thể con người có được phép cho người lạ tùy tiện chạm vào không?",
                    explanation="Theo chuẩn y khoa và quy tắc đồ lót, không ai được phép chạm vào vùng kín trừ bác sĩ/cha mẹ khi khám bệnh có sự đồng ý.",
                    order_index=1,
                    options=[
                      OptionCreate(option_text="Tuyệt đối không được", is_correct=True, order_index=1),
                      OptionCreate(option_text="Được nếu người đó là người quen", is_correct=False, order_index=2),
                      OptionCreate(option_text="Được nếu họ cho quà", is_correct=False, order_index=3),
                    ]
                  ),
                  QuestionCreate(
                    question_text="Khi cảm thấy không an toàn hoặc có người chạm vào vùng riêng tư, em cần làm gì?",
                    explanation="Quy tắc 3 bước an toàn: Nói KHÔNG thật dứt khoát, BỎ CHẠY đến nơi an toàn, và KỂ LẠI cho người lớn tin cậy.",
                    order_index=2,
                    options=[
                      OptionCreate(option_text="Giữ im lặng vì sợ hãi", is_correct=False, order_index=1),
                      OptionCreate(option_text="Hét to 'KHÔNG', bỏ chạy và kể ngay với người lớn tin cậy", is_correct=True, order_index=2),
                      OptionCreate(option_text="Chờ xem họ làm gì tiếp theo", is_correct=False, order_index=3),
                    ]
                  )
                ]
            )

            created_lq = await quiz_service.create_or_update_quiz(
                db=db,
                instructor_id=instructor_id,
                course_id=course_id,
                data=lesson_quiz_data,
                is_admin=True
            )
            print(f"Lesson quiz created successfully! Quiz ID: {created_lq.id}, Questions: {len(created_lq.questions)}")

            # 2. Test Student View
            student_view = await quiz_service.get_quiz_student_view(
                db=db,
                user_id=instructor_id,
                lesson_id=lesson.id,
                course_id=course_id
            )
            assert student_view is not None
            print("Student view fetched successfully!")
            print(f"Student questions count: {len(student_view.questions)}")
            # Verify options do NOT leak is_correct
            for q in student_view.questions:
                for opt in q.options:
                    assert not hasattr(opt, 'is_correct'), "Security failure: is_correct leaked in student view!"
            print("Security check passed: is_correct is NOT leaked to students before submission.")

            # 3. Test Student Submission (Pass)
            q1 = student_view.questions[0]
            q2 = student_view.questions[1]
            # Pick options
            opt1_id = q1.options[0].id
            opt2_id = q2.options[1].id

            submit_res = await quiz_service.submit_quiz(
                db=db,
                user_id=instructor_id,
                quiz_id=student_view.id,
                data=QuizSubmitRequest(
                    answers=[
                        AnswerSubmitItem(question_id=q1.id, selected_option_id=opt1_id),
                        AnswerSubmitItem(question_id=q2.id, selected_option_id=opt2_id),
                    ]
                )
            )
            print(f"Submission result: Score = {submit_res.score}%, Passed = {submit_res.passed}")
            assert submit_res.score == 100, f"Expected 100, got {submit_res.score}"
            assert submit_res.passed is True

        # 4. Create Final Course Quiz
        final_quiz_data = QuizCreateOrUpdate(
            lesson_id=None,
            title="Bài kiểm tra đánh giá năng lực cuối khóa",
            description="Đánh giá tổng hợp kiến thức toàn khóa học",
            passing_score=80,
            show_correct_answers=False, # Test show_correct_answers=False mode
            max_attempts=3,
            cooldown_minutes=15,
            questions=[
              QuestionCreate(
                question_text="Tuổi dậy thì ở nam và nữ thường bắt đầu trong khoảng độ tuổi nào?",
                explanation="Tuổi dậy thì trung bình bắt đầu từ 9-14 tuổi ở nữ và 10-15 tuổi ở nam.",
                order_index=1,
                options=[
                  OptionCreate(option_text="9 - 14 tuổi ở nữ, 10 - 15 tuổi ở nam", is_correct=True, order_index=1),
                  OptionCreate(option_text="18 - 20 tuổi", is_correct=False, order_index=2),
                  OptionCreate(option_text="Dưới 5 tuổi", is_correct=False, order_index=3),
                ]
              )
            ]
        )

        created_fq = await quiz_service.create_or_update_quiz(
            db=db,
            instructor_id=instructor_id,
            course_id=course_id,
            data=final_quiz_data,
            is_admin=True
        )
        print(f"Final course quiz created successfully! ID: {created_fq.id}")

        # Test submit on final quiz with show_correct_answers=False
        fq_student_view = await quiz_service.get_quiz_student_view(
            db=db,
            user_id=instructor_id,
            course_id=course_id,
            is_final=True
        )
        assert fq_student_view is not None
        fq_submit = await quiz_service.submit_quiz(
            db=db,
            user_id=instructor_id,
            quiz_id=fq_student_view.id,
            data=QuizSubmitRequest(
                answers=[
                    AnswerSubmitItem(
                        question_id=fq_student_view.questions[0].id,
                        selected_option_id=fq_student_view.questions[0].options[0].id
                    )
                ]
            )
        )
        print(f"Final Quiz submission: Score = {fq_submit.score}%, show_correct_answers = {fq_submit.show_correct_answers}")
        assert fq_submit.results is None, "Results/explanations should be hidden when show_correct_answers is False!"
        print("Show answers privacy toggle check passed: explanations and correct answers are hidden when teacher disabled it!")

        print("\nALL BACKEND QUIZ TESTS PASSED 100%!")

if __name__ == "__main__":
    asyncio.run(test_quiz_flow())
