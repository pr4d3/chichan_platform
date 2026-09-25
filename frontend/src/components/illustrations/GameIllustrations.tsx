import React from "react";

interface GameIllustrationProps {
  className?: string;
}

// =========================================================================
// BỘ ẢNH MINH HỌA GAME PHONG CÁCH STORYSET / UNDRAW (ĐỒNG BỘ TRANG CHỦ)
// Ưu tiên ICON TRỰC QUAN TO RÕ thay cho chữ bé, tỉ lệ hình thể nhân vật lớn,
// sắc nét, không bị vỡ chữ khi co giãn ở mọi độ phân giải.
// =========================================================================

// 1. ROOM_STRANGER: Kẻ ẩn danh & Ranh giới an toàn
// Storyset: Học sinh kiên quyết giơ tay tạo ranh giới "Dừng lại ✋", chiếc khiên bảo mật rực sáng chặn đứng kết nối/quà dụ dỗ
export function StrangerSafetyIllustration({
  className = "w-full h-full",
}: GameIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="160" cy="85" r="75" fill="#FFE4E6" fillOpacity="0.75" />
      <circle cx="215" cy="50" r="35" fill="#FEF3C7" fillOpacity="0.8" />
      <circle cx="95" cy="115" r="28" fill="#E6F4EA" fillOpacity="0.8" />

      {/* Floating Sparkles & Stars */}
      <circle cx="65" cy="40" r="3.5" fill="#E11D48" fillOpacity="0.4" />
      <circle cx="255" cy="105" r="3" fill="#D97706" fillOpacity="0.5" />
      <path
        d="M245 32L246.5 36.5L251 38L246.5 39.5L245 44L243.5 39.5L239 38L243.5 36.5L245 32Z"
        fill="#F59E0B"
      />

      {/* Ground / Desk Base */}
      <rect x="35" y="148" width="250" height="6" rx="3" fill="#FECDD3" />

      {/* Student Character (Left - Sitting & Setting Boundary) */}
      <g transform="translate(62, 42)">
        {/* Torso / Shirt (ChiChan Emerald) */}
        <path
          d="M10 106C10 82 24 74 42 74C60 74 74 82 74 106H10Z"
          fill="#008272"
        />
        {/* White Collar */}
        <path d="M35 74L42 85L49 74H35Z" fill="#FFFFFF" />

        {/* Neck */}
        <rect x="38" y="60" width="8" height="16" fill="#FBD5B5" />

        {/* Head */}
        <circle cx="42" cy="42" r="20" fill="#FBD5B5" />

        {/* Hair (Youthful, modern student bangs) */}
        <path
          d="M24 38C24 22 33 16 42 16C52 16 60 22 60 38C55 33 49 31 42 31C34 31 28 34 24 38Z"
          fill="#1E293B"
        />

        {/* Face features: confident smile & eyes */}
        <circle cx="36" cy="40" r="1.5" fill="#1E293B" />
        <circle cx="48" cy="40" r="1.5" fill="#1E293B" />
        <path
          d="M39 48C41 50.5 44 50.5 46 48"
          stroke="#C27848"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Hand Raised in Confident "Stop / Boundary" Gesture (✋) */}
        <g transform="translate(68, 48)">
          <path
            d="M5 14V2C5 0.9 5.9 0 7 0C8.1 0 9 0.9 9 2V11M9 2C9 0.9 9.9 0 11 0C12.1 0 13 0.9 13 2V11M13 4C13 2.9 13.9 2 15 2C16.1 2 17 2.9 17 4V13C17 20 10 26 4 26"
            fill="#FBD5B5"
            stroke="#C27848"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Big Protective Boundary Shield (Center - Standing tall) */}
      <g transform="translate(136, 32)">
        <path
          d="M26 2L50 11C50 34 36 54 26 60C16 54 2 34 2 11L26 2Z"
          fill="#005039"
          stroke="#FFFFFF"
          strokeWidth="3"
          filter="drop-shadow(0 4px 10px rgba(0,80,57,0.3))"
        />
        {/* Inner Shield Layer */}
        <path
          d="M26 7L44 14C44 32 32 48 26 53C20 48 8 32 8 14L26 7Z"
          fill="#008272"
        />
        {/* Large Prominent Padlock Icon in Shield */}
        <g transform="translate(16, 21)">
          {/* Shackle */}
          <path
            d="M5 10V5C5 2.2 7.2 0 10 0C12.8 0 15 2.2 15 5V10"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          {/* Lock Body */}
          <rect x="1" y="9" width="18" height="14" rx="3" fill="#FFFFFF" />
          <circle cx="10" cy="15" r="2" fill="#005039" />
          <path d="M10 16V19" stroke="#005039" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>

      {/* Online Stranger / Phone Bait (Right Side) */}
      <g transform="translate(196, 30)">
        {/* Smartphone Body */}
        <rect
          x="10"
          y="4"
          width="68"
          height="114"
          rx="12"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="2.5"
          filter="drop-shadow(0 4px 8px rgba(15,23,42,0.15))"
        />
        <rect x="14" y="10" width="60" height="102" rx="8" fill="#FFFFFF" />
        {/* Top Speaker bar */}
        <rect x="33" y="6" width="22" height="2.5" rx="1" fill="#64748B" />

        {/* Suspicious Chat Bubble with Gift Icon */}
        <g transform="translate(18, 20)">
          <rect
            width="52"
            height="32"
            rx="8"
            fill="#FEE2E2"
            stroke="#FECDD3"
            strokeWidth="1.2"
          />
          {/* Gift Box Icon (🎁) */}
          <g transform="translate(8, 8)">
            <rect x="0" y="4" width="15" height="11" rx="2" fill="#EF4444" />
            <rect x="-1" y="2" width="17" height="3" rx="1" fill="#DC2626" />
            <line x1="7.5" y1="2" x2="7.5" y2="15" stroke="#FDE68A" strokeWidth="2" />
            <line x1="-1" y1="7" x2="16" y2="7" stroke="#FDE68A" strokeWidth="1.5" />
          </g>
          {/* Suspicious Message lines */}
          <line
            x1="28"
            y1="12"
            x2="46"
            y2="12"
            stroke="#DC2626"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <line
            x1="28"
            y1="19"
            x2="42"
            y2="19"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* Big Stop / Block Icon (🚫) */}
        <g transform="translate(32, 60)">
          <circle cx="16" cy="16" r="15" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
          <path
            d="M11 11L21 21M21 11L11 21"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>

        {/* Safe Green Shield Tag Icon at Phone Bottom */}
        <g transform="translate(30, 96)">
          <circle cx="8" cy="8" r="7" fill="#10B981" />
          <path
            d="M5 8L7 10L11 6"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}

