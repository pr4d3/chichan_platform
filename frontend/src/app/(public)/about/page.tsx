"use client";

import React, { useState, useRef, useEffect } from "react";
import { BRAND_CONFIG } from "@/config/branding";
import {
  Flask,
  Warning,
  Brain,
  EnvelopeSimple,
  PhoneCall,
  MapPin,
  CheckCircle,
} from "@phosphor-icons/react";
import { FormRow, EyebrowLabel } from "@/components/ui";

interface Author {
  name: string;
  role: string;
  contact: string;
  institution: string;
  avatar: string;
}

const AUTHORS: Author[] = [
  {
    name: "Monkey D. Luffy",
    role: "Thuyền Trưởng / Trưởng Nhóm",
    contact: "luffy@strawhat.pirates",
    institution: "Băng Hải Tặc Mũ Rơm",
    avatar:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Roronoa Zoro",
    role: "Phó Thuyền Trưởng / Kiếm Sĩ",
    contact: "zoro@strawhat.pirates",
    institution: "Phái Tam Kiếm Wano",
    avatar:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Nami",
    role: "Hoa Tiêu / Cố Vấn Định Hướng",
    contact: "nami@strawhat.pirates",
    institution: "Viện Khí Tượng Weatheria",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Tony Tony Chopper",
    role: "Bác Sĩ Trưởng / Cố Vấn Y Khoa",
    contact: "chopper@strawhat.pirates",
    institution: "Vương Quốc Drum (Sakura)",
    avatar:
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Nico Robin",
    role: "Nhà Khảo Cổ / Nghiên Cứu Lịch Sử",
    contact: "robin@strawhat.pirates",
    institution: "Viện Khảo Cổ Ohara",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Vinsmoke Sanji",
    role: "Đầu Bếp / Chuyên Gia Dinh Dưỡng",
    contact: "sanji@strawhat.pirates",
    institution: "Nhà Hàng Nổi Baratie",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Franky (Cutty Flam)",
    role: "Thợ Đóng Tàu / Kỹ Sư Hệ Thống",
    contact: "franky@strawhat.pirates",
    institution: "Tập Đoàn Water 7",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Brook",
    role: "Nhạc Công / Cố Vấn Nghệ Thuật & Âm Nhạc",
    contact: "brook@strawhat.pirates",
    institution: "Soul King Entertainment",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80",
  },
];

