"use client";

import React from "react";
import { CheckCircle } from "@phosphor-icons/react";
import {
  MedicalKnowledgeIllustration,
  AiSimulationIllustration,
  AssessmentGrowthIllustration,
} from "@/components/illustrations/StepIllustrations";

export function ThreeStepJourney() {
  const steps = [
    {
      step: "01",
      title: "Khám Phá Kiến Thức",
      description:
        "Tìm hiểu kiến thức qua hệ thống bài giảng online từ giáo viên, giải thích khoa học, tự nhiên về cơ thể và tâm sinh lý theo định hướng của nhà trường.",
      illustration: (
        <MedicalKnowledgeIllustration className="w-full h-40 my-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-xs" />
      ),
      highlights: [
        "Bài giảng online chuẩn hóa từ giáo viên",
        "Nội dung phù hợp định hướng nhà trường",
        "Kiến thức khoa học, trực quan, dễ tiếp thu",
      ],
    },
    {
      step: "02",
      title: "Củng Cố & Rèn Luyện Cùng AI",
      description:
        "Nhập vai tương tác với các tình huống giả định: ranh giới an toàn, phòng chống quấy rối mạng và tự bảo vệ mà không gặp bất kỳ rủi ro nào.",
      illustration: (
        <AiSimulationIllustration className="w-full h-40 my-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-xs" />
      ),
      highlights: [
        "Tình huống ranh giới an toàn & phòng quấy rối",
        "Phản xạ thực tế với trí tuệ nhân tạo",
        "Rèn luyện kỹ năng tự bảo vệ bản thân",
      ],
    },
    {
      step: "03",
      title: "Đồng Hành & Chia Sẻ",
      description:
        "Tiếp nhận các thắc mắc, phản hồi của HS và PH. Gợi mở chủ đề đối thoại cởi mở, gần gũi cho các bậc phụ huynh, học sinh và nhà trường.",
      illustration: (
        <AssessmentGrowthIllustration className="w-full h-40 my-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-xs" />
      ),
      highlights: [
        "Tiếp nhận thắc mắc, phản hồi của HS & PH",
        "Gợi mở đối thoại cởi mở, không khoảng cách",
        "Gắn kết Nhà trường - Gia đình - Học sinh",
      ],
    },
  ];

  return (
    <section className="relative py-20 md:py-28 px-4 md:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl md:text-4xl font-extrabold text-on-surface tracking-tight">
            Phương Pháp Học Tập &amp; Thực Hành Toàn Diện
          </h2>
          <p className="text-sm md:text-base text-on-surface-variant font-light leading-relaxed">
            Mô hình 3 bước giúp học sinh tiếp thu bài giảng từ giáo viên, rèn luyện kỹ năng phản xạ cùng AI và gắn kết đối thoại cởi mở cùng phụ huynh và nhà trường.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-none p-8 border border-outline-variant/40 shadow-depth-2 hover:shadow-depth-3 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group overflow-hidden"
            >
              {/* Step number watermark */}
              <span className="absolute top-5 right-7 text-7xl sm:text-8xl font-black text-outline-variant/25 select-none font-mono tracking-tighter group-hover:text-primary/25 group-hover:scale-105 transition-all duration-300 pointer-events-none">
                {item.step}
              </span>

              <div className="space-y-4">
                {/* Custom Storyset / unDraw Illustration */}
                <div className="flex items-center justify-center pt-2">
                  {item.illustration}
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>

                {/* Micro Checklist with Phosphor CheckCircle */}
                <ul className="space-y-2.5 pt-3 border-t border-outline-variant/20">
                  {item.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-on-surface-variant font-medium"
                    >
                      <CheckCircle
                        size={18}
                        weight="fill"
                        className="text-primary shrink-0"
                      />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
