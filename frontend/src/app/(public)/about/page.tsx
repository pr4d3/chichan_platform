"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { BRAND_CONFIG } from "@/config/branding";
import {
  GraduationCap,
  Sparkle,
  Target,
  Brain,
  HandHeart,
  Lightbulb,
  Scales,
  MagnifyingGlassPlus,
  ArrowSquareOut,
  Bookmarks,
  GameController,
  ChatsCircle,
  PhoneCall,
  EnvelopeSimple,
  CheckCircle,
  FileText,
  Quotes,
  TrendUp,
  WarningCircle,
  ChartBar,
} from "@phosphor-icons/react";
import { FormRow, EyebrowLabel, Modal } from "@/components/ui";
import {
  AdvisorAbstractIllustration,
  SurveyAnalyticsAbstractIllustration,
  ScenarioStoryAbstractIllustration,
  TechSystemAbstractIllustration,
} from "@/components/illustrations/RoleIllustrations";
import {
  Chart211,
  Chart212,
  Chart213,
  Chart214,
  Chart215,
  Chart216,
  Chart217,
  Chart218,
} from "@/components/research/ResearchCharts";

interface Author {
  name: string;
  role: string;
  tagline: string;
  institution: string;
  illustration: React.ReactNode;
  quote: string;
}

const AUTHORS: Author[] = [
  {
    name: "Thầy Trần Thiện Trí",
    role: "Giáo viên hướng dẫn",
    tagline: "GV Toán • Cố vấn phương pháp luận & Sư phạm",
    institution: "THPT Giồng Ông Tố, TP.HCM",
    illustration: <AdvisorAbstractIllustration className="w-full h-full" />,
    quote:
      "Giáo dục giới tính không phải là vẽ đường cho hươu chạy, mà là thắp đèn soi rọi cho các em đi đúng đường trong sự an toàn và hiểu biết.",
  },
  {
    name: "Nguyễn Lê Khánh Dung",
    role: "Đồng tác giả nghiên cứu",
    tagline: "Lớp 12A9 • Phụ trách khảo sát & Phân tích số liệu",
    institution: "THPT Giồng Ông Tố, TP.HCM",
    illustration: <SurveyAnalyticsAbstractIllustration className="w-full h-full" />,
    quote:
      "Tụi mình muốn tạo nên một nơi mà bạn bè có thể thoải mái tìm hiểu về chính cơ thể mình mà không phải ngại ngùng hay sợ bị phán xét.",
  },
  {
    name: "Đinh Tuệ Chi",
    role: "Đồng tác giả nghiên cứu",
    tagline: "Lớp 12A9 • Biên kịch kịch bản tình huống nhập vai",
    institution: "THPT Giồng Ông Tố, TP.HCM",
    illustration: <ScenarioStoryAbstractIllustration className="w-full h-full" />,
    quote:
      "Nếu đã từng rèn luyện phản xạ từ chối cùng AI trong môi trường giả lập an toàn, khi gặp tình huống thực tế ngoài đời các bạn sẽ tự tin bảo vệ mình.",
  },
  {
    name: "Đàm Lê Tuấn Anh",
    role: "Kỹ thuật & Công nghệ",
    tagline: "Kỹ sư phần mềm • Kiến trúc sư hệ thống",
    institution: "Đại học FPT",
    illustration: <TechSystemAbstractIllustration className="w-full h-full" />,
    quote:
      "Công nghệ mang sứ mệnh kết nối, biến những kiến thức khoa học thành trải nghiệm tương tác trực quan, an toàn và dễ tiếp cận cho mọi bạn trẻ.",
  },
];

const ABBREVIATIONS = [
  { term: "GDGT", full: "Giáo dục giới tính" },
  { term: "GDGTTD", full: "Giáo dục giới tính toàn diện (Comprehensive Sexuality Education - CSE)" },
  { term: "SKSS", full: "Sức khỏe sinh sản" },
  { term: "SKTD", full: "Sức khỏe tình dục" },
  { term: "THPT", full: "Trung học phổ thông" },
  { term: "SMD", full: "Standardized Mean Difference (Hiệu số trung bình chuẩn hóa trong phân tích meta)" },
  { term: "ES", full: "Effect Size (Kích thước hiệu ứng / Mức độ ảnh hưởng thực nghiệm)" },
];

const REFERENCES = [
  {
    title: "AMAZE.org (Tổ chức Quốc tế)",
    desc: "Nền tảng giáo dục trực tuyến miễn phí cung cấp kiến thức giáo dục giới tính và sức khỏe sinh sản dành cho trẻ vị thành niên, phụ huynh và giáo viên.",
    url: "https://amaze.org/",
  },
  {
    title: "UNFPA Việt Nam - Báo cáo quốc gia về thanh niên Việt Nam",
    desc: "Điều tra quốc gia về sức khỏe sinh sản, sức khỏe tình dục thanh thiếu niên Việt Nam (Bộ Y tế & Quỹ Dân số Liên Hợp Quốc).",
    url: "https://vietnam.unfpa.org/vi/publications/b%C3%A1o-c%C3%A1o-v%E1%BB%81-thanh-ni%C3%AAn-vi%E1%BB%87t-nam-2015-2018",
  },
  {
    title: "Tổng hội Y học Việt Nam - Giáo dục giới tính và tình dục toàn diện cho học sinh",
    desc: "Thực trạng, khoảng trống và một số khuyến nghị sư phạm y tế học đường (Tạp chí Y học Việt Nam).",
    url: "https://tapchiyhocvietnam.vn/index.php/vmj/article/view/3573",
  },
  {
    title: "Báo Tuổi Trẻ - Giáo dục giới tính trong bối cảnh hiện nay",
    desc: "Khảo sát thực tế về tâm lý né tránh của phụ huynh và sự e ngại của học sinh trước các vấn đề sức khỏe giới tính.",
    url: "https://tuoitre.vn/giaoduc/giao-duc-gioi-tinh-trong-boi-canh-hien-nay-108926802.htm",
  },
  {
    title: "Bộ GD&ĐT - Chương trình Giáo dục Phổ thông tổng thể 2018",
    desc: "Thông tư số 32/2018/TT-BGDĐT về phát triển năng lực, phẩm chất, kỹ năng sống và trách nhiệm cá nhân cho học sinh phổ thông.",
    url: "https://luatvietnam.vn/giao-duc/thong-tu-32-2018-tt-bgddt-ban-hanh-chuong-trinh-giao-duc-pho-thong-moi-169745-d1.html",
  },
];

