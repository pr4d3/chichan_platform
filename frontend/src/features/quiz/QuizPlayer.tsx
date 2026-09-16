"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, EmptyState, Spinner } from "@/components/ui";
import {
  SealCheck,
  WarningCircle,
  ClockCountdown,
  ArrowRight,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  Lightbulb,
  ShieldCheck,
  BookOpen,
} from "@phosphor-icons/react";

interface Option {
  id: string;
  option_text: string;
  order_index: number;
}

interface Question {
  id: string;
  question_text: string;
  order_index: number;
  options: Option[];
}

interface QuizData {
  id: string;
  course_id: string;
  lesson_id?: string | null;
  title: string;
  description?: string | null;
  passing_score: number;
  show_correct_answers: boolean;
  max_attempts: number;
  cooldown_minutes: number;
  total_questions: number;
  questions: Question[];
  is_locked: boolean;
  remaining_cooldown_seconds: number;
  attempts_left: number;
  best_score?: number | null;
  has_passed: boolean;
}

interface QuestionResult {
  question_id: string;
  selected_option_id?: string | null;
  is_correct?: boolean | null;
  correct_option_id?: string | null;
  explanation?: string | null;
}

interface SubmissionResult {
  score: number;
  passed: boolean;
  passing_score: number;
  show_correct_answers: boolean;
  attempts_left: number;
  is_locked: boolean;
  remaining_cooldown_seconds: number;
  message: string;
  results?: QuestionResult[] | null;
}

interface QuizPlayerProps {
  courseId: string;
  lessonId?: string | null;
  isFinalQuiz?: boolean;
  onPassed?: () => void;
  onNextLesson?: () => void;
}

