"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CourseCard, CourseItem } from "@/components/CourseCard";
import { CourseCardSkeleton } from "@/components/Skeleton";
import {
  BookOpen,
  ArrowSquareOut,
  Article,
} from "@phosphor-icons/react";

export default function CoursesPage() {
  const { user } = useAuth();
  const isParent = user?.role === "STUDENT_PARENT";
  const isChild = user?.role === "STUDENT_CHILD" || user?.role === "STUDENT";

  const initialFilter = isParent ? "PARENT" : isChild ? "CHILD" : "ALL";
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CHILD" | "PARENT">(initialFilter);

  // Selected article modal state
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  useEffect(() => {
    if (isParent) {
      setFilter("PARENT");
    } else if (isChild) {
      setFilter("CHILD");
    }
  }, [isParent, isChild]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = "/courses";
        if (filter !== "ALL") {
          url += `?target_audience=${filter}`;
        }
        const res = await api.get(url);
        if (res.success) {
          setCourses(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Lỗi khi tải danh sách bài học");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [filter]);

  // Các bài báo và nghiên cứu uy tín
  const referenceArticles = [
    {
      id: "art-1",
      badge: "Tâm lý & Gia đình",
      badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
      title: "Nghệ Thuật Trò Chuyện Cùng Con Tuổi Dậy Thì",
      citation: "UNICEF Việt Nam & Bộ Giáo dục và Đào tạo (2023)",
      summary:
        "Hướng dẫn cha mẹ cách phá vỡ rào cản e ngại, đặt câu hỏi mở và lắng nghe không phán xét khi con chia sẻ về những thay đổi tâm sinh lý lứa tuổi và các thắc mắc giới tính.",
      content:
        "Khi bước vào giai đoạn dậy thì, trẻ bắt đầu hình thành ý thức độc lập và xuất hiện những tò mò tự nhiên về cơ thể, tình cảm. Cha mẹ thường gặp khó khăn do tâm lý e dè hoặc thói quen la rầy. Nghiên cứu chỉ ra rằng: việc cha mẹ bình tĩnh lắng nghe, thừa nhận cảm xúc của con và chia sẻ kiến thức chuẩn khoa học một cách tự nhiên giúp trẻ hình thành lòng tự trọng vững chắc, biết tôn trọng bản thân và xây dựng ranh giới lành mạnh.",
      tags: ["Đối thoại cởi mở", "Tâm lý tuổi dậy thì", "Gia đình đồng hành"],
    },
    {
      id: "art-2",
      badge: "An toàn học đường",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      title: "Bảo Vệ Học Sinh Trước Rủi Ro & Quấy Rối Không Gian Mạng",
      citation: "Cục Trẻ em & Save the Children (Báo cáo Nghiên cứu An toàn số)",
      summary:
        "Phân tích các phương thức quấy rối trực tuyến, tình huống gạ gẫm hình ảnh nhạy cảm và quy tắc bảo mật thông tin cá nhân giúp học sinh tự bảo vệ bản thân.",
      content:
        "Môi trường mạng xã hội mang lại cơ hội học hỏi nhưng cũng tiềm ẩn nhiều nguy cơ xâm phạm ranh giới cá nhân. Bài viết trang bị cho học sinh quy tắc nhận diện hành vi thao túng tâm lý (grooming), cách từ chối dứt khoát khi bị đòi hỏi hình ảnh riêng tư và các kênh hỗ trợ khẩn cấp tại nhà trường.",
      tags: ["An toàn mạng", "Ranh giới cá nhân", "Phòng chống xâm hại"],
    },
    {
      id: "art-3",
      badge: "Y khoa & Sinh lý",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Chăm Sóc Sức Khỏe Sinh Sản Vị Thành Niên & Vệ Sinh Thể Chất",
      citation: "Vụ Sức khỏe Bà mẹ - Trẻ em, Bộ Y tế",
      summary:
        "Kiến thức chuẩn y khoa về những biến đổi sinh học trong giai đoạn dậy thì, hướng dẫn chăm sóc cơ thể đúng cách và phòng tránh các bệnh lý học đường.",
      content:
        "Những thay đổi về hormone, chu kỳ kinh nguyệt ở nữ sinh và hiện tượng mộng tinh ở nam sinh là hoàn toàn tự nhiên. Việc trang bị kiến thức giải phẫu và vệ sinh cá nhân đúng cách giúp các em vượt qua lo lắng, tự tin vào sự phát triển cơ thể của mình.",
      tags: ["Y khoa vị thành niên", "Vệ sinh cá nhân", "Cơ thể dậy thì"],
    },
    {
      id: "art-4",
      badge: "Mô hình NCKH",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      title: "Mô Hình Phối Hợp Nhà Trường - Gia Đình Trong Công Tác GDGT",
      citation: "Nhóm Nghiên cứu Khoa học THPT Giồng Ông Tố (2026)",
      summary:
        "Đề xuất giải pháp trang web học tập trực tuyến tích hợp AI mô phỏng nhằm giảm thiểu rào cản tâm lý tiếp cận giáo dục giới tính cho học sinh THPT.",
      content:
        "Nghiên cứu khảo sát thực trạng rào cản e ngại tại nhà trường và đề xuất nền tảng E-learning kết hợp mô phỏng AI đóng vai (roleplay), mang lại môi trường học tập trực quan, thân thiện và hiệu quả thực tiễn cao.",
      tags: ["NCKH Giồng Ông Tố", "E-learning", "Gamification"],
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            {isParent
              ? "Góc Học Tập Cho Phụ Huynh"
              : isChild
              ? "Góc Học Tập Cho Học Sinh"
              : "Góc Học Tập"}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
            {isParent
              ? "Chương trình chuyên sâu giúp phụ huynh trang bị kiến thức và kỹ năng đồng hành cùng con tuổi dậy thì."
              : isChild
              ? "Hệ thống bài giảng do giáo viên phụ trách đăng tải, học sinh hoàn thành như một bài giảng trên lớp."
              : "Bài giảng do giáo viên đăng tải, học sinh hoàn thành như một bài giảng trên lớp. Tích hợp E-learning trực quan và kiểm tra đánh giá chuẩn hóa."}
          </p>
        </div>

        {/* Filters - Only displayed for Guests / Admins / Instructors */}
        {!isParent && !isChild && (
          <div className="flex gap-1 p-1 rounded-none bg-surface-container-low border border-outline-variant/30">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-5 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-primary text-white shadow-depth-1"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/50"
              }`}
            >
              Tất cả
            </button>

            <button
              onClick={() => setFilter("CHILD")}
              className={`px-5 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                filter === "CHILD"
                  ? "bg-primary text-white shadow-depth-1"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/50"
              }`}
            >
              Dành cho Học sinh
            </button>

            <button
              onClick={() => setFilter("PARENT")}
              className={`px-5 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                filter === "PARENT"
                  ? "bg-primary text-white shadow-depth-1"
                  : "text-on-surface-variant hover:text-primary hover:bg-white/50"
              }`}
            >
              Dành cho Phụ huynh
            </button>
          </div>
        )}
      </div>

      {/* Content list */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <BookOpen size={22} weight="duotone" className="text-primary" />
            <span>Bài học trực tuyến</span>
          </h2>
          <span className="text-xs text-on-surface-variant">
            {courses.length} bài giảng có sẵn
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12 border border-red-500/10 rounded-xl bg-red-950/10 max-w-md mx-auto">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center text-slate-500 py-24 bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
            Không tìm thấy bài học nào phù hợp trong góc học tập.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* SECTION TÌM HIỂU THÊM (CÁC BÀI BÁO, NGHIÊN CỨU TRÍCH DẪN UY TÍN) */}
      <section className="pt-8 border-t border-outline-variant/30 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-on-surface">
              Tìm Hiểu Thêm: Nghiên Cứu &amp; Bài Báo Uy Tín
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl font-light leading-relaxed">
              Các bài báo khoa học, cẩm nang tâm lý và nghiên cứu được trích dẫn nguồn uy tín từ UNICEF, Bộ GD&amp;ĐT và Bộ Y tế, giúp cả Học sinh và Phụ huynh chủ động tra cứu, mở rộng kiến thức.
            </p>
          </div>
        </div>

        {/* Reference Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {referenceArticles.map((art) => (
            <div
              key={art.id}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-outline-variant/30 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${art.badgeColor}`}
                  >
                    {art.badge}
                  </span>
                  <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                    <Article size={13} weight="bold" />
                    Nguồn thẩm định
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-primary/80 font-medium italic">
                  Trích dẫn: {art.citation}
                </p>

                <p className="text-xs sm:text-sm text-on-surface-variant font-light leading-relaxed">
                  {art.summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {art.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant/70 font-medium">
                  Phục vụ nghiên cứu &amp; đối thoại gia đình
                </span>
                <button
                  onClick={() => setSelectedArticle(art)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-container transition-colors cursor-pointer"
                >
                  <span>Đọc chi tiết</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal chi tiết bài báo */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-outline-variant/30 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${selectedArticle.badgeColor}`}
              >
                {selectedArticle.badge}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition-colors cursor-pointer text-sm font-bold"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-on-surface">
                {selectedArticle.title}
              </h3>
              <p className="text-xs text-primary font-medium italic">
                Nguồn tài liệu: {selectedArticle.citation}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/20 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              <p className="font-semibold text-on-surface mb-1.5">Tóm lược cốt lõi:</p>
              <p>{selectedArticle.summary}</p>
            </div>

            <div className="text-xs sm:text-sm text-on-surface leading-relaxed space-y-3 max-h-[40vh] overflow-y-auto pr-2">
              <p className="font-semibold text-on-surface">Nội dung trích đoạn nghiên cứu:</p>
              <p className="font-light">{selectedArticle.content}</p>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
