"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CourseCard } from "@/components/CourseCard";
import { HeroTypingTitle } from "@/app/(public)/_home/HeroTypingTitle";
import { ThreeStepJourney } from "@/app/(public)/_home/ThreeStepJourney";
import { FeaturedRoleplaySection } from "@/app/(public)/_home/FeaturedRoleplaySection";
import { CourseCardSkeleton, ForumPostSkeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/ui";
import {
  ArrowRight,
  Lightning,
  BookOpen,
  ChartLineUp,
  Robot,
  UsersThree,
  UserCircle,
  ChatCircle,
  Heart,
} from "@phosphor-icons/react";

// Hero visual là chỗ duy nhất còn dùng gsap — dynamic ssr:false để gsap rơi ra chunk
// tải trễ; hero title (chứa h1 SEO, đã bỏ gsap) và các section text vẫn render tĩnh.
const HeroVisualShowcase = dynamic(
  () =>
    import("@/app/(public)/_home/HeroVisualShowcase").then(
      (m) => m.HeroVisualShowcase,
    ),
  {
    ssr: false,
    // Skeleton tối giản giữ đúng khung hero để tránh layout shift khi chunk tải trễ
    loading: () => (
      <div
        className="w-full flex items-center justify-center py-4 md:py-6"
        aria-hidden="true"
      >
        <div className="w-full h-[340px] sm:h-[420px] md:h-[490px] rounded-3xl bg-surface-container animate-pulse" />
      </div>
    ),
  },
);

interface Course {
  id: string;
  title: string;
  thumbnail_url: string | null;
  instructor_name: string;
  total_lessons: number;
}

interface ForumPost {
  id: string;
  title: string;
  short_content?: string | null;
  category_name: string;
  author_name: string;
  author_avatar?: string | null;
  is_anonymous?: boolean;
  likes_count?: number;
  comment_count: number;
  created_at: string;
}

export default function HomePage() {
  const { user } = useAuth();
  const isParent = user?.role === "STUDENT_PARENT";
  const isChild = user?.role === "STUDENT_CHILD" || user?.role === "STUDENT";

  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PARENT" | "CHILD">(
    isChild ? "CHILD" : "PARENT",
  );

  useEffect(() => {
    if (isParent) {
      setActiveTab("PARENT");
    } else if (isChild) {
      setActiveTab("CHILD");
    }
  }, [isParent, isChild]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await api.get("/general/home");
        if (res.success) {
          setHomeData(res.data);
        }
      } catch (err) {
        console.error("Error loading home page data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Giới hạn 6 khóa cho landing teaser, tránh DOM phình vô hạn khi danh mục lớn dần
  const coursesToRender =
    activeTab === "PARENT"
      ? (homeData?.parent_courses || []).slice(0, 6)
      : (homeData?.child_courses || []).slice(0, 6);

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-24 px-4 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 md:gap-8">
            <HeroTypingTitle />
            <p className="text-base md:text-lg text-on-surface-variant font-normal leading-relaxed max-w-lg">
              Nền tảng hỗ trợ giáo viên trong công tác Giáo dục giới tính tại THPT Giồng Ông Tố — Tiện lợi, khoa học, thú vị — đồng hành cùng Học sinh, Phụ huynh và Nhà trường. Môi trường học tập số tiện lợi, an toàn, hỗ trợ giảm thiểu rào cản trong việc GDGT ở nhà trường và gia đình.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/courses"
                className="px-6 py-3.5 bg-primary text-white rounded-full text-sm font-bold hover:opacity-90 shadow-md flex items-center justify-center gap-2 transition-all"
              >
                Khám phá Góc Học Tập
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link
                href="/about"
                className="px-6 py-3.5 border border-outline/30 text-primary hover:bg-surface-container rounded-full text-sm font-bold flex items-center justify-center transition-all"
              >
                Về Chúng Tôi
              </Link>
            </div>
          </div>
          <HeroVisualShowcase />
        </div>
      </section>

      {/* NCKH THPT Giồng Ông Tố Intro Banner */}
      <section className="px-4 md:px-16 -mt-4 mb-4">
        <div className="max-w-7xl mx-auto p-6 md:p-8 rounded-none bg-white border border-outline-variant/40 shadow-depth-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-primary">Về chúng tôi</span>
            <h3 className="text-lg md:text-xl font-extrabold text-on-surface">
              Nhóm nghiên cứu khoa học THPT Giồng Ông Tố
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-3xl">
              Mô hình trang web học tập online hỗ trợ nhà trường cung cấp kiến thức và giảm thiểu các rào cản tiếp cận GDGT ở học sinh. Tích hợp E-learning trực quan và gamification giúp tăng tính tương tác, đồng hành cùng Học sinh, Phụ huynh và Nhà trường.
            </p>
          </div>
          <Link
            href="/about"
            className="shrink-0 px-5 py-2.5 rounded-none bg-white border border-outline-variant/40 text-xs font-bold text-primary hover:bg-surface-container transition-all shadow-depth-1"
          >
            Tìm hiểu đề tài
          </Link>
        </div>
      </section>

      {/* 3-Step Interactive Learning Journey */}
      <ThreeStepJourney />

      {/* Featured AI Roleplay Simulation Hub Section */}
      <FeaturedRoleplaySection />

      {/* Course Switcher Section */}
      <section className="py-24 px-4 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-4">
              Khám phá Góc Học Tập
            </h2>
            <p className="text-sm text-on-surface-variant max-w-xl mx-auto">
              {isParent
                ? "Chương trình hướng dẫn chuyên sâu giúp phụ huynh trang bị kiến thức và kỹ năng đồng hành cùng con."
                : isChild
                  ? "Hệ thống bài giảng do giáo viên phụ trách, học sinh hoàn thành như bài giảng trên lớp."
                  : "Lựa chọn chương trình học tập phù hợp để đồng hành hiệu quả giữa Nhà trường, Học sinh và Phụ huynh."}
            </p>
          </div>

          {/* Switcher Tabs - Only visible for Guests / Admin / Instructors */}
          {!isParent && !isChild && (
            <div className="inline-flex p-1 bg-surface-container-low rounded-none mb-16 border border-outline-variant/30">
              <button
                onClick={() => setActiveTab("PARENT")}
                className={`px-8 py-3 rounded-none text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "PARENT"
                    ? "bg-white text-primary font-bold shadow-depth-1 border border-outline-variant/20"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
                }`}
              >
                Dành cho Phụ huynh
              </button>
              <button
                onClick={() => setActiveTab("CHILD")}
                className={`px-8 py-3 rounded-none text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "CHILD"
                    ? "bg-white text-primary font-bold shadow-depth-1 border border-outline-variant/20"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-white/50"
                }`}
              >
                Dành cho Học sinh
              </button>
            </div>
          )}

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {coursesToRender.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={48} weight="duotone" />}
                  title="Chưa có khóa học nổi bật nào."
                  className="col-span-full"
                />
              ) : (
                coursesToRender.map((course: Course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    forcedAudience={activeTab}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recent Forum Feed */}
      <section className="py-24 bg-surface-container-low/30 px-4 md:px-16 relative border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-2">
                Góc Trò Chuyện &amp; Thảo Luận
              </h2>
              <p className="text-sm text-on-surface-variant">
                Không gian đối thoại cởi mở, giải đáp thắc mắc giữa học sinh, phụ huynh và giáo viên.
              </p>
            </div>
            <Link
              className="hidden md:flex items-center gap-1.5 text-primary hover:text-primary-container font-semibold transition-colors text-sm"
              href="/forum"
            >
              Xem tất cả
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <ForumPostSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {!homeData?.recent_forum_posts ||
              homeData.recent_forum_posts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-on-surface-variant/75 text-sm">
                  Chưa có chủ đề thảo luận nào.
                </div>
              ) : (
                homeData.recent_forum_posts.map((post: ForumPost) => (
                  <Link
                    key={post.id}
                    href={`/forum/${post.id}`}
                    className="p-8 bg-white rounded-none border border-outline-variant/40 shadow-depth-1 hover:shadow-depth-3 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                          {post.is_anonymous ? (
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant flex-shrink-0">
                              <UserCircle size={24} weight="duotone" />
                            </div>
                          ) : post.author_avatar ? (
                            <img
                              src={post.author_avatar}
                              alt={post.author_name}
                              loading="lazy"
                              decoding="async"
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shadow-xs flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                              {post.author_name
                                ? post.author_name.charAt(0).toUpperCase()
                                : "U"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-on-surface">
                              {post.author_name || "Thành viên ẩn danh"}
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {new Date(post.created_at).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-[10px] font-semibold text-on-surface-variant border border-outline-variant/20 flex-shrink-0">
                          {post.category_name}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-on-surface mb-2.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-6 line-clamp-3">
                        {post.short_content ||
                          "Bấm vào để xem nội dung thảo luận và các ý kiến đóng góp từ cộng đồng."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant pt-4 border-t border-outline-variant/20 mt-auto">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <ChatCircle size={16} weight="duotone" />
                          {post.comment_count} bình luận
                        </div>
                        {post.likes_count !== undefined &&
                          post.likes_count > 0 && (
                            <div className="flex items-center gap-1.5 text-red-500 font-medium">
                              <Heart size={16} weight="fill" />
                              {post.likes_count}
                            </div>
                          )}
                      </div>

                      <span className="text-xs text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Xem chi tiết
                        <ArrowRight size={13} weight="bold" />
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link
              href="/forum"
              className="inline-flex px-8 py-3 border border-outline/30 text-on-surface rounded-none text-sm font-bold bg-white shadow-depth-1 hover:bg-surface-container transition-colors"
            >
              Xem tất cả thảo luận
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