// 2. ROOM_SEXTORTION: Ứng phó tống tiền mạng
// Storyset: Học sinh bình tĩnh trước laptop, chú Robot ChiChan trợ lực với cặp icon TO: Khóa bằng chứng 📁✔️ & Hotline 📞 111
export function SextortionResponseIllustration({
  className = "w-full h-full",
}: GameIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="160" cy="85" r="75" fill="#FEF3C7" fillOpacity="0.75" />
      <circle cx="105" cy="50" r="35" fill="#E6F4EA" fillOpacity="0.8" />
      <circle cx="230" cy="115" r="30" fill="#FEE2E2" fillOpacity="0.6" />

      {/* Decorative Sparkles */}
      <circle cx="55" cy="35" r="3.5" fill="#D97706" fillOpacity="0.5" />
      <circle cx="265" cy="45" r="3.5" fill="#EF4444" fillOpacity="0.4" />

      {/* Desk Base */}
      <rect x="35" y="148" width="250" height="6" rx="3" fill="#FDE68A" />

      {/* Student Sitting Calmly at Laptop (Left) */}
      <g transform="translate(52, 48)">
        {/* Torso */}
        <path
          d="M10 100C10 78 22 70 40 70C58 70 70 78 70 100H10Z"
          fill="#3B82F6"
        />
        {/* White Collar */}
        <path d="M34 70L40 80L46 70H34Z" fill="#FFFFFF" />
        {/* Neck */}
        <rect x="36" y="58" width="8" height="14" fill="#FBD5B5" />
        {/* Head */}
        <circle cx="40" cy="40" r="19" fill="#FBD5B5" />
        {/* Hair */}
        <path
          d="M23 38C23 21 31 15 40 15C50 15 57 21 57 38C52 32 46 30 40 30C32 30 26 33 23 38Z"
          fill="#334155"
        />
        {/* Calm expression */}
        <circle cx="36" cy="38" r="1.4" fill="#0F172A" />
        <circle cx="46" cy="38" r="1.4" fill="#0F172A" />
        <path
          d="M38 46C40 47.5 42 47.5 44 46"
          stroke="#C27848"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Laptop on Desk with Green Security Shield */}
        <g transform="translate(52, 60)">
          {/* Laptop Screen */}
          <rect
            x="0"
            y="0"
            width="46"
            height="32"
            rx="4"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="2"
          />
          <rect x="3" y="3" width="40" height="26" rx="2" fill="#F8FAFC" />
          {/* Big Security Checkmark Icon on Screen */}
          <circle cx="23" cy="16" r="8" fill="#10B981" />
          <path
            d="M19 16L22 19L27 13"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Laptop Base */}
          <path
            d="M-6 32H52L48 36H-2L-6 32Z"
            fill="#94A3B8"
            stroke="#0F172A"
            strokeWidth="1.6"
          />
        </g>
      </g>

      {/* Friendly ChiChan AI Robot Companion (Center Right) */}
      <g transform="translate(172, 45)">
        {/* Antenna */}
        <line
          x1="32"
          y1="2"
          x2="32"
          y2="10"
          stroke="#B45309"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="32" cy="2" r="3.5" fill="#D97706" />

        {/* Robot Head */}
        <rect
          x="10"
          y="10"
          width="44"
          height="34"
          rx="11"
          fill="#FFFFFF"
          stroke="#B45309"
          strokeWidth="2.2"
        />
        {/* Robot Face Screen */}
        <rect x="16" y="16" width="32" height="21" rx="7" fill="#005039" />
        {/* Glowing Smiling Eyes */}
        <circle cx="25" cy="25" r="2.5" fill="#34D399" />
        <circle cx="39" cy="25" r="2.5" fill="#34D399" />
        <path
          d="M29 31C31 33 35 33 37 31"
          stroke="#34D399"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Robot Body */}
        <rect
          x="14"
          y="48"
          width="36"
          height="32"
          rx="9"
          fill="#F59E0B"
          stroke="#B45309"
          strokeWidth="2"
        />
        <circle cx="32" cy="64" r="6" fill="#FFFFFF" />
        <circle cx="32" cy="64" r="3" fill="#D97706" />
      </g>

      {/* Right Column: Prominent Visual Icons (No Tiny Broken Text!) */}
      <g transform="translate(230, 26)">
        {/* 1. Large Evidence Vault Folder Icon with Big Green Checkmark */}
        <g>
          <rect
            width="56"
            height="44"
            rx="7"
            fill="#FFFFFF"
            stroke="#F59E0B"
            strokeWidth="2.2"
            filter="drop-shadow(0 4px 8px rgba(217,119,6,0.2))"
          />
          {/* Folder Tab */}
          <path d="M6 10H22L27 16H50V38H6V10Z" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
          {/* Big Checkmark Circle Icon */}
          <circle cx="28" cy="24" r="10" fill="#10B981" />
          <path
            d="M24 24L27 27L33 21"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 2. Hotline 111 Emergency Badge (Large, Bold, High Contrast & Clear Phone Icon) */}
        <g transform="translate(-2, 54)">
          <rect
            width="60"
            height="26"
            rx="13"
            fill="#DC2626"
            filter="drop-shadow(0 3px 6px rgba(220,38,38,0.35))"
          />
          {/* Clean Phone Receiver Icon (📞) */}
          <g transform="translate(10, 7)">
            <path
              d="M1.5 1.5C1.5 1.5 3 4.5 4 4.5C4.8 4.5 5.5 3.5 6.5 4.5C7.5 5.5 6.5 6.2 6.5 7C6.5 8 9.5 9.5 9.5 9.5"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          {/* Bold, Crisp "111" Text (Big font, unmistakable) */}
          <text
            x="38"
            y="18"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="12.5"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1"
          >
            111
          </text>
        </g>
      </g>
    </svg>
  );
}