export function QuizPlayer({
  courseId,
  lessonId,
  isFinalQuiz = false,
  onPassed,
  onNextLesson,
}: QuizPlayerProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Live countdown timer for Coursera anti-spam lockout
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);

  const fetchQuiz = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const endpoint = isFinalQuiz
        ? `/courses/${courseId}/final-quiz`
        : `/courses/${courseId}/lessons/${lessonId}/quiz`;

      const res = await api.get(endpoint);
      if (res.success && res.data) {
        setQuiz(res.data);
        if (res.data.is_locked && res.data.remaining_cooldown_seconds > 0) {
          setCountdownSeconds(res.data.remaining_cooldown_seconds);
        } else {
          setCountdownSeconds(0);
        }
      } else {
        setQuiz(null);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải bài kiểm tra:", err);
      setQuiz(null);
      setLoadError(err.message || "Lỗi khi tải bài kiểm tra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    setSubmissionResult(null);
    setSelectedAnswers({});
  }, [courseId, lessonId, isFinalQuiz]);

  // Live countdown timer ticker
  useEffect(() => {
    if (countdownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto re-fetch when cooldown expires
          fetchQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (submissionResult) return; // Prevent changing after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    // Check if user answered all questions
    const unansweredCount = quiz.questions.filter((q) => !selectedAnswers[q.id]).length;
    if (unansweredCount > 0) {
      showToast(`Bạn còn ${unansweredCount} câu hỏi chưa trả lời. Vui lòng hoàn thành tất cả các câu trước khi nộp.`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(selectedAnswers).map(([question_id, selected_option_id]) => ({
          question_id,
          selected_option_id,
        })),
      };

      const res = await api.post(`/quizzes/${quiz.id}/submit`, payload);
      if (res.success && res.data) {
        setSubmissionResult(res.data);

        if (res.data.is_locked && res.data.remaining_cooldown_seconds > 0) {
          setCountdownSeconds(res.data.remaining_cooldown_seconds);
        }

        if (res.data.passed) {
          showToast(`Xuất sắc! Bạn đạt ${res.data.score}% và đã vượt qua bài kiểm tra!`, "success");
          if (onPassed) onPassed();
        } else {
          showToast(`Bạn đạt ${res.data.score}%. Cần đạt tối thiểu ${res.data.passing_score}% để qua bài.`, "error");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi nộp bài kiểm tra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmissionResult(null);
    setSelectedAnswers({});
    fetchQuiz();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Spinner size="md" />
        <p className="text-xs text-on-surface-variant font-medium">
          Đang tải bài kiểm tra...
        </p>
      </div>
    );
  }

  if (!quiz) {
    // Lỗi tải (mất mạng / hết quyền): hiển thị trạng thái lỗi kèm nút thử lại
    if (loadError) {
      return (
        <EmptyState
          tone="error"
          icon={<WarningCircle size={32} weight="duotone" />}
          title="Không thể tải bài kiểm tra"
          body={loadError}
          action={{
            label: "Thử lại",
            onClick: () => {
              setLoadError(null);
              fetchQuiz();
            },
          }}
        />
      );
    }
    return null;
  }

  const isLocked = countdownSeconds > 0 || (quiz.is_locked && !quiz.has_passed);

  return (
    <div className="w-full max-w-3xl mx-auto my-8 bg-white/90 backdrop-blur-md rounded-3xl border border-white shadow-md p-6 sm:p-10 space-y-8 animate-fade-in">
      {/* Quiz Header & Coursera Anti-Spam Policy Bar */}
      <div className="space-y-4 border-b border-outline-variant/30 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck size={24} weight="duotone" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                {isFinalQuiz ? "Đánh giá năng lực cuối khóa" : "Kiểm tra kiến thức bài học"}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">
                {quiz.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-surface-container-high text-on-surface font-bold text-xs border border-white">
              Điểm đạt: {quiz.passing_score}%
            </span>
            {quiz.has_passed && (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5">
                <SealCheck size={16} weight="fill" />
                Đã đạt
              </span>
            )}
          </div>
        </div>

        {quiz.description && (
          <p className="text-xs text-on-surface-variant font-light leading-relaxed">
            {quiz.description}
          </p>
        )}

        {/* Anti-spam Attempt Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 text-xs">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <ClockCountdown size={16} weight="duotone" className="text-amber-600" />
            <span>
              Chính sách thử lại: Tối đa <strong>{quiz.max_attempts} lần</strong> (Thời gian chờ: {quiz.cooldown_minutes} phút)
            </span>
          </div>

          <div className="font-bold">
            {isLocked ? (
              <span className="text-red-600 flex items-center gap-1">
                <WarningCircle size={14} weight="bold" /> Tạm khóa chờ mở lượt
              </span>
            ) : (
              <span className="text-primary">
                Lượt thử còn lại: {quiz.attempts_left} / {quiz.max_attempts}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Coursera-style Lockout State Screen */}
      {isLocked && !submissionResult && (
        <div className="p-8 rounded-3xl bg-amber-50/80 border border-amber-300 text-center space-y-4 animate-scale-up">
          <div className="w-14 h-14 mx-auto bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-xs">
            <ClockCountdown size={32} weight="duotone" className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-amber-950">
              Bạn đã sử dụng hết số lần thử cho phép
            </h4>
            <p className="text-xs text-amber-800 max-w-md mx-auto font-light leading-relaxed">
              Theo quy chuẩn chống học vẹt, bạn hãy dành thời gian này để ôn tập lại kiến thức bài giảng. Hệ thống sẽ tự động mở khóa sau:
            </p>
          </div>

          <div className="inline-block px-6 py-2.5 rounded-2xl bg-white border border-amber-300 shadow-sm">
            <span className="font-mono text-2xl font-black text-amber-900 tracking-wider">
              {formatTime(countdownSeconds)}
            </span>
          </div>

          <div className="pt-2">
            <p className="text-[11px] text-amber-700">
              * Đồng hồ sẽ tự động đếm ngược. Khi hết giờ bạn có thể làm lại bài kiểm tra.
            </p>
          </div>
        </div>
      )}

      {/* Questions Form (Visible when not locked, or reviewing submission) */}
      {(!isLocked || submissionResult) && (
        <div className="space-y-8">
          {quiz.questions.map((question, qIdx) => {
            const questionResult = submissionResult?.results?.find(
              (r) => r.question_id === question.id
            );
            const userSelectedOptId = submissionResult
              ? questionResult?.selected_option_id
              : selectedAnswers[question.id];

            return (
              <div
                key={question.id}
                className="p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-4 transition-all"
              >
                {/* Question Label & Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-primary uppercase tracking-wider">
                      Câu {qIdx + 1} / {quiz.questions.length}
                    </span>

                    {/* Submission status badge per question */}
                    {submissionResult && submissionResult.show_correct_answers && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                          questionResult?.is_correct
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {questionResult?.is_correct ? (
                          <>
                            <CheckCircle size={14} weight="fill" />
                            Đúng
                          </>
                        ) : (
                          <>
                            <XCircle size={14} weight="fill" />
                            Chưa chính xác
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-bold text-on-surface leading-snug">
                    {question.question_text}
                  </p>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {question.options.map((option, optIdx) => {
                    const isSelected = userSelectedOptId === option.id;
                    const isCorrectAnswer =
                      submissionResult?.show_correct_answers &&
                      questionResult?.correct_option_id === option.id;
                    const isWrongAnswerSelected =
                      submissionResult?.show_correct_answers &&
                      isSelected &&
                      !questionResult?.is_correct;

                    let optClasses =
                      "border-outline-variant/40 bg-white hover:bg-surface-container hover:border-primary/40";

                    if (isSelected && !submissionResult) {
                      optClasses = "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-semibold";
                    }

                    if (submissionResult && submissionResult.show_correct_answers) {
                      if (isCorrectAnswer) {
                        optClasses = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200";
                      } else if (isWrongAnswerSelected) {
                        optClasses = "border-red-500 bg-red-50 text-red-900 font-medium ring-2 ring-red-200";
                      } else {
                        optClasses = "border-outline-variant/30 opacity-60 bg-white";
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectOption(question.id, option.id)}
                        disabled={!!submissionResult}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 text-xs sm:text-sm cursor-pointer disabled:cursor-default ${optClasses}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-current/30 flex items-center justify-center text-[11px] font-bold shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-relaxed">{option.option_text}</span>
                        </div>

                        {/* Status Icon after submission */}
                        {submissionResult && submissionResult.show_correct_answers && (
                          <div className="shrink-0">
                            {isCorrectAnswer && (
                              <CheckCircle size={20} weight="fill" className="text-emerald-600" />
                            )}
                            {isWrongAnswerSelected && (
                              <XCircle size={20} weight="fill" className="text-red-500" />
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Medical Explanation Box (if teacher enabled show_correct_answers) */}
                {submissionResult &&
                  submissionResult.show_correct_answers &&
                  questionResult?.explanation && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-950 space-y-1.5 animate-fade-in">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800 text-[11px] uppercase tracking-wider">
                        <Lightbulb size={16} weight="duotone" className="text-amber-600" />
                        Lời giải thích y khoa:
                      </div>
                      <p className="font-light leading-relaxed pl-5">
                        {questionResult.explanation}
                      </p>
                    </div>
                  )}
              </div>
            );
          })}

          {/* Submission Result Summary Card */}
          {submissionResult && (
            <div
              className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 animate-scale-up ${
                submissionResult.passed
                  ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                  : "bg-amber-50/90 border-amber-300 text-amber-950"
              }`}
            >
              <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-xs bg-white">
                {submissionResult.passed ? (
                  <SealCheck size={36} weight="duotone" className="text-emerald-600" />
                ) : (
                  <WarningCircle size={36} weight="duotone" className="text-amber-600" />
                )}
              </div>

              <div className="space-y-1">
                <span className="text-3xl font-black font-serif">
                  {submissionResult.score}%
                </span>
                <h4 className="text-lg font-bold">
                  {submissionResult.passed
                    ? "Chúc mừng bạn đã hoàn thành đạt yêu cầu!"
                    : "Bạn chưa đạt điểm số tối thiểu để vượt qua"}
                </h4>
                <p className="text-xs font-light max-w-md mx-auto leading-relaxed">
                  {submissionResult.message}
                </p>
              </div>

              {!submissionResult.show_correct_answers && (
                <div className="p-3 rounded-xl bg-white/80 border border-black/5 text-[11px] text-on-surface-variant font-light max-w-lg mx-auto">
                  * Giáo viên đã ẩn đáp án chi tiết và giải thích cho bài kiểm tra này nhằm bảo mật nội dung học thuật.
                </div>
              )}

              {/* Action Buttons after result */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {!submissionResult.passed && !submissionResult.is_locked && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 rounded-full bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ArrowClockwise size={16} weight="bold" />
                    <span>Làm lại bài kiểm tra (Còn {submissionResult.attempts_left} lượt)</span>
                  </button>
                )}

                {submissionResult.passed && onNextLesson && (
                  <Button
                    size="lg"
                    onClick={onNextLesson}
                    icon={<ArrowRight size={16} weight="bold" />}
                    className="px-8 py-3.5 shadow-md"
                  >
                    <span>{isFinalQuiz ? "Xem Chứng Chỉ Tốt Nghiệp" : "Tiếp tục bài học tiếp theo"}</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Submit Action Bar */}
          {!submissionResult && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <Button
                type="button"
                size="lg"
                loading={submitting}
                onClick={handleSubmit}
                icon={<SealCheck size={18} weight="bold" />}
                className="px-8 py-3.5 shadow-md"
              >
                <span>{submitting ? "Đang chấm điểm..." : "Nộp bài kiểm tra"}</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
