"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  DotsSixVertical,
  PencilSimple,
  Trash,
  X,
  UsersThree,
  Certificate,
  Percent,
  Article,
  Question,
  ShieldCheck,
} from "@phosphor-icons/react";
import {
  Button,
  EyebrowLabel,
  Modal,
  SkeletonBlock,
  Spinner,
  StatTile,
} from "@/components/ui";

// Modal quiz nặng (731 dòng) — chỉ mở khi bấm soạn quiz, tải lazy như QuizPlayer
const QuizEditorModal = dynamic(
  () =>
    import("@/features/quiz/QuizEditorModal").then((m) => m.QuizEditorModal),
  { ssr: false },
);

interface ManagedCourse {
  course_id: string;
  title: string;
  target_audience: "PARENT" | "CHILD" | "BOTH";
  is_published: boolean;
  total_lessons: number;
  total_enrolled: number;
  completed_count: number;
  in_progress_count: number;
  created_at: string;
}

interface SyllabusLesson {
  id: string;
  order_index: number;
  title: string;
  content_type?: string;
  duration_minutes: number | null;
}

interface CourseDetails {
  course_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  thumbnail_url: string | null;
  target_audience: "PARENT" | "CHILD" | "BOTH";
  learning_objectives: string | null;
  outro_content: string | null;
  syllabus: SyllabusLesson[];
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<ManagedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected course for detailed management
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "lessons" | "final_quiz">("basic");
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizModalLessonId, setQuizModalLessonId] = useState<string | null>(null);
  const [quizModalLessonTitle, setQuizModalLessonTitle] = useState("");
  const [quizModalIsFinal, setQuizModalIsFinal] = useState(false);
  const [quizModalIsStandalone, setQuizModalIsStandalone] = useState(false);
  const [quizModalLessonOrderIndex, setQuizModalLessonOrderIndex] = useState<number | undefined>(undefined);


  // Create Course Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAudience, setNewAudience] = useState<"BOTH" | "CHILD" | "PARENT">(
    "BOTH",
  );
  const [newThumb, setNewThumb] = useState("");
  const [newShortDesc, setNewShortDesc] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newObjectives, setNewObjectives] = useState("");
  const [newOutroContent, setNewOutroContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Course Form states (within detail view)
  const [editTitle, setEditTitle] = useState("");
  const [editAudience, setEditAudience] = useState<"BOTH" | "CHILD" | "PARENT">(
    "BOTH",
  );
  const [editThumb, setEditThumb] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editObjectives, setEditObjectives] = useState("");
  const [editOutroContent, setEditOutroContent] = useState("");

  // Lesson Modal states
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContentType, setLessonContentType] = useState<
    "VIDEO" | "TEXT" | "HYBRID" | "AUDIO"
  >("HYBRID");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonContentBody, setLessonContentBody] = useState("");
  const [lessonOrderIndex, setLessonOrderIndex] = useState<number>(1);
  const [lessonDuration, setLessonDuration] = useState<number | "">("");
  const [lessonSubmitting, setLessonSubmitting] = useState(false);

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isDraggingAllowed, setIsDraggingAllowed] = useState(false);

  // Tự giãn textarea theo nội dung — thay 7 useEffect auto-grow (mỗi keystroke đều
  // forced-reflow qua effect): onInput chỉnh thẳng height trên event target, không state/effect.
  // ref callback (useCallback) chạy lúc mount sau khi populate để giãn đúng nội dung tải về.
  const growOnMount = useCallback(
    (el: HTMLTextAreaElement | null) => {
      if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      }
    },
    [],
  );
  const autoGrow = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    fetchStats();
    fetchManagedCourses();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/instructor/dashboard/overview");
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Error loading dashboard stats", err);
    }
  };

  const fetchManagedCourses = async () => {
    try {
      const res = await api.get("/instructor/dashboard/courses");
      if (res.success) {
        setCourses(res.data);
      }
    } catch (err) {
      console.error("Error loading managed courses", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    setDetailsLoading(true);
    try {
      // Chạy song song intro + quiz (trước đây await tuần tự); lỗi quiz chỉ log,
      // không chặn chi tiết khóa học như hành vi cũ
      const [introRes, quizRes] = await Promise.all([
        api.get(`/courses/${courseId}/intro`),
        api.get(`/courses/${courseId}/quizzes/manage`).catch((e) => {
          console.error("Error loading course quizzes", e);
          return null;
        }),
      ]);
      if (introRes.success) {
        const data: CourseDetails = introRes.data;
        setCourseDetails(data);

        // Populate edit fields
        setEditTitle(data.title);
        setEditAudience(data.target_audience);
        setEditThumb(data.thumbnail_url || "");
        setEditShortDesc(data.short_description || "");
        setEditDesc(data.description || "");
        setEditObjectives(data.learning_objectives || "");
        setEditOutroContent(data.outro_content || "");

        setCourseQuizzes(
          quizRes?.success && Array.isArray(quizRes.data) ? quizRes.data : [],
        );
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi tải chi tiết khóa học", "error");
    } finally {
      setDetailsLoading(false);
    }
  };


  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveTab("basic");
    fetchCourseDetails(courseId);
  };

  const handleBackToOverview = () => {
    setSelectedCourseId(null);
    setCourseDetails(null);
    fetchStats();
    fetchManagedCourses();
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    setSubmitting(true);
    // Automatically generate slug from title (remove Vietnamese accents and make URL-safe)
    const slug = newTitle
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/([^a-z0-9\s-]|_)+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    try {
      const res = await api.post("/courses", {
        title: newTitle,
        slug: slug,
        target_audience: newAudience,
        thumbnail_url: newThumb || null,
        short_description: newShortDesc || null,
        description: newDesc || null,
        learning_objectives: newObjectives || null,
        outro_content: newOutroContent || null,
      });

      if (res.success) {
        showToast("Tạo khóa học mới thành công!", "success");
        setModalOpen(false);

        // Clear fields
        setNewTitle("");
        setNewThumb("");
        setNewShortDesc("");
        setNewDesc("");
        setNewObjectives("");
        setNewOutroContent("");

        fetchStats();
        fetchManagedCourses();
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi tạo khóa học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !selectedCourseId) return;

    setSubmitting(true);
    const slug = editTitle
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/([^a-z0-9\s-]|_)+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    try {
      const res = await api.put(`/courses/${selectedCourseId}`, {
        title: editTitle,
        slug: slug,
        target_audience: editAudience,
        thumbnail_url: editThumb || null,
        short_description: editShortDesc || null,
        description: editDesc || null,
        learning_objectives: editObjectives || null,
        outro_content: editOutroContent || null,
      });

      if (res.success) {
        showToast("Cập nhật thông tin khóa học thành công!", "success");
        fetchCourseDetails(selectedCourseId);
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi cập nhật thông tin khóa học", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) return;
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn XÓA VĨNH VIỄN khóa học này cùng toàn bộ các bài học bên trong? Hành động này không thể khôi phục!",
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete(`/courses/${selectedCourseId}`);
      if (res.success) {
        showToast("Đã xóa khóa học thành công!", "success");
        handleBackToOverview();
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa khóa học", "error");
    }
  };

  const handleTogglePublish = async (courseId: string) => {
    try {
      const res = await api.put(`/courses/${courseId}/publish`, {});
      if (res.success) {
        showToast(res.message || "Cập nhật trạng thái thành công!", "success");
        fetchStats();
        fetchManagedCourses();
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi cập nhật trạng thái xuất bản", "error");
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !courseDetails)
      return;

    setIsReordering(true);
    const newSyllabus = [...courseDetails.syllabus];
    const [draggedItem] = newSyllabus.splice(draggedIndex, 1);
    newSyllabus.splice(targetIndex, 0, draggedItem);

    // Re-assign order_index based on new index
    const reorderedSyllabus = newSyllabus.map((item, idx) => ({
      ...item,
      order_index: idx + 1,
    }));

    setCourseDetails({
      ...courseDetails,
      syllabus: reorderedSyllabus,
    });

    setDraggedIndex(null);

    try {
      const lessonIds = reorderedSyllabus.map((item) => item.id);
      const res = await api.put(
        `/courses/${selectedCourseId}/lessons/reorder`,
        { lesson_ids: lessonIds },
      );
      if (res.success) {
        showToast("Sắp xếp thứ tự bài học thành công!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi sắp xếp thứ tự bài học", "error");
      fetchCourseDetails(selectedCourseId!);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Lesson Operations
  const clearLessonForm = () => {
    setSelectedLessonId(null);
    setLessonTitle("");
    setLessonContentType("HYBRID");
    setLessonVideoUrl("");
    setLessonContentBody("");
    setLessonOrderIndex((courseDetails?.syllabus.length || 0) + 1);
    setLessonDuration("");
  };

  const handleOpenAddLesson = () => {
    clearLessonForm();
    setLessonModalOpen(true);
  };

  const handleOpenEditLesson = async (lessonId: string) => {
    try {
      const res = await api.get(
        `/courses/${selectedCourseId}/lessons/${lessonId}`,
      );
      if (res.success) {
        const lesson = res.data;
        setSelectedLessonId(lessonId);
        setLessonTitle(lesson.title);
        setLessonContentType(lesson.content_type);
        setLessonVideoUrl(lesson.video_url || "");
        setLessonContentBody(lesson.content_body || "");
        setLessonOrderIndex(lesson.order_index);
        setLessonDuration(lesson.duration_minutes || "");
        setLessonModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi tải thông tin bài học", "error");
    }
  };

  const extractVideoIdentifier = (input: string | null | undefined): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    const ytMatch = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
    );
    if (ytMatch && ytMatch[1]) return ytMatch[1];
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) return vimeoMatch[1];
    return trimmed;
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle || !selectedCourseId) return;

    setLessonSubmitting(true);
    const cleanedVideo = extractVideoIdentifier(lessonVideoUrl);

    const payload = {
      title: lessonTitle,
      content_type: lessonContentType,
      video_url: cleanedVideo,
      content_body: lessonContentBody || null,
      order_index: Number(lessonOrderIndex),
      duration_minutes: lessonDuration ? Number(lessonDuration) : null,
    };

    try {
      let res;
      if (selectedLessonId) {
        res = await api.put(
          `/courses/${selectedCourseId}/lessons/${selectedLessonId}`,
          payload,
        );
      } else {
        res = await api.post(`/courses/${selectedCourseId}/lessons`, payload);
      }

      if (res.success) {
        showToast(
          selectedLessonId
            ? "Cập nhật bài học thành công!"
            : "Thêm bài học mới thành công!",
          "success",
        );
        setLessonModalOpen(false);
        clearLessonForm();
        fetchCourseDetails(selectedCourseId);
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi lưu thông tin bài học", "error");
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!selectedCourseId) return;
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa bài học này?",
    );
    if (!confirmDelete) return;

    try {
      const res = await api.delete(
        `/courses/${selectedCourseId}/lessons/${lessonId}`,
      );
      if (res.success) {
        showToast("Đã xóa bài học thành công!", "success");
        fetchCourseDetails(selectedCourseId);
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa bài học", "error");
    }
  };

  // If a course is selected, render the management view
  if (selectedCourseId) {
    return (
      <div className="space-y-8">
        {/* Back and Title */}
        <div className="flex flex-col gap-3 pb-6 border-b border-outline-variant/30">
          <button
            onClick={handleBackToOverview}
            className="flex items-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-all w-fit cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            Quay lại Tổng quan
          </button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                Quản lý khóa học
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-on-surface mt-0.5">
                {courseDetails?.title || "Đang tải..."}
              </h1>
            </div>
            {courseDetails && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary`}
              >
                {courseDetails.syllabus.length} bài học
              </span>
            )}
          </div>
        </div>

        {detailsLoading ? (
          <div className="h-60 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex border-b border-outline-variant/20 gap-8">
              <button
                onClick={() => setActiveTab("basic")}
                className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                  activeTab === "basic"
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Thông tin cơ bản
                {activeTab === "basic" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("lessons")}
                className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
                  activeTab === "lessons"
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Đề cương bài giảng
                {activeTab === "lessons" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("final_quiz")}
                className={`pb-3 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "final_quiz"
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span>Quiz cuối khóa</span>
                {courseQuizzes.some((q) => q.is_final) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã cấu hình" />
                )}
                {activeTab === "final_quiz" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </div>


            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm space-y-6">
                <form onSubmit={handleUpdateCourse} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-on-surface ml-1"
                        htmlFor="editTitle"
                      >
                        Tiêu đề khóa học
                      </label>
                      <input
                        id="editTitle"
                        type="text"
                        required
                        className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-xs font-semibold text-on-surface ml-1"
                        htmlFor="editAudience"
                      >
                        Đối tượng hướng đến
                      </label>
                      <select
                        id="editAudience"
                        className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={editAudience}
                        onChange={(e) => setEditAudience(e.target.value as any)}
                      >
                        <option value="BOTH">Tất cả đối tượng</option>
                        <option value="CHILD">Học sinh / Trẻ nhỏ</option>
                        <option value="PARENT">Phụ huynh</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold text-on-surface ml-1"
                      htmlFor="editThumb"
                    >
                      Link ảnh Thumbnail
                    </label>
                    <input
                      id="editThumb"
                      type="text"
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      value={editThumb}
                      onChange={(e) => setEditThumb(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold text-on-surface ml-1"
                      htmlFor="editShort"
                    >
                      Tóm tắt khóa học
                    </label>
                    <input
                      id="editShort"
                      type="text"
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      value={editShortDesc}
                      onChange={(e) => setEditShortDesc(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold text-on-surface ml-1"
                      htmlFor="editDesc"
                    >
                      Mô tả chi tiết đề cương
                    </label>
                    <textarea
                      ref={growOnMount}
                      id="editDesc"
                      rows={5}
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onInput={autoGrow}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold text-on-surface ml-1"
                      htmlFor="editObjectives"
                    >
                      Mục tiêu học tập (mỗi mục tiêu 1 dòng)
                    </label>
                    <textarea
                      ref={growOnMount}
                      id="editObjectives"
                      rows={4}
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
                      placeholder={"- Tiếp cận các kiến thức giáo dục giới tính chuẩn y khoa\n- Rèn luyện kỹ năng tự bảo vệ bản thân và phòng chống xâm hại\n- Nắm vững kiến thức sinh lý và tâm lý theo độ tuổi"}
                      value={editObjectives}
                      onChange={(e) => setEditObjectives(e.target.value)}
                      onInput={autoGrow}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-semibold text-on-surface ml-1"
                      htmlFor="editOutro"
                    >
                      Lời chúc mừng hoàn thành
                    </label>
                    <textarea
                      ref={growOnMount}
                      id="editOutro"
                      rows={3}
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
                      placeholder="Nội dung sẽ hiện khi học viên tốt nghiệp khóa học (Lời nhắn nhủ, chúc mừng, hướng dẫn khảo sát...)"
                      value={editOutroContent}
                      onChange={(e) => setEditOutroContent(e.target.value)}
                      onInput={autoGrow}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-outline-variant/10">
                    <button
                      type="button"
                      onClick={handleDeleteCourse}
                      className="w-full sm:w-auto px-6 h-11 rounded-full border border-red-500 text-red-500 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                    >
                      Xóa khóa học này
                    </button>

                    <Button
                      type="submit"
                      disabled={submitting}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Lessons Tab */}
            {activeTab === "lessons" && (
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-on-surface">
                    Đề cương bài học
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setQuizModalLessonId(null);
                        setQuizModalLessonTitle("");
                        setQuizModalIsFinal(false);
                        setQuizModalIsStandalone(true);
                        setQuizModalLessonOrderIndex((courseDetails?.syllabus.length || 0) + 1);
                        setQuizModalOpen(true);
                      }}
                      className="bg-purple-600 text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                      title="Thêm bài kiểm tra trắc nghiệm độc lập vào đề cương"
                    >
                      <Question size={16} weight="bold" />
                      Thêm bài Quiz
                    </button>
                    <button
                      onClick={handleOpenAddLesson}
                      className="bg-primary text-white px-4 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                    >
                      <Plus size={16} weight="bold" />
                      Thêm bài học
                    </button>
                  </div>
                </div>

                {!courseDetails || courseDetails.syllabus.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <BookOpen size={48} weight="duotone" className="mx-auto text-on-surface-variant/40" />
                    <p className="text-xs text-on-surface-variant font-light">
                      Khóa học này chưa có bài học nào. Hãy thiết kế bài học đầu
                      tiên!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {courseDetails.syllabus.map((lesson, index) => {
                      const isQuizLesson = lesson.content_type === "QUIZ";
                      const lQuiz = courseQuizzes.find((q) => q.lesson_id === lesson.id);

                      return (
                        <div
                          key={lesson.id}
                          draggable={isDraggingAllowed && !isReordering}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex justify-between items-center py-4 first:pt-0 last:pb-0 group transition-all select-none ${
                            draggedIndex === index
                              ? "opacity-40 bg-primary/5 rounded-2xl px-2"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              onMouseEnter={() => setIsDraggingAllowed(true)}
                              onMouseLeave={() => setIsDraggingAllowed(false)}
                              className="flex items-center gap-2 cursor-grab active:cursor-grabbing p-1 hover:bg-primary/5 rounded-2xl transition-all"
                              title="Kéo thả để sắp xếp"
                            >
                              <DotsSixVertical size={18} weight="bold" className="text-on-surface-variant/35 group-hover:text-primary transition-colors" />
                              <div className={`h-8 w-8 rounded-2xl flex items-center justify-center font-black text-xs ${
                                isQuizLesson ? "bg-purple-100 text-purple-700" : "bg-primary/10 text-primary"
                              }`}>
                                {lesson.order_index}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className={`text-xs font-bold transition-colors ${
                                  isQuizLesson ? "text-purple-700 group-hover:text-purple-800" : "text-on-surface group-hover:text-primary"
                                }`}>
                                  {lesson.title}
                                </h4>
                                {isQuizLesson && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700">
                                    Quiz
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-on-surface-variant font-light mt-0.5">
                                {isQuizLesson
                                  ? `${lQuiz ? `${lQuiz.total_questions} câu hỏi • Điểm đạt: ${lQuiz.passing_score}%` : "Bài kiểm tra trắc nghiệm"}`
                                  : `Thời lượng: ${lesson.duration_minutes || "--"} phút`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isQuizLesson ? (
                              <button
                                onClick={() => {
                                  setQuizModalLessonId(lesson.id);
                                  setQuizModalLessonTitle(lesson.title);
                                  setQuizModalIsFinal(false);
                                  setQuizModalIsStandalone(true);
                                  setQuizModalLessonOrderIndex(lesson.order_index);
                                  setQuizModalOpen(true);
                                }}
                                className="h-8 px-3 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Soạn câu hỏi Quiz"
                              >
                                <Question size={14} weight="bold" />
                                <span>Soạn Quiz {lQuiz ? `(${lQuiz.total_questions})` : ""}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenEditLesson(lesson.id)}
                                className="h-8 w-8 rounded-full hover:bg-surface-container flex items-center justify-center text-primary transition-colors cursor-pointer"
                                title="Sửa bài giảng"
                              >
                                <PencilSimple size={18} weight="bold" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="h-8 w-8 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors cursor-pointer"
                              title={isQuizLesson ? "Xóa bài Quiz" : "Xóa bài giảng"}
                            >
                              <Trash size={18} weight="bold" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Final Quiz Tab */}
            {activeTab === "final_quiz" && (
              <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-on-surface">
                      Bài kiểm tra đánh giá cuối khóa (Final Exam)
                    </h3>
                    <p className="text-xs text-on-surface-variant font-light mt-0.5">
                      Học viên cần vượt qua bài kiểm tra này sau khi hoàn thành tất cả bài học để nhận chứng nhận tốt nghiệp.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setQuizModalLessonId(null);
                      setQuizModalLessonTitle("");
                      setQuizModalIsFinal(true);
                      setQuizModalOpen(true);
                    }}
                    className="bg-primary text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm cursor-pointer shrink-0"
                  >
                    <Question size={16} weight="bold" />
                    <span>
                      {courseQuizzes.some((q) => q.is_final)
                        ? "Chỉnh sửa Quiz cuối khóa"
                        : "Thiết lập Quiz cuối khóa"}
                    </span>
                  </button>
                </div>

                {/* Final quiz summary info or empty state */}
                {courseQuizzes.find((q) => q.is_final) ? (
                  (() => {
                    const fq = courseQuizzes.find((q) => q.is_final);
                    return (
                      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                              <ShieldCheck size={24} weight="duotone" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-on-surface">
                                {fq.title}
                              </h4>
                              <p className="text-xs text-on-surface-variant font-medium">
                                Tổng cộng {fq.total_questions} câu hỏi trắc nghiệm
                              </p>
                            </div>
                          </div>
                          <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            Đang hoạt động
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-outline-variant/20">
                            <span className="text-on-surface-variant text-[11px]">
                              Điểm đạt yêu cầu:
                            </span>
                            <p className="font-bold text-primary text-sm mt-0.5">
                              {fq.passing_score}%
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-outline-variant/20">
                            <span className="text-on-surface-variant text-[11px]">
                              Xem giải thích:
                            </span>
                            <p className="font-bold text-on-surface text-sm mt-0.5">
                              {fq.show_correct_answers ? "Cho phép" : "Ẩn đáp án"}
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-outline-variant/20">
                            <span className="text-on-surface-variant text-[11px]">
                              Lượt thử tối đa:
                            </span>
                            <p className="font-bold text-on-surface text-sm mt-0.5">
                              {fq.max_attempts} lần
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-outline-variant/20">
                            <span className="text-on-surface-variant text-[11px]">
                              Thời gian chờ:
                            </span>
                            <p className="font-bold text-on-surface text-sm mt-0.5">
                              {fq.cooldown_minutes} phút
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-outline-variant/40 space-y-3">
                    <ShieldCheck
                      size={48}
                      weight="duotone"
                      className="mx-auto text-on-surface-variant/30"
                    />
                    <p className="text-xs text-on-surface-variant font-light max-w-sm mx-auto">
                      Khóa học hiện tại chưa có Quiz cuối khóa. Học viên hoàn thành 100% bài học sẽ nhận chứng chỉ trực tiếp. Bấm nút trên để thiết lập bài kiểm tra tổng kết.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lesson Create/Edit Modal */}
        <Modal
          open={lessonModalOpen}
          onClose={() => setLessonModalOpen(false)}
          size="lg"
          dismissible={false}
          backdropClassName="bg-black/30"
          panelClassName="border border-white/60 p-8"
        >
          <button
            onClick={() => setLessonModalOpen(false)}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X size={20} weight="bold" />
          </button>

          <h3 className="text-base font-extrabold text-on-surface mb-6">
            {selectedLessonId ? "Cập nhật bài học" : "Thêm bài học mới"}
          </h3>

          <form onSubmit={handleSaveLesson} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold text-on-surface ml-1"
                htmlFor="lTitle"
              >
                Tiêu đề bài học
              </label>
              <input
                id="lTitle"
                type="text"
                required
                className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                placeholder="Ví dụ: Cấu trúc cơ quan sinh dục"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-on-surface ml-1"
                  htmlFor="lType"
                >
                  Loại bài học
                </label>
                <select
                  id="lType"
                  className="w-full bg-white border border-outline-variant/30 rounded-none px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={lessonContentType}
                  onChange={(e) =>
                    setLessonContentType(e.target.value as any)
                  }
                >
                  <option value="HYBRID">Hỗn hợp (Video/Audio + Tài liệu)</option>
                  <option value="VIDEO">Video YouTube / MP4</option>
                  <option value="AUDIO">Audio Podcast (Google NotebookLM / Drive)</option>
                  <option value="TEXT">Văn bản thuần</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-on-surface ml-1"
                  htmlFor="lDuration"
                >
                  Thời lượng (Phút)
                </label>
                <input
                  id="lDuration"
                  type="number"
                  min="1"
                  placeholder="Phút..."
                  className="w-full bg-white border border-outline-variant/30 rounded-none px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={lessonDuration}
                  onChange={(e) =>
                    setLessonDuration(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            {lessonContentType !== "TEXT" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs font-semibold text-on-surface ml-1"
                    htmlFor="lVideo"
                  >
                    {lessonContentType === "AUDIO"
                      ? "Đường dẫn Audio / NotebookLM"
                      : "Đường dẫn Video / Audio"}
                  </label>
                  <span className="text-[10px] text-primary font-medium">Hỗ trợ YouTube & NotebookLM</span>
                </div>
                <input
                  id="lVideo"
                  type="text"
                  placeholder={
                    lessonContentType === "AUDIO"
                      ? "Dán link Google Drive (Audio Overview), file .m4a/.mp3 hoặc link NotebookLM..."
                      : "Dán link YouTube, Google Drive (NotebookLM), hoặc file video/audio..."
                  }
                  className="w-full bg-white border border-outline-variant/30 rounded-none px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={lessonVideoUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleaned = extractVideoIdentifier(val);
                    if (cleaned && cleaned !== val && (val.includes("youtube.com") || val.includes("youtu.be"))) {
                      setLessonVideoUrl(cleaned);
                    } else {
                      setLessonVideoUrl(val);
                    }
                  }}
                />
                <p className="text-[10px] text-on-surface-variant font-light ml-1 leading-relaxed">
                  💡 <strong>YouTube:</strong> Link xem hoặc mã video (vd: <code className="bg-surface-container px-1">GU3JqoUDkjA</code>).<br />
                  💡 <strong>NotebookLM:</strong> Link Google Drive chia sẻ (Audio Overview), link tệp <code className="bg-surface-container px-1">.m4a/.mp3</code>, hoặc link sổ tay NotebookLM.
                </p>
              </div>
            )}

            {lessonContentType !== "VIDEO" && (
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-xs font-semibold text-on-surface ml-1"
                  htmlFor="lBody"
                >
                  Nội dung bài viết giảng dạy
                </label>
                <textarea
                  ref={growOnMount}
                  id="lBody"
                  rows={6}
                  placeholder="Nhập nội dung bài học bằng văn bản/định dạng văn bản..."
                  className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
                  value={lessonContentBody}
                  onChange={(e) => setLessonContentBody(e.target.value)}
                  onInput={autoGrow}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={lessonSubmitting}
              full
              size="lg"
              className="mt-2"
            >
              {lessonSubmitting ? "Đang lưu..." : "Lưu bài giảng"}
            </Button>
          </form>
        </Modal>

        {/* Quiz Create/Edit Modal */}
        <QuizEditorModal
          isOpen={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          courseId={selectedCourseId}
          lessonId={quizModalLessonId}
          lessonTitle={quizModalLessonTitle}
          isFinalQuiz={quizModalIsFinal}
          isStandaloneQuiz={quizModalIsStandalone}
          existingLessonCount={courseDetails?.syllabus.length || 0}
          lessonOrderIndex={quizModalLessonOrderIndex}
          onQuizSaved={() => {
            fetchCourseDetails(selectedCourseId);
          }}
        />
      </div>
    );
  }

  // Main Dashboard Overview view
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-on-surface">
            Bảng Thống Kê Giảng Viên
          </h1>
          <p className="text-xs text-on-surface-variant font-light mt-1">
            Chào {user?.full_name}, vai trò quản trị hệ thống.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          icon={<Plus size={18} weight="bold" />}
        >
          Tạo khóa học mới
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile
          icon={<BookOpen size={20} weight="duotone" />}
          label="Khóa học"
          value={loading || !stats ? undefined : stats.total_courses || 0}
        />
        <StatTile
          icon={<UsersThree size={20} weight="duotone" />}
          label="Học viên"
          value={
            loading || !stats ? undefined : stats.total_students_enrolled || 0
          }
        />
        <StatTile
          icon={<Certificate size={20} weight="duotone" />}
          label="Tốt nghiệp"
          chipTone="secondary"
          value={
            loading || !stats ? undefined : stats.total_completed_students || 0
          }
        />
        <StatTile
          icon={<Percent size={20} weight="bold" />}
          label="Hoàn thành TB"
          chipTone="tertiary"
          value={
            loading || !stats
              ? undefined
              : `${stats.average_completion_rate || 0}%`
          }
        />
        <StatTile
          icon={<Article size={20} weight="duotone" />}
          label="Bài giảng"
          value={
            loading || !stats ? undefined : stats.total_lessons_published || 0
          }
        />
      </div>

      {/* Courses Management Table Wrapper */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-on-surface">
          Khóa học do tôi quản lý
        </h3>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Khóa học
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Đối tượng
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Số bài học
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Lượt học viên
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Đã xong / Đang học
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Trạng thái
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20">
                    Thao tác
                  </EyebrowLabel>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-outline-variant/10">
                    <td className="py-4 px-4">
                      <SkeletonBlock className="h-4 w-40" />
                    </td>
                    <td className="py-4 px-4">
                      <SkeletonBlock className="h-4 w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <SkeletonBlock className="h-4 w-12" />
                    </td>
                    <td className="py-4 px-4">
                      <SkeletonBlock className="h-4 w-12" />
                    </td>
                    <td className="py-4 px-4">
                      <SkeletonBlock className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <SkeletonBlock rounded="full" className="h-6 w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <SkeletonBlock className="h-8 w-24" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : courses.length === 0 ? (
          <p className="text-xs text-on-surface-variant/85 py-6">
            Bạn chưa tạo khóa học nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20 whitespace-nowrap">
                    Khóa học
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20 whitespace-nowrap">
                    Đối tượng
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20 whitespace-nowrap">
                    Số bài học
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20 whitespace-nowrap">
                    Lượt học viên
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20 whitespace-nowrap">
                    Đã xong / Đang học
                  </EyebrowLabel>
                  <EyebrowLabel as="th" className="py-4 px-4 bg-white/20 whitespace-nowrap">
                    Trạng thái
                  </EyebrowLabel>
                  <EyebrowLabel
                    as="th"
                    className="py-4 px-4 bg-white/20 text-right whitespace-nowrap"
                  >
                    Thao tác
                  </EyebrowLabel>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {courses.map((c) => (
                  <tr
                    key={c.course_id}
                    className="hover:bg-white/40 transition-colors"
                  >
                    <td className="py-4 px-4 font-bold text-on-surface">
                      {c.title}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-none border text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          c.target_audience === "PARENT"
                            ? "border-secondary/30 bg-secondary/10 text-secondary"
                            : c.target_audience === "CHILD"
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-tertiary/20 bg-tertiary/10 text-tertiary"
                        }`}
                      >
                        {c.target_audience === "PARENT"
                          ? "Phụ huynh"
                          : c.target_audience === "CHILD"
                            ? "Học sinh"
                            : "Cả hai"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant font-medium whitespace-nowrap">
                      {c.total_lessons} bài
                    </td>
                    <td className="py-4 px-4 font-bold text-on-surface whitespace-nowrap">
                      {c.total_enrolled}
                    </td>
                    <td className="py-4 px-4 text-on-surface-variant whitespace-nowrap">
                      <strong className="text-primary font-bold">
                        {c.completed_count}
                      </strong>{" "}
                      Hoàn thành /{" "}
                      <strong className="text-secondary font-bold">
                        {c.in_progress_count}
                      </strong>{" "}
                      Đang học
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          c.is_published
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-surface-container text-on-surface-variant border border-outline-variant/30"
                        }`}
                      >
                        {c.is_published ? "Public" : "Bản nháp"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSelectCourse(c.course_id)}
                          className="px-3 py-1.5 rounded-none text-[10px] font-bold transition-all cursor-pointer shadow-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        >
                          Quản lý
                        </button>
                        <button
                          onClick={() => handleTogglePublish(c.course_id)}
                          className={`px-3 py-1.5 rounded-none text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
                            c.is_published
                              ? "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30"
                              : "bg-primary text-white hover:opacity-90"
                          }`}
                        >
                          {c.is_published ? "Hạ nháp" : "Xuất bản"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        dismissible={false}
        backdropClassName="bg-black/30"
        panelClassName="border border-white/60 p-8"
      >
        <button
          onClick={() => setModalOpen(false)}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X size={20} weight="bold" />
        </button>

        <h3 className="text-base font-extrabold text-on-surface mb-6">
          Tạo khóa học mới
        </h3>

        <form onSubmit={handleCreateCourse} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cTitle"
            >
              Tiêu đề khóa học
            </label>
            <input
              id="cTitle"
              type="text"
              required
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="Ví dụ: Giáo dục giới tính tuổi dậy thì"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cAudience"
            >
              Dành cho
            </label>
            <select
              id="cAudience"
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={newAudience}
              onChange={(e) => setNewAudience(e.target.value as any)}
            >
              <option value="BOTH">Mọi người</option>
              <option value="CHILD">Trẻ nhỏ</option>
              <option value="PARENT">Phụ huynh</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cThumb"
            >
              Link ảnh Thumbnail
            </label>
            <input
              id="cThumb"
              type="text"
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="https://image-url.com/thumb.jpg"
              value={newThumb}
              onChange={(e) => setNewThumb(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cShort"
            >
              Tóm tắt khóa học
            </label>
            <input
              id="cShort"
              type="text"
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="Nội dung chính tóm gọn trong 1 dòng..."
              value={newShortDesc}
              onChange={(e) => setNewShortDesc(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cDesc"
            >
              Mô tả chi tiết đề cương
            </label>
            <textarea
              ref={growOnMount}
              id="cDesc"
              rows={4}
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
              placeholder="Nhập chi tiết về bài học, mục tiêu..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              onInput={autoGrow}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cObjectives"
            >
              Mục tiêu học tập (mỗi mục tiêu 1 dòng)
            </label>
            <textarea
              ref={growOnMount}
              id="cObjectives"
              rows={3}
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
              placeholder={"- Tiếp cận các kiến thức giáo dục giới tính chuẩn y khoa\n- Rèn luyện kỹ năng tự bảo vệ bản thân và phòng chống xâm hại"}
              value={newObjectives}
              onChange={(e) => setNewObjectives(e.target.value)}
              onInput={autoGrow}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-on-surface ml-1"
              htmlFor="cOutro"
            >
              Lời chúc mừng hoàn thành
            </label>
            <textarea
              ref={growOnMount}
              id="cOutro"
              rows={3}
              className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none overflow-hidden"
              placeholder="Nội dung sẽ hiện khi học viên tốt nghiệp khóa học..."
              value={newOutroContent}
              onChange={(e) => setNewOutroContent(e.target.value)}
              onInput={autoGrow}
            />
          </div>

          <Button type="submit" disabled={submitting} full size="lg">
            {submitting ? "Đang tạo..." : "Tạo khóa học (Nháp)"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

