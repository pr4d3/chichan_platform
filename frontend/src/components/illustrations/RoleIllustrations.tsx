import React from "react";

interface RoleIllustrationProps {
  className?: string;
}

// 1. Vai trò 1: Giáo viên hướng dẫn (Teacher Mentor & Research Advisor)
// Phong cách Storyset: Người thầy giáo đeo kính tri thức, bảng sư phạm, thước đo, ngòi bút & cuốn sách định hướng
export function AdvisorIllustration({ className = "w-full h-full" }: RoleIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Circles */}
      <circle cx="80" cy="80" r="70" fill="#E6F4EA" fillOpacity="0.8" />
      <circle cx="118" cy="48" r="26" fill="#FEF3C7" fillOpacity="0.7" />
      <circle cx="42" cy="115" r="20" fill="#C2E7FF" fillOpacity="0.5" />

      {/* Decorative Sparkles */}
      <circle cx="36" cy="42" r="3" fill="#005039" fillOpacity="0.5" />
      <circle cx="128" cy="110" r="2.5" fill="#D97706" fillOpacity="0.6" />
      <path d="M125 32L127 38L133 40L127 42L125 48L123 42L117 40L123 38L125 32Z" fill="#D97706" fillOpacity="0.8" />

      {/* Mini Blackboard / Teaching Frame in Background */}
      <rect x="26" y="38" width="52" height="38" rx="2" fill="#005039" stroke="#003525" strokeWidth="2" />
      {/* Chalk diagram lines (Function / Graph) */}
      <path d="M33 66L42 56L50 62L62 48L70 54" stroke="#80E2B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="62" cy="48" r="2.5" fill="#FEF08A" />

      {/* Teacher Character Body */}
      {/* Shoulders / Suit */}
      <path
        d="M48 148C48 126 62 118 80 118C98 118 112 126 112 148H48Z"
        fill="#1E293B"
      />
      {/* Shirt Collar / Tie */}
      <path d="M72 118L80 132L88 118H72Z" fill="#FFFFFF" />
      <path d="M78 126L80 148L82 126H78Z" fill="#008272" />

      {/* Neck */}
      <rect x="74" y="104" width="12" height="16" fill="#FBD5B5" />

      {/* Head */}
      <path
        d="M62 76C62 61 70 52 80 52C90 52 98 61 98 76C98 89 90 99 80 99C70 99 62 89 62 76Z"
        fill="#FBD5B5"
      />

      {/* Hair (Professional, neat) */}
      <path
        d="M60 70C60 52 70 44 80 44C91 44 100 52 100 68C98 65 92 62 84 62C75 62 67 66 60 70Z"
        fill="#334155"
      />

      {/* Glasses (Teacher signature) */}
      <rect x="67" y="70" width="11" height="8" rx="1.5" stroke="#0F172A" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.4" />
      <rect x="82" y="70" width="11" height="8" rx="1.5" stroke="#0F172A" strokeWidth="1.8" fill="#FFFFFF" fillOpacity="0.4" />
      <line x1="78" y1="74" x2="82" y2="74" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" />
      {/* Frame legs */}
      <line x1="67" y1="73" x2="62" y2="72" stroke="#0F172A" strokeWidth="1.5" />
      <line x1="93" y1="73" x2="98" y2="72" stroke="#0F172A" strokeWidth="1.5" />

      {/* Eyes & Smile */}
      <circle cx="72.5" cy="74" r="1.2" fill="#0F172A" />
      <circle cx="87.5" cy="74" r="1.2" fill="#0F172A" />
      <path d="M76 86C78 88 82 88 84 86" stroke="#C27848" strokeWidth="1.5" strokeLinecap="round" />

      {/* Open Guide Book in Foreground */}
      <g transform="translate(90, 100)">
        <path
          d="M4 28C14 24 24 25 28 29C32 25 42 24 52 28V8C42 4 32 5 28 9C24 5 14 4 4 8V28Z"
          fill="#FFFFFF"
          stroke="#005039"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line x1="28" y1="9" x2="28" y2="29" stroke="#005039" strokeWidth="1.5" />
        {/* Book bookmark ribbon */}
        <path d="M28 29L31 36L28 34L25 36L28 29Z" fill="#D97706" />
      </g>
    </svg>
  );
}