interface ZoomModalState {
  title: string;
  img: string;
  stat: string;
  note: string;
}

export default function AboutPage() {
  const [zoomedChart, setZoomedChart] = useState<ZoomModalState | null>(null);

  // Feedback form state
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  const feedbackContentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (feedbackContentRef.current) {
      feedbackContentRef.current.style.height = "auto";
      if (feedbackContent) {
        feedbackContentRef.current.style.height = `${feedbackContentRef.current.scrollHeight}px`;
      }
    }
  }, [feedbackContent]);

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackEmail.trim() || !feedbackContent.trim()) return;
    setFeedbackSent(true);
    setFeedbackName("");
    setFeedbackEmail("");
    setFeedbackContent("");
    setTimeout(() => setFeedbackSent(false), 6000);
  };

  return (
    <main className="flex-grow flex flex-col relative w-full bg-surface text-on-surface">
      
      {/* ========================================================================= */}
      {/* PHẦN 1: HEADER & THÔNG TIN ĐỀ TÀI                                        */}
      {/* ========================================================================= */}
      <section className="relative w-full py-16 md:py-20 px-4 sm:px-6 lg:px-12 bg-surface-container-lowest border-b border-outline-variant/30">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Huy hiệu hành chính & nghiên cứu */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-xs">
              <GraduationCap size={16} weight="fill" />
              Sở GD&amp;ĐT TP. Hồ Chí Minh
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface text-xs font-semibold rounded-none border border-outline-variant/40">
              Đề tài NCKH 2026 – 2027 • Khoa học Xã hội &amp; Hành vi
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-none">
              Trường THPT Giồng Ông Tố
            </span>
          </div>

          {/* Tiêu đề đề tài & Slogan */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-on-surface leading-tight tracking-tight">
              Thực Trạng Tiếp Cận Thông Tin Giáo Dục Giới Tính Của Học Sinh THPT Trên Môi Trường Số Và Xây Dựng Nền Tảng Tương Tác ChiChan
            </h1>
            
            <div className="inline-block px-4 py-2.5 bg-white border-l-4 border-primary rounded-none shadow-xs">
              <p className="text-xs sm:text-sm font-black text-primary tracking-widest uppercase flex items-center gap-2">
                <Sparkle size={18} weight="fill" />
                TIẾP CẬN DỄ – THỰC HÀNH AN TOÀN – ĐỒNG HÀNH BỀN VỮNG
              </p>
            </div>
          </div>

          <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-4xl">
            Công trình nghiên cứu khoa học xuất phát từ chính những câu hỏi ngập ngừng
            tuổi mới lớn của học sinh phổ thông. Đề tài khảo sát thực chứng trên{" "}
            <strong className="text-on-surface font-bold">401 học sinh THPT tại TP.HCM</strong>,
            chỉ ra những khoảng trống thông tin và đề xuất mô hình giải pháp công nghệ số ChiChan
            giúp gắn kết bền chặt tam giác{" "}
            <strong className="text-on-surface font-bold">Học sinh — Nhà trường — Gia đình</strong>.
          </p>

          {/* 4 Thẻ Grid: Tóm tắt dự án */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-white p-5 rounded-none border-l-4 border-primary border-y border-r border-outline-variant/40 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb size={22} weight="duotone" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">1. Tính Mới</h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Kết hợp E-learning với AI Roleplay đo thanh cảm xúc (0–100) và kiểm duyệt tự động bảo vệ an toàn.
              </p>
            </div>

            <div className="bg-white p-5 rounded-none border-l-4 border-primary border-y border-r border-outline-variant/40 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Brain size={22} weight="duotone" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">2. Tính Khoa Học</h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Số liệu điều tra UNFPA &amp; Bộ Y tế (chỉ 26.8% có kiến thức toàn diện HIV); chuẩn CSE của UNESCO/WHO.
              </p>
            </div>

            <div className="bg-white p-5 rounded-none border-l-4 border-primary border-y border-r border-outline-variant/40 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Target size={22} weight="duotone" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">3. Tính Thực Tiễn</h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Cung cấp giáo trình số hóa sẵn sàng cho tiết sinh hoạt lớp, giảm tải soạn giảng cho giáo viên bộ môn.
              </p>
            </div>

            <div className="bg-white p-5 rounded-none border-l-4 border-primary border-y border-r border-outline-variant/40 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <HandHeart size={22} weight="duotone" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">4. Tính Cộng Đồng</h2>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Xóa bỏ rào cản e ngại, bảo vệ quyền riêng tư tuyệt đối và đồng hành tâm lý cùng cha mẹ học sinh.
              </p>
            </div>
          </div>

          {/* Đội ngũ tác giả & GVHD (Tranh Minh Họa Trừu Tượng Phóng Khoáng) */}
          <div className="pt-6 border-t border-outline-variant/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <EyebrowLabel as="p" size="11">
                  NHÂN SỰ THỰC HIỆN ĐỀ TÀI
                </EyebrowLabel>
                <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-1">
                  Đội Ngũ Thực Hiện &amp; Cố Vấn Dự Án
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant font-medium">
                Sư phạm • Khảo sát nghiên cứu • Biên kịch kịch bản • Công nghệ số
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {AUTHORS.map((author, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-none border border-outline-variant/40 shadow-xs hover:border-primary/50 transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    {/* Khung tranh minh họa trừu tượng phóng khoáng (Không gò bó avatar) */}
                    <div className="w-full h-36 mx-auto rounded-none overflow-hidden mb-4 border border-outline-variant/20 bg-slate-50/70 p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      {author.illustration}
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        {author.name}
                      </h3>
                      <p className="text-xs font-bold text-primary uppercase tracking-wide">
                        {author.role}
                      </p>
                      <p className="text-xs text-on-surface-variant font-medium">
                        {author.tagline}
                      </p>
                      <p className="text-[11px] text-on-surface-variant/70 font-semibold mt-0.5">
                        {author.institution}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hiển thị đầy đủ trích dẫn, KHÔNG line-clamp */}
                  <div className="mt-4 pt-3 border-t border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant italic leading-relaxed text-center">
                      &quot;{author.quote}&quot;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHẦN 2: THỰC TRẠNG & KHO DỮ LIỆU KHẢO SÁT (7 STORY BLOCKS DATA STORYTELLING) */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto w-full space-y-12">
        
        {/* Section Header */}
        <div className="border-b border-outline-variant/30 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <EyebrowLabel as="p" size="11">
              PHẦN 2 • MINH CHỨNG THỰC CHỨNG
            </EyebrowLabel>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-1">
              Thực Trạng Khảo Sát 401 Học Sinh THPT Tại TP.HCM
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant font-light mt-1.5">
              Dữ liệu tương tác thực nghiệm: Mỗi luận điểm khoa học đi kèm biểu đồ Recharts trực quan sắc nét, rê chuột xem chi tiết số lượng &amp; tỷ lệ.
            </p>
          </div>

          <a
            href="https://drive.google.com/file/d/14oaojW0qOVguagjcQbRW155HrMdFcP-B/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container text-primary hover:bg-primary hover:text-white transition-colors text-xs sm:text-sm font-bold rounded-none border border-primary/30 shadow-xs flex-shrink-0"
          >
            <FileText size={18} weight="bold" />
            Biểu Mẫu Khảo Sát Gốc (Google Drive)
            <ArrowSquareOut size={16} />
          </a>
        </div>

        {/* ==================== STORY BLOCK 1 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-6">
          {/* Header & Phân tích */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                LUẬN ĐIỂM 01
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Khảo sát mức độ tiếp cận
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
              Tiếp cận GDGT tại trường học còn rất hạn chế và ngắt quãng
            </h3>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Dù nội dung giáo dục giới tính đã được lồng ghép trong chương trình phổ thông,
              việc triển khai tại các trường vẫn chưa đồng đều. Số liệu khảo sát 401 học sinh
              cho thấy có tới <strong className="text-on-surface font-semibold">36,4% học sinh chưa từng học hoặc chỉ tiếp cận rất ít</strong>,
              trong khi <strong className="text-on-surface font-semibold">40,9% chỉ dừng ở mức cơ bản</strong>.
              Tổng cộng gần <strong className="text-primary font-bold">77.3% học sinh</strong> chưa được trang bị đầy đủ kiến thức hệ thống.
            </p>

            <div className="p-4 bg-surface-container-low border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
              <strong>Kết luận thực tế:</strong> Phần lớn học sinh đang trải qua giai đoạn dậy thì
              với một &quot;khoảng trống&quot; kiến thức sinh học và tâm lý lớn vì thiếu các tiết chuyên đề định kỳ.
            </div>
          </div>

          {/* Vùng Biểu Đồ Rộng Rãi, Sắc Nét */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.1: Mức độ tiếp cận GDGT tại trường học</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.1: Lượng HS tiếp cận nội dung GDGT tại trường",
                    img: "/research/bieu_do_2_1_1.png",
                    stat: "36.4% Chưa từng / Ít tiếp cận",
                    note: "40.9% chỉ học mức cơ bản, 36.4% ít hoặc chưa từng học. Chỉ 22.7% được trang bị đầy đủ kiến thức tại trường học.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart211 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Chỉ số nổi bật</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">36.4% Chưa từng học hoặc ít tiếp cận • 40.9% Chỉ dừng ở mức cơ bản</span>
              </div>
              <WarningCircle size={24} className="text-primary shrink-0" weight="duotone" />
            </div>
          </div>
        </div>

        {/* ==================== STORY BLOCK 2 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                LUẬN ĐIỂM 02
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Kênh tìm kiếm thông tin
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
              Học sinh tìm kiếm thông tin từ đâu khi trường học thiếu hụt?
            </h3>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Khi không nhận được giải đáp thỏa đáng từ lớp học, học sinh buộc phải tự tìm kiếm.
              Kết quả khảo sát chỉ ra <strong className="text-primary font-bold">73,1% học sinh tìm qua Mạng xã hội</strong> (Facebook, TikTok...)
              — đây là nguồn thông tin tự do, không kiểm chứng và tiềm ẩn rủi ro sai lệch lớn nhất.
              Trong khi đó, nguồn chính thống từ chuyên gia y tế chỉ chiếm <strong className="text-on-surface font-semibold">33–35%</strong>.
            </p>

            <div className="p-4 bg-surface-container-low border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
              <strong>Hệ quả đáng lo ngại:</strong> Các bạn trẻ dễ bị dẫn dắt bởi trào lưu giật gân,
              những mẹo tránh thai truyền miệng nguy hiểm hoặc hiểu lầm về bệnh lây truyền qua đường tình dục (STI).
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.2: Các nguồn thông tin được học sinh sử dụng (%)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.2: Các nguồn thông tin được học sinh sử dụng",
                    img: "/research/bieu_do_2_1_2.png",
                    stat: "73.1% Mạng xã hội",
                    note: "Mạng xã hội dẫn đầu với 73.1%, gia đình chiếm 58.1%, thầy cô chiếm 53.1%. Cơ sở y tế chỉ chiếm 33-35%.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart212 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Kênh áp đảo</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">73.1% Học sinh tự tìm qua Mạng xã hội • Cơ sở y tế chỉ đạt 35.4%</span>
              </div>
              <TrendUp size={24} className="text-primary shrink-0" weight="bold" />
            </div>
          </div>
        </div>

        {/* ==================== STORY BLOCK 3 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                LUẬN ĐIỂM 03
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Ngộ nhận nhận thức
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
              Nghịch lý tự đánh giá: Thiếu kiến thức nhưng vẫn nghĩ mình hiểu đủ
            </h3>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Một phát hiện tâm lý rất đặc biệt: dù tiếp cận chủ yếu qua kênh phi chính thức,
              có tới <strong className="text-on-surface font-semibold">53,6% học sinh tự tin đánh giá mình hiểu biết ở mức Khá và Đầy đủ</strong>{" "}
              (mức 4: 24,4%; mức 5: 29,2%), và 36,9% đánh giá mức trung bình.
              Chỉ có <strong className="text-primary font-bold">9,5% học sinh</strong> tự nhận mình còn hạn chế kiến thức.
            </p>

            <div className="p-4 bg-surface-container-low border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
              <strong>Nghịch lý tâm lý:</strong> Việc thiếu thước đo chuẩn mực khiến nhiều bạn
              trẻ ngộ nhận những &quot;lời đồn&quot; hay video ngắn trên mạng là kiến thức chuẩn y khoa,
              dẫn đến tâm lý chủ quan khi xử lý các tình huống xâm hại hay quan hệ tình dục không an toàn.
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.3: Mức độ tự đánh giá hiểu biết của bản thân (%)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.3: Mức độ hiểu biết của HS về giới tính bản thân",
                    img: "/research/bieu_do_2_1_3.png",
                    stat: "53.6% Tự đánh giá mức Khá - Cao",
                    note: "Mức 3 chiếm 36.9%, mức 4 chiếm 24.4%, mức 5 chiếm 29.2%. Chỉ 9.5% tự nhận hiểu biết thấp.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart213 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Tự tin ngộ nhận</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">53.6% Học sinh tự tin hiểu biết Khá &amp; Đầy đủ dù thiếu kênh kiểm chứng</span>
              </div>
              <ChartBar size={24} className="text-primary shrink-0" weight="duotone" />
            </div>
          </div>
        </div>

        {/* ==================== STORY BLOCK 4 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                LUẬN ĐIỂM 04
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Rào cản tâm lý &amp; Phỏng vấn sâu
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
              Rào cản tâm lý và sự né tránh ngập ngừng từ người lớn
            </h3>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Tâm lý e ngại, sợ bị đánh giá và sợ bạn bè trêu chọc là nguyên nhân cao nhất
              (84.5% đồng thuận) khiến học sinh không dám hỏi. Khảo sát cũng ghi nhận thực tế đáng suy ngẫm:{" "}
              <strong className="text-on-surface font-bold">60% phụ huynh né tránh</strong> khi con hỏi về tình dục,
              và 27% trả lời giấu giếm, lảng tránh sang chuyện khác.
            </p>

            {/* Trích dẫn phỏng vấn sâu trực tiếp 1 PH, 1 GV, 2 HS */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-primary uppercase block tracking-wider">
                Trích dẫn phỏng vấn sâu trực tiếp:
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs sm:text-sm text-on-surface-variant italic">
                <div className="p-3.5 bg-surface-container-low border border-outline-variant/30 leading-relaxed">
                  <strong className="not-italic font-bold text-on-surface block text-xs mb-1">Học sinh (12A9):</strong>
                  &quot;Tụi em rất sợ hỏi rồi bị thầy cô hay bố mẹ nghĩ là hư hỏng, vẽ đường cho hươu chạy.&quot;
                </div>
                <div className="p-3.5 bg-surface-container-low border border-outline-variant/30 leading-relaxed">
                  <strong className="not-italic font-bold text-on-surface block text-xs mb-1">Giáo viên:</strong>
                  &quot;Không chuyên trách thì rất ngại giải thích sâu vì sợ dùng từ ngữ không đúng chuẩn mực.&quot;
                </div>
                <div className="p-3.5 bg-surface-container-low border border-outline-variant/30 leading-relaxed">
                  <strong className="not-italic font-bold text-on-surface block text-xs mb-1">Phụ huynh:</strong>
                  &quot;Nhiều khi con hỏi bất ngờ quá, tôi lúng túng không biết nói sao cho hợp độ tuổi con.&quot;
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.4: Nguyên nhân dẫn đến khó khăn khi tiếp cận GDGT (%)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.4: Nguyên nhân dẫn đến khó khăn khi tiếp cận GDGT",
                    img: "/research/bieu_do_2_1_4.png",
                    stat: "Top 1: E ngại & Bị trêu chọc",
                    note: "Tâm lý e ngại, sợ bị đánh giá cùng việc thiếu tiết học định kỳ là nguyên nhân hàng đầu khiến học sinh khép kín.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart214 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Rào cản gia đình &amp; Tâm lý</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">84.5% E ngại bị trêu chọc • 60% Phụ huynh né tránh khi con đặt câu hỏi</span>
              </div>
              <Quotes size={24} className="text-primary shrink-0" weight="duotone" />
            </div>
          </div>
        </div>

        {/* ==================== STORY BLOCK 5 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                LUẬN ĐIỂM 05
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Nhận thức &amp; Nhu cầu thực tế
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
              Tầm quan trọng bức thiết: Học sinh khao khát được học bài bản
            </h3>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Trái ngược với định kiến cho rằng học sinh THPT không quan tâm hoặc lơ là,
              có tới <strong className="text-primary font-extrabold text-base sm:text-lg">93,3% học sinh</strong> khẳng định
              giáo dục giới tính là Quan trọng và Rất quan trọng. Riêng tỷ lệ chọn mức Rất quan trọng (mức 5/5)
              chiếm áp đảo <strong className="text-on-surface font-bold">74,3%</strong>; chỉ có 6,7% chọn mức 1–3.
            </p>

            <div className="p-4 bg-surface-container-low border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
              <strong>Thông điệp rõ ràng:</strong> Nhu cầu của các em là hoàn toàn trong sáng, lành mạnh
              và cấp thiết. Vấn đề không nằm ở người học, mà nằm ở việc chúng ta chưa mang đến
              cho các em một công cụ học tập phù hợp với hơi thở thời đại số.
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.5: Tầm quan trọng của việc triển khai GDGT</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.5: Tầm quan trọng của việc triển khai GDGT",
                    img: "/research/bieu_do_2_1_5.png",
                    stat: "93.3% Quan trọng & Rất quan trọng",
                    note: "74.3% chọn mức 5 (rất quan trọng), 19% chọn mức 4. Chỉ 6.7% lựa chọn mức 1-3. Nhu cầu học hỏi là cực kỳ cấp bách.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart215 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Đồng thuận áp đảo</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">93.3% Khẳng định GDGT Rất quan trọng • 74.3% Đánh giá cấp thiết tối đa</span>
              </div>
              <CheckCircle size={24} className="text-primary shrink-0" weight="fill" />
            </div>
          </div>
        </div>

        {/* ==================== STORY BLOCK 6 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-8">
          
          {/* Hàng trên: Text cùng hàng với Biểu đồ tròn 2.1.7 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Cột trái: Luận điểm & Phân tích */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                  LUẬN ĐIỂM 06
                </span>
                <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                  Kỳ vọng giải pháp công nghệ
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
                Nhu cầu về môi trường số: 83.3% cần không gian cởi mở và nền tảng trực tuyến
              </h3>

              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Khi được hỏi về giải pháp hiệu quả, <strong className="text-primary font-bold">83,3% học sinh mong muốn xây dựng môi trường cởi mở</strong>,
                không định kiến; <strong className="text-on-surface font-semibold">59,9% đề xuất phát triển tài liệu số, video và website học tập</strong>.
                Đặc biệt, có tới <strong className="text-on-surface font-semibold">64,6% học sinh đánh giá website trực tuyến là rất cần thiết</strong>{" "}
                (39,4% đánh giá cấp thiết mức tối đa).
              </p>

              <div className="p-4 bg-surface-container-low border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
                <strong>Luận cứ sáng lập:</strong> Hai con số 83.3% và 64.6% chính là căn cứ thực chứng
                vững chắc nhất thúc đẩy nhóm tác giả bắt tay xây dựng nền tảng ChiChan.
              </div>
            </div>

            {/* Cột phải: Biểu đồ tròn 2.1.7 (Mức độ cần thiết của Website) */}
            <div className="lg:col-span-5 bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2 text-on-surface font-bold text-xs sm:text-sm">
                  <ChartBar size={18} className="text-primary" weight="duotone" />
                  <span>Biểu đồ 2.1.7: Mức độ cần thiết của Website (%)</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setZoomedChart({
                      title: "Biểu đồ 2.1.7: Nhu cầu tiếp cận qua website trực tuyến",
                      img: "/research/bieu_do_2_1_7.png",
                      stat: "64.6% Cần thiết & Rất cần thiết",
                      note: "39.4% rất cần thiết, 25.2% khá cần thiết. Nền tảng số hóa là giải pháp đón đầu tâm lý thanh thiếu niên thời đại mới.",
                    })
                  }
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ảnh gốc <MagnifyingGlassPlus size={13} />
                </button>
              </div>

              <Chart217 />
            </div>

          </div>

          {/* Hàng dưới: Biểu đồ cột 2.1.6 (Full Width) */}
          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.6: Giải pháp tiếp cận GDGT hiệu quả hơn (%)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.6: Giải pháp nâng cao hiệu quả GDGT",
                    img: "/research/bieu_do_2_1_6.png",
                    stat: "83.3% Môi trường không kỳ thị",
                    note: "83.3% chọn môi trường cởi mở không định kiến, 59.9% phát triển tài liệu số website, 54.4% phối hợp nhà trường - gia đình.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart216 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Cơ sở ra đời ChiChan</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">83.3% Chọn môi trường số không kỳ thị • 64.6% Cần Website giáo dục trực tuyến</span>
              </div>
              <Sparkle size={24} className="text-primary shrink-0" weight="fill" />
            </div>
          </div>

        </div>

        {/* ==================== STORY BLOCK 7 ==================== */}
        <div className="bg-white p-6 sm:p-8 md:p-10 rounded-none border border-outline-variant/40 shadow-xs space-y-6">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none">
                LUẬN ĐIỂM 07
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Nguyện vọng học đường
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
              Kỳ vọng của học sinh: Kiến thức chuẩn xác, đối thoại cởi mở và game mô phỏng
            </h3>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Học sinh kỳ vọng nhà trường cải tiến phương pháp giáo dục:{" "}
              <strong className="text-on-surface font-semibold">67,8% mong cung cấp kiến thức đầy đủ, chính xác</strong>;{" "}
              <strong className="text-on-surface font-semibold">64,8% cần môi trường hỏi đáp cởi mở</strong>;{" "}
              <strong className="text-on-surface font-semibold">61,3% yêu cầu nội dung gắn liền thực tế</strong> và{" "}
              <strong className="text-primary font-bold">52,4% mong muốn tăng cường hoạt động tương tác, tình huống mô phỏng</strong>.
            </p>

            <div className="p-4 bg-surface-container-low border-l-4 border-primary text-sm text-on-surface-variant leading-relaxed">
              <strong>Định hướng thiết kế ChiChan:</strong> Đây chính là 4 tiêu chí cốt lõi định hình
              nên cấu trúc bài giảng và tính năng trò chơi AI nhập vai của nền tảng.
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 sm:p-6 border border-outline-variant/30 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-on-surface font-bold text-sm sm:text-base">
                <ChartBar size={20} className="text-primary" weight="duotone" />
                <span>Biểu đồ 2.1.8: Mong muốn của học sinh đối với nhà trường (%)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setZoomedChart({
                    title: "Biểu đồ 2.1.8: Mong muốn của HS đối với nhà trường về GDGT",
                    img: "/research/bieu_do_2_1_8.png",
                    stat: "67.8% Cần kiến thức chuẩn xác",
                    note: "67.8% kiến thức chuẩn xác, 64.8% hỏi đáp cởi mở, 61.3% gắn liền thực tế, 52.4% tăng hoạt động thực hành tương tác.",
                  })
                }
                className="text-xs sm:text-sm text-primary font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                Ảnh gốc đề cương <MagnifyingGlassPlus size={15} />
              </button>
            </div>

            <Chart218 />

            <div className="p-3.5 bg-primary/10 border-l-4 border-primary rounded-none flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase block">Tiêu chí hàng đầu</span>
                <span className="text-sm sm:text-base text-on-surface font-bold">67.8% Kiến thức chuẩn xác • 64.8% Hỏi đáp cởi mở • 52.4% Game nhập vai</span>
              </div>
              <Target size={24} className="text-primary shrink-0" weight="duotone" />
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* PHẦN 3: LỜI GIẢI ĐÁP — HỆ SINH THÁI GIÁO DỤC GIỚI TÍNH CHICHAN             */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-surface-container-lowest border-y border-outline-variant/30">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <EyebrowLabel as="p" size="11">
              PHẦN 3 • LỜI GIẢI ĐÁP
            </EyebrowLabel>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface">
              Hệ Sinh Thái ChiChan: Giải Pháp Toàn Diện Cho Học Đường
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Đáp ứng trọn vẹn 7 bài toán khảo sát thực tế bằng 3 giải pháp công nghệ số hóa đột phá,
              đồng hành cùng học sinh, giáo viên và phụ huynh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Giải pháp 1 */}
            <div className="bg-white p-7 rounded-none border border-outline-variant/40 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-none border border-primary/20">
                  <GameController size={26} weight="duotone" />
                </div>
                
                <div>
                  <span className="text-xs font-bold text-primary uppercase">Giải pháp 01</span>
                  <h3 className="text-lg font-bold text-on-surface mt-0.5">
                    Môi Trường Học Tập &amp; AI Role-Playing
                  </h3>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Học sinh được nhập vai vào các tình huống thực tế (từ chối lời mời nhạy cảm,
                  nhận diện quấy rối, giữ ranh giới an toàn). Người chơi tự do đưa ra lựa chọn,
                  <strong>Thanh cảm xúc (0–100) biến thiên liên tục</strong> theo từng câu trả lời.
                  Đặc biệt, hệ thống tích hợp <strong>màng lọc tự động chặn từ ngữ vi phạm</strong> chuẩn mực đạo đức và pháp luật (hiện cảnh báo đỏ).
                </p>
              </div>

              <div className="p-3.5 bg-surface-container-low rounded-none border-l-2 border-primary text-xs sm:text-sm text-on-surface-variant space-y-1.5 leading-relaxed">
                <span className="font-bold text-primary block uppercase">Cơ sở khoa học quốc tế:</span>
                <p>• <strong>McKenney (2025):</strong> Role-play giúp tăng vượt bậc kỹ năng tự khẳng định (self-assertion).</p>
                <p>• <strong>Meta-analysis (2024):</strong> Gamification giảm 15% quan hệ sớm; SMD thái độ = 0.95.</p>
                <p>• <strong>Fu &amp; Li (2025):</strong> Tác động thực nghiệm lớn (Effect Size = 0.818) đối với rèn luyện kỹ năng sống.</p>
              </div>
            </div>

            {/* Giải pháp 2 */}
            <div className="bg-white p-7 rounded-none border border-outline-variant/40 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-none border border-primary/20">
                  <Bookmarks size={26} weight="duotone" />
                </div>
                
                <div>
                  <span className="text-xs font-bold text-primary uppercase">Giải pháp 02</span>
                  <h3 className="text-lg font-bold text-on-surface mt-0.5">
                    Hỗ Trợ Nhà Trường &amp; Giảm Tải Cho Giáo Viên
                  </h3>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Cung cấp hệ thống 10 khóa học chuẩn y khoa và hướng dẫn CSE (UNESCO):
                  từ thay đổi sinh học tuổi dậy thì, phòng tránh bệnh STI, biện pháp tránh thai
                  đến tình bạn, tình yêu lành mạnh.
                  Mỗi chủ đề có sẵn video chính thống và ngân hàng câu hỏi trắc nghiệm ôn tập ngắn,
                  giúp thầy cô sử dụng trực tiếp trong các tiết sinh hoạt lớp mà không mất công soạn giáo án.
                </p>
              </div>

              <div className="p-3.5 bg-surface-container-low rounded-none border-l-2 border-primary text-xs sm:text-sm text-on-surface-variant space-y-1.5 leading-relaxed">
                <span className="font-bold text-primary block uppercase">Đa nền tảng linh hoạt:</span>
                <p>Tương thích hoàn hảo trên điện thoại, máy tính bảng và máy tính để bàn, hỗ trợ học sinh tự học tại nhà liên tục.</p>
              </div>
            </div>

            {/* Giải pháp 3 */}
            <div className="bg-white p-7 rounded-none border border-outline-variant/40 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center rounded-none border border-primary/20">
                  <ChatsCircle size={26} weight="duotone" />
                </div>
                
                <div>
                  <span className="text-xs font-bold text-primary uppercase">Giải pháp 03</span>
                  <h3 className="text-lg font-bold text-on-surface mt-0.5">
                    Kết Nối Gia Đình &amp; Bảo Mật Tuyệt Đối
                  </h3>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Xây dựng diễn đàn trao đổi có kiểm duyệt trước an toàn.
                  <strong>Admin tuyệt đối không có quyền theo dõi hoặc biết danh tính tài khoản học sinh</strong>,
                  bảo vệ quyền riêng tư 100%.
                  Cung cấp chuyên mục kiến thức dành riêng cho cha mẹ thấu hiểu tâm lý lứa tuổi dậy thì.
                </p>
              </div>

              {/* Thẻ Đường dây nóng cứu trợ khẩn cấp */}
              <div className="p-3.5 bg-surface-container-low rounded-none border-l-2 border-primary text-xs sm:text-sm text-on-surface-variant space-y-1.5 leading-relaxed">
                <span className="font-bold text-primary block uppercase flex items-center gap-1.5">
                  <PhoneCall size={16} weight="fill" />
                  Đường dây nóng khẩn cấp:
                </span>
                <p>• <strong>Tổng đài 111:</strong> Bảo vệ trẻ em Quốc gia (Miễn phí 24/7)</p>
                <p>• <strong>CSAGA &amp; BV Từ Dũ:</strong> Tư vấn sức khỏe sinh sản &amp; phòng chống xâm hại</p>
                <p>• <strong>Take It Down:</strong> Công cụ gỡ bỏ hình ảnh nhạy cảm</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PHẦN 4: KẾT LUẬN & TÀI LIỆU THAM KHẢO                                     */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto w-full space-y-12">
        
        {/* Khung Kết luận */}
        <div className="bg-white p-8 rounded-none border border-outline-variant/40 shadow-xs space-y-4">
          <EyebrowLabel as="p" size="11">
            PHẦN 4 • TỔNG KẾT BÁO CÁO
          </EyebrowLabel>
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface">
            Kết Luận Của Nhóm Nghiên Cứu
          </h2>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            Thực trạng triển khai giáo dục giới tính tại trường học vẫn còn nhiều rào cản từ định kiến xã hội,
            thời lượng eo hẹp và sự e ngại của người lớn. Số liệu khảo sát 401 học sinh đã khẳng định nhu cầu
            tiếp cận kiến thức của các em là vô cùng bức thiết. Sự ra đời của nền tảng tương tác ChiChan
            chính là câu trả lời toàn diện: tích hợp công nghệ AI mô phỏng an toàn, số hóa bài giảng chuẩn y khoa
            và tạo lập cầu nối thấu cảm giữa gia đình, nhà trường và học sinh, hiện thực hóa mục tiêu:
          </p>

          <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-none">
            <p className="text-sm sm:text-base font-black text-primary tracking-wider uppercase">
              TIẾP CẬN DỄ – THỰC HÀNH AN TOÀN – ĐỒNG HÀNH BỀN VỮNG
            </p>
          </div>
        </div>

        {/* Bảng Tra cứu Thuật ngữ viết tắt */}
        <div className="bg-white p-8 rounded-none border border-outline-variant/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Scales size={22} weight="duotone" className="text-primary" />
            <h3 className="text-sm sm:text-base font-bold text-on-surface uppercase tracking-wider">
              Bảng Tra Cứu Thuật Ngữ Viết Tắt Trong Báo Cáo
            </h3>
          </div>

          <div className="overflow-x-auto border border-outline-variant/30">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/30">
                  <th className="p-3.5 font-bold text-on-surface w-36">Ký hiệu</th>
                  <th className="p-3.5 font-bold text-on-surface">Thuật ngữ đầy đủ &amp; Định nghĩa khoa học</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {ABBREVIATIONS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-lowest">
                    <td className="p-3.5 font-bold text-primary">{item.term}</td>
                    <td className="p-3.5 text-on-surface-variant font-medium">{item.full}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danh mục 5 Tài liệu tham khảo chính thống */}
        <div className="bg-white p-8 rounded-none border border-outline-variant/40 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileText size={22} weight="duotone" className="text-primary" />
            <h3 className="text-sm sm:text-base font-bold text-on-surface uppercase tracking-wider">
              Danh Mục Tài Liệu Tham Khảo Chính Thức
            </h3>
          </div>

          <div className="divide-y divide-outline-variant/20 border border-outline-variant/30">
            {REFERENCES.map((ref, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm bg-white hover:bg-surface-container-lowest transition-colors"
              >
                <div className="space-y-1 max-w-3xl">
                  <p className="font-bold text-on-surface">{ref.title}</p>
                  <p className="text-on-surface-variant leading-relaxed">
                    {ref.desc}
                  </p>
                </div>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-surface-container hover:bg-primary hover:text-white transition-colors text-primary font-bold rounded-none flex-shrink-0 self-start sm:self-center"
                >
                  Nguồn tài liệu
                  <ArrowSquareOut size={15} />
                </a>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* FORM LIÊN HỆ & ĐÓNG GÓP Ý KIẾN HỌC THUẬT                                 */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-12 bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-5xl mx-auto bg-white p-8 sm:p-12 rounded-none border border-outline-variant/40 shadow-depth-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Cột trái: Thông tin */}
            <div className="space-y-6">
              <div>
                <EyebrowLabel as="p" size="11">
                  KẾT NỐI HỌC THUẬT
                </EyebrowLabel>
                <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-1">
                  Đóng Góp Ý Kiến Cho Đề Tài
                </h2>
              </div>
              
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Nhóm nghiên cứu trân trọng đón nhận mọi ý kiến đóng góp chuyên môn,
                phản biện khoa học từ quý thầy cô giáo, các bậc phụ huynh và chuyên gia
                y tế để tiếp tục hoàn thiện nền tảng ChiChan.
              </p>

              <div className="space-y-4 pt-2 text-sm sm:text-base">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-surface-container text-primary flex items-center justify-center rounded-none border border-outline-variant/30 shrink-0">
                    <EnvelopeSimple size={22} weight="duotone" />
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant uppercase font-bold block">Email đề tài</span>
                    <span className="font-semibold text-on-surface">{BRAND_CONFIG.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-surface-container text-primary flex items-center justify-center rounded-none border border-outline-variant/30 shrink-0">
                    <PhoneCall size={22} weight="duotone" />
                  </div>
                  <div>
                    <span className="text-xs text-on-surface-variant uppercase font-bold block">Hotline liên hệ</span>
                    <span className="font-semibold text-on-surface">{BRAND_CONFIG.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Form */}
            <form onSubmit={handleSendFeedback} className="space-y-4 bg-surface-container-low p-6 rounded-none border border-outline-variant/30">
              {feedbackSent && (
                <div className="p-3.5 bg-primary/10 border border-primary/20 text-xs sm:text-sm font-semibold text-primary flex items-center gap-2 rounded-none">
                  <CheckCircle size={20} weight="fill" />
                  Cảm ơn bạn! Ý kiến đóng góp học thuật đã được gửi thành công đến nhóm nghiên cứu.
                </div>
              )}

              <FormRow label="Họ và tên của bạn" required>
                <input
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  required
                  className="w-full bg-white border border-outline-variant/60 rounded-none px-3.5 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                  placeholder="Họ tên hoặc cơ quan công tác"
                  type="text"
                />
              </FormRow>

              <FormRow label="Địa chỉ Email" required>
                <input
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-outline-variant/60 rounded-none px-3.5 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none"
                  placeholder="name@example.com"
                  type="email"
                />
              </FormRow>

              <FormRow label="Ý kiến đóng góp / Phản biện" required>
                <textarea
                  ref={feedbackContentRef}
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  required
                  className="w-full bg-white border border-outline-variant/60 rounded-none px-3.5 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-colors outline-none resize-none overflow-hidden"
                  placeholder="Chia sẻ nhận định, góp ý về phương pháp nghiên cứu hoặc các bài học..."
                  rows={4}
                />
              </FormRow>

              <button
                type="submit"
                className="w-full bg-primary text-white py-3.5 rounded-none font-bold text-xs uppercase tracking-wider transition-colors shadow-depth-1 hover:shadow-depth-2 hover:opacity-95 cursor-pointer"
              >
                Gửi Đóng Góp Học Thuật
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* DIALOG MODAL ĐỐI CHIẾU ẢNH BÁO CÁO GỐC                                    */}
      {/* ========================================================================= */}
      <Modal
        open={Boolean(zoomedChart)}
        onClose={() => setZoomedChart(null)}
        size="full"
        panelClassName="p-6 sm:p-8"
      >
        {zoomedChart && (
          <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-outline-variant/30 pb-4 pr-10">
              <div>
                <span className="text-xs font-bold text-primary uppercase">
                  Đối Chiếu Bản Báo Cáo Gốc • N=401 Học Sinh THPT TP.HCM
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-on-surface mt-1">
                  {zoomedChart.title}
                </h3>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-none border border-primary/20 flex-shrink-0">
                {zoomedChart.stat}
              </span>
            </div>

            <div className="relative w-full aspect-[16/10] bg-surface-container-lowest border border-outline-variant/20 rounded-none overflow-hidden">
              <Image
                src={zoomedChart.img}
                alt={zoomedChart.title}
                fill
                className="object-contain p-2"
                sizes="(max-width: 1200px) 100vw, 900px"
              />
            </div>

            <div className="bg-surface-container-low p-4 rounded-none border-l-4 border-primary space-y-1">
              <p className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Ghi chú số liệu trong đề cương:
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {zoomedChart.note}
              </p>
            </div>
          </div>
        )}
      </Modal>

    </main>
  );
}
