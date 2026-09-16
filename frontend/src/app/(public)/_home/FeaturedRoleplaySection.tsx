"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Robot,
  Sparkle,
  CheckCircle,
  XCircle,
  ShieldCheck,
  HeartStraight,
  Lightning,
  User,
  ArrowsLeftRight,
  ChatCircleDots,
  CaretLeft,
  CaretRight,
  HeadCircuit,
} from "@phosphor-icons/react";
import {
  RoleplayInteractiveIllustration,
  MedicalBoundaryIllustration,
  AnonymousSafeIllustration,
} from "@/components/illustrations/StepIllustrations";

interface ComparisonScenario {
  id: string;
  tabLabel: string;
  contextTag: string;
  userPrompt: string;
  genericAi: {
    avatar: string;
    botName: string;
    status: string;
    response: string;
    bulletPoints: string[];
    downsides: string[];
  };
  chichanAi: {
    avatar: string;
    botName: string;
    status: string;
    response: string;
    interactiveAction: string;
    emotionScore: string;
    safetyScore: string;
    benefits: string[];
  };
}

const featuredScenario: ComparisonScenario = {
  id: "online_safety",
  tabLabel: "🛡️ Gạ gẫm ảnh riêng tư qua mạng",
  contextTag: "Tình huống: An toàn mạng & Ranh giới cá nhân",
  userPrompt:
    "Bạn mới quen qua mạng bảo: “Nếu thật lòng quý bạn thì phải gửi ảnh chụp cơ thể cho bạn xem”. Em sợ từ chối thì bạn giận và chặn em, nhưng em cũng thấy rất bất an... Em phải làm sao ạ?",
  genericAi: {
    avatar: "🤖",
    botName: "Chatbot AI Truyền Thống",
    status: "Máy móc • Lý thuyết",
    response:
      "Theo quy định an toàn mạng, người dùng không nên gửi hình ảnh riêng tư cho người lạ:",
    bulletPoints: [
      "1. Kiên quyết từ chối yêu cầu gửi ảnh.",
      "2. Không chia sẻ thông tin cá nhân/mật khẩu.",
      "3. Chặn tài khoản và báo cáo người giám hộ.",
    ],
    downsides: [
      "Khô khan, sáo rỗng như đọc luật",
      "Bỏ qua nỗi sợ bị cô lập của em",
      "Không rèn phản xạ giao tiếp thực tế",
    ],
  },
  chichanAi: {
    avatar: "🌟",
    botName: "ChiChan AI Roleplay",
    status: "Đang đồng hành thấu cảm",
    response:
      "Chị rất hiểu cảm giác bối rối của em lúc này: vừa sợ mất đi một người bạn, vừa cảm thấy bất an trong lòng. Nhưng em hãy nhớ nhé: Sự tôn trọng thật sự luôn đi kèm với việc tôn trọng ranh giới của em, chứ không bao giờ là ép buộc.",
    interactiveAction:
      "🎮 Em có muốn thử cùng chị tập phản xạ không? Chị sẽ đóng vai bạn đó nhắn lại, em thử luyện cách từ chối khéo léo nhưng dứt khoát nhé!",
    emotionScore: "Thấu cảm: 98%",
    safetyScore: "Ranh giới: 100%",
    benefits: [
      "Đồng cảm sâu sắc, không phán xét",
      "Tập dượt phản xạ đối thoại 1-1",
      "Rèn kỹ năng bảo vệ ranh giới mình",
    ],
  },
};