// 3. ROOM_DOCTOR: Bác sĩ tư vấn dậy thì & SKSS
// Storyset: Bác sĩ y khoa thân thiện, hồ sơ y khoa với Chữ Thập Y Tế TO ➕, Biểu đồ tăng trưởng 📈 và Trái Tim ❤️
export function DoctorConsultationIllustration({
  className = "w-full h-full",
}: GameIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="160" cy="85" r="75" fill="#E6F4EA" fillOpacity="0.75" />
      <circle cx="220" cy="50" r="35" fill="#C2E7FF" fillOpacity="0.5" />
      <circle cx="95" cy="115" r="28" fill="#FEF7E0" fillOpacity="0.8" />

      {/* Decorative Dots / Sparks */}
      <circle cx="70" cy="45" r="3.5" fill="#005039" fillOpacity="0.4" />
      <circle cx="255" cy="105" r="3" fill="#008272" fillOpacity="0.5" />
      <circle cx="160" cy="20" r="3" fill="#D97706" fillOpacity="0.5" />

      {/* Desk Base */}
      <rect x="35" y="148" width="250" height="6" rx="3" fill="#D1E7DD" />

      {/* Friendly Female Doctor (BS. Minh Trang - Center Left) */}
      <g transform="translate(80, 36)">
        {/* Doctor White Coat */}
        <path
          d="M16 112C16 84 32 74 54 74C76 74 92 84 92 112H16Z"
          fill="#FFFFFF"
          stroke="#005039"
          strokeWidth="2.5"
        />
        {/* Inner Shirt (Emerald) */}
        <path d="M46 74L54 88L62 74H46Z" fill="#008272" />

        {/* Stethoscope */}
        <path
          d="M44 74C44 88 47 97 54 97C61 97 64 88 64 74"
          stroke="#1E293B"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="54"
          cy="100"
          r="4"
          fill="#005039"
          stroke="#FFFFFF"
          strokeWidth="1.2"
        />

        {/* Neck */}
        <rect x="49" y="62" width="10" height="15" fill="#FBD5B5" />

        {/* Head */}
        <circle cx="54" cy="42" r="21" fill="#FBD5B5" />

        {/* Hair (Professional bun / doctor style) */}
        <path
          d="M35 38C35 22 43 15 54 15C65 15 73 22 73 38C69 33 62 30 54 30C45 30 39 33 35 38Z"
          fill="#1E293B"
        />
        {/* Bun on top */}
        <circle cx="54" cy="13" r="8.5" fill="#1E293B" />

        {/* Doctor Glasses (Distinctive & Warm) */}
        <rect
          x="41"
          y="38"
          width="11"
          height="9"
          rx="2.5"
          stroke="#005039"
          strokeWidth="1.8"
          fill="#FFFFFF"
          fillOpacity="0.4"
        />
        <rect
          x="57"
          y="38"
          width="11"
          height="9"
          rx="2.5"
          stroke="#005039"
          strokeWidth="1.8"
          fill="#FFFFFF"
          fillOpacity="0.4"
        />
        <line
          x1="52"
          y1="42"
          x2="57"
          y2="42"
          stroke="#005039"
          strokeWidth="1.8"
        />

        {/* Eyes & Warm Smile */}
        <circle cx="46.5" cy="42" r="1.3" fill="#0F172A" />
        <circle cx="62.5" cy="42" r="1.3" fill="#0F172A" />
        <path
          d="M50 51C52.5 53.5 55.5 53.5 58 51"
          stroke="#C27848"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Prominent Medical Health Clipboard (Right Side - Replaced Tiny Text with Big Icons) */}
      <g transform="translate(182, 36)">
        {/* Clipboard Body */}
        <rect
          width="78"
          height="104"
          rx="9"
          fill="#FFFFFF"
          stroke="#005039"
          strokeWidth="2.4"
          filter="drop-shadow(0 4px 10px rgba(0,80,57,0.15))"
        />
        {/* Clip at top */}
        <rect x="24" y="-5" width="30" height="10" rx="3" fill="#005039" />
        <circle cx="39" cy="0" r="1.5" fill="#FFFFFF" />

        {/* Big Medical Cross Badge (➕) */}
        <g transform="translate(26, 14)">
          <circle cx="13" cy="13" r="12" fill="#D1FAE5" />
          <path
            d="M13 7V19M7 13H19"
            stroke="#059669"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>

        {/* Growth Metric Chart with Upward Arrow (📈) */}
        <g transform="translate(14, 46)">
          <rect x="0" y="0" width="50" height="5" rx="2.5" fill="#E2E8F0" />
          <rect x="0" y="0" width="38" height="5" rx="2.5" fill="#10B981" />

          <rect x="0" y="11" width="50" height="5" rx="2.5" fill="#E2E8F0" />
          <rect x="0" y="11" width="46" height="5" rx="2.5" fill="#059669" />

          <rect x="0" y="22" width="50" height="5" rx="2.5" fill="#E2E8F0" />
          <rect x="0" y="22" width="30" height="5" rx="2.5" fill="#34D399" />
        </g>

        {/* Health Heart Badge (❤️) at Bottom */}
        <g transform="translate(26, 78)">
          <circle cx="13" cy="11" r="11" fill="#FEE2E2" />
          <path
            d="M13 7C11.5 5 8.5 5 7 7C5 9.5 8 13.5 13 16.5C18 13.5 21 9.5 19 7C17.5 5 14.5 5 13 7Z"
            fill="#EF4444"
          />
        </g>
      </g>

      {/* Floating Botanical Health Leaf */}
      <path
        d="M55 60C55 60 67 64 69 74C69 84 59 87 59 87C59 87 60 76 55 60Z"
        fill="#34A853"
      />
    </svg>
  );
}

