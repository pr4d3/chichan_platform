import React from "react";

interface IllustrationProps {
  className?: string;
}

// =========================================================================
// BỘ 4 TRANH MINH HỌA TRỪU TƯỢNG CHO 4 THÀNH VIÊN ĐỀ TÀI (TRANG ABOUT)
// Phong cách: Storyset / unDraw trừu tượng (Abstract Concept), đồng bộ với
// các tranh minh họa ở trang chủ (StepIllustrations).
// KHÔNG VẼ AVATAR MẶT NGƯỜI — TẬP TRUNG VÀO BIỂU TƯỢNG VAI TRÒ & ĐÓNG GÓP HỌC THUẬT.
// =========================================================================

/**
 * 1. THẦY TRẦN THIỆN TRÍ — GIÁO VIÊN HƯỚNG DẪN & CỐ VẤN SƯ PHẠM
 * Biểu tượng trừu tượng: Bảng phương pháp luận sư phạm, La bàn định hướng học thuật,
 * Ngọn đuốc tri thức ("thắp đèn soi rọi") và cuốn sách giáo trình chuẩn hóa.
 */
export function AdvisorAbstractIllustration({
  className = "w-full h-full",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Aura */}
      <circle cx="140" cy="90" r="75" fill="#E6F4EA" fillOpacity="0.8" />
      <circle cx="205" cy="55" r="35" fill="#FEF3C7" fillOpacity="0.7" />
      <circle cx="70" cy="120" r="28" fill="#C2E7FF" fillOpacity="0.5" />

      {/* Decorative Sparkles */}
      <circle cx="45" cy="40" r="3" fill="#005039" fillOpacity="0.4" />
      <circle cx="240" cy="105" r="3" fill="#D97706" fillOpacity="0.5" />
      <path
        d="M230 30L231.5 34.5L236 36L231.5 37.5L230 42L228.5 37.5L224 36L228.5 34.5L230 30Z"
        fill="#D97706"
        fillOpacity="0.75"
      />

      {/* Base Floor Line */}
      <rect x="30" y="152" width="220" height="5" rx="2.5" fill="#D1E7DD" />

      {/* Left: Ngọn Đèn Hải Đăng / Ngọn Đuốc Tri Thức ("Thắp đèn soi rọi") */}
      <g transform="translate(36, 52)">
        <circle cx="20" cy="20" r="24" fill="#FEF08A" fillOpacity="0.5" />
        <path d="M12 60L18 40H22L28 60H12Z" fill="#1E293B" />
        <rect x="10" y="60" width="20" height="5" rx="2" fill="#334155" />
        <rect x="10" y="22" width="20" height="19" rx="3.5" fill="#FFFFFF" stroke="#005039" strokeWidth="2.2" />
        <path d="M20 25C20 25 16 30 16 33C16 36 18 38 20 38C22 38 24 36 24 33C24 30 20 25 20 25Z" fill="#F59E0B" />
        <circle cx="20" cy="33" r="1.8" fill="#FEF08A" />
        <path d="M8 22L20 12L32 22H8Z" fill="#005039" />
        <circle cx="20" cy="8.5" r="3.5" fill="none" stroke="#005039" strokeWidth="2" />
      </g>

      {/* Center: Bảng Phương Pháp Luận Nghiên Cứu (Methodology Easel) */}
      <g transform="translate(92, 30)">
        {/* Easel Stand Legs */}
        <line x1="24" y1="80" x2="14" y2="122" stroke="#003525" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="72" y1="80" x2="82" y2="122" stroke="#003525" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="48" y1="80" x2="48" y2="122" stroke="#003525" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />

        {/* Board */}
        <rect
          x="0"
          y="0"
          width="96"
          height="80"
          rx="6"
          fill="#005039"
          stroke="#003525"
          strokeWidth="2.5"
          filter="drop-shadow(0 5px 10px rgba(0,80,57,0.2))"
        />

        {/* Board Header Bar */}
        <rect x="0" y="0" width="96" height="12" rx="6" fill="#003525" />
        <circle cx="9" cy="6" r="2" fill="#34D399" />
        <circle cx="16" cy="6" r="2" fill="#34D399" fillOpacity="0.5" />

        {/* Methodology Tree Nodes */}
        <rect x="33" y="18" width="30" height="12" rx="2.5" fill="#FFFFFF" />
        <path d="M38 24H58" stroke="#005039" strokeWidth="2" strokeLinecap="round" />

        <path d="M48 30V37" stroke="#80E2B8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 37H72" stroke="#80E2B8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 37V42" stroke="#80E2B8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M72 37V42" stroke="#80E2B8" strokeWidth="1.8" strokeLinecap="round" />

        <rect x="11" y="42" width="26" height="11" rx="2.5" fill="#A7F3D0" />
        <path d="M15 47.5H33" stroke="#005039" strokeWidth="1.8" strokeLinecap="round" />

        <rect x="59" y="42" width="26" height="11" rx="2.5" fill="#FEF08A" />
        <path d="M63 47.5H81" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />

        {/* Research Trend Graph Line */}
        <path
          d="M14 68L34 60L54 65L74 57L84 59"
          stroke="#34D399"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="74" cy="57" r="3" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.2" />
      </g>

      {/* Right: Sách Định Hướng Sư Phạm & Huân Chương Học Thuật */}
      <g transform="translate(196, 68)">
        <rect x="10" y="58" width="48" height="10" rx="2" fill="#005039" stroke="#003525" strokeWidth="1.2" />
        <rect x="14" y="48" width="42" height="10" rx="2" fill="#008272" stroke="#005039" strokeWidth="1.2" />
        <rect x="18" y="38" width="36" height="10" rx="2" fill="#D97706" stroke="#B45309" strokeWidth="1.2" />

        {/* Academic Compass (La bàn định hướng) */}
        <g transform="translate(16, -10)">
          <circle cx="18" cy="18" r="16" fill="#FFFFFF" stroke="#005039" strokeWidth="2" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.1))" />
          <polygon points="18,6 20.5,18 18,15.5 15.5,18" fill="#DC2626" />
          <polygon points="18,30 20.5,18 18,20.5 15.5,18" fill="#64748B" />
          <circle cx="18" cy="18" r="2.5" fill="#005039" />
        </g>
      </g>
    </svg>
  );
}