export default function AboutPage() {
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

  const title =
    "Nền tảng giáo dục giới tính đồng hành cùng HS, PH và nhà trường";
  const purpose =
    "Thiếu hụt công cụ để giảm thiểu bớt các rào cản triển khai và tiếp cận công tác GDGT cho HS, PH ở nhà trường. Nhóm nghiên cứu khoa học của THPT Giồng Ông Tố phát triển mô hình trang web học tập online hỗ trợ nhà trường cung cấp kiến thức và giảm thiểu các rào cản tiếp cận GDGT ở học sinh.";
  const methodology =
    "Khung chương trình được thiết kế theo định hướng triển khai và vận hành công tác giáo dục giới tính tại nhà trường. Tích hợp E-learning với thiết kế trực quan, gamification để tăng tính tương tác, đồng thời đảm bảo nội dung phù hợp với định hướng của nhà trường, mang lại môi trường học tập số an toàn, tiện lợi và thân thiện.";

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackName && feedbackEmail && feedbackContent) {
      setFeedbackSent(true);
      setFeedbackName("");
      setFeedbackEmail("");
      setFeedbackContent("");
      setTimeout(() => {
        setFeedbackSent(false);
      }, 3500);
    }
  };

  return (
    <main className="flex-grow flex flex-col relative w-full">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-secondary-container/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header Banner */}
      <section className="relative w-full py-16 px-4 md:px-16 flex items-center justify-center overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-2">
            <Flask size={16} weight="fill" />
            Đề tài Nghiên cứu Khoa học — THPT Giồng Ông Tố
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary-container mb-4 leading-tight">
            Mô Hình Học Tập Số Giáo Dục Giới Tính
          </h1>
          <p className="text-base md:text-lg font-medium text-on-surface-variant max-w-3xl mx-auto leading-relaxed">
            {title}
          </p>
        </div>
      </section>

      {/* Section 1: Cấp thiết & Phương pháp */}
      <section className="py-12 px-4 md:px-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: Tính cấp thiết */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 shadow-sm hover-shadow transition-all duration-300 border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-error-container/40 to-transparent rounded-bl-[100px] -z-10 transition-transform group-hover:scale-105 duration-500"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-error-container to-white text-error rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-error-container/50">
              <Warning size={28} weight="duotone" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-4">
              Tính cấp thiết của Đề tài
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed font-light">
              {purpose}
            </p>
          </div>

          {/* Card 2: Phương pháp */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 shadow-sm hover-shadow transition-all duration-300 border border-white/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-tertiary-fixed/40 to-transparent rounded-bl-[100px] -z-10 transition-transform group-hover:scale-105 duration-500"></div>
            <div className="w-14 h-14 bg-gradient-to-br from-tertiary-fixed to-white text-tertiary-container rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-tertiary-fixed/50">
              <Brain size={28} weight="duotone" />
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-4">
              Khung chương trình &amp; Vận hành
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed font-light">
              {methodology}
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Đội ngũ Nghiên cứu (Băng Mũ Rơm) */}
      <section className="py-20 px-4 md:px-16 w-full relative bg-surface-container-low/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface">
              Đội ngũ Nghiên cứu &amp; Cố vấn
            </h2>
            <p className="text-sm text-on-surface-variant">
              Các thành viên tâm huyết tham gia xây dựng và phát triển nền tảng
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {AUTHORS.map((author, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 text-center shadow-sm hover:shadow-md transition-all duration-300 border border-white/60 relative overflow-hidden group hover:-translate-y-1"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-container to-secondary-container opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-5 border-4 border-surface-container shadow-sm group-hover:border-primary/30 transition-colors duration-300">
                  <img
                    alt={author.name}
                    className="w-full h-full object-cover"
                    src={author.avatar}
                  />
                </div>
                <h3 className="text-base font-bold text-on-surface mb-1">
                  {author.name}
                </h3>
                <p className="text-[11px] font-bold text-secondary-container mb-2 uppercase tracking-wider">
                  {author.role}
                </p>
                <p className="text-xs text-on-surface-variant font-light mb-1">
                  {author.institution}
                </p>
                <p className="text-[11px] text-primary/80 font-medium">
                  {author.contact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Feedback Form & Contact */}
      <section className="py-20 px-4 md:px-16 max-w-5xl mx-auto w-full">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-14 shadow-sm relative overflow-hidden border border-white/50">
          {/* Decorative subtle elements */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-bl from-primary-fixed to-secondary-fixed rounded-full blur-[80px] opacity-60"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-secondary-fixed to-primary-fixed rounded-full blur-[80px] opacity-40"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-extrabold text-on-surface">
                Liên hệ &amp; Đóng góp
              </h2>
              <p className="text-sm text-on-surface-variant font-light leading-relaxed">
                Dự án nghiên cứu của chúng tôi luôn mở rộng cửa đón nhận những ý
                kiến đóng góp từ cộng đồng, phụ huynh, giáo viên và các chuyên
                gia y tế để hoàn thiện hơn nữa hệ thống E-learning.
              </p>
              <div className="space-y-6 pt-4">
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <EnvelopeSimple size={22} weight="duotone" />
                  </div>
                  <div>
                    <EyebrowLabel as="p" size="10">
                      Email
                    </EyebrowLabel>
                    <p className="text-sm font-semibold text-on-surface">
                      {BRAND_CONFIG.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <PhoneCall size={22} weight="duotone" />
                  </div>
                  <div>
                    <EyebrowLabel as="p" size="10">
                      Hotline
                    </EyebrowLabel>
                    <p className="text-sm font-semibold text-on-surface">
                      {BRAND_CONFIG.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 group">
                  <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <MapPin size={22} weight="duotone" />
                  </div>
                  <div>
                    <EyebrowLabel as="p" size="10">
                      Địa chỉ
                    </EyebrowLabel>
                    <p className="text-sm font-semibold text-on-surface leading-relaxed">
                      TRƯỜNG THPT GIỒNG ÔNG TỐ
                      <br />
                      200/10 Nguyễn Thị Định, Phường Bình Trưng,
                      <br />
                      Thành phố Hồ Chí Minh
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Form */}
            <form
              onSubmit={handleSendFeedback}
              className="space-y-5 bg-white/40 p-6 rounded-2xl border border-white/60 shadow-inner backdrop-blur-sm"
            >
              {feedbackSent && (
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3 text-xs font-semibold text-primary flex items-center gap-2">
                  <CheckCircle size={18} weight="fill" />
                  Cảm ơn bạn đã đóng góp ý kiến cho đội ngũ nghiên cứu!
                </div>
              )}
              <FormRow label="Họ và tên" required>
                <input
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                  placeholder="Nhập họ và tên của bạn"
                  type="text"
                />
              </FormRow>
              <FormRow label="Email" required>
                <input
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                  placeholder="Nhập địa chỉ email"
                  type="email"
                />
              </FormRow>
              <FormRow label="Nội dung đóng góp" required>
                <textarea
                  ref={feedbackContentRef}
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none resize-none overflow-hidden"
                  placeholder="Chia sẻ ý kiến của bạn..."
                  rows={4}
                />
              </FormRow>
              <button
                type="submit"
                className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-xs transition-all shadow-md hover:shadow-lg hover:opacity-95 cursor-pointer"
              >
                Gửi phản hồi
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