// 4. ROOM_TEEN_CHILD: Cầu nối đối thoại cùng con
// Storyset: Cha/Mẹ và con tuổi dậy thì ngồi đối thoại thấu cảm, Trái Tim Đối Thoại TO ❤️ ở trung tâm
export function FamilyDialogueIllustration({
  className = "w-full h-full",
}: GameIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="160" cy="85" r="75" fill="#EEF2FF" fillOpacity="0.8" />
      <circle cx="230" cy="50" r="35" fill="#DDD6FE" fillOpacity="0.5" />
      <circle cx="90" cy="115" r="30" fill="#FEF3C7" fillOpacity="0.7" />

      {/* Floor Base */}
      <rect x="35" y="148" width="250" height="6" rx="3" fill="#C7D2FE" />

      {/* Parent Figure (Left - Larger, Welcoming) */}
      <g transform="translate(60, 42)">
        {/* Torso */}
        <path
          d="M10 106C10 80 26 72 46 72C66 72 82 80 82 106H10Z"
          fill="#4F46E5"
        />
        {/* Collar */}
        <path d="M40 72L46 83L52 72H40Z" fill="#FFFFFF" />
        {/* Neck */}
        <rect x="42" y="58" width="8" height="16" fill="#FBD5B5" />
        {/* Head */}
        <circle cx="46" cy="40" r="20" fill="#FBD5B5" />
        {/* Hair */}
        <path
          d="M28 38C28 22 37 16 46 16C56 16 63 22 63 38C59 33 52 31 46 31C37 31 32 34 28 38Z"
          fill="#1E1B4B"
        />
        {/* Caring eyes & gentle smile */}
        <circle cx="42" cy="38" r="1.5" fill="#1E1B4B" />
        <circle cx="52" cy="38" r="1.5" fill="#1E1B4B" />
        <path
          d="M44 47C46 49.5 48.5 49.5 50.5 47"
          stroke="#C27848"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>

      {/* Central Dialogue Connection: Large Heart-in-Speech-Bubble (TO RÕ, RỰC RỠ) */}
      <g transform="translate(134, 34)">
        <rect
          width="52"
          height="42"
          rx="12"
          fill="#FFFFFF"
          stroke="#6366F1"
          strokeWidth="2.5"
          filter="drop-shadow(0 4px 10px rgba(99,102,241,0.25))"
        />
        {/* Speech Bubble Tail */}
        <path d="M20 42L14 49V42H20Z" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2" />
        {/* Big Pink Heart Icon (❤️) */}
        <path
          d="M26 18C24 14.5 19.5 14.5 17.5 17C15 20.5 18.5 25.5 26 30.5C33.5 25.5 37 20.5 34.5 17C32.5 14.5 28 14.5 26 18Z"
          fill="#EC4899"
        />
      </g>

      {/* Active Listening Sound Waves Between Parent & Teen */}
      <path
        d="M122 104C134 98 146 98 158 104"
        stroke="#818CF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M164 104C176 98 188 98 200 104"
        stroke="#818CF8"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Teen Child Figure (Right - Attentive & Reassured) */}
      <g transform="translate(186, 48)">
        {/* Torso (ChiChan Teal Hoodie) */}
        <path
          d="M10 100C10 78 24 70 42 70C60 70 74 78 74 100H10Z"
          fill="#008272"
        />
        {/* Hoodie Strings */}
        <line
          x1="38"
          y1="70"
          x2="36"
          y2="82"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="46"
          y1="70"
          x2="48"
          y2="82"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Neck */}
        <rect x="38" y="58" width="8" height="14" fill="#FBD5B5" />
        {/* Head */}
        <circle cx="42" cy="40" r="19" fill="#FBD5B5" />
        {/* Teen Bangs */}
        <path
          d="M26 38C26 21 34 16 42 16C51 16 58 21 58 38C55 32 48 30 42 30C35 30 30 33 26 38Z"
          fill="#334155"
        />
        {/* Attentive eyes */}
        <circle cx="38" cy="38" r="1.4" fill="#0F172A" />
        <circle cx="48" cy="38" r="1.4" fill="#0F172A" />
        <path
          d="M40 46C42 47.5 44 47.5 46 46"
          stroke="#C27848"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// 5. ROOM_BULLYING: Chống kỳ thị & Bắt nạt học đường