/**
 * 2. NGUYỄN LÊ KHÁNH DUNG — ĐỒNG TÁC GIẢ: KHẢO SÁT & PHÂN TÍCH SỐ LIỆU
 * Biểu tượng trừu tượng: Bảng hồ sơ khảo sát 401 học sinh, Ô tích xanh kiểm định ✔️,
 * Biểu đồ cột phân tích thống kê và Kính lúp phóng đại dữ liệu 🔍.
 */
export function SurveyAnalyticsAbstractIllustration({
  className = "w-full h-full",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Aura */}
      <circle cx="140" cy="90" r="75" fill="#E6F4EA" fillOpacity="0.8" />
      <circle cx="75" cy="65" r="32" fill="#C2E7FF" fillOpacity="0.6" />
      <circle cx="205" cy="115" r="30" fill="#FEF3C7" fillOpacity="0.6" />

      {/* Decorative Dots */}
      <circle cx="45" cy="40" r="3" fill="#008272" fillOpacity="0.4" />
      <circle cx="235" cy="100" r="3" fill="#10B981" fillOpacity="0.5" />
      <path
        d="M230 32L231.5 36.5L236 38L231.5 39.5L230 44L228.5 39.5L224 38L228.5 36.5L230 32Z"
        fill="#10B981"
        fillOpacity="0.75"
      />

      {/* Floor Line */}
      <rect x="30" y="152" width="220" height="5" rx="2.5" fill="#A7F3D0" />

      {/* Left: Thống Kê Tăng Trưởng Thực Chứng (Mini Graph Card) */}
      <g transform="translate(38, 55)">
        <rect
          x="0"
          y="0"
          width="60"
          height="68"
          rx="6"
          fill="#FFFFFF"
          stroke="#008272"
          strokeWidth="2"
          filter="drop-shadow(0 4px 8px rgba(0,130,114,0.15))"
        />
        <rect x="0" y="0" width="60" height="12" rx="6" fill="#008272" />
        <circle cx="8" cy="6" r="2" fill="#A7F3D0" />
        <circle cx="14" cy="6" r="2" fill="#A7F3D0" fillOpacity="0.6" />

        {/* Bar chart inside card */}
        <g transform="translate(8, 20)">
          <rect x="0" y="32" width="44" height="1.5" fill="#CBD5E1" />
          <rect x="3" y="14" width="7" height="18" rx="1.5" fill="#005039" />
          <rect x="13" y="8" width="7" height="24" rx="1.5" fill="#008272" />
          <rect x="23" y="4" width="7" height="28" rx="1.5" fill="#10B981" />
          <rect x="33" y="18" width="7" height="14" rx="1.5" fill="#3B82F6" />
        </g>
      </g>

      {/* Center: Bảng Hồ Sơ Khảo Sát 401 Học Sinh (N=401 Survey Clipboard) */}
      <g transform="translate(104, 30)">
        <rect
          x="0"
          y="7"
          width="80"
          height="104"
          rx="7"
          fill="#FFFFFF"
          stroke="#005039"
          strokeWidth="2.5"
          filter="drop-shadow(0 6px 14px rgba(0,80,57,0.18))"
        />
        {/* Top Metallic Clip */}
        <rect x="22" y="0" width="36" height="11" rx="2.5" fill="#64748B" stroke="#334155" strokeWidth="1.2" />
        <circle cx="40" cy="5" r="2.5" fill="#FFFFFF" />

        {/* Survey Question Rows with Crisp Checkmarks */}
        <g transform="translate(10, 24)">
          <circle cx="6" cy="6" r="5" fill="#10B981" />
          <path d="M4 6L5.5 7.5L8.5 4.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="6" x2="62" y2="6" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        <g transform="translate(10, 42)">
          <circle cx="6" cy="6" r="5" fill="#10B981" />
          <path d="M4 6L5.5 7.5L8.5 4.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="6" x2="55" y2="6" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        <g transform="translate(10, 60)">
          <circle cx="6" cy="6" r="5" fill="#10B981" />
          <path d="M4 6L5.5 7.5L8.5 4.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="16" y1="6" x2="50" y2="6" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" />
        </g>

        {/* Metric Progress Line */}
        <g transform="translate(10, 78)">
          <rect x="0" y="0" width="60" height="6" rx="3" fill="#E2E8F0" />
          <rect x="0" y="0" width="46" height="6" rx="3" fill="#008272" />
        </g>

        {/* Magnifying Glass Overlapping Board (🔍) */}
        <g transform="translate(48, 64)">
          <circle cx="14" cy="14" r="12" fill="#E0F2FE" fillOpacity="0.8" stroke="#0284C7" strokeWidth="2.6" />
          <path d="M10 14L13 17L18 11" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="23" y1="23" x2="33" y2="33" stroke="#0369A1" strokeWidth="3.8" strokeLinecap="round" />
        </g>
      </g>

      {/* Right: Huy Hiệu Dữ Liệu Thực Chứng & Đánh Giá Chuẩn Xác */}
      <g transform="translate(196, 45)">
        <circle cx="18" cy="18" r="18" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" filter="drop-shadow(0 3px 6px rgba(245,158,11,0.2))" />
        {/* Star in circle */}
        <path
          d="M18 9L20 14.5H25.5L21 17.8L22.8 23L18 19.8L13.2 23L15 17.8L10.5 14.5H16L18 9Z"
          fill="#D97706"
        />
        {/* Verification ribbon */}
        <path d="M13 28L10 38L18 35L26 38L23 28" fill="#F59E0B" />
      </g>
    </svg>
  );
}