// 2. Vai trò 2: Học sinh nghiên cứu khoa học (Student Researcher / Co-author)
// Phong cách Storyset: Nữ sinh THPT năng động, kẹp tóc/đuôi ngựa, cầm sổ khảo sát N=401, kính lúp, bóng đèn ý tưởng
export function StudentResearcherIllustration({
  className = "w-full h-full",
  accent = "emerald",
}: RoleIllustrationProps & { accent?: "emerald" | "amber" }) {
  const isEmerald = accent === "emerald";
  const bgBadge = isEmerald ? "#E6F4EA" : "#FEF3C7";
  const primaryStroke = isEmerald ? "#005039" : "#D97706";
  const shirtColor = isEmerald ? "#008272" : "#D97706";

  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="80" cy="80" r="70" fill={bgBadge} fillOpacity="0.85" />
      <circle cx="45" cy="50" r="25" fill="#FFE4E6" fillOpacity="0.6" />
      <circle cx="120" cy="115" r="22" fill="#E0E7FF" fillOpacity="0.6" />

      {/* Idea Sparkle / Lightbulb floating */}
      <g transform="translate(112, 34)">
        <circle cx="12" cy="12" r="10" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
        <path d="M9 16C9 16 10 18 12 18C14 18 15 16 15 16" stroke="#CA8A04" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="12" y1="5" x2="12" y2="2" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="19" y1="8" x2="22" y2="6" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="5" y1="8" x2="2" y2="6" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Student Character */}
      {/* School Uniform / Polo Shirt */}
      <path
        d="M48 148C48 128 60 120 80 120C100 120 112 128 112 148H48Z"
        fill={shirtColor}
      />
      {/* White Collar */}
      <path d="M68 120L80 134L92 120H68Z" fill="#FFFFFF" />
      <line x1="80" y1="134" x2="80" y2="148" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

      {/* Neck */}
      <rect x="74" y="104" width="12" height="18" fill="#FBD5B5" />

      {/* Hair Behind */}
      <path
        d="M56 68C56 68 50 85 54 104C56 112 62 118 64 120H96C98 118 104 112 106 104C110 85 104 68 104 68Z"
        fill="#475569"
      />

      {/* Face */}
      <path
        d="M63 76C63 62 70 54 80 54C90 54 97 62 97 76C97 88 90 98 80 98C70 98 63 88 63 76Z"
        fill="#FBD5B5"
      />

      {/* Front Bangs / Hair Style */}
      <path
        d="M61 68C61 54 70 46 80 46C90 46 99 54 99 68C95 62 88 60 80 60C72 60 65 63 61 68Z"
        fill="#334155"
      />
      {/* Side hair locks */}
      <path d="M62 68C60 74 61 84 63 88C64 88 65 78 66 70" fill="#334155" />
      <path d="M98 68C100 74 99 84 97 88C96 88 95 78 94 70" fill="#334155" />

      {/* Eyes with cheerful spark */}
      <circle cx="72" cy="74" r="1.5" fill="#0F172A" />
      <circle cx="88" cy="74" r="1.5" fill="#0F172A" />
      <circle cx="72.5" cy="73.5" r="0.5" fill="#FFFFFF" />
      <circle cx="88.5" cy="73.5" r="0.5" fill="#FFFFFF" />

      {/* Cheerful Smile & Blush */}
      <path d="M75 84C77 87 83 87 85 84" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="68" cy="80" r="3" fill="#FDA4AF" fillOpacity="0.6" />
      <circle cx="92" cy="80" r="3" fill="#FDA4AF" fillOpacity="0.6" />

      {/* Research Clipboard / Survey Binder in front */}
      <g transform="translate(24, 98)">
        {/* Clipboard board */}
        <rect x="0" y="4" width="36" height="46" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        {/* Paper */}
        <rect x="3" y="8" width="30" height="38" fill="#FFFFFF" />
        {/* Metal clip */}
        <rect x="11" y="2" width="14" height="6" rx="1.5" fill="#94A3B8" />
        {/* Survey checklist lines */}
        <line x1="7" y1="16" x2="28" y2="16" stroke={primaryStroke} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="7" y1="22" x2="24" y2="22" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="28" x2="26" y2="28" stroke="#64748B" strokeWidth="1.2" strokeLinecap="round" />
        {/* N=401 label text stamp */}
        <rect x="6" y="33" width="22" height="9" fill={isEmerald ? "#DCFCE7" : "#FEF3C7"} />
        <path d="M8 39L10 35H12V41M15 38H19M21 35H24V41" stroke={primaryStroke} strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// 3. Vai trò 3: Kỹ thuật & Phát triển phần mềm (Software Developer / Tech Architect)
