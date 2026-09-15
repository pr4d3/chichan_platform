"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  X,
  Plus,
  Trash,
  CheckCircle,
  Question,
  ToggleLeft,
  ToggleRight,
  ClockCountdown,
  ShieldCheck,
  WarningCircle,
  FloppyDisk,
  ArrowDown,
  ArrowUp,
} from "@phosphor-icons/react";

interface OptionDraft {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface QuestionDraft {
  question_text: string;
  explanation?: string;
  order_index: number;
  options: OptionDraft[];
}

interface QuizEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  lessonId?: string | null;
  lessonTitle?: string;
  isFinalQuiz?: boolean;
  isStandaloneQuiz?: boolean;
  existingLessonCount?: number;
  lessonOrderIndex?: number;
  onQuizSaved?: () => void;
}

export function QuizEditorModal({
  isOpen,
  onClose,
  courseId,
  lessonId,
  lessonTitle,
  isFinalQuiz = false,
  isStandaloneQuiz = true,
  existingLessonCount = 0,
  lessonOrderIndex,
  onQuizSaved,
}: QuizEditorModalProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState<number>(80);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(true);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(15);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchExistingQuiz = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/courses/${courseId}/quizzes/manage`);
        if (res.success && Array.isArray(res.data)) {
          const match = res.data.find((q: any) =>
            isFinalQuiz ? q.is_final : q.lesson_id === lessonId
          );

          if (match) {
            setQuizId(match.quiz_id);
            // Fetch detailed quiz with questions and options
            const detailRes = await api.get(
              `/courses/${courseId}/quizzes/${match.quiz_id}/manage`
            );
            if (detailRes.success && detailRes.data) {
              const qData = detailRes.data;
              setTitle(qData.title || "");
              setDescription(qData.description || "");
              setPassingScore(qData.passing_score ?? 80);
              setShowCorrectAnswers(qData.show_correct_answers ?? true);
              setMaxAttempts(qData.max_attempts ?? 3);
              setCooldownMinutes(qData.cooldown_minutes ?? 15);

              const formattedQuestions: QuestionDraft[] = (
                qData.questions || []
              ).map((q: any, qIdx: number) => ({
                question_text: q.question_text || "",
                explanation: q.explanation || "",
                order_index: q.order_index ?? qIdx + 1,
                options: (q.options || []).map((o: any, oIdx: number) => ({
                  option_text: o.option_text || "",
                  is_correct: !!o.is_correct,
                  order_index: o.order_index ?? oIdx + 1,
                })),
              }));
              setQuestions(formattedQuestions);
              return;
            }
          }
        }

        // Initialize default empty template
        setQuizId(null);
        setTitle(
          isFinalQuiz
            ? "Bài đánh giá tổng kết cuối khóa"
            : lessonTitle
              ? lessonTitle
              : "Bài kiểm tra trắc nghiệm"
        );
        setDescription(
          isFinalQuiz
            ? "Vui lòng trả lời các câu hỏi để đánh giá toàn diện năng lực và nhận chứng nhận hoàn thành khóa học."
            : "Trả lời ngắn gọn các câu hỏi trắc nghiệm để củng cố kiến thức đã học."
        );
        setPassingScore(80);
        setShowCorrectAnswers(true);
        setMaxAttempts(3);
        setCooldownMinutes(15);
        setQuestions([
          {
            question_text: "",
            explanation: "",
            order_index: 1,
            options: [
              { option_text: "", is_correct: true, order_index: 1 },
              { option_text: "", is_correct: false, order_index: 2 },
              { option_text: "", is_correct: false, order_index: 3 },
              { option_text: "", is_correct: false, order_index: 4 },
            ],
          },
        ]);
      } catch (err: any) {
        console.error("Lỗi tải quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingQuiz();
  }, [isOpen, courseId, lessonId, isFinalQuiz, lessonTitle]);

  const handleAddQuestion = () => {
    const newIdx = questions.length + 1;
    setQuestions([
      ...questions,
      {
        question_text: "",
        explanation: "",
        order_index: newIdx,
        options: [
          { option_text: "", is_correct: true, order_index: 1 },
          { option_text: "", is_correct: false, order_index: 2 },
          { option_text: "", is_correct: false, order_index: 3 },
          { option_text: "", is_correct: false, order_index: 4 },
        ],
      },
    ]);
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (questions.length <= 1) {
      showToast("Bài kiểm tra cần ít nhất 1 câu hỏi", "error");
      return;
    }
    const updated = questions.filter((_, idx) => idx !== qIndex);
    setQuestions(
      updated.map((q, idx) => ({ ...q, order_index: idx + 1 }))
    );
  };

  const handleQuestionTextChange = (qIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].question_text = val;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].explanation = val;
    setQuestions(updated);
  };

  const handleOptionTextChange = (
    qIndex: number,
    optIndex: number,
    val: string
  ) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].option_text = val;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === optIndex,
    }));
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length >= 6) {
      showToast("Tối đa 6 lựa chọn cho một câu hỏi", "error");
      return;
    }
    const newIdx = updated[qIndex].options.length + 1;
    updated[qIndex].options.push({
      option_text: "",
      is_correct: false,
      order_index: newIdx,
    });
    setQuestions(updated);
  };

  const handleDeleteOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length <= 2) {
      showToast("Mỗi câu hỏi cần ít nhất 2 phương án lựa chọn", "error");
      return;
    }
    const wasCorrect = updated[qIndex].options[optIndex].is_correct;
    updated[qIndex].options = updated[qIndex].options.filter(
      (_, idx) => idx !== optIndex
    );
    // If we deleted the correct option, assign correct to the first option
    if (wasCorrect && updated[qIndex].options.length > 0) {
      updated[qIndex].options[0].is_correct = true;
    }
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Vui lòng nhập tiêu đề bài kiểm tra", "error");
      return;
    }

    if (questions.length === 0) {
      showToast("Vui lòng thêm ít nhất một câu hỏi", "error");
      return;
    }

    // Validate questions and options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        showToast(`Câu hỏi ${i + 1} chưa có nội dung câu hỏi`, "error");
        return;
      }
      if (q.options.length < 2) {
        showToast(`Câu hỏi ${i + 1} phải có ít nhất 2 đáp án lựa chọn`, "error");
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].option_text.trim()) {
          showToast(`Lựa chọn ${j + 1} ở câu hỏi ${i + 1} chưa có nội dung`, "error");
          return;
        }
      }
      const hasCorrect = q.options.some((o) => o.is_correct);
      if (!hasCorrect) {
        showToast(`Câu hỏi ${i + 1} chưa được chọn đáp án đúng`, "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      let targetLessonId = isFinalQuiz ? null : lessonId || null;

      if (isStandaloneQuiz) {
        if (!targetLessonId) {
          // Create new Lesson of type QUIZ in the course syllabus
          const lessonRes = await api.post(`/courses/${courseId}/lessons`, {
            title: title.trim(),
            content_type: "QUIZ",
            order_index: (existingLessonCount || 0) + 1,
            duration_minutes: 15,
            video_url: null,
            content_body: null,
          });
          if (lessonRes.success && lessonRes.data?.lesson_id) {
            targetLessonId = lessonRes.data.lesson_id;
          }
        } else {
          // Keep lesson title in sync with quiz title
          try {
            await api.put(`/courses/${courseId}/lessons/${targetLessonId}`, {
              title: title.trim(),
              content_type: "QUIZ",
              order_index: lessonOrderIndex || 1,
              duration_minutes: 15,
              video_url: null,
              content_body: null,
            });
          } catch (e) {
            // non-fatal sync
          }
        }
      }

      const payload = {
        lesson_id: targetLessonId,
        title: title.trim(),
        description: description.trim() || null,
        passing_score: Number(passingScore) || 80,
        show_correct_answers: showCorrectAnswers,
        max_attempts: Number(maxAttempts) || 3,
        cooldown_minutes: Number(cooldownMinutes) || 15,
        questions: questions.map((q, qIdx) => ({
          question_text: q.question_text.trim(),
          explanation: q.explanation?.trim() || null,
          order_index: qIdx + 1,
          options: q.options.map((o, oIdx) => ({
            option_text: o.option_text.trim(),
            is_correct: o.is_correct,
            order_index: oIdx + 1,
          })),
        })),
      };

      const res = await api.post(`/courses/${courseId}/quizzes`, payload);
      if (res.success) {
        showToast("Lưu bài kiểm tra trắc nghiệm thành công!", "success");
        if (onQuizSaved) onQuizSaved();
        onClose();
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi lưu bài kiểm tra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizId && !lessonId) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài kiểm tra này?")) return;

    setSubmitting(true);
    try {
      if (isStandaloneQuiz && lessonId) {
        // Deleting the standalone quiz lesson will cascade delete the quiz
        const res = await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
        if (res.success) {
          showToast("Đã xóa bài kiểm tra khỏi đề cương thành công!", "success");
          if (onQuizSaved) onQuizSaved();
          onClose();
          return;
        }
      }

      if (quizId) {
        const res = await api.delete(`/quizzes/${quizId}`);
        if (res.success) {
          showToast("Đã xóa bài kiểm tra thành công!", "success");
          if (onQuizSaved) onQuizSaved();
          onClose();
        }
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa bài kiểm tra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-white/80 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Question size={22} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-on-surface">
                {isFinalQuiz
                  ? "Cấu hình Bài kiểm tra cuối khóa"
                  : `Cấu hình Quiz bài học`}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                {isFinalQuiz
                  ? "Đánh giá năng lực tổng kết để cấp chứng nhận hoàn thành"
                  : lessonTitle || "Kiểm tra kiến thức bài học"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">
              Đang tải dữ liệu bài kiểm tra...
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-on-surface"
          >
            {/* General Settings Card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 space-y-4">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <ShieldCheck size={18} weight="duotone" className="text-primary" />
                Cài đặt bài kiểm tra
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-on-surface-variant">
                    Tiêu đề bài kiểm tra <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Quiz ôn tập bài học..."
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-on-surface-variant">
                    Mô tả hoặc hướng dẫn làm bài
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nhập hướng dẫn làm bài cho học sinh..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant">
                    Điểm đạt yêu cầu (Passing score: %)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="w-24 px-3 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-bold"
                    />
                    <span className="text-on-surface-variant text-xs font-medium">
                      % (Tối thiểu để tính hoàn thành)
                    </span>
                  </div>
                </div>

                {/* Switch: Show Correct Answers */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-outline-variant/30">
                  <div className="space-y-0.5">
                    <p className="font-bold text-on-surface">Hiển thị đáp án &amp; giải thích</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Học sinh thấy giải thích y khoa sau khi nộp
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                    className="text-2xl text-primary focus:outline-none cursor-pointer"
                  >
                    {showCorrectAnswers ? (
                      <ToggleRight size={32} weight="fill" />
                    ) : (
                      <ToggleLeft size={32} weight="fill" className="text-zinc-400" />
                    )}
                  </button>
                </div>

                {/* Coursera-style Anti-Spam settings */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 md:col-span-2 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                    <ClockCountdown size={18} weight="duotone" className="text-amber-700" />
                    Chính sách chống spam làm lại (Chuẩn Coursera)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-amber-950 text-[11px]">
                        Số lượt thử tối đa trước khi khóa:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={maxAttempts}
                          onChange={(e) => setMaxAttempts(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-bold text-xs"
                        />
                        <span className="text-amber-800 text-[11px]">lượt</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-amber-950 text-[11px]">
                        Thời gian chờ nếu hết lượt (Cooldown):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={cooldownMinutes}
                          onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                          className="w-20 px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-bold text-xs"
                        />
                        <span className="text-amber-800 text-[11px]">phút</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-800 italic">
                    * Nếu học sinh làm trượt liên tiếp {maxAttempts} lần, hệ thống sẽ tạm khóa và hiển thị đồng hồ đếm ngược {cooldownMinutes} phút yêu cầu ôn tập lại bài trước khi được thử tiếp.
                  </p>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-on-surface">
                  Danh sách câu hỏi ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} weight="bold" />
                  <span>Thêm câu hỏi</span>
                </button>
              </div>

              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl bg-white border border-outline-variant/40 shadow-xs space-y-4 relative"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                    <span className="font-bold text-xs text-primary uppercase tracking-wider">
                      Câu hỏi {qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa câu hỏi này"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="space-y-1">
                    <label className="font-bold text-on-surface-variant text-[11px]">
                      Nội dung câu hỏi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={q.question_text}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      placeholder="Ví dụ: Ranh giới vùng kín của cơ thể gồm những khu vực nào?"
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                      required
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-on-surface-variant text-[11px]">
                        Các phương án lựa chọn (Click chọn nút tròn để đánh dấu đáp án đúng)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="text-primary hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Plus size={12} weight="bold" /> Thêm lựa chọn
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(qIdx, optIdx)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                              opt.is_correct
                                ? "border-primary bg-primary text-white"
                                : "border-outline-variant hover:border-primary"
                            }`}
                            title={opt.is_correct ? "Đáp án đúng" : "Đặt làm đáp án đúng"}
                          >
                            {opt.is_correct && <CheckCircle size={14} weight="fill" />}
                          </button>
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) =>
                              handleOptionTextChange(qIdx, optIdx, e.target.value)
                            }
                            placeholder={`Phương án ${String.fromCharCode(65 + optIdx)}...`}
                            className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                              opt.is_correct
                                ? "border-primary/60 bg-primary/5 font-semibold text-primary"
                                : "border-outline-variant/40"
                            }`}
                            required
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(qIdx, optIdx)}
                              className="p-1 rounded-md text-on-surface-variant hover:text-red-500 transition-colors"
                              title="Xóa lựa chọn"
                            >
                              <X size={14} weight="bold" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation Field */}
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-on-surface-variant text-[11px]">
                      Lời giải thích y khoa chi tiết (Hiển thị sau khi nộp bài)
                    </label>
                    <textarea
                      value={q.explanation || ""}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      placeholder="Giải thích vì sao đáp án này đúng theo kiến thức y khoa..."
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between gap-3">
              {quizId ? (
                <button
                  type="button"
                  onClick={handleDeleteQuiz}
                  disabled={submitting}
                  className="px-4 py-2 rounded-full text-red-600 hover:bg-red-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Xóa bài kiểm tra
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant font-bold text-xs hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-xs hover:opacity-95 shadow-sm transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <FloppyDisk size={16} weight="bold" />
                      <span>Lưu bài kiểm tra</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
