"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LearnPageSkeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

// Các khối nặng chỉ render có điều kiện nên tải động (ssr:false) để giảm first-load bundle
const VideoPlayer = dynamic(
  () =>
    import("@/app/courses/[courseId]/learn/_components/VideoPlayer").then(
      (m) => m.VideoPlayer,
    ),
  {
    ssr: false,
    // Skeleton hiển thị khi player đang tải
    loading: () => (
      <div className="w-full h-full min-h-[360px] max-h-[calc(100vh-210px)] bg-black rounded-none flex items-center justify-center">
        <Spinner size="md" tone="white" />
      </div>
    ),
  },
);
const CourseGraduationModal = dynamic(
  () =>
    import("@/app/courses/[courseId]/learn/_components/CourseGraduationModal").then(
      (m) => m.CourseGraduationModal,
    ),
  { ssr: false },
);
const QuizPlayer = dynamic(
  () => import("@/features/quiz/QuizPlayer").then((m) => m.QuizPlayer),
  { ssr: false },
);
import {
  WarningCircle,
  ArrowLeft,
  Play,
  Video,
  Article,
  Info,
  ArrowRight,
  GraduationCap,
  CheckCircle,
  Question,
  Lock,
  ShieldCheck,
  Headphones,
  List,
  X,
} from "@phosphor-icons/react";

interface Lesson {
  lesson_id: string;
  order_index: number;
  title: string;
  content_type: "VIDEO" | "TEXT" | "HYBRID" | "QUIZ" | "AUDIO" | "NOTEBOOKLM";
  video_url: string | null;
  content_body: string | null;
  is_completed: boolean;
  has_quiz?: boolean;
  quiz_id?: string | null;
  is_quiz_passed?: boolean;
}