export const FeaturedRoleplaySection: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100 %
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !e.touches[0]) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <section className="py-24 px-4 md:px-16 relative overflow-hidden bg-gradient-to-b from-transparent via-primary-container/15 to-transparent select-none">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
            <Sparkle size={14} weight="fill" />
            <span>SO SÁNH CÔNG NGHỆ NHẬP VAI AI</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight">
            Không Chỉ Trả Lời — Đây Là Đối Thoại Có Cảm Xúc
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant font-light leading-relaxed">
            Khám phá sự chuyển biến từ một câu trả lời máy móc thông thường
            thành trải nghiệm đồng hành tâm lý và rèn luyện kỹ năng thực chiến.
          </p>
        </div>

        {/* WRAPPER FOR CHAT WINDOW */}
        <div className="relative max-w-4xl mx-auto w-full px-2 sm:px-4 my-2">
          {/* SLIDER SHOWCASE CONTAINER */}
          <div
            ref={containerRef}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                setIsDragging(true);
                handleMove(e.touches[0].clientX);
              }
            }}
            className="relative rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 cursor-ew-resize bg-surface-container-lowest"
          >
            {/* Top Bar with Clean Windows Dots */}
            <div className="px-5 py-3 flex items-center justify-start border-b border-outline-variant/20 bg-white/95 backdrop-blur-md z-30 relative">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              </div>
            </div>

            {/* Common User Question Section */}
            <div className="p-4 sm:p-5 pb-3 bg-surface-container-lowest/95 border-b border-outline-variant/15">
              <div className="flex items-start justify-end gap-2.5 max-w-xl ml-auto">
                <div className="space-y-1 text-right">
                  <div className="inline-block p-3.5 sm:p-4 rounded-2xl rounded-tr-xs bg-primary/10 border border-primary/20 text-on-surface text-xs sm:text-sm font-medium leading-relaxed text-left shadow-2xs">
                    <p>{featuredScenario.userPrompt}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant/60 block pr-1">
                    Học sinh gửi câu hỏi • Vừa xong
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
                  <User size={15} weight="bold" />
                </div>
              </div>
            </div>

            {/* COMPARISON BODY: DUAL LAYERS WITH UNIFIED SEAMLESS BACKGROUND */}
            <div className="relative bg-white">
              {/* LAYER 1 (BASE / RIGHT SIDE): CHICHAN AI ROLEPLAY */}
              <div className="w-full p-4 sm:p-6 bg-white text-on-surface space-y-3">
                {/* Floating Badge (Right Corner) - Fixed h-7 */}
                <div className="h-7 flex items-center justify-end pb-1 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold uppercase tracking-wider">
                    <Sparkle size={12} weight="fill" />
                    ChiChan AI
                  </span>
                </div>

                {/* 2/3 Left Response & 1/3 Right Strengths Grid (items-start for rock-solid top alignment) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* LEFT 2/3 COLUMN: AI Response in Chat Bubble */}
                  <div className="md:col-span-8 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20 ring-2 ring-primary/20">
                      <HeadCircuit size={20} weight="fill" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="h-7 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-extrabold text-on-surface">
                            {featuredScenario.chichanAi.botName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-primary text-white uppercase tracking-wider">
                            ĐỘT PHÁ
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {featuredScenario.chichanAi.status}
                        </span>
                      </div>

                      {/* 2/3 Chat Bubble - fixed min-height */}
                      <div className="p-3.5 sm:p-4 rounded-2xl rounded-tl-xs bg-emerald-50/40 border border-primary/25 shadow-xs min-h-[145px] flex flex-col justify-center">
                        <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                          {featuredScenario.chichanAi.response}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT 1/3 COLUMN: Strengths (Clean Unboxed List with Fixed Row Heights) */}
                  <div className="md:col-span-4 flex flex-col space-y-2.5 pt-1 pl-1 md:pl-2">
                    <div>
                      {/* Fixed h-7 Header */}
                      <div className="h-7 flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkle
                            size={15}
                            weight="fill"
                            className="text-primary shrink-0"
                          />
                          <span className="text-xs font-extrabold text-primary uppercase tracking-wider truncate">
                            Sự khác biệt
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                          {featuredScenario.chichanAi.safetyScore}
                        </span>
                      </div>

                      {/* 3 Perfectly Balanced Items with identical h-9 */}
                      <div className="pt-1.5 space-y-2">
                        {featuredScenario.chichanAi.benefits.map(
                          (benefit, idx) => (
                            <div
                              key={idx}
                              className="h-9 flex items-center gap-2 text-xs font-medium text-slate-700 leading-snug"
                            >
                              <CheckCircle
                                size={16}
                                weight="fill"
                                className="text-emerald-600 shrink-0"
                              />
                              <span className="truncate">{benefit}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Fixed h-8 Footer */}
                    <div className="h-8 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>Độ thấu cảm:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {featuredScenario.chichanAi.emotionScore}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LAYER 2 (CLIPPED / LEFT SIDE): GENERIC AI CHATBOT (SEAMLESS UNIFIED WHITE BACKGROUND) */}
              <div
                className="absolute inset-0 z-10 overflow-hidden bg-white text-slate-700"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                }}
              >
                <div className="w-full p-4 sm:p-6 bg-white text-slate-700 space-y-3">
                  {/* Floating Badge (Left Corner) - Fixed h-7 */}
                  <div className="h-7 flex items-center justify-start pb-1 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                      <Robot size={12} />
                      AI Truyền Thống
                    </span>
                  </div>

                  {/* 2/3 Left Response & 1/3 Right Weaknesses Grid (items-start for rock-solid top alignment) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* LEFT 2/3 COLUMN: Generic AI Response in Chat Bubble */}
                    <div className="md:col-span-8 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0 shadow-xs">
                        <HeadCircuit size={20} weight="regular" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="h-7 flex items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                            {featuredScenario.genericAi.botName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Máy móc • Lý thuyết
                          </span>
                        </div>

                        {/* 2/3 Chat Bubble - fixed min-height */}
                        <div className="p-3.5 sm:p-4 rounded-2xl rounded-tl-xs bg-slate-50/70 border border-slate-200/80 shadow-xs min-h-[145px] flex flex-col justify-center space-y-2">
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                            {featuredScenario.genericAi.response}
                          </p>
                          <div className="space-y-1 text-xs text-slate-600 font-mono bg-white p-2 rounded-lg border border-slate-200/60">
                            {featuredScenario.genericAi.bulletPoints.map(
                              (bp, idx) => (
                                <div key={idx}>{bp}</div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT 1/3 COLUMN: Weaknesses (Clean Unboxed List with Fixed Row Heights) */}
                    <div className="md:col-span-4 flex flex-col space-y-2.5 pt-1 pl-1 md:pl-2">
                      <div>
                        {/* Fixed h-7 Header */}
                        <div className="h-7 flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <XCircle
                              size={15}
                              weight="fill"
                              className="text-rose-500 shrink-0"
                            />
                            <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider truncate">
                              Hạn Chế AI Thường
                            </span>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 shrink-0">
                            0% Thực chiến
                          </span>
                        </div>

                        {/* 3 Perfectly Balanced Items with identical h-9 */}
                        <div className="pt-1.5 space-y-2">
                          {featuredScenario.genericAi.downsides.map(
                            (downside, idx) => (
                              <div
                                key={idx}
                                className="h-9 flex items-center gap-2 text-xs font-medium text-slate-600 leading-snug"
                              >
                                <XCircle
                                  size={16}
                                  weight="fill"
                                  className="text-rose-500 shrink-0"
                                />
                                <span className="truncate">{downside}</span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Fixed h-8 Footer */}
                      <div className="h-8 pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Độ thấu cảm:</span>
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                          Thấu cảm: 20%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERTICAL SLIDER DIVIDER & REFINED MINIMALIST DRAG HANDLE */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none flex items-center justify-center"
                style={{
                  left: `${sliderPosition}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {/* Slim Vertical Divider Line */}
                <div className="w-[1.5px] h-full bg-slate-300/80 shadow-xs relative">
                  <div className="absolute inset-y-0 -left-0.5 -right-0.5 bg-primary/20 blur-xs"></div>
                </div>

                {/* Sleek Minimalist Pill Drag Capsule */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-7 h-11 sm:w-8 sm:h-12 rounded-full bg-white/95 backdrop-blur-md text-slate-600 shadow-md shadow-black/10 border border-slate-200/90 flex flex-col items-center justify-center gap-0.5 pointer-events-auto cursor-ew-resize transition-all duration-150 ${
                    isDragging
                      ? "scale-110 shadow-lg ring-2 ring-primary/30 border-primary/50 text-primary"
                      : "hover:scale-105 hover:border-slate-300 hover:shadow-lg"
                  }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                >
                  <div className="flex items-center justify-center text-slate-500 hover:text-primary">
                    <CaretLeft size={10} weight="bold" />
                    <div className="w-[1.5px] h-3.5 bg-slate-300 mx-0.5 rounded-full" />
                    <CaretRight size={10} weight="bold" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION CTA TO GAMEPLAY */}
        <div className="flex justify-center pt-2 relative z-30">
          <Link
            href="/game"
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all group cursor-pointer"
          >
            <span>Bước vào Phòng Chơi Giả Lập AI Để Thử Thách Ngay</span>
            <ArrowRight
              size={18}
              weight="bold"
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </Link>
        </div>

        {/* 3 CORE FEATURE PILLARS (RESPONSIVE GRID) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto w-full pt-2">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center gap-3">
            <RoleplayInteractiveIllustration className="w-28 h-20" />
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm font-bold text-on-surface">
                  Giả Lập 1–1
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Thực chiến
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-light leading-snug mt-1">
                Rèn phản xạ giao tiếp và xử lý tình huống thực tế
              </p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center gap-3">
            <MedicalBoundaryIllustration className="w-28 h-20" />
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm font-bold text-on-surface">
                  Chuẩn Y Văn
                </span>
                <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200/60">
                  Y tế
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-light leading-snug mt-1">
                Chấm điểm ranh giới an toàn và quy chuẩn y khoa
              </p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center gap-3">
            <AnonymousSafeIllustration className="w-28 h-20" />
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm font-bold text-on-surface">
                  100% Ẩn Danh
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              </div>
              <p className="text-xs text-on-surface-variant font-light leading-snug mt-1">
                Bảo mật danh tính tuyệt đối, đồng hành không phán xét
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
