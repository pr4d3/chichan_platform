"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import {
  SealCheck,
  Robot,
  ShieldCheck,
  Heart,
  Sparkle,
} from "@phosphor-icons/react";

export function HeroVisualShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  // Global Mouse Tracker: Nghiêng 3D mượt mà không làm vỡ nét font chữ
  useEffect(() => {
    // Thiết bị cảm ứng không có con trỏ chính xác: không đăng ký listener, tránh tốn main-thread vô ích
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const scene = sceneRef.current;
    if (!scene) return;

    const ctx = gsap.context(() => {
      gsap.set(scene, { transformPerspective: 1000 });

      const rotateXTo = gsap.quickTo(scene, "rotationX", {
        duration: 0.7,
        ease: "power2.out",
      });
      const rotateYTo = gsap.quickTo(scene, "rotationY", {
        duration: 0.7,
        ease: "power2.out",
      });

      const handleGlobalMouseMove = (e: MouseEvent) => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const normX = (e.clientX - windowWidth / 2) / (windowWidth / 2);
        const normY = (e.clientY - windowHeight / 2) / (windowHeight / 2);

        rotateYTo(normX * 8);
        rotateXTo(-normY * 6);
      };

      const handleGlobalMouseLeave = () => {
        rotateXTo(0);
        rotateYTo(0);
      };

      window.addEventListener("mousemove", handleGlobalMouseMove, { passive: true });
      document.addEventListener("mouseleave", handleGlobalMouseLeave);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseleave", handleGlobalMouseLeave);
      };
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full py-4 md:py-6 flex items-center justify-center select-none"
      style={{ perspective: "1000px" }}
    >
      {/* CSS Animations: 2D transform nhẹ nhàng, không bị giật */}
      <style jsx>{`
        @keyframes floatCard1 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        @keyframes floatCard2 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(7px);
          }
        }
        @keyframes floatCard3 {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .anim-float-1 {
          animation: floatCard1 4.2s ease-in-out infinite;
        }
        .anim-float-2 {
          animation: floatCard2 4.8s ease-in-out infinite 0.5s;
        }
        .anim-float-3 {
          animation: floatCard3 3.9s ease-in-out infinite 0.8s;
        }
        .crisp-card {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
        }
      `}</style>

      {/* Scene Wrapper */}
      <div
        ref={sceneRef}
        className="relative w-full h-[340px] sm:h-[420px] md:h-[490px]"
      >
        {/* Main Image Frame (Solid White Background, viền rõ nét & Shadow tạo chiều sâu) */}
        <div className="w-full h-full rounded-none overflow-hidden bg-white border border-outline-variant/50 shadow-depth-3 transition-shadow duration-300 group hover:shadow-depth-4">
          <img
            className="w-full h-full object-cover transform scale-102 group-hover:scale-105 transition-transform duration-700 ease-out rounded-none"
            alt="Gia đình cùng học tập an toàn trên ChiChan"
            src="/images/hero-family.jpg"
          />

          {/* Subtle Bottom Shade for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* --- FLOATING CARD 1: Đội ngũ nghiên cứu tâm huyết (Top-Left) --- */}
        <div className="absolute -top-4 -left-2 sm:-top-5 sm:-left-6 z-20 anim-float-1 pointer-events-none">
          <div className="crisp-card bg-white border border-outline-variant/40 p-3 sm:p-3.5 rounded-none shadow-depth-3 flex flex-col gap-2 max-w-[240px] sm:max-w-[265px] pointer-events-auto transition-transform hover:scale-105 duration-300">
            {/* Header Row: Stacked Avatars + Tag */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center -space-x-2">
                <div className="w-6 h-6 rounded-none bg-emerald-100 border border-white flex items-center justify-center text-[12px]">
                  🩺
                </div>
                <div className="w-6 h-6 rounded-none bg-teal-100 border border-white flex items-center justify-center text-[12px]">
                  🧠
                </div>
                <div className="w-6 h-6 rounded-none bg-blue-100 border border-white flex items-center justify-center text-[12px]">
                  🎓
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-primary-fixed/60 text-on-primary-fixed-variant text-[9px] font-extrabold uppercase tracking-wider">
                <SealCheck size={13} weight="fill" className="text-primary" />
                NCKH Giồng Ông Tố
              </span>
            </div>

            {/* Title & Subtext */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-[13px] font-extrabold text-on-surface leading-snug">
                Nhóm NCKH THPT Giồng Ông Tố
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium mt-0.5">
                Hỗ trợ giáo viên &amp; học sinh GOT
              </span>
            </div>
          </div>
        </div>

        {/* --- FLOATING CARD 2: Rèn luyện không rủi ro cùng AI (Bottom-Right) --- */}
        <div className="absolute -bottom-5 -right-2 sm:-bottom-7 sm:-right-6 z-20 anim-float-2 pointer-events-none">
          <div className="crisp-card bg-white border border-outline-variant/40 p-3 sm:p-3.5 rounded-none shadow-depth-3 flex flex-col gap-2 max-w-[250px] sm:max-w-[280px] pointer-events-auto transition-transform hover:scale-105 duration-300">
            {/* Header Row: AI Badge & Live Indicator */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-secondary-fixed/50 text-on-secondary-fixed text-[10px] font-bold">
                <Robot size={15} weight="duotone" className="text-secondary" />
                Mô phỏng Phản xạ
              </div>

              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  Real-time
                </span>
              </div>
            </div>

            {/* Title & Subtext */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-[13px] font-extrabold text-on-surface leading-snug">
                Củng cố &amp; rèn luyện cùng AI
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium mt-0.5">
                Tình huống ranh giới &amp; an toàn mạng
              </span>
            </div>
          </div>
        </div>

        {/* --- FLOATING CARD 3: Không Gian Tâm Sự Ẩn Danh (Bottom-Left) --- */}
        <div className="absolute bottom-4 left-1 sm:bottom-6 sm:-left-6 z-20 anim-float-3 pointer-events-none">
          <div className="crisp-card bg-white border border-outline-variant/40 p-3 sm:p-3.5 rounded-none shadow-depth-3 flex flex-col gap-2 max-w-[250px] sm:max-w-[275px] pointer-events-auto transition-transform hover:scale-105 duration-300">
            {/* Header Row: Shield Badge + Animated Audio/Pulse Wave */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-primary/10 text-primary text-[10px] font-extrabold tracking-wide">
                <ShieldCheck size={14} weight="fill" className="text-primary" />
                <span>Ẩn danh 100%</span>
              </div>

              {/* Animated Listening Soundwave */}
              <div
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-none bg-emerald-50 text-emerald-700 text-[9px] font-bold"
                title="Đang lắng nghe"
              >
                <span className="w-1 h-2 bg-primary rounded-none animate-pulse" />
                <span className="w-1 h-3.5 bg-primary rounded-none animate-pulse [animation-delay:0.2s]" />
                <span className="w-1 h-2.5 bg-primary rounded-none animate-pulse [animation-delay:0.4s]" />
                <span className="w-1 h-1.5 bg-primary rounded-none animate-pulse [animation-delay:0.1s]" />
                <span className="ml-1 text-[9px]">Lắng nghe</span>
              </div>
            </div>

            {/* Title & Subtext */}
            <div className="flex flex-col">
              <span className="text-xs sm:text-[13px] font-extrabold text-on-surface leading-snug flex items-center gap-1">
                <span>Đồng hành &amp; Lắng nghe</span>
                <Sparkle size={13} weight="fill" className="text-amber-500" />
              </span>
              <span className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium mt-0.5">
                Đối thoại cởi mở cùng Giáo viên
              </span>
            </div>

            {/* Bottom Reassurance Tag */}
            <div className="pt-1 border-t border-outline-variant/20 flex items-center justify-between text-[9px] text-on-surface-variant font-semibold">
              <span className="flex items-center gap-1 text-primary font-bold">
                <Heart size={11} weight="fill" className="text-rose-500 animate-pulse" />
                Bảo mật danh tính
              </span>
              <span className="text-on-surface-variant/70">24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