function getCleanLessonTitle(title: string): string {
  if (!title) return "";
  const cleaned = title.replace(/^(bài\s*\d+[\s:.-]*|\d+[\s:.-]+)/i, "").trim();
  return cleaned || title;
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const courseId = params.courseId as string;

  const [learnData, setLearnData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lessonTab, setLessonTab] = useState<"content" | "quiz">("content");
  const [completing, setCompleting] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [outroInfo, setOutroInfo] = useState<any>(null);
  const [isViewingFinalQuiz, setIsViewingFinalQuiz] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!courseId) return;
    fetchLearningRoom();
  }, [courseId]);

  const fetchLearningRoom = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/learn`);
      if (res.success) {
        setLearnData(res.data);

        // Resume Learning:
        // 1. Kiểm tra query param ?lesson=
        const targetLessonId = searchParams.get("lesson");
        if (targetLessonId && res.data.lessons) {
          const foundIdx = res.data.lessons.findIndex(
            (l: Lesson) => l.lesson_id === targetLessonId,
          );
          if (foundIdx !== -1) {
            setActiveIdx(foundIdx);
            return;
          }
        }

        // 2. Tự động nhảy tới bài đầu tiên chưa hoàn thành
        if (res.data.lessons && res.data.lessons.length > 0) {
          const firstUncompleted = res.data.lessons.findIndex(
            (l: Lesson) => !l.is_completed,
          );
          if (firstUncompleted !== -1) {
            setActiveIdx(firstUncompleted);
          } else {
            // Đã hoàn thành tất cả: nếu có final quiz và chưa pass thì mở final quiz, không thì ở bài cuối
            if (res.data.has_final_quiz && !res.data.is_final_quiz_passed) {
              setIsViewingFinalQuiz(true);
            } else {
              setActiveIdx(res.data.lessons.length - 1);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải phòng học");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = (idx: number) => {
    if (idx >= 0 && learnData?.lessons && idx < learnData.lessons.length) {
      setIsViewingFinalQuiz(false);
      setShowNotes(false);
      setLessonTab("content");
      setActiveIdx(idx);

      const targetLesson = learnData.lessons[idx];
      if (targetLesson?.lesson_id && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("lesson", targetLesson.lesson_id);
        window.history.replaceState({}, "", url.toString());
      }

      // Cuộn lên đầu
      if (typeof window !== "undefined") {
        const mainContainer = document.getElementById("learn-main-content");
        if (mainContainer) {
          mainContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const triggerGraduationModal = async () => {
    try {
      const outroRes = await api.get(`/courses/${courseId}/outro`);
      if (outroRes.success) {
        setOutroInfo(outroRes.data);
      }
    } catch (e) {
      console.error("Lỗi khi tải thông tin tốt nghiệp:", e);
    }
    setCompletionModalOpen(true);
  };

  const handleLessonQuizPassed = async (lessonId: string) => {
    if (!learnData || !learnData.lessons) return;

    // Gửi request API ghi nhận hoàn thành bài học vào Database ngay khi pass Quiz
    try {
      const res = await api.post(
        `/users/courses/${courseId}/lessons/${lessonId}/complete`,
        {},
      );
      const newProgress = res.success
        ? res.data.progress_percentage
        : learnData.progress_percentage;

      const updatedLessons = learnData.lessons.map((l: Lesson) =>
        l.lesson_id === lessonId
          ? { ...l, is_quiz_passed: true, is_completed: true }
          : l,
      );

      setLearnData({
        ...learnData,
        progress_percentage: newProgress,
        lessons: updatedLessons,
      });

      const isLast = activeIdx === updatedLessons.length - 1;
      if (isLast) {
        if (learnData.has_final_quiz && !learnData.is_final_quiz_passed) {
          showToast(
            "Bạn đã hoàn thành bài học cuối cùng! Hãy tiến hành làm Quiz cuối khóa để nhận chứng chỉ.",
            "success",
          );
          setIsViewingFinalQuiz(true);
        } else {
          showToast("Chúc mừng bạn đã hoàn thành khóa học!", "success");
          await triggerGraduationModal();
        }
      } else {
        showToast(
          "Tuyệt vời! Bạn đã vượt qua bài kiểm tra và hoàn thành bài học.",
          "success",
        );
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu tiến độ bài học vào database:", err);
      // Vẫn cập nhật local state để học viên không bị chặn cục bộ
      const updatedLessons = learnData.lessons.map((l: Lesson) =>
        l.lesson_id === lessonId
          ? { ...l, is_quiz_passed: true, is_completed: true }
          : l,
      );
      setLearnData({
        ...learnData,
        lessons: updatedLessons,
      });
    }
  };

  const handleFinalQuizPassed = () => {
    setLearnData((prev: any) => ({ ...prev, is_final_quiz_passed: true }));
    showToast(
      "Chúc mừng bạn đã xuất sắc vượt qua bài kiểm tra cuối khóa!",
      "success",
    );
    triggerGraduationModal();
  };

  const handleNextOrComplete = async () => {
    if (!learnData || !learnData.lessons) return;

    if (isViewingFinalQuiz) {
      if (learnData.is_final_quiz_passed) {
        triggerGraduationModal();
      } else {
        showToast(
          "Vui lòng làm đạt bài kiểm tra cuối khóa để nhận chứng nhận!",
          "error",
        );
      }
      return;
    }

    const isLastLesson = activeIdx === learnData.lessons.length - 1;
    const lesson = learnData.lessons[activeIdx];

    // Nếu bài có Quiz mà chưa pass và chưa completed: cho phép sang bài sau nhưng cảnh báo chưa hoàn thành
    const hasMandatoryQuiz = lesson.has_quiz || lesson.content_type === "QUIZ";
    if (hasMandatoryQuiz && !lesson.is_quiz_passed && !lesson.is_completed) {
      showToast(
        "Bài học chưa hoàn thành do chưa làm đạt bài trắc nghiệm.",
        "warning",
      );
      if (!isLastLesson) {
        handleSelectLesson(activeIdx + 1);
        return;
      }
      if (learnData.has_final_quiz && !learnData.is_final_quiz_passed) {
        setIsViewingFinalQuiz(true);
        return;
      }
      showToast(
        "Bạn cần hoàn thành bài trắc nghiệm để hoàn tất khóa học!",
        "warning",
      );
      return;
    }

    // Nếu bài đã hoàn thành và là bài cuối
    if (isLastLesson && lesson.is_completed) {
      if (learnData.has_final_quiz && !learnData.is_final_quiz_passed) {
        setIsViewingFinalQuiz(true);
        return;
      }
      triggerGraduationModal();
      return;
    }

    // Nếu bài đã hoàn thành và chưa phải bài cuối: chuyển sang bài tiếp theo
    if (!isLastLesson && lesson.is_completed) {
      handleSelectLesson(activeIdx + 1);
      return;
    }

    // Nếu là bài TEXT thuần túy không có Quiz (hoặc cần complete thủ công):
    setCompleting(true);
    try {
      const res = await api.post(
        `/users/courses/${courseId}/lessons/${lesson.lesson_id}/complete`,
        {},
      );
      if (res.success) {
        const updatedLessons = [...learnData.lessons];
        updatedLessons[activeIdx].is_completed = true;

        setLearnData({
          ...learnData,
          progress_percentage: res.data.progress_percentage,
          lessons: updatedLessons,
        });

        if (isLastLesson) {
          if (learnData.has_final_quiz && !learnData.is_final_quiz_passed) {
            showToast(
              "Bạn đã hoàn thành các bài học! Hãy làm Bài kiểm tra cuối khóa để nhận chứng chỉ.",
              "success",
            );
            setIsViewingFinalQuiz(true);
          } else {
            showToast("Chúc mừng bạn đã hoàn thành khóa học!", "success");
            triggerGraduationModal();
          }
        } else {
          showToast("Đã hoàn thành bài học!", "success");
          handleSelectLesson(activeIdx + 1);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi ghi nhận hoàn thành bài học", "error");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <LearnPageSkeleton />;
  }

  if (error || !learnData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <EmptyState
          tone="error"
          icon={<WarningCircle size={32} weight="duotone" />}
          title="Không thể truy cập phòng học"
          body={error ?? undefined}
          action={{
            label: "Quay lại danh mục",
            onClick: () => router.push("/courses"),
          }}
        />
      </div>
    );
  }

  const currentLesson: Lesson = learnData.lessons[activeIdx];
  const progress = learnData.progress_percentage || 0;
  const completedCount = learnData.lessons.filter(
    (l: Lesson) => l.is_completed,
  ).length;

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-background text-on-background font-sans antialiased overflow-hidden">
      {/* Top Bar: Focus Mode */}
      <header className="glass-panel border-b border-outline-variant/30 sticky top-0 z-40 flex flex-col h-auto w-full bg-white/95 backdrop-blur-md shrink-0">
        <div className="flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14 w-full max-w-screen-2xl mx-auto gap-2">
          <button
            onClick={() => router.push(`/courses/${courseId}/intro`)}
            className="flex items-center gap-1.5 text-primary hover:text-primary-container transition-colors group p-1.5 sm:p-2 -ml-1 sm:-ml-2 rounded-full hover:bg-surface-container-low cursor-pointer shrink-0"
            title="Quay lại"
          >
            <ArrowLeft
              size={18}
              weight="bold"
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="text-xs font-bold hidden md:inline">Quay lại</span>
          </button>
          <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-on-surface truncate flex-grow text-center px-2">
            {isViewingFinalQuiz
              ? "Bài kiểm tra đánh giá năng lực cuối khóa"
              : `Bài ${currentLesson.order_index}: ${getCleanLessonTitle(currentLesson.title)}`}
          </h1>
          <div className="flex items-center gap-2 justify-end shrink-0">
            <span className="text-xs font-bold text-primary hidden sm:inline">{progress}%</span>
            {/* Mobile Lesson Outline Drawer Trigger */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-bold cursor-pointer lg:hidden"
              aria-label="Danh sách bài học"
            >
              <List size={18} weight="bold" />
              <span className="text-[11px] font-bold">
                {completedCount}/{learnData.lessons.length}
              </span>
            </button>
          </div>
        </div>
        {/* Global Progress Bar */}
        <div className="w-full h-1 bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row overflow-hidden">
        {/* Left Area: Video & Content Canvas OR Standalone Quiz OR Final Quiz */}
        <div
          id="learn-main-content"
          className="flex-1 min-h-0 flex flex-col h-full bg-surface overflow-hidden"
        >
          {isViewingFinalQuiz ? (
            <div className="p-6 md:p-10 flex-grow">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    tone="bg-primary/10 text-primary"
                    uppercase
                    icon={<ShieldCheck size={14} weight="bold" />}
                  >
                    Đánh giá tốt nghiệp
                  </Badge>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">
                  Bài kiểm tra tổng kết cuối khóa
                </h2>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  Bạn đã xuất sắc hoàn thành tất cả các bài học trong khóa học.
                  Hãy vượt qua bài kiểm tra này để hoàn tất 100% lộ trình và
                  nhận Chứng nhận tốt nghiệp!
                </p>

                <QuizPlayer
                  courseId={courseId}
                  isFinalQuiz={true}
                  onPassed={handleFinalQuizPassed}
                  onNextLesson={() => triggerGraduationModal()}
                />
              </div>
            </div>
          ) : currentLesson?.content_type === "QUIZ" ? (
            /* Standalone Quiz Lesson */
            <div className="p-6 md:p-10 flex-grow overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    tone="bg-purple-100 text-purple-700"
                    uppercase
                    icon={<Question size={14} weight="bold" />}
                  >
                    Bài kiểm tra trắc nghiệm
                  </Badge>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">
                  Bài {currentLesson.order_index}:{" "}
                  {getCleanLessonTitle(currentLesson.title)}
                </h2>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  Vui lòng trả lời các câu hỏi trắc nghiệm dưới đây để đánh giá
                  mức độ hiểu bài và mở khóa bài học tiếp theo.
                </p>

                <QuizPlayer
                  key={currentLesson.lesson_id}
                  courseId={courseId}
                  lessonId={currentLesson.lesson_id}
                  onPassed={() =>
                    handleLessonQuizPassed(currentLesson.lesson_id)
                  }
                  onNextLesson={handleNextOrComplete}
                />
              </div>
            </div>
          ) : (
            /* HYBRID or TEXT Lesson with optional attached Quiz */
            <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
              {/* Top Navigation Tabs for Lessons with Quiz */}
              {currentLesson?.has_quiz && (
                <div className="flex items-center justify-between border-b border-outline-variant/15 bg-white px-3 sm:px-6 py-2 shrink-0 z-10">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setLessonTab("content")}
                      className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-lg whitespace-nowrap shrink-0 ${
                        lessonTab === "content"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      {currentLesson.content_type === "TEXT" ? (
                        <Article size={14} weight="bold" className="shrink-0" />
                      ) : (
                        <Video size={14} weight="bold" className="shrink-0" />
                      )}
                      <span className="hidden sm:inline">
                        {currentLesson.content_type === "TEXT"
                          ? "Bài đọc"
                          : "Video bài giảng"}
                      </span>
                      <span className="sm:hidden">
                        {currentLesson.content_type === "TEXT"
                          ? "Bài đọc"
                          : "Video"}
                      </span>
                    </button>
                    <button
                      onClick={() => setLessonTab("quiz")}
                      className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-lg whitespace-nowrap shrink-0 ${
                        lessonTab === "quiz"
                          ? "bg-primary text-white shadow-xs"
                          : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <Question size={14} weight="bold" className="shrink-0" />
                      <span className="hidden sm:inline">Trắc nghiệm (10 câu)</span>
                      <span className="sm:hidden">Trắc nghiệm</span>
                      {currentLesson.is_quiz_passed ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold whitespace-nowrap shrink-0 ml-0.5">
                          ✓ Đạt
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold whitespace-nowrap shrink-0 ml-0.5">
                          Cần làm
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content Display */}
              {lessonTab === "quiz" && currentLesson?.has_quiz ? (
                <div className="p-4 sm:p-6 md:p-10 flex-grow overflow-y-auto">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        tone="bg-purple-100 text-purple-700"
                        uppercase
                        icon={<Question size={14} weight="bold" />}
                      >
                        Bài kiểm tra trắc nghiệm củng cố
                      </Badge>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">
                      Bài {currentLesson.order_index}:{" "}
                      {getCleanLessonTitle(currentLesson.title)}
                    </h2>
                    <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                      Vui lòng hoàn thành 10 câu hỏi trắc nghiệm dưới đây (đạt
                      tối thiểu 80%) để hoàn tất bài học và mở khóa bài tiếp
                      theo.
                    </p>

                    <QuizPlayer
                      key={currentLesson.lesson_id}
                      courseId={courseId}
                      lessonId={currentLesson.lesson_id}
                      onPassed={() =>
                        handleLessonQuizPassed(currentLesson.lesson_id)
                      }
                      onNextLesson={handleNextOrComplete}
                    />
                  </div>
                </div>
              ) : currentLesson?.content_type !== "TEXT" &&
                currentLesson?.video_url ? (
                /* Media Lesson */
                (() => {
                  const isAudioMedia =
                    currentLesson.content_type === "AUDIO" ||
                    currentLesson.content_type === "NOTEBOOKLM" ||
                    /\.(m4a|mp3|wav|ogg|aac|flac)(\?.*)?$/i.test(
                      currentLesson.video_url || "",
                    ) ||
                    (currentLesson.video_url || "").includes(
                      "notebooklm.google.com",
                    );

                  return (
                    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
                      {/* Desktop Video Top Bar (Hidden on Mobile) */}
                      <div className="hidden lg:flex px-6 py-2.5 items-center justify-between border-b border-outline-variant/15 bg-white/70 shrink-0 gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <Badge
                            tone={
                              isAudioMedia
                                ? "bg-purple-100 text-purple-700"
                                : "bg-primary/10 text-primary"
                            }
                            uppercase
                            icon={
                              isAudioMedia ? (
                                <Headphones size={12} weight="bold" />
                              ) : (
                                <Video size={12} weight="bold" />
                              )
                            }
                          >
                            {isAudioMedia
                              ? "NotebookLM"
                              : "Video bài giảng"}
                          </Badge>
                          <h2 className="text-sm font-bold text-on-surface truncate">
                            Bài {currentLesson.order_index}:{" "}
                            {getCleanLessonTitle(currentLesson.title)}
                          </h2>
                        </div>
                        {currentLesson.content_body && (
                          <button
                            onClick={() => setShowNotes(!showNotes)}
                            className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 transition-all cursor-pointer shrink-0 ml-2"
                          >
                            <Article size={14} weight="bold" />
                            <span>
                              {showNotes
                                ? "Ẩn tài liệu"
                                : "Xem tài liệu bài học"}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Video Player Stage:
                          - On Mobile (< lg): Docked cleanly at top
                          - On Desktop (>= lg): Centered in cinema theater backdrop */}
                      <div className="w-full shrink-0 bg-black z-10 shadow-sm overflow-hidden lg:flex-1 lg:min-h-0 lg:flex lg:items-center lg:justify-center lg:p-4 lg:bg-black/95 lg:relative">
                        <div className="w-full aspect-video lg:h-full lg:max-h-[calc(100vh-210px)] lg:mx-auto flex items-center justify-center">
                          <VideoPlayer
                            key={currentLesson.lesson_id}
                            url={currentLesson.video_url}
                            title={currentLesson.title}
                            contentType={currentLesson.content_type}
                            autoPlay={true}
                          />
                        </div>

                        {/* Desktop Collapsible Slide-over overlay if student toggles document notes */}
                        {showNotes && currentLesson.content_body && (
                          <div className="hidden lg:flex absolute inset-0 bg-white z-30 p-6 md:p-10 overflow-y-auto animate-fade-in border border-outline-variant/30 flex-col">
                            <div className="max-w-3xl mx-auto w-full space-y-4 flex-1">
                              <div className="sticky top-0 bg-white/95 backdrop-blur-md py-3 flex justify-between items-center border-b border-outline-variant/20 z-10 -mx-6 px-6">
                                <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                                  <Article size={18} weight="duotone" className="text-primary" />
                                  <span>Tài liệu & Ghi chú bài giảng</span>
                                </h3>
                                <button
                                  onClick={() => setShowNotes(false)}
                                  className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high cursor-pointer flex items-center gap-1"
                                >
                                  <X size={14} weight="bold" />
                                  <span>Đóng</span>
                                </button>
                              </div>
                              <MarkdownRenderer
                                content={currentLesson.content_body}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Mobile Scrollable Notes & Quiz Prompt (Hidden on Desktop >= lg) */}
                      <div className="flex-1 min-h-0 overflow-y-auto bg-surface p-4 space-y-4 lg:hidden">
                        {/* Lesson metadata */}
                        <div className="space-y-1.5 pb-3 border-b border-outline-variant/15">
                          <div className="flex items-center gap-2">
                            <Badge
                              tone={
                                isAudioMedia
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-primary/10 text-primary"
                              }
                              uppercase
                              size="xs"
                              icon={
                                isAudioMedia ? (
                                  <Headphones size={12} weight="bold" />
                                ) : (
                                  <Video size={12} weight="bold" />
                                )
                              }
                            >
                              {isAudioMedia
                                ? "NotebookLM Podcast"
                                : "Video bài giảng"}
                            </Badge>
                            {currentLesson.is_completed && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle size={12} weight="fill" />
                                Đã học
                              </span>
                            )}
                          </div>
                          <h2 className="text-sm sm:text-base font-extrabold text-on-surface leading-snug">
                            Bài {currentLesson.order_index}:{" "}
                            {getCleanLessonTitle(currentLesson.title)}
                          </h2>
                        </div>

                        {/* Quick Quiz Banner if available and not passed */}
                        {currentLesson.has_quiz && !currentLesson.is_quiz_passed && (
                          <div className="bg-purple-50/80 border border-purple-200/80 p-3.5 rounded-xl flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                                <Question size={14} weight="bold" className="text-purple-600" />
                                <span>Bài tập trắc nghiệm củng cố</span>
                              </p>
                              <p className="text-[11px] text-purple-700">
                                Hoàn thành 10 câu hỏi để mở khóa bài tiếp theo
                              </p>
                            </div>
                            <button
                              onClick={() => setLessonTab("quiz")}
                              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-xs hover:bg-purple-700 shrink-0 cursor-pointer"
                            >
                              Làm bài
                            </button>
                          </div>
                        )}

                        {/* Reading/Notes content if available */}
                        {currentLesson.content_body ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface uppercase tracking-wider">
                              <Article size={16} weight="bold" className="text-primary" />
                              <span>Tài liệu & Ghi chú bài học</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-outline-variant/20 shadow-xs prose prose-sm max-w-none text-xs leading-relaxed text-on-surface-variant">
                              <MarkdownRenderer content={currentLesson.content_body} />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-xl border border-outline-variant/20 shadow-xs flex items-start gap-3">
                            <Info size={20} weight="duotone" className="text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                              Theo dõi kỹ video bài giảng trên để nắm vững kiến thức. Bạn có thể mở danh sách bài học ở góc trên bên phải để chuyển bài bất cứ lúc nào.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Article / Reading Lesson */
                <div className="p-4 sm:p-6 md:p-10 flex-grow overflow-y-auto">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge
                        tone="bg-primary/10 text-primary"
                        uppercase
                        icon={<Article size={14} weight="bold" />}
                      >
                        Tài liệu đọc
                      </Badge>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">
                      Bài {currentLesson.order_index}:{" "}
                      {getCleanLessonTitle(currentLesson.title)}
                    </h2>

                    {currentLesson.content_body ? (
                      <MarkdownRenderer content={currentLesson.content_body} />
                    ) : (
                      <div className="prose max-w-none text-on-surface-variant font-light text-sm md:text-base leading-relaxed space-y-4">
                        <p>
                          Chào mừng bạn đến với bài học này. Trong chương trình
                          giáo dục giới tính chuẩn y khoa, nội dung học tập được
                          thiết kế ngắn gọn, trực quan và dễ hiểu giúp bạn nhanh
                          chóng nắm bắt được các kiến thức cần thiết.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                          <li>
                            Cung cấp kiến thức sinh lý học và tâm lý học toàn
                            diện.
                          </li>
                          <li>
                            Rèn luyện kỹ năng nhận biết và hành động bảo vệ bản
                            thân.
                          </li>
                          <li>
                            Bổ sung các tình huống thực tế để dễ dàng ghi nhớ.
                          </li>
                        </ul>
                      </div>
                    )}

                    <div className="bg-white p-6 rounded-none border border-outline-variant/30 shadow-xs flex gap-4 mt-8">
                      <Info
                        size={28}
                        weight="duotone"
                        className="text-primary shrink-0"
                      />
                      <p className="text-xs text-on-surface-variant leading-relaxed m-0 font-light">
                        Mọi thông tin trong bài học này đều được kiểm duyệt bởi
                        các chuyên gia y khoa và được thiết kế để mang lại cảm
                        giác an toàn, tôn trọng và không phán xét.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Bar */}
          {!isViewingFinalQuiz && (
            <div className="sticky bottom-0 glass-panel border-t border-outline-variant/20 p-2.5 sm:p-3 md:px-8 flex items-center justify-between z-20 bg-white/95 backdrop-blur-md shrink-0 pb-[calc(0.625rem+env(safe-area-inset-bottom,0px))] gap-2">
              <button
                onClick={() => handleSelectLesson(activeIdx - 1)}
                disabled={activeIdx === 0}
                className="flex items-center gap-1.5 text-primary hover:bg-surface-container-low px-3 sm:px-4 py-2 rounded-xl transition-colors text-xs font-bold disabled:opacity-30 cursor-pointer shrink-0 border border-outline-variant/30 whitespace-nowrap"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-2">
                {currentLesson?.has_quiz &&
                  !currentLesson?.is_quiz_passed &&
                  !currentLesson?.is_completed &&
                  lessonTab === "content" && (
                    <button
                      onClick={() => setLessonTab("quiz")}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all text-xs font-bold border border-primary text-primary hover:bg-primary/10 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      <Question size={16} weight="bold" />
                      <span>Làm Quiz</span>
                    </button>
                  )}

                <button
                  onClick={handleNextOrComplete}
                  disabled={completing}
                  className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap ${
                    activeIdx === learnData.lessons.length - 1
                      ? "bg-gradient-to-r from-secondary-container to-secondary text-white hover:opacity-95 shadow-md"
                      : "bg-primary text-white hover:opacity-90"
                  }`}
                >
                  <span>
                    {completing
                      ? "Đang lưu..."
                      : activeIdx === learnData.lessons.length - 1
                        ? learnData.has_final_quiz &&
                          !learnData.is_final_quiz_passed
                          ? "Quiz cuối khóa"
                          : "Hoàn thành khóa học"
                        : "Bài tiếp theo"}
                  </span>
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Lesson List */}
        <aside className="w-full lg:w-[360px] flex-shrink-0 glass-panel border-l border-outline-variant/30 flex flex-col h-full overflow-hidden hidden lg:flex relative z-10 bg-white/70">
          <div className="p-6 border-b border-outline-variant/30 sticky top-0 z-10 bg-transparent">
            <h3 className="text-base font-extrabold text-on-surface mb-2">
              Nội dung khóa học
            </h3>
            <div className="flex items-center gap-2 text-on-surface-variant font-bold bg-surface-container-lowest/50 py-1.5 px-3 rounded-full inline-flex border border-white/60">
              <GraduationCap
                size={16}
                weight="duotone"
                className="text-primary"
              />
              <span className="text-[10px] uppercase tracking-wider">
                {completedCount}/{learnData.lessons.length} Bài học hoàn thành
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {learnData.lessons.map((lesson: Lesson, idx: number) => {
              const isActive = !isViewingFinalQuiz && idx === activeIdx;
              const isQuiz = lesson.content_type === "QUIZ";

              return (
                <button
                  key={lesson.lesson_id}
                  onClick={() => handleSelectLesson(idx)}
                  className={`w-full flex items-start gap-4 p-4 rounded-none transition-all duration-300 text-left border cursor-pointer ${
                    isActive
                      ? isQuiz
                        ? "bg-purple-50/80 border-purple-200 shadow-sm ring-2 ring-purple-400/20"
                        : "bg-white border-white shadow-sm ring-2 ring-primary/10"
                      : "border-transparent hover:bg-white/40"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                    {lesson.is_completed ? (
                      <CheckCircle
                        size={18}
                        weight="fill"
                        className={isQuiz ? "text-purple-600" : "text-primary"}
                      />
                    ) : isActive ? (
                      <span
                        className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white ${
                          isQuiz
                            ? "bg-purple-600 ring-purple-600"
                            : "bg-primary ring-primary"
                        }`}
                      ></span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-outline-variant"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold ${
                        isActive
                          ? isQuiz
                            ? "text-purple-700"
                            : "text-primary"
                          : "text-on-surface"
                      }`}
                    >
                      Bài {lesson.order_index}:{" "}
                      {getCleanLessonTitle(lesson.title)}
                    </p>
                    <div className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1.5 font-medium flex-wrap">
                      {isQuiz ? (
                        <Question
                          size={12}
                          weight="bold"
                          className="text-purple-600"
                        />
                      ) : lesson.content_type === "VIDEO" ? (
                        <Video size={12} weight="bold" />
                      ) : (
                        <Article size={12} weight="bold" />
                      )}
                      <span>
                        {isQuiz
                          ? "Trắc nghiệm"
                          : lesson.content_type === "VIDEO"
                            ? "Video"
                            : "Đọc"}{" "}
                        • 15 phút
                      </span>
                      {lesson.has_quiz && (
                        <Badge
                          size="xs"
                          tone={
                            lesson.is_quiz_passed || lesson.is_completed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {lesson.is_quiz_passed || lesson.is_completed
                            ? "✓ Quiz đạt"
                            : "Cần Quiz"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Final Quiz Item in Sidebar */}
            {learnData.has_final_quiz && (
              <div className="pt-3 border-t border-outline-variant/20">
                <button
                  disabled={
                    completedCount < learnData.lessons.length &&
                    !learnData.is_final_quiz_passed
                  }
                  onClick={() => setIsViewingFinalQuiz(true)}
                  className={`w-full flex items-start gap-4 p-4 rounded-none transition-all duration-300 text-left border ${
                    isViewingFinalQuiz
                      ? "bg-white border-white shadow-sm ring-2 ring-primary/20"
                      : completedCount < learnData.lessons.length &&
                          !learnData.is_final_quiz_passed
                        ? "opacity-50 cursor-not-allowed border-transparent bg-surface-container-low/40"
                        : "border-transparent hover:bg-white/50 cursor-pointer"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                    {learnData.is_final_quiz_passed ? (
                      <CheckCircle
                        size={18}
                        weight="fill"
                        className="text-emerald-600"
                      />
                    ) : completedCount >= learnData.lessons.length ? (
                      <ShieldCheck
                        size={18}
                        weight="duotone"
                        className="text-primary"
                      />
                    ) : (
                      <Lock
                        size={16}
                        weight="bold"
                        className="text-on-surface-variant/50"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold ${isViewingFinalQuiz ? "text-primary" : "text-on-surface"}`}
                    >
                      Bài kiểm tra cuối khóa
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
                      {learnData.is_final_quiz_passed
                        ? "Đã đạt điểm yêu cầu"
                        : completedCount >= learnData.lessons.length
                          ? "Sẵn sàng làm bài kiểm tra"
                          : "Khóa cho đến khi xong các bài"}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Mobile Lesson Outline Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-surface h-full shadow-2xl flex flex-col z-10 animate-slide-in border-l border-outline-variant/30">
            <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex items-center justify-between bg-white/80 backdrop-blur-md">
              <div>
                <h3 className="text-sm font-extrabold text-on-surface">
                  Nội dung khóa học
                </h3>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                  {completedCount}/{learnData.lessons.length} bài hoàn thành ({progress}%)
                </p>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                aria-label="Đóng danh sách"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Drawer Progress Bar */}
            <div className="w-full h-1 bg-surface-container-high">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Lesson List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {learnData.lessons.map((lesson: Lesson, idx: number) => {
                const isActive = !isViewingFinalQuiz && idx === activeIdx;
                const isQuiz = lesson.content_type === "QUIZ";

                return (
                  <button
                    key={lesson.lesson_id}
                    onClick={() => {
                      handleSelectLesson(idx);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-none transition-all duration-200 text-left border cursor-pointer ${
                      isActive
                        ? isQuiz
                          ? "bg-purple-50/80 border-purple-200 shadow-xs ring-1 ring-purple-400/40"
                          : "bg-white border-primary/20 shadow-xs ring-1 ring-primary/30"
                        : "border-transparent bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                      {lesson.is_completed ? (
                        <CheckCircle
                          size={18}
                          weight="fill"
                          className={isQuiz ? "text-purple-600" : "text-primary"}
                        />
                      ) : isActive ? (
                        <span
                          className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white ${
                            isQuiz
                              ? "bg-purple-600 ring-purple-600"
                              : "bg-primary ring-primary"
                          }`}
                        />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-outline-variant" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isActive
                            ? isQuiz
                              ? "text-purple-700"
                              : "text-primary"
                            : "text-on-surface"
                        }`}
                      >
                        Bài {lesson.order_index}: {getCleanLessonTitle(lesson.title)}
                      </p>
                      <div className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1.5 font-medium flex-wrap">
                        {isQuiz ? (
                          <Question size={12} weight="bold" className="text-purple-600" />
                        ) : lesson.content_type === "VIDEO" ? (
                          <Video size={12} weight="bold" />
                        ) : (
                          <Article size={12} weight="bold" />
                        )}
                        <span>
                          {isQuiz
                            ? "Trắc nghiệm"
                            : lesson.content_type === "VIDEO"
                              ? "Video"
                              : "Đọc"}
                        </span>
                        {lesson.has_quiz && (
                          <Badge
                            size="xs"
                            tone={
                              lesson.is_quiz_passed || lesson.is_completed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-purple-100 text-purple-800"
                            }
                          >
                            {lesson.is_quiz_passed || lesson.is_completed
                              ? "✓ Đạt"
                              : "Cần Quiz"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Final Quiz in Mobile Drawer */}
              {learnData.has_final_quiz && (
                <div className="pt-2 border-t border-outline-variant/20">
                  <button
                    disabled={
                      completedCount < learnData.lessons.length &&
                      !learnData.is_final_quiz_passed
                    }
                    onClick={() => {
                      setIsViewingFinalQuiz(true);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-none transition-all duration-200 text-left border ${
                      isViewingFinalQuiz
                        ? "bg-white border-primary/30 shadow-xs ring-1 ring-primary/30"
                        : completedCount < learnData.lessons.length &&
                            !learnData.is_final_quiz_passed
                          ? "opacity-50 cursor-not-allowed border-transparent bg-surface-container-low/40"
                          : "border-transparent bg-white/60 hover:bg-white cursor-pointer"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center">
                      {learnData.is_final_quiz_passed ? (
                        <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                      ) : completedCount >= learnData.lessons.length ? (
                        <ShieldCheck size={18} weight="duotone" className="text-primary" />
                      ) : (
                        <Lock size={16} weight="bold" className="text-on-surface-variant/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isViewingFinalQuiz ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        Bài kiểm tra cuối khóa
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                        {learnData.is_final_quiz_passed
                          ? "Đã đạt điểm yêu cầu"
                          : completedCount >= learnData.lessons.length
                            ? "Sẵn sàng làm bài kiểm tra"
                            : "Khóa cho đến khi xong các bài"}
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Graduation Modal */}
      <CourseGraduationModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        courseId={courseId}
        courseTitle={learnData?.course_title}
        outroContent={outroInfo?.outro_content}
        surveyUrl={outroInfo?.research_survey_url}
      />
    </div>
  );
}
