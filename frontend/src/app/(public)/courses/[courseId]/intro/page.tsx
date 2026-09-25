"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CourseIntroSkeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { BRAND_CONFIG } from "@/config/branding";
import { Badge, EmptyState } from "@/components/ui";
import { MarkdownRenderer } from "@/components/common/MarkdownRenderer";
import {
  WarningCircle,
  Sparkle,
  CheckCircle,
  CaretDown,
  Clock,
  Play,
  BookOpen,
  UsersThree,
  Infinity as InfinityIcon,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Backpack,
  HouseLine,
  Video,
  Article,
  Question,
  Headphones,
  Check,
  ShareNetwork,
  Certificate,
  LockKey,
  SealCheck,
  Compass,
  Heart,
  ChatCircleText,
} from "@phosphor-icons/react";

interface SyllabusItem {
  id: string;
  order_index: number;
  title: string;
  content_type?: string;
  duration_minutes: number | null;
  has_quiz?: boolean;
}

export default function CourseIntroPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const courseId = params.courseId as string;

  const [courseData, setCourseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSyllabus, setExpandedSyllabus] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!courseId) return;

    const fetchCourseDetail = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/intro`);
        if (res.success) {
          setCourseData(res.data);
        }
      } catch (err: any) {
        const msg = err.message || "Lỗi khi tải chi tiết khóa học";
        if (
          msg.includes("quyền") ||
          msg.includes("dành riêng") ||
          msg.includes("không thể xem")
        ) {
          router.replace(`/invalid?reason=${encodeURIComponent(msg)}`);
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetail();
  }, [courseId, router]);

  const handleAction = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (courseData?.is_enrolled) {
      router.push(`/courses/${courseId}/learn`);
      return;
    }

    setEnrolling(true);
    try {
      const res = await api.post(`/courses/${courseId}/enroll`, {});
      if (res.success) {
        showToast("Đăng ký khóa học thành công!", "success");
        router.push(`/courses/${courseId}/learn`);
      }
    } catch (err: any) {
      const msg = err.message || "Lỗi khi đăng ký khóa học";
      if (
        msg.includes("quyền") ||
        msg.includes("dành riêng") ||
        msg.includes("không thể")
      ) {
        router.replace(`/invalid?reason=${encodeURIComponent(msg)}`);
        return;
      }
      showToast(msg, "error");
    } finally {
      setEnrolling(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast("Đã sao chép liên kết khóa học!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return <CourseIntroSkeleton />;
  }

  if (error || !courseData) {
    return (
      <EmptyState
        tone="error"
        icon={<WarningCircle size={32} weight="duotone" />}
        title="Không tìm thấy khóa học này"
        body={error ?? undefined}
        action={{ label: "Quay lại danh mục", href: "/courses" }}
        className="py-16 max-w-md mx-auto"
      />
    );
  }

  const isParent = courseData.target_audience === "PARENT";
  const isChild = courseData.target_audience === "CHILD";

  const totalMinutes = (courseData.syllabus || []).reduce(
    (acc: number, curr: SyllabusItem) => acc + (curr.duration_minutes || 12),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes}p` : `${totalMinutes} phút`;

  const learningObjectivesList = courseData.learning_objectives
    ? courseData.learning_objectives
        .split("\n")
        .map((line: string) => line.trim().replace(/^[-*•]\s*/, ""))
        .filter((line: string) => line.length > 0)
    : [
        "Hiểu rõ kiến thức sinh lý học và giải phẫu cơ thể chuẩn y khoa theo từng lứa tuổi.",
        "Xây dựng ranh giới cá nhân, nhận diện sớm các nguy cơ bị xâm hại hoặc quấy rối.",
        "Rèn luyện kỹ năng từ chối dứt khoát và kỹ năng ứng phó các tình huống nhạy cảm thực tế.",
        "Thiết lập kênh đối thoại cởi mở, an toàn và không phán xét giữa thanh thiếu niên và gia đình.",
      ];

  return (
    <div className="min-h-screen bg-background text-on-background font-sans pb-28 lg:pb-16 animate-page-appear">
      {/* Top Breadcrumb & Hero Header Section */}
      <section className="relative w-full bg-gradient-to-b from-primary/10 via-surface to-background border-b border-outline-variant/20 pt-8 pb-12 sm:pb-16 overflow-hidden">
        {/* Subtle Decorative Background Blurs */}
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant font-medium mb-6">
            <Link href="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <span className="text-outline-variant">/</span>
            <Link href="/courses" className="hover:text-primary transition-colors">
              Danh mục khóa học
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-semibold truncate max-w-[200px] sm:max-w-xs">
              {courseData.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left 7-cols: Hero Typography & Info */}
            <div className="lg:col-span-8 space-y-6">
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {isParent ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <HouseLine size={15} weight="duotone" />
                    <span>Dành cho Phụ huynh</span>
                  </span>
                ) : isChild ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30">
                    <Backpack size={15} weight="duotone" />
                    <span>Dành cho Học sinh (12-18 tuổi)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                    <UsersThree size={15} weight="duotone" />
                    <span>Mọi đối tượng</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={15} weight="fill" className="text-emerald-600" />
                  <span>Chuẩn Y khoa Thẩm định</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                  <Certificate size={15} weight="duotone" className="text-purple-600" />
                  <span>Chứng nhận tốt nghiệp</span>
                </span>
              </div>

              {/* Course Main Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
                {courseData.title}
              </h1>

              {/* Short Hook Description */}
              <p className="text-sm sm:text-base text-on-surface-variant font-light leading-relaxed max-w-3xl">
                {courseData.short_description ||
                  "Khóa học cung cấp lộ trình giáo dục giới tính toàn diện, kết hợp hình ảnh trực quan, video tình huống và hệ thống kiểm tra trắc nghiệm chuẩn y khoa."}
              </p>

              {/* Author & Highlights Metrics Bar */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 border-t border-outline-variant/20 text-xs sm:text-sm text-on-surface-variant">
                {/* Instructor Snapshot */}
                <div className="flex items-center gap-2.5">
                  <img
                    className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shadow-xs bg-surface-container"
                    alt={courseData.instructor.full_name}
                    src={
                      courseData.instructor.avatar_url ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLgNlt8oxrJXRkbLEhGWQB1WaLOqf9Zm7fBANEhyCLI3WBvhBT1fFopS25w1iSYvOj7ChfPef3vVnlOy4-2IfSJh9cSEEDdOHVz1f0RxGNFvC6S9pytVBlevtz6tEDiHNgYyDr2GmyZE3sjiypqLWOCkhf2du7uRwTKYADj9nXtFS3CrbKEQUi9agqpKyN-LZtQr9-UkMUYQ-Z1npuTPGg-Zb0iumqS2vauThTOXStUxw7mMeHr-dUXw"
                    }
                  />
                  <div>
                    <span className="text-[11px] text-on-surface-variant/70 block">Giảng viên phụ trách</span>
                    <span className="font-bold text-on-surface">{courseData.instructor.full_name}</span>
                  </div>
                </div>

                <div className="h-6 w-px bg-outline-variant/30 hidden sm:block" />

                <div className="flex items-center gap-1.5 font-medium">
                  <BookOpen size={18} weight="duotone" className="text-primary" />
                  <span>
                    <strong className="text-on-surface font-bold">{courseData.total_lessons}</strong> bài học
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <Clock size={18} weight="duotone" className="text-primary" />
                  <span>
                    Ước tính <strong className="text-on-surface font-bold">~{durationText}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-medium">
                  <InfinityIcon size={18} weight="bold" className="text-primary" />
                  <span>Học không giới hạn</span>
                </div>
              </div>
            </div>

            {/* Right 4-cols on Desktop: Floating Video Preview Hero Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="glass-panel bg-white/95 rounded-2xl border border-outline-variant/40 shadow-xl overflow-hidden sticky top-24 transition-all">
                {/* Thumbnail Preview Stage */}
                <div
                  onClick={handleAction}
                  className="relative w-full h-52 bg-surface-container overflow-hidden group cursor-pointer"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={courseData.title}
                    src={
                      courseData.thumbnail_url ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9-sxq6hwgyme01rYTAWAZzCHGgH8DuSQtNxeTBNyeagcRB66jUv-pKFaK84qEbPi-1JCa6Apc_NeHXJCFfYyURKkzLpD4ZwIAmfCzJ_MqJxX598zjHbSPR66nKvVfG5hpgqfgP7Lgh8aPTVF10p2aeCZqQQEKXgG_Go_krqDOYALphZ_tJUPtZqrshdB0Y57Q-fI1nmcOBVyQFaqp5ytmflg2-mbg3FWJWKJa5Ik9ZY-zNZoxf9Qkjg"
                    }
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={24} weight="fill" className="ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5">
                    <Video size={13} weight="bold" />
                    <span>Xem lộ trình phòng học</span>
                  </div>
                </div>

                {/* Card CTA & Features Body */}
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <button
                      onClick={handleAction}
                      disabled={enrolling}
                      className="w-full bg-primary hover:bg-primary-container text-white text-sm font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {enrolling
                          ? "Đang xử lý..."
                          : courseData.is_enrolled
                            ? "Vào học ngay"
                            : "Bắt đầu học miễn phí"}
                      </span>
                      <ArrowRight size={18} weight="bold" />
                    </button>

                    <button
                      onClick={handleShare}
                      className="w-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-outline-variant/30"
                    >
                      <ShareNetwork size={16} weight="bold" className="text-primary" />
                      <span>{copiedLink ? "Đã sao chép liên kết!" : "Chia sẻ khóa học"}</span>
                    </button>
                  </div>

                  {/* Benefit Checklist */}
                  <div className="space-y-3 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                    <div className="font-bold text-on-surface text-xs tracking-wider uppercase">
                      Khóa học bao gồm:
                    </div>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2.5">
                        <Check size={16} weight="bold" className="text-primary shrink-0" />
                        <span>{courseData.total_lessons} bài học đa phương tiện (Video, Podcast & Đọc)</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check size={16} weight="bold" className="text-primary shrink-0" />
                        <span>Trắc nghiệm củng cố sau mỗi bài học</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check size={16} weight="bold" className="text-primary shrink-0" />
                        <span>Bài đánh giá năng lực & cấp chứng nhận</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check size={16} weight="bold" className="text-primary shrink-0" />
                        <span>Tài liệu tham khảo y khoa có kiểm duyệt</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check size={16} weight="bold" className="text-primary shrink-0" />
                        <span>Truy cập trọn đời trên máy tính & điện thoại</span>
                      </li>
                    </ul>
                  </div>

                  {/* Trust Footer */}
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-primary leading-relaxed flex items-center gap-2">
                    <ShieldCheck size={20} weight="fill" className="shrink-0" />
                    <span>Miễn phí 100% • Không yêu cầu thẻ tín dụng • Bảo mật thông tin học viên</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Left Column: Course Details, Objectives, Syllabus, Instructor */}
          <div className="lg:col-span-8 space-y-12">
            {/* Mobile Hero Media Card (Visible only on mobile/tablet) */}
            <div className="lg:hidden glass-panel bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
              <div
                onClick={handleAction}
                className="relative w-full h-48 sm:h-64 bg-surface-container overflow-hidden group cursor-pointer"
              >
                <img
                  className="w-full h-full object-cover"
                  alt={courseData.title}
                  src={
                    courseData.thumbnail_url ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuD9-sxq6hwgyme01rYTAWAZzCHGgH8DuSQtNxeTBNyeagcRB66jUv-pKFaK84qEbPi-1JCa6Apc_NeHXJCFfYyURKkzLpD4ZwIAmfCzJ_MqJxX598zjHbSPR66nKvVfG5hpgqfgP7Lgh8aPTVF10p2aeCZqQQEKXgG_Go_krqDOYALphZ_tJUPtZqrshdB0Y57Q-fI1nmcOBVyQFaqp5ytmflg2-mbg3FWJWKJa5Ik9ZY-zNZoxf9Qkjg"
                  }
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-md">
                    <Play size={22} weight="fill" className="ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <button
                  onClick={handleAction}
                  disabled={enrolling}
                  className="w-full bg-primary hover:bg-primary-container text-white text-sm font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {enrolling
                      ? "Đang xử lý..."
                      : courseData.is_enrolled
                        ? "Vào học ngay"
                        : "Bắt đầu học miễn phí"}
                  </span>
                  <ArrowRight size={18} weight="bold" />
                </button>
              </div>
            </div>

            {/* SECTION 1: Learning Objectives */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Sparkle size={20} weight="fill" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-on-surface">
                    Mục tiêu bài học & Kỹ năng đạt được
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Sau khi hoàn thành khóa học này, bạn sẽ nắm vững:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {learningObjectivesList.map((obj: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/40 transition-colors"
                  >
                    <CheckCircle
                      size={20}
                      weight="fill"
                      className="text-primary mt-0.5 shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-on-surface leading-relaxed font-medium">
                      {obj}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 2: Course Description */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface flex items-center gap-2">
                <span>Về khóa học này</span>
              </h2>

              <div className="prose prose-sm sm:prose-base max-w-none text-on-surface-variant font-light leading-relaxed bg-white rounded-2xl sm:rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-xs">
                {courseData.description ? (
                  <MarkdownRenderer content={courseData.description} />
                ) : (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <p>
                      Giáo dục giới tính không chỉ là những kiến thức sinh học đơn thuần, mà là hành trang thiết yếu giúp mỗi bạn trẻ hiểu và yêu thương cơ thể mình, biết cách tự bảo vệ trước các nguy cơ và xây dựng những mối quan hệ lành mạnh, tôn trọng lẫn nhau.
                    </p>
                    <p>
                      Khóa học được xây dựng theo chuẩn y khoa hiện đại bởi các chuyên gia sức khỏe vị thành niên và tâm lý học đường, mang đến trải nghiệm học tập cởi mở, văn minh và hoàn toàn không phán xét.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 3: Detailed Syllabus Accordion */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface">
                    Chương trình học chi tiết
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {courseData.syllabus.length} bài học • Tổng thời lượng ước tính ~{durationText}
                  </p>
                </div>

                <button
                  onClick={() => setExpandedSyllabus(!expandedSyllabus)}
                  className="text-xs font-bold text-primary hover:text-primary-container px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{expandedSyllabus ? "Thu gọn" : "Mở rộng tất cả"}</span>
                  <CaretDown
                    size={16}
                    weight="bold"
                    className={`transition-transform duration-200 ${
                      expandedSyllabus ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {expandedSyllabus && (
                <div className="space-y-3 animate-fade-in">
                  {courseData.syllabus.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-outline-variant/20 text-xs text-on-surface-variant">
                      Chương trình học đang được cập nhật. Vui lòng quay lại sau!
                    </div>
                  ) : (
                    courseData.syllabus.map((lesson: SyllabusItem) => {
                      const isQuiz = lesson.content_type === "QUIZ";
                      const isAudio =
                        lesson.content_type === "AUDIO" ||
                        lesson.content_type === "NOTEBOOKLM";

                      return (
                        <div
                          key={lesson.id}
                          className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-outline-variant/30 flex items-center justify-between gap-4 transition-all hover:border-primary/50 hover:shadow-xs group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Order Number Badge */}
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                              {lesson.order_index}
                            </div>

                            {/* Title & Type Info */}
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                                {lesson.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant font-medium flex-wrap">
                                {isQuiz ? (
                                  <span className="flex items-center gap-1 text-purple-700">
                                    <Question size={13} weight="bold" />
                                    <span>Trắc nghiệm kiểm tra</span>
                                  </span>
                                ) : isAudio ? (
                                  <span className="flex items-center gap-1 text-purple-700">
                                    <Headphones size={13} weight="bold" />
                                    <span>NotebookLM Audio</span>
                                  </span>
                                ) : lesson.content_type === "VIDEO" ? (
                                  <span className="flex items-center gap-1 text-primary">
                                    <Video size={13} weight="bold" />
                                    <span>Video bài giảng</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-primary">
                                    <Article size={13} weight="bold" />
                                    <span>Tài liệu bài đọc</span>
                                  </span>
                                )}

                                {lesson.duration_minutes && (
                                  <>
                                    <span>•</span>
                                    <span>{lesson.duration_minutes} phút</span>
                                  </>
                                )}

                                {lesson.has_quiz && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                                    + Trắc nghiệm 10 câu
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs font-semibold text-primary/70 group-hover:text-primary flex items-center gap-1 transition-colors">
                              <span className="hidden sm:inline">Xem bài</span>
                              <Play size={14} weight="fill" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Graduation Milestone Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-primary/5 border border-purple-200/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Certificate size={22} weight="fill" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-on-surface">
                          Đánh giá năng lực tổng kết & Cấp Chứng nhận
                        </h4>
                        <p className="text-[11px] text-on-surface-variant font-light mt-0.5">
                          Hoàn tất các bài học để mở khóa bài kiểm tra tốt nghiệp và nhận chứng chỉ chính thức.
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold shrink-0">
                      Đích đến
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 4: Instructor Profile */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-outline-variant/30 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <span>Chuyên gia & Giảng viên</span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-primary/20 bg-surface-container shrink-0 shadow-sm"
                  alt={courseData.instructor.full_name}
                  src={
                    courseData.instructor.avatar_url ||
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDLgNlt8oxrJXRkbLEhGWQB1WaLOqf9Zm7fBANEhyCLI3WBvhBT1fFopS25w1iSYvOj7ChfPef3vVnlOy4-2IfSJh9cSEEDdOHVz1f0RxGNFvC6S9pytVBlevtz6tEDiHNgYyDr2GmyZE3sjiypqLWOCkhf2du7uRwTKYADj9nXtFS3CrbKEQUi9agqpKyN-LZtQr9-UkMUYQ-Z1npuTPGg-Zb0iumqS2vauThTOXStUxw7mMeHr-dUXw"
                  }
                />
                <div className="text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
                      {courseData.instructor.full_name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <SealCheck size={14} weight="fill" />
                      <span>Đã xác minh chuyên môn</span>
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-on-surface-variant font-light leading-relaxed">
                    {courseData.instructor.bio ||
                      `Chuyên gia giàu kinh nghiệm trong lĩnh vực Y học Dự phòng và Tâm lý lứa tuổi học đường, phụ trách điều phối nội dung khóa học trên nền tảng giáo dục ${BRAND_CONFIG.name}.`}
                  </p>

                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={16} weight="duotone" className="text-primary" />
                      <span>Cố vấn y khoa</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <ChatCircleText size={16} weight="duotone" className="text-secondary" />
                      <span>Đồng hành cùng học viên</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Medical Safety & Non-Judgmental Pledge */}
            <section className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Heart size={26} weight="duotone" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-on-surface">
                  Không gian học tập an toàn, bảo mật & không phán xét
                </h4>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  Tất cả tài liệu và số liệu được kiểm chứng y khoa theo tài liệu hướng dẫn của Bộ Y tế và Tổ chức Y tế Thế giới (WHO). Toàn bộ quá trình học tập, lịch sử trắc nghiệm và thông tin của bạn được bảo mật tuyệt đối.
                </p>
              </div>
            </section>
          </div>

          {/* Right Column Spacer for Desktop (Sidebar floats over it via fixed/sticky) */}
          <div className="lg:col-span-4 hidden lg:block" />
        </div>
      </main>

      {/* Floating Bottom Sticky Bar for Mobile Devices */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-outline-variant/30 p-3 sm:p-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-xl flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-on-surface truncate">
            {courseData.title}
          </p>
          <p className="text-[11px] text-primary font-bold">
            {courseData.is_enrolled ? "Đang theo học" : "Miễn phí 100%"}
          </p>
        </div>

        <button
          onClick={handleAction}
          disabled={enrolling}
          className="bg-primary hover:bg-primary-container text-white text-xs font-bold py-3 px-5 rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
        >
          <span>
            {enrolling
              ? "Đang tải..."
              : courseData.is_enrolled
                ? "Vào học ngay"
                : "Bắt đầu học"}
          </span>
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>
    </div>
  );
}
