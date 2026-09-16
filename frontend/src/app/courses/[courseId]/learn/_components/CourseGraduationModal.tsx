"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BRAND_CONFIG } from "@/config/branding";
import { GraduationTrophyIllustration } from "@/components/illustrations/StepIllustrations";
import { Modal } from "@/components/ui";
import {
  SealCheck,
  Robot,
  ArrowRight,
  ClipboardText,
  ArrowSquareOut,
} from "@phosphor-icons/react";

interface CourseGraduationModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle?: string;
  outroContent?: string;
  surveyUrl?: string;
}

export function CourseGraduationModal({
  isOpen,
  onClose,
  courseId,
  courseTitle = "Khóa học",
  outroContent,
  surveyUrl,
}: CourseGraduationModalProps) {
  const router = useRouter();
  const confettiIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Trigger Confetti Celebration on Modal Open
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    if (confettiIntervalRef.current) {
      clearInterval(confettiIntervalRef.current);
    }

    let cancelled = false;
    let confettiFn: typeof import("canvas-confetti") | null = null;

    // Tải động canvas-confetti: chỉ mở đúng dịp tốt nghiệp nên không cần nằm trong bundle chính
    (async () => {
      confettiFn = (await import("canvas-confetti")).default;
      if (cancelled) return;

      confettiIntervalRef.current = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(confettiIntervalRef.current);
          confettiIntervalRef.current = null;
          return;
        }

        const particleCount = 45 * (timeLeft / duration);
        confettiFn?.({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confettiFn?.({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    })();

    // Phím Escape do Modal primitive tự xử lý
    return () => {
      cancelled = true;
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current);
        confettiIntervalRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actualSurveyUrl = surveyUrl || BRAND_CONFIG.defaultSurveyUrl;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      backdropClassName="bg-black/60 backdrop-blur-md"
      panelClassName="p-8 sm:p-10 border border-white/80 text-center flex flex-col items-center gap-6"
    >
        {/* Graduation Trophy Illustration (Storyset / unDraw Style) */}
        <div className="relative flex items-center justify-center -mt-2 -mb-2">
          <GraduationTrophyIllustration className="w-52 h-36 drop-shadow-xs" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-on-surface">
            Chúc mừng bạn đã hoàn thành
          </h2>
          <p className="text-sm font-bold text-primary">{courseTitle}</p>
          <p className="text-xs text-on-surface-variant font-light leading-relaxed pt-1 max-w-sm mx-auto">
            {outroContent ||
              "Bạn đã xuất sắc hoàn thành toàn bộ lộ trình bài giảng và tích lũy trọn vẹn kiến thức chuẩn y khoa"}
          </p>
        </div>

        {/* Actions & Next Steps */}
        <div className="w-full space-y-3 pt-2">
          {/* Main CTA: View Certificate */}
          <button
            onClick={() => router.push(`/courses/${courseId}/certificate`)}
            className="w-full bg-gradient-to-r from-secondary-container to-secondary text-white py-3.5 px-6 rounded-full font-bold text-xs shadow-md hover:shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Nhận &amp; In Chứng Chỉ Điện Tử</span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/game")}
              className="w-full bg-primary/10 border border-primary/20 text-primary py-3 px-4 rounded-full font-bold text-xs hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Robot size={16} weight="duotone" />
              <span>AI Roleplay</span>
            </button>
            <button
              onClick={onClose}
              className="w-full bg-surface-container text-on-surface-variant py-3 px-4 rounded-full font-bold text-xs hover:bg-surface-container-high transition-all flex items-center justify-center cursor-pointer"
            >
              <span>Xem lại bài học</span>
            </button>
          </div>

          {/* Quick survey link */}
          {actualSurveyUrl && (
            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-center">
              <a
                href={actualSurveyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 px-2"
              >
                <ClipboardText size={14} weight="duotone" />
                <span>Đóng góp phiếu khảo sát nghiên cứu (ẩn danh)</span>
                <ArrowSquareOut size={12} weight="bold" />
              </a>
            </div>
          )}
        </div>
    </Modal>
  );
}
