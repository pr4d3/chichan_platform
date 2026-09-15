"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { BRAND_CONFIG } from "@/config/branding";
import {
  Certificate,
  DownloadSimple,
  GraduationCap,
  ClipboardText,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

function getSignatureName(str: string): string {
  if (!str) return "";
  let cleaned = str.replace(/^(GS|PGS|TS|ThS|BS|Dr|Prof)(\.|\s)+/gi, "");
  cleaned = cleaned.replace(/^(GS|PGS|TS|ThS|BS|Dr|Prof)(\.|\s)+/gi, "");
  cleaned = cleaned.replace(/^(GS|PGS|TS|ThS|BS|Dr|Prof)(\.|\s)+/gi, "");

  const noTones = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();

  const parts = noTones.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const lastName = parts[parts.length - 1];
  return lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
}

export default function CourseCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCertificate = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/outro`);
        if (res.success) {
          setCertData(res.data);
        }
      } catch (err: any) {
        setError(
          err.message || "Bạn chưa hoàn thành khóa học này để nhận chứng chỉ.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [courseId]);

  const handleDownloadPdf = async () => {
    if (!certRef.current || downloading) return;

    try {
      setDownloading(true);
      const element = certRef.current;

      // High-definition render via SVG foreignObject (supports OKLCH, OKLAB, standard CSS colors perfectly)
      const dataUrl = await toPng(element, {
        pixelRatio: 2.5, // Crisp high-DPI
        backgroundColor: "#ffffff",
        cacheBust: true,
        fontEmbedCSS: "", // Do not read external stylesheets into SVG to avoid browser CORS SecurityError
        skipFonts: true,
        filter: (node) => {
          if (
            node.tagName === "LINK" &&
            (node as HTMLLinkElement).rel === "stylesheet"
          ) {
            return false;
          }
          return true;
        },
      });

      // Standard A4 landscape dimensions in mm: 297 x 210
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Fit image cleanly to A4 landscape
      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST",
      );

      const studentClean = certData?.student_name
        ? getSignatureName(certData.student_name)
        : "Student";
      const fileName = `certificate-${certData?.certificate_code || "CERT"}-${studentClean}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      console.error("Lỗi khi xuất file PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-on-surface-variant text-sm font-semibold animate-pulse">
          Đang chuẩn bị chứng chỉ của bạn...
        </div>
      </div>
    );
  }

  if (error || !certData) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="text-center py-16 max-w-md mx-auto space-y-6 bg-white/80 backdrop-blur-md p-10 rounded-3xl border border-white/60 shadow-sm">
          <div className="w-16 h-16 mx-auto bg-red-50 text-error rounded-2xl flex items-center justify-center shadow-sm">
            <Certificate size={32} weight="duotone" />
          </div>
          <h2 className="text-lg font-bold text-on-surface">
            Chưa hoàn thành khóa học
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed font-light">
            {error}
          </p>
          <button
            onClick={() => router.push(`/courses/${courseId}/learn`)}
            className="px-8 py-3 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 shadow-md transition-all cursor-pointer"
          >
            Quay lại phòng học
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = certData.completed_at
    ? new Date(certData.completed_at).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("vi-VN");

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 bg-gradient-to-br from-surface to-surface-container-high">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 print:hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-fixed/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-40 right-10 w-80 h-80 bg-secondary-fixed/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-10 left-1/3 w-72 h-72 bg-tertiary-fixed/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Action Bar (Top) */}
      <div className="w-full max-w-4xl flex items-center justify-end mb-6 z-10 print:hidden">
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm hover:shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang tạo file PDF...</span>
            </>
          ) : (
            <>
              <DownloadSimple size={18} weight="bold" />
              <span>Tải Chứng Chỉ (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* CERTIFICATE CANVAS CARD */}
      <div
        id="certificate-print-area"
        ref={certRef}
        className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-xl border-8 border-double border-amber-600/30 p-8 sm:p-14 overflow-hidden text-center flex flex-col justify-between aspect-[1.414/1] max-h-[640px]"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,251,245,0.95) 100%)`,
        }}
      >
        {/* Decorative Certificate Corner Accents */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-amber-600/60 rounded-tl-xl pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-amber-600/60 rounded-tr-xl pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-amber-600/60 rounded-bl-xl pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-amber-600/60 rounded-br-xl pointer-events-none"></div>

        {/* Certificate Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <GraduationCap size={360} weight="fill" />
        </div>

        {/* Top Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-primary font-black tracking-widest text-xs uppercase mb-1">
            Nền Tảng Giáo Dục Giới Tính {BRAND_CONFIG.name}
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wider uppercase text-amber-900 drop-shadow-xs">
            Chứng Nhận Hoàn Thành
          </h1>
        </div>

        {/* Student Recipient Area */}
        <div className="my-auto py-3 space-y-2">
          <p className="text-xs sm:text-sm text-on-surface-variant font-medium italic">
            Chứng nhận trao tặng cho:
          </p>
          <h2
            className="text-4xl sm:text-6xl text-primary border-b-2 border-amber-600/30 pb-2 px-8 max-w-2xl mx-auto inline-block leading-normal"
            style={{ fontFamily: "var(--font-mea-culpa), cursive" }}
          >
            {certData.student_name}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed pt-1 font-light">
            Đã xuất sắc hoàn thành 100% lộ trình học tập:
          </p>
          <h3 className="text-base sm:text-xl font-bold text-amber-950 uppercase tracking-wide font-sans">
            {certData.course_title}
          </h3>
        </div>

        {/* Bottom Signature & Verification Info */}
        <div className="pt-6 border-t border-amber-900/10 flex items-end justify-between text-xs">
          {/* Left: Issue Date & Certificate ID */}
          <div className="text-left space-y-1">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Ngày cấp chứng chỉ
            </p>
            <p className="font-bold text-on-surface text-xs">{formattedDate}</p>
            <p className="text-[10px] font-mono text-primary font-bold pt-1">
              Mã: {certData.certificate_code}
            </p>
          </div>

          {/* Right: Instructor / Scientific Committee Signature */}
          <div className="text-right space-y-0.5 flex flex-col items-end justify-end relative">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              Giảng viên / Ban Chuyên Môn
            </p>

            {/* Fake Handwritten Signature with WindSong in Black & Large */}
            <div
              className="text-5xl sm:text-7xl text-zinc-900 font-medium select-none -rotate-6 py-2 pr-4 leading-none tracking-wide"
              style={{ fontFamily: "var(--font-windsong), cursive" }}
            >
              {getSignatureName(certData.instructor_name)}
            </div>

            {/* Printed Instructor Name */}
            <p className="text-xs sm:text-sm text-on-surface font-bold">
              {certData.instructor_name}
            </p>
          </div>
        </div>
      </div>

      {/* Survey Section (Bottom) */}
      <div className="w-full max-w-4xl mt-8 z-10 print:hidden">
        {/* Survey Feedback Box */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-primary font-bold text-xs">
              <ClipboardText size={18} weight="bold" />
              Phiếu khảo sát đóng góp nghiên cứu
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed font-light max-w-xl">
              Ý kiến của bạn là nguồn dữ liệu quý giá giúp hoàn thiện đề tài
              Giáo dục giới tính khoa học tại Việt Nam.
            </p>
          </div>
          <a
            href={
              certData.research_survey_url ||
              "https://forms.gle/research_feedback_sexed"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex h-11 px-8 items-center justify-center gap-2 rounded-full bg-primary text-xs font-bold text-white shadow-sm hover:shadow-md hover:opacity-95 transition-all"
          >
            <span>Làm khảo sát ẩn danh (2 phút)</span>
            <ArrowSquareOut size={16} weight="bold" />
          </a>
        </div>
      </div>
    </div>
  );
}