/**
 * 3. ĐINH TUỆ CHI — ĐỒNG TÁC GIẢ: BIÊN KỊCH KỊCH BẢN TÌNH HUỐNG NHẬP VAI
 * Biểu tượng trừu tượng: Cuộn kịch bản nhập vai (Storyboard phân nhánh A/B),
 * Bong bóng hội thoại đối thoại an toàn, Bóng đèn ý tưởng sáng tạo 💡 và Trái tim thấu cảm.
 */
export function ScenarioStoryAbstractIllustration({
  className = "w-full h-full",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Aura */}
      <circle cx="140" cy="90" r="75" fill="#FEF3C7" fillOpacity="0.8" />
      <circle cx="80" cy="65" r="32" fill="#FFE4E6" fillOpacity="0.6" />
      <circle cx="205" cy="115" r="30" fill="#E6F4EA" fillOpacity="0.6" />

      {/* Decorative Dots */}
      <circle cx="45" cy="38" r="3" fill="#D97706" fillOpacity="0.4" />
      <circle cx="235" cy="105" r="3" fill="#EF4444" fillOpacity="0.4" />
      <path
        d="M230 32L231.5 36.5L236 38L231.5 39.5L230 44L228.5 39.5L224 38L228.5 36.5L230 32Z"
        fill="#F59E0B"
        fillOpacity="0.75"
      />

      {/* Floor Line */}
      <rect x="30" y="152" width="220" height="5" rx="2.5" fill="#FDE68A" />

      {/* Left: Cuộn Kịch Bản / Phân Cảnh Nhập Vai (Storyboard) */}
      <g transform="translate(36, 42)">
        <rect
          x="0"
          y="12"
          width="68"
          height="84"
          rx="7"
          fill="#FFFFFF"
          stroke="#D97706"
          strokeWidth="2.2"
          filter="drop-shadow(0 4px 10px rgba(217,119,6,0.15))"
        />
        {/* Clapper / Header bar */}
        <rect x="0" y="12" width="68" height="16" rx="7" fill="#D97706" />
        <rect x="0" y="22" width="68" height="5" fill="#B45309" />
        <circle cx="12" cy="20" r="2.5" fill="#FFFFFF" />
        <line x1="19" y1="20" x2="55" y2="20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

        {/* Choice A Box (Ranh giới an toàn) */}
        <g transform="translate(7, 34)">
          <rect width="54" height="21" rx="4" fill="#E6F4EA" stroke="#005039" strokeWidth="1.4" />
          <circle cx="7" cy="10.5" r="3.5" fill="#10B981" />
          <path d="M5.5 10.5L6.8 11.8L9 9.2" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
          <line x1="14" y1="8" x2="46" y2="8" stroke="#005039" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="14" y1="13" x2="36" y2="13" stroke="#008272" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* Choice B Box (Lời khuyên cởi mở) */}
        <g transform="translate(7, 61)">
          <rect width="54" height="21" rx="4" fill="#FEF3C7" stroke="#CA8A04" strokeWidth="1.4" />
          <circle cx="7" cy="10.5" r="3.5" fill="#F59E0B" />
          <circle cx="7" cy="10.5" r="1.2" fill="#FFFFFF" />
          <line x1="14" y1="8" x2="43" y2="8" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="14" y1="13" x2="32" y2="13" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>

      {/* Center: Bong Bóng Đối Thoại Giả Định (Roleplay Interactive Dialogue) */}
      <g transform="translate(116, 48)">
        {/* User Prompt Bubble */}
        <g transform="translate(0, 0)">
          <rect width="72" height="34" rx="10" fill="#FFFFFF" stroke="#005039" strokeWidth="2" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.08))" />
          <line x1="12" y1="12" x2="58" y2="12" stroke="#005039" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
          <line x1="12" y1="20" x2="44" y2="20" stroke="#005039" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
          <path d="M56 34L63 41V34H56Z" fill="#FFFFFF" stroke="#005039" strokeWidth="2" />
        </g>

        {/* AI Feedback / Safe Response Bubble */}
        <g transform="translate(12, 38)">
          <rect width="72" height="36" rx="10" fill="#005039" filter="drop-shadow(0 4px 8px rgba(0,80,57,0.2))" />
          <circle cx="14" cy="18" r="4.5" fill="#34D399" />
          <line x1="24" y1="14" x2="60" y2="14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="24" y1="22" x2="50" y2="22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
          <path d="M14 36L7 43V36H14Z" fill="#005039" />
        </g>
      </g>

      {/* Right: Bóng Đèn Sáng Tạo 💡 & Trái Tim Thấu Cảm */}
      <g transform="translate(204, 38)">
        <circle cx="18" cy="18" r="20" fill="#FEF08A" fillOpacity="0.5" />
        <circle cx="18" cy="18" r="13" fill="#FEF08A" stroke="#CA8A04" strokeWidth="2.2" />
        <path d="M14 25C14 25 15.5 29 18 29C20.5 29 22 25 22 25" stroke="#CA8A04" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="15" y="29" width="6" height="3.5" rx="1" fill="#CA8A04" />

        {/* Lightbulb rays */}
        <line x1="18" y1="6" x2="18" y2="2" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
        <line x1="28" y1="9" x2="31" y2="6" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="9" x2="5" y2="6" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />

        {/* Empathy Heart Badge below */}
        <g transform="translate(4, 42)">
          <rect width="28" height="22" rx="5" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.6" />
          <path
            d="M14 7.5C12.5 5.5 9.5 5.5 8 7.5C6.2 9.8 8.8 12.5 14 15.5C19.2 12.5 21.8 9.8 20 7.5C18.5 5.5 15.5 5.5 14 7.5Z"
            fill="#EF4444"
          />
        </g>
      </g>
    </svg>
  );
}