// Phong cách Storyset: Kỹ sư lập trình, đeo tai nghe, gõ code trên laptop, màn hình tag </>, chip AI kết nối
export function DeveloperIllustration({ className = "w-full h-full" }: RoleIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="80" cy="80" r="70" fill="#E0E7FF" fillOpacity="0.85" />
      <circle cx="120" cy="50" r="28" fill="#C7D2FE" fillOpacity="0.6" />
      <circle cx="40" cy="110" r="22" fill="#E6F4EA" fillOpacity="0.7" />

      {/* Floating Code Symbol Tag </> */}
      <g transform="translate(112, 34)">
        <rect x="0" y="0" width="34" height="24" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
        <path d="M8 12L12 8M8 12L12 16M26 12L22 8M26 12L22 16M18 7L16 17" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Developer Character Body */}
      {/* Hoodie / Casual Developer Wear */}
      <path
        d="M46 148C46 126 58 118 80 118C102 118 114 126 114 148H46Z"
        fill="#2563EB"
      />
      {/* Inner T-shirt */}
      <path d="M72 118C72 126 88 126 88 118H72Z" fill="#0F172A" />
      {/* Hoodie strings */}
      <line x1="74" y1="124" x2="74" y2="136" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="86" y1="124" x2="86" y2="136" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />

      {/* Neck */}
      <rect x="74" y="104" width="12" height="16" fill="#FBD5B5" />

      {/* Head */}
      <path
        d="M63 76C63 62 70 54 80 54C90 54 97 62 97 76C97 89 90 98 80 98C70 98 63 89 63 76Z"
        fill="#FBD5B5"
      />

      {/* Hair (Modern, textured) */}
      <path
        d="M62 68C62 52 70 44 80 44C91 44 98 52 98 68C94 64 88 62 82 63C75 63 68 65 62 68Z"
        fill="#1E293B"
      />
      {/* Tuft / Volume */}
      <path d="M74 44C76 40 82 40 85 43" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

      {/* Tech Headphones (Developer signature) */}
      <path
        d="M58 76C58 62 68 50 80 50C92 50 102 62 102 76"
        stroke="#475569"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Ear cups */}
      <rect x="56" y="70" width="6" height="15" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
      <rect x="98" y="70" width="6" height="15" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />

      {/* Eyes with focus look */}
      <circle cx="72" cy="74" r="1.5" fill="#0F172A" />
      <circle cx="88" cy="74" r="1.5" fill="#0F172A" />

      {/* Gentle confident smile */}
      <path d="M76 85C78 87 82 87 84 85" stroke="#C27848" strokeWidth="1.6" strokeLinecap="round" />

      {/* Laptop & Coding Screen in Foreground */}
      <g transform="translate(42, 114)">
        {/* Laptop screen open */}
        <rect x="12" y="2" width="52" height="30" rx="2" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
        {/* Screen Content (Syntax highlighted lines) */}
        <line x1="18" y1="8" x2="32" y2="8" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="8" x2="48" y2="8" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="14" x2="40" y2="14" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="20" x2="54" y2="20" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="26" x2="30" y2="26" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        {/* Laptop base / keyboard */}
        <path d="M6 32L70 32L64 35H12L6 32Z" fill="#64748B" />
        {/* Glowing touch pad */}
        <rect x="33" y="32" width="10" height="2" fill="#38BDF8" />
      </g>
    </svg>
  );
}
