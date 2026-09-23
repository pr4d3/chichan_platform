"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LearnPageSkeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { Badge, EmptyState, Spinner } from "@/components/ui";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";

// Các khối nặng chỉ render có điều kiện nên tải động (ssr:false) để giảm first-load bundle
const VideoPlayer = dynamic(
  () =>
    import(
      "@/app/courses/[courseId]/learn/_components/VideoPlayer"
    ).then((m) => m.VideoPlayer),
  {
    ssr: false,
    // Skeleton giữ aspect-video để khu rạp phim không bị giãn layout khi player chưa sẵn sàng
    loading: () => (
      <div className="w-full aspect-video bg-black rounded-3xl flex items-center justify-center">
        <Spinner size="md" tone="white" />
      </div>
    ),
  }
);
const CourseGraduationModal = dynamic(
  () =>
    import(
      "@/app/courses/[courseId]/learn/_components/CourseGraduationModal"
    ).then((m) => m.CourseGraduationModal),
  { ssr: false }
);
const QuizPlayer = dynamic(
  () => import("@/features/quiz/QuizPlayer").then((m) => m.QuizPlayer),
  { ssr: false }
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
  const { user } = useAuth();

  const courseId = params.courseId as string;

  const [learnData, setLearnData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [outroInfo, setOutroInfo] = useState<any>(null);
  const [isViewingFinalQuiz, setIsViewingFinalQuiz] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
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
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải phòng học");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = (idx: number) => {
    if (idx >= 0 && idx < learnData.lessons.length) {
      setIsViewingFinalQuiz(false);
      setShowNotes(false);
      setActiveIdx(idx);
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

  const handleLessonQuizPassed = (lessonId: string) => {
    if (!learnData || !learnData.lessons) return;
    const updatedLessons = learnData.lessons.map((l: Lesson) =>
      l.lesson_id === lessonId
        ? { ...l, is_quiz_passed: true, is_completed: true }
        : l
    );
    const completedCount = updatedLessons.filter((l: Lesson) => l.is_completed).length;
    const progress_pct = Math.round((completedCount / updatedLessons.length) * 100);

    setLearnData({
      ...learnData,
      progress_percentage: progress_pct,
      lessons: updatedLessons,
    });

    const isLast = activeIdx === updatedLessons.length - 1;
    if (isLast) {
      if (learnData.has_final_quiz && !learnData.is_final_quiz_passed) {
        showToast("Bạn đã hoàn thành bài học cuối cùng! Hãy tiến hành làm Quiz cuối khóa để nhận chứng chỉ.", "success");
        setIsViewingFinalQuiz(true);
      } else {
        showToast("Chúc mừng bạn đã hoàn thành khóa học!", "success");
        triggerGraduationModal();
      }
    }
  };

  const handleFinalQuizPassed = () => {
    setLearnData((prev: any) => ({ ...prev, is_final_quiz_passed: true }));
    showToast("Chúc mừng bạn đã xuất sắc vượt qua bài kiểm tra cuối khóa!", "success");
    triggerGraduationModal();
  };

  const handleNextOrComplete = async () => {
    if (!learnData || !learnData.lessons) return;

    if (isViewingFinalQuiz) {
      if (learnData.is_final_quiz_passed) {
        triggerGraduationModal();
      } else {
        showToast("Vui lòng làm đạt bài kiểm tra cuối khóa để nhận chứng nhận!", "error");
      }
      return;
    }

    const isLastLesson = activeIdx === learnData.lessons.length - 1;
    const lesson = learnData.lessons[activeIdx];

    // If lesson is a standalone Quiz and student hasn't passed it yet
    if (lesson.content_type === "QUIZ" && !lesson.is_quiz_passed && !lesson.is_completed) {
      showToast("Vui lòng làm đạt bài kiểm tra trắc nghiệm để hoàn thành bài học này!", "error");
      return;
    }

    // If already on the last lesson and it's completed
    if (isLastLesson && lesson.is_completed) {
      if (learnData.has_final_quiz && !learnData.is_final_quiz_passed) {
        setIsViewingFinalQuiz(true);
        return;
      }
      triggerGraduationModal();
      return;
    }

    // If not the last lesson and it's already completed: directly navigate to next lesson
    if (!isLastLesson && lesson.is_completed) {
      setActiveIdx(activeIdx + 1);
      return;
    }

    // Otherwise, submit completion to API
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
            showToast("Bạn đã hoàn thành các bài học! Hãy làm Bài kiểm tra cuối khóa để nhận chứng chỉ.", "success");
            setIsViewingFinalQuiz(true);
          } else {
            showToast("Chúc mừng bạn đã hoàn thành khóa học!", "success");
            triggerGraduationModal();
          }
        } else {
          showToast("Đã hoàn thành bài học!", "success");
          if (activeIdx < learnData.lessons.length - 1) {
            setActiveIdx(activeIdx + 1);
          }
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
    <div className="flex flex-col h-screen w-full bg-background text-on-background font-sans antialiased overflow-hidden">
      {/* Top Bar: Focus Mode */}
      <header className="glass-panel border-b border-outline-variant/30 sticky top-0 z-50 flex flex-col h-auto w-full bg-white/80">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-2xl mx-auto">
          <button
            onClick={() => router.push(`/courses/${courseId}/intro`)}
            className="flex items-center gap-2 text-primary hover:text-primary-container transition-colors group p-2 -ml-2 rounded-full hover:bg-surface-container-low cursor-pointer"
          >
            <ArrowLeft
              size={20}
              weight="bold"
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="text-xs font-bold hidden sm:inline">Quay lại</span>
          </button>
          <h1 className="text-sm md:text-base font-extrabold text-on-surface truncate flex-grow text-center px-4">
            {isViewingFinalQuiz
              ? "Bài kiểm tra đánh giá năng lực cuối khóa"
              : `Bài ${currentLesson.order_index}: ${getCleanLessonTitle(currentLesson.title)}`}
          </h1>
          <div className="w-16 sm:w-24 flex justify-end">
            <span className="text-xs font-bold text-primary">{progress}%</span>
          </div>
        </div>
        {/* Global Progress Bar */}
        <div className="w-full h-1.5 bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out animate-pulse"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden">
        {/* Left Area: Video & Content Canvas OR Standalone Quiz OR Final Quiz */}
        <div
          className={`flex-grow flex flex-col h-full bg-surface ${
            !isViewingFinalQuiz &&
            currentLesson?.content_type !== "TEXT" &&
            currentLesson?.content_type !== "QUIZ" &&
            currentLesson?.video_url
              ? "overflow-hidden"
              : "overflow-y-auto"
          }`}
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
                  Bạn đã xuất sắc hoàn thành tất cả các bài học trong khóa học. Hãy vượt qua bài kiểm tra này để hoàn tất 100% lộ trình và nhận Chứng nhận tốt nghiệp!
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
                  Bài {currentLesson.order_index}: {getCleanLessonTitle(currentLesson.title)}
                </h2>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  Vui lòng trả lời các câu hỏi trắc nghiệm dưới đây để đánh giá mức độ hiểu bài và mở khóa bài học tiếp theo.
                </p>

                <QuizPlayer
                  key={currentLesson.lesson_id}
                  courseId={courseId}
                  lessonId={currentLesson.lesson_id}
                  onPassed={() => handleLessonQuizPassed(currentLesson.lesson_id)}
                  onNextLesson={handleNextOrComplete}
                />
              </div>
            </div>
          ) : currentLesson?.content_type !== "TEXT" && currentLesson?.video_url ? (
            /* Media Lesson: Cinema / Theater Fit-to-screen for Video & Audio/NotebookLM */
            (() => {
              const isAudioMedia =
                currentLesson.content_type === "AUDIO" ||
                currentLesson.content_type === "NOTEBOOKLM" ||
                /\.(m4a|mp3|wav|ogg|aac|flac)(\?.*)?$/i.test(currentLesson.video_url || "") ||
                (currentLesson.video_url || "").includes("notebooklm.google.com");

              return (
                <div className="flex flex-col flex-grow h-full overflow-hidden">
                  {/* Compact Video Top Bar */}
                  <div className="px-6 py-2.5 flex items-center justify-between border-b border-outline-variant/15 bg-white/70 shrink-0">
                    <div className="flex items-center gap-2.5 truncate">
                      <Badge
                        tone={isAudioMedia ? "bg-purple-100 text-purple-700" : "bg-primary/10 text-primary"}
                        uppercase
                        icon={isAudioMedia ? <Headphones size={12} weight="bold" /> : <Video size={12} weight="bold" />}
                      >
                        {isAudioMedia ? "NotebookLM Audio Podcast" : "Video bài giảng"}
                      </Badge>
                      <h2 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                        Bài {currentLesson.order_index}: {getCleanLessonTitle(currentLesson.title)}
                      </h2>
                    </div>
                    {currentLesson.content_body && (
                      <button
                        onClick={() => setShowNotes(!showNotes)}
                        className="text-xs font-bold text-primary hover:opacity-80 flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-primary/10 transition-all cursor-pointer shrink-0 ml-3"
                      >
                        <Article size={14} weight="bold" />
                        <span>{showNotes ? "Ẩn tài liệu" : "Xem tài liệu bài học"}</span>
                      </button>
                    )}
                  </div>

                  {/* Main Theater Stage - perfectly fits within viewport */}
                  <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 bg-black/95 relative overflow-hidden">
                    <div className="w-full h-full max-h-[calc(100vh-210px)] aspect-video flex items-center justify-center mx-auto">
                      <VideoPlayer
                        key={currentLesson.lesson_id + currentLesson.video_url}
                        url={currentLesson.video_url}
                        title={currentLesson.title}
                        contentType={currentLesson.content_type}
                        autoPlay={true}
                      />
                    </div>

                    {/* Collapsible Slide-over overlay if student toggles document notes */}
                    {showNotes && currentLesson.content_body && (
                      <div className="absolute inset-0 bg-white z-30 p-6 md:p-10 overflow-y-auto animate-fade-in border border-outline-variant/30">
                        <div className="max-w-3xl mx-auto space-y-4">
                          <div className="flex justify-between items-center pb-4 border-b border-outline-variant/20">
                            <h3 className="font-bold text-base text-on-surface">Tài liệu & Ghi chú bài giảng</h3>
                            <button
                              onClick={() => setShowNotes(false)}
                              className="px-3.5 py-1 rounded-none bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high cursor-pointer"
                            >
                              Đóng tài liệu
                            </button>
                          </div>
                          <MarkdownRenderer content={currentLesson.content_body} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* Article / Reading Lesson */
            <div className="p-6 md:p-10 flex-grow">
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
                  Bài {currentLesson.order_index}: {getCleanLessonTitle(currentLesson.title)}
                </h2>

                {currentLesson.content_body ? (
                  <MarkdownRenderer content={currentLesson.content_body} />
                ) : (
                  <div className="prose max-w-none text-on-surface-variant font-light text-sm md:text-base leading-relaxed space-y-4">
                    <p>
                      Chào mừng bạn đến với bài học này. Trong chương trình giáo
                      dục giới tính chuẩn y khoa, nội dung học tập được thiết kế
                      ngắn gọn, trực quan và dễ hiểu giúp bạn nhanh chóng nắm bắt
                      được các kiến thức cần thiết.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                      <li>Cung cấp kiến thức sinh lý học và tâm lý học toàn diện.</li>
                      <li>Rèn luyện kỹ năng nhận biết và hành động bảo vệ bản thân.</li>
                      <li>Bổ sung các tình huống thực tế để dễ dàng ghi nhớ.</li>
                    </ul>
                  </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-white/60 shadow-sm flex gap-4 mt-8">
                  <Info
                    size={28}
                    weight="duotone"
                    className="text-primary shrink-0"
                  />
                  <p className="text-xs text-on-surface-variant leading-relaxed m-0 font-light">
                    Mọi thông tin trong bài học này đều được kiểm duyệt bởi các
                    chuyên gia y khoa và được thiết kế để mang lại cảm giác an
                    toàn, tôn trọng và không phán xét.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          {!isViewingFinalQuiz && (
            <div className="sticky bottom-0 glass-panel border-t border-outline-variant/30 p-3 sm:p-4 md:px-10 flex items-center justify-between z-20 bg-white/90 shrink-0">
              <button
                onClick={() => handleSelectLesson(activeIdx - 1)}
                disabled={activeIdx === 0}
                className="flex items-center gap-1.5 text-primary hover:bg-surface-container-low px-5 py-2.5 rounded-full transition-colors text-xs font-bold disabled:opacity-30 cursor-pointer"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Bài trước</span>
              </button>
              <button
                onClick={handleNextOrComplete}
                disabled={completing}
                className={`flex items-center gap-1.5 px-8 py-3 rounded-full transition-all text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 ${
                  activeIdx === learnData.lessons.length - 1
                    ? "bg-gradient-to-r from-secondary-container to-secondary text-white hover:opacity-95 shadow-lg"
                    : "bg-primary text-white hover:opacity-90"
                }`}
              >
                <span>
                  {completing
                    ? "Đang lưu..."
                    : activeIdx === learnData.lessons.length - 1
                      ? (learnData.has_final_quiz && !learnData.is_final_quiz_passed ? "Tới Quiz cuối khóa" : "Hoàn thành")
                      : "Bài sau"}
                </span>
                <ArrowRight size={16} weight="bold" />
              </button>
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
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 text-left border cursor-pointer ${
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
                      <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-offset-white ${
                        isQuiz ? "bg-purple-600 ring-purple-600" : "bg-primary ring-primary"
                      }`}></span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-outline-variant"></span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold ${
                        isActive
                          ? isQuiz ? "text-purple-700" : "text-primary"
                          : "text-on-surface"
                      }`}
                    >
                      Bài {lesson.order_index}:{" "}
                      {getCleanLessonTitle(lesson.title)}
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
                            : "Đọc"}{" "}
                        • 15 phút
                      </span>
                      {isQuiz && (
                        <Badge
                          size="xs"
                          tone={
                            lesson.is_quiz_passed || lesson.is_completed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }
                        >
                          {lesson.is_quiz_passed || lesson.is_completed ? "✓ Quiz đạt" : "Cần làm Quiz"}
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
                  disabled={completedCount < learnData.lessons.length && !learnData.is_final_quiz_passed}
                  onClick={() => setIsViewingFinalQuiz(true)}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 text-left border ${
                    isViewingFinalQuiz
                      ? "bg-white border-white shadow-sm ring-2 ring-primary/20"
                      : completedCount < learnData.lessons.length && !learnData.is_final_quiz_passed
                      ? "opacity-50 cursor-not-allowed border-transparent bg-surface-container-low/40"
                      : "border-transparent hover:bg-white/50 cursor-pointer"
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
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${isViewingFinalQuiz ? "text-primary" : "text-on-surface"}`}>
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
