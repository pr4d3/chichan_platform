"use client";

import React, { useRef, useEffect } from "react";
import { BRAND_CONFIG } from "@/config/branding";

interface HeroTypingTitleProps {
  className?: string;
}

const KEYWORDS = [
  "Tiện lợi, Khoa học & Thú vị",
  "Đồng hành cùng HS & Phụ huynh",
  "Môi trường học tập số an toàn",
  "Rèn luyện phản xạ cùng AI",
  "Giáo dục giới tính toàn diện",
];

// Nhịp vòng lặp giữ nguyên như timeline gsap cũ (đơn vị ms)
const HOLD_MS = 2600; // Dừng cho người xem đọc
const GAP_MS = 250; // Nghỉ một nhịp nhỏ trước từ khóa tiếp theo
const TYPE_MS = 45; // Tốc độ gõ mỗi ký tự
const DELETE_MS = 22; // Tốc độ xóa mỗi ký tự

export function HeroTypingTitle({ className = "" }: HeroTypingTitleProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  // Vòng lặp gõ/xóa thuần setTimeout (bỏ gsap + TextPlugin — chỉ để gõ chữ)
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let word = 0;
    let chars = KEYWORDS[0].length; // Từ khóa đầu render sẵn đầy đủ, chạy thẳng vào pause
    let phase: "hold" | "type" | "delete" = "hold";
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (phase === "hold") {
        phase = "delete";
        timer = setTimeout(step, HOLD_MS);
        return;
      }

      const keyword = KEYWORDS[word];
      if (phase === "delete") {
        chars -= 1;
        el.textContent = chars > 0 ? keyword.slice(0, chars) : "\u00A0";
        if (chars > 0) {
          timer = setTimeout(step, DELETE_MS);
        } else {
          // Xóa hết → chuyển từ kế tiếp (quay vòng) và bắt đầu gõ
          word = (word + 1) % KEYWORDS.length;
          phase = "type";
          timer = setTimeout(step, GAP_MS);
        }
      } else {
        chars += 1;
        el.textContent = KEYWORDS[word].slice(0, chars);
        if (chars >= KEYWORDS[word].length) {
          phase = "hold";
          timer = setTimeout(step, HOLD_MS);
        } else {
          timer = setTimeout(step, TYPE_MS);
        }
      }
    };

    timer = setTimeout(step, HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <h1 className={`flex flex-col gap-2 text-on-surface select-none ${className}`}>
      {/* Brand Title: Nổi bật, kích thước lớn nhất & Gradient cao cấp */}
      <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-primary via-emerald-700 to-teal-800 bg-clip-text text-transparent leading-[1.1]">
        {BRAND_CONFIG.fullName}
      </span>

      {/* Dòng 2: Câu dẫn cố định */}
      <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-on-surface leading-snug">
        Nền tảng Giáo dục Giới tính
      </span>

      {/* Dòng 3: Khung Typing cố định chiều cao (Dành sẵn khoảng 2 dòng, baseline ổn định, không giật layout) */}
      <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight min-h-[2.5em] text-primary">
        <span
          ref={textRef}
          className="text-primary font-black bg-gradient-to-r from-primary to-teal-700 bg-clip-text text-transparent inline"
        >
          {KEYWORDS[0]}
        </span>
        <span
          className="inline-block w-[3.5px] h-[0.82em] bg-primary ml-1 align-baseline rounded-none animate-[caret-blink_0.9s_ease-in-out_infinite]"
          aria-hidden="true"
        />
        <style jsx>{`
          @keyframes caret-blink {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </h1>
  );
}