/**
 * 4. ĐÀM LÊ TUẤN ANH — KỸ THUẬT & CÔNG NGHỆ NỀN TẢNG
 * Biểu tượng trừu tượng: Màn hình lập trình (IDE), Thẻ Code Tag </>,
 * Chip vi xử lý trí tuệ nhân tạo (AI Engine 🤖) và Đám mây dữ liệu bảo mật ☁️.
 */
export function TechSystemAbstractIllustration({
  className = "w-full h-full",
}: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Aura - Tươi sáng, thoáng đãng */}
      <circle cx="140" cy="90" r="75" fill="#E0F2FE" fillOpacity="0.8" />
      <circle cx="205" cy="55" r="35" fill="#E6F4EA" fillOpacity="0.75" />
      <circle cx="75" cy="120" r="30" fill="#FEF3C7" fillOpacity="0.65" />

      {/* Decorative Sparkles & Glowing Code Accents */}
      <circle cx="45" cy="38" r="3" fill="#2563EB" fillOpacity="0.5" />
      <circle cx="235" cy="105" r="3" fill="#008272" fillOpacity="0.5" />
      <path
        d="M230 30L231.5 34.5L236 36L231.5 37.5L230 42L228.5 37.5L224 36L228.5 34.5L230 30Z"
        fill="#0284C7"
        fillOpacity="0.8"
      />

      {/* Clean Floor Line */}
      <rect x="30" y="152" width="220" height="5" rx="2.5" fill="#BAE6FD" />

      {/* Left: Thẻ Code Tag </> SÁNG RỰC RỠ & LÁ CHẮN BẢO MẬT DỮ LIỆU */}
      <g transform="translate(36, 44)">
        {/* Floating White Code Tag Badge */}
        <rect
          x="0"
          y="0"
          width="58"
          height="42"
          rx="8"
          fill="#FFFFFF"
          stroke="#2563EB"
          strokeWidth="2.2"
          filter="drop-shadow(0 4px 10px rgba(37,99,235,0.15))"
        />
        {/* Header line */}
        <rect x="0" y="0" width="58" height="10" rx="8" fill="#EFF6FF" />
        <circle cx="8" cy="5" r="1.5" fill="#2563EB" />
        <circle cx="13" cy="5" r="1.5" fill="#60A5FA" />

        {/* Crisp Code Brackets </> in Royal Blue */}
        <path
          d="M13 25L20 18M13 25L20 32M45 25L38 18M45 25L38 32M32 15L26 35"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Floating Privacy & Security Shield below (Màu ngọc lục bảo tươi) */}
        <g transform="translate(10, 50)">
          <path
            d="M19 0L37 7C37 22 26.5 34 19 39C11.5 34 1 22 1 7L19 0Z"
            fill="#E6F4EA"
            stroke="#005039"
            strokeWidth="2"
            filter="drop-shadow(0 3px 6px rgba(0,80,57,0.15))"
          />
          {/* Golden Keyhole / Lock */}
          <circle cx="19" cy="16" r="4.5" fill="#F59E0B" />
          <path d="M19 19V25" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>

      {/* Center: Trạm Màn Hình Lập Trình & Giao Diện E-Learning Trực Quan (Tone Trắng / Xanh Công Nghệ) */}
      <g transform="translate(100, 36)">
        {/* Monitor Outer Screen (White & Sky Blue Border) */}
        <rect
          x="0"
          y="0"
          width="104"
          height="74"
          rx="7"
          fill="#FFFFFF"
          stroke="#0284C7"
          strokeWidth="2.5"
          filter="drop-shadow(0 6px 16px rgba(2,132,199,0.18))"
        />

        {/* Toolbar Header (Ice Blue) */}
        <rect x="0" y="0" width="104" height="14" rx="7" fill="#F0F9FF" />
        <circle cx="9" cy="7" r="2" fill="#EF4444" />
        <circle cx="16" cy="7" r="2" fill="#F59E0B" />
        <circle cx="23" cy="7" r="2" fill="#10B981" />
        <line x1="34" y1="7" x2="68" y2="7" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />

        {/* Code & UI Wireframe Area (Fresh, Colorful, High-Tech) */}
        <g transform="translate(10, 20)">
          {/* Code Syntax Lines in bright emerald, blue, amber, violet */}
          <line x1="2" y1="6" x2="32" y2="6" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="38" y1="6" x2="64" y2="6" stroke="#008272" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="8" y1="15" x2="48" y2="15" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="8" y1="24" x2="72" y2="24" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="2" y1="33" x2="26" y2="33" stroke="#8B5CF6" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="32" y1="33" x2="56" y2="33" stroke="#0284C7" strokeWidth="2.4" strokeLinecap="round" />

          {/* Interactive UI Card element on screen */}
          <rect x="52" y="30" width="30" height="15" rx="3" fill="#E6F4EA" stroke="#005039" strokeWidth="1.2" />
          <line x1="56" y1="36" x2="76" y2="36" stroke="#005039" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="76" cy="40" r="1.5" fill="#10B981" />
        </g>

        {/* Clean Stand & Base */}
        <path d="M43 74H61L65 94H39L43 74Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.2" />
        <rect x="33" y="94" width="38" height="5" rx="2" fill="#94A3B8" />

        {/* Keyboard on Desk */}
        <rect x="20" y="103" width="64" height="6" rx="2" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1.2" />
      </g>

      {/* Right: Cloud ☁️ & Chip AI Engine 🤖 (Trắng Sáng & Tươi Tắn) */}
      <g transform="translate(208, 40)">
        {/* Cloud Computing ☁️ */}
        <path
          d="M10 22C6 22 2 18.5 2 14.5C2 11 4.5 8 8 7.5C10 3.5 14 0 19 0C25 0 29 4 30 9C33 9.5 35.5 12 35.5 15C35.5 19 32.5 22 28.5 22H10Z"
          fill="#FFFFFF"
          stroke="#0284C7"
          strokeWidth="2.2"
          filter="drop-shadow(0 4px 8px rgba(2,132,199,0.18))"
        />
        {/* Cloud Sync Arrow */}
        <path d="M19 15V7M15 11L19 7L23 11" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* AI Neural Chip 🤖 (Trắng Tinh Khiết & Viền Indigo Tươi) */}
        <g transform="translate(3, 46)">
          <rect
            x="0"
            y="0"
            width="34"
            height="34"
            rx="6"
            fill="#FFFFFF"
            stroke="#6366F1"
            strokeWidth="2.2"
            filter="drop-shadow(0 4px 10px rgba(99,102,241,0.2))"
          />
          {/* Chip Pins */}
          <line x1="8" y1="-3" x2="8" y2="0" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="17" y1="-3" x2="17" y2="0" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="26" y1="-3" x2="26" y2="0" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />

          <line x1="8" y1="34" x2="8" y2="37" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="17" y1="34" x2="17" y2="37" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="26" y1="34" x2="26" y2="37" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />

          {/* AI Neural Star Core */}
          <circle cx="17" cy="17" r="8" fill="#EEF2FF" />
          <path
            d="M17 12V22M12 17H22M13.5 13.5L20.5 20.5M13.5 20.5L20.5 13.5"
            stroke="#6366F1"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="17" cy="17" r="2.8" fill="#06B6D4" />
        </g>
      </g>
    </svg>
  );
}
