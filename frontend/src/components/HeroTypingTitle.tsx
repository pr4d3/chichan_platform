"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";
import { BRAND_CONFIG } from "@/config/branding";

if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

interface HeroTypingTitleProps {
  className?: string;
}

const KEYWORDS = [
  "Tiện lợi, Khoa học & Thú vị",
  "Đồng hành cùng HS, PH & Nhà trường",
  "Môi trường học tập số an toàn",
  "Rèn luyện phản xạ cùng AI",
  "Giảm thiểu rào cản tiếp cận GDGT",
];

export function HeroTypingTitle({ className = "" }: HeroTypingTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (!textRef.current || !cursorRef.current) return;

      // 1. Cursor blinking effect
      gsap.to(cursorRef.current, {
        opacity: 0,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
        duration: 0.45,
      });

      // 2. Master timeline for cycling keywords
      const masterTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 0.2,
      });

      KEYWORDS.forEach((keyword) => {
        const typeDuration = Math.max(0.6, keyword.length * 0.045);
        const deleteDuration = Math.max(0.4, keyword.length * 0.022);

        const wordTl = gsap.timeline();

        // Gõ chữ tiến tới
        wordTl.to(textRef.current, {
          duration: typeDuration,
          text: {
            value: keyword,
            delimiter: "",
          },
          ease: "none",
        });

        // Dừng lại cho người xem đọc
        wordTl.to({}, { duration: 2.6 });

        // Xóa lùi lại (Backspace effect)
        wordTl.to(textRef.current, {
          duration: deleteDuration,
          text: {
            value: "",
            delimiter: "",
          },
          ease: "none",
        });

        // Nghỉ một nhịp nhỏ trước từ khóa tiếp theo
        wordTl.to({}, { duration: 0.25 });

        masterTl.add(wordTl);
      });
    },
    { scope: containerRef },
  );

  return (
    <h1
      ref={containerRef}
      className={`flex flex-col gap-1.5 text-on-surface select-none ${className}`}
    >
      {/* Brand Title: Nổi bật, kích thước lớn nhất & Gradient cao cấp */}
      <span className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-primary via-emerald-700 to-teal-800 bg-clip-text text-transparent">
        {BRAND_CONFIG.fullName}
      </span>

      {/* Dòng 2: Câu dẫn cố định */}
      <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
        Nền tảng Giáo dục Giới tính
      </span>

      {/* Dòng 3: Khung Typing cố định chiều cao (Không bao giờ bị xô lệch layout khi xoá chữ) */}
      <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight h-[1.35em] flex items-center text-primary">
        <span
          ref={textRef}
          className="text-primary font-black bg-gradient-to-r from-primary to-teal-700 bg-clip-text text-transparent"
        >
          {KEYWORDS[0]}
        </span>
        <span
          ref={cursorRef}
          className="inline-block w-[3.5px] h-[0.85em] bg-primary ml-1.5 rounded-full"
          aria-hidden="true"
        />
      </div>
    </h1>
  );
}