// Storyset: Hai bạn khoác vai sát cánh, Khiên Tình Bạn TO 🛡️❤️ & Huy hiệu Bàn Tay / Huy Chương Đoàn Kết
export function AntiBullyingIllustration({
  className = "w-full h-full",
}: GameIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow Circles */}
      <circle cx="160" cy="85" r="75" fill="#CCFBF1" fillOpacity="0.75" />
      <circle cx="220" cy="50" r="35" fill="#FEF3C7" fillOpacity="0.75" />
      <circle cx="95" cy="115" r="30" fill="#E6F4EA" fillOpacity="0.8" />

      {/* Decorative Sparkles */}
      <circle cx="55" cy="40" r="3.5" fill="#0D9488" fillOpacity="0.4" />
      <circle cx="265" cy="100" r="3" fill="#F59E0B" fillOpacity="0.5" />
      <path
        d="M250 32L251.5 36.5L256 38L251.5 39.5L250 44L248.5 39.5L244 38L248.5 36.5L250 32Z"
        fill="#0D9488"
      />

      {/* Floor Base */}
      <rect x="35" y="148" width="250" height="6" rx="3" fill="#99F6E4" />

      {/* Two Supportive Friends (Center) */}
      <g transform="translate(82, 38)">
        {/* Friend 1 (Left - Standing Strong & Comforting) */}
        <g>
          {/* Torso */}
          <path
            d="M10 110C10 84 24 74 44 74C64 74 76 84 76 110H10Z"
            fill="#0F766E"
          />
          {/* Collar */}
          <path d="M38 74L44 85L50 74H38Z" fill="#FFFFFF" />
          {/* Neck */}
          <rect x="40" y="60" width="8" height="16" fill="#FBD5B5" />
          {/* Head */}
          <circle cx="44" cy="41" r="20" fill="#FBD5B5" />
          {/* Hair */}
          <path
            d="M26 39C26 23 35 17 44 17C54 17 62 23 62 39C57 34 50 32 44 32C35 32 30 35 26 39Z"
            fill="#134E4A"
          />
          {/* Gentle Smile */}
          <circle cx="40" cy="39" r="1.4" fill="#134E4A" />
          <circle cx="50" cy="39" r="1.4" fill="#134E4A" />
          <path
            d="M42 47C44 49.5 46.5 49.5 48.5 47"
            stroke="#C27848"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Friend 2 (Right - Receiving Comfort & Standing Tall) */}
        <g transform="translate(56, 8)">
          {/* Torso (Warm Amber) */}
          <path
            d="M10 102C10 78 22 70 40 70C58 70 70 78 70 102H10Z"
            fill="#F59E0B"
          />
          {/* Collar */}
          <path d="M34 70L40 81L46 70H34Z" fill="#FFFFFF" />
          {/* Neck */}
          <rect x="36" y="58" width="8" height="14" fill="#FBD5B5" />
          {/* Head */}
          <circle cx="40" cy="40" r="19" fill="#FBD5B5" />
          {/* Hair */}
          <path
            d="M24 38C24 22 32 17 40 17C49 17 56 22 56 38C52 33 46 31 40 31C33 31 28 34 24 38Z"
            fill="#78350F"
          />
          {/* Reassured eyes */}
          <circle cx="36" cy="38" r="1.4" fill="#78350F" />
          <circle cx="45" cy="38" r="1.4" fill="#78350F" />
          <path
            d="M38 46C40 47.5 42 47.5 44 46"
            stroke="#C27848"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* Arm Around Shoulder of Friend (Solidarity) */}
        <path
          d="M54 86C66 80 80 80 88 88"
          stroke="#0F766E"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Floating Protective Shield of Friendship (Right Side - Large & Bold) */}
      <g transform="translate(210, 28)">
        <path
          d="M24 2L46 10C46 32 33 50 24 56C15 50 2 32 2 10L24 2Z"
          fill="#0D9488"
          stroke="#FFFFFF"
          strokeWidth="3"
          filter="drop-shadow(0 4px 10px rgba(13,148,136,0.3))"
        />
        {/* Heart of Empathy inside Shield (❤️) */}
        <path
          d="M24 20C22 16.5 18 16.5 16 19C13.5 22.5 17 27.5 24 32.5C31 27.5 34.5 22.5 32 19C30 16.5 26 16.5 24 20Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Solidarity Ribbon / Anti-Bullying Badge (Left Floating - Replaced Tiny Text with Big Ribbon Icon) */}
      <g transform="translate(38, 50)">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="#FFFFFF"
          stroke="#0D9488"
          strokeWidth="2"
          filter="drop-shadow(0 3px 6px rgba(13,148,136,0.15))"
        />
        {/* Big Green Checkmark Icon (✔️) */}
        <path
          d="M11 18L16 23L25 13"
          stroke="#0D9488"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// Fallback illustration
export function GeneralGameIllustration({
  className = "w-full h-full",
}: GameIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="160" cy="85" r="75" fill="#E6F4EA" />
      <rect x="35" y="148" width="250" height="6" rx="3" fill="#D1E7DD" />
      <circle cx="160" cy="80" r="28" fill="#005039" />
      <path d="M152 70L172 80L152 90V70Z" fill="#FFFFFF" />
    </svg>
  );
}

// Helper to get illustration by room code
export function getGameIllustration(roomCode: string, className?: string) {
  switch (roomCode) {
    case "ROOM_STRANGER":
      return <StrangerSafetyIllustration className={className} />;
    case "ROOM_SEXTORTION":
      return <SextortionResponseIllustration className={className} />;
    case "ROOM_DOCTOR":
      return <DoctorConsultationIllustration className={className} />;
    case "ROOM_TEEN_CHILD":
      return <FamilyDialogueIllustration className={className} />;
    case "ROOM_BULLYING":
      return <AntiBullyingIllustration className={className} />;
    default:
      return <GeneralGameIllustration className={className} />;
  }
}
