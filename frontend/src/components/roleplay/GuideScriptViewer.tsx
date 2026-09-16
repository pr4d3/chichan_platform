"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Trophy,
  CaretDown,
  CaretUp,
  Info,
  Lightning,
  Sparkle,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui";

interface HighlightItem {
  type: "DO" | "DONT";
  text: string;
}

interface StepItem {
  step: string;
  tag: string;
  title: string;
  description: string;
  highlights: HighlightItem[];
}

interface ScenarioJourneyData {
  illustrationUrl: string;
  badge: string;
  title: string;
  summary: string;
  steps: StepItem[];
  winCondition: string;
}

const SCENARIO_JOURNEY_DATA: Record<string, ScenarioJourneyData> = {
  ROOM_STRANGER: {
    illustrationUrl: "/images/roleplay/guides/cyber-shield.jpg",
    badge: "🛡️ HÀNH TRÌNH 3 BƯỚC PHÒNG THỦ MẠNG",
    title: "Tỉnh táo nhận diện & bẻ gãy bẫy làm quen qua mạng",
    summary:
      "Đối phương dùng chiêu bài khen ngợi ngọt ngào, dò hỏi đời tư và gạ gẫm gặp mặt bí mật.",
    steps: [
      {
        step: "01",
        tag: "BẬT RADAR CẢNH GIÁC",
        title: "Nhận Diện Bẫy Tiếp Cận",
        description:
          "Cảnh giác ngay khi người lạ khen ngợi quá đà, gửi tin nhắn dồn dập nhằm tạo sự thân thiết bất thường.",
        highlights: [
          { type: "DO", text: "Tự hỏi: Vì sao người lạ lại quan tâm đặc biệt đến mình?" },
          { type: "DO", text: "Giữ tâm lý vững vàng trước những lời tâng bốc nịnh nọt" },
          { type: "DONT", text: "Không vội tin tưởng người mới quen qua mạng xã hội" },
        ],
      },
      {
        step: "02",
        tag: "KÍCH HOẠT TƯỜNG LỬA",
        title: "Khóa Kín Tọa Độ & Đời Tư",
        description:
          "Thiết lập ranh giới bảo mật tuyệt đối cho mọi thông tin cá nhân của bạn và gia đình.",
        highlights: [
          { type: "DO", text: "Giữ kín tên trường, lớp học, địa chỉ nhà, số điện thoại" },
          { type: "DO", text: "Chỉ chia sẻ những thông tin học tập công khai, vô hại" },
          { type: "DONT", text: "CẤM gửi bất kỳ ảnh cá nhân hoặc ảnh riêng tư nào" },
        ],
      },
      {
        step: "03",
        tag: "PHẢN XẠ QUYẾT ĐOÁN",
        title: "Từ Chối Thẳng & Cầu Cứu",
        description:
          "Nói KHÔNG dứt khoát trước mọi lời rủ rê đi chơi riêng, kích hoạt hệ thống bảo vệ từ người lớn.",
        highlights: [
          { type: "DO", text: "Từ chối dứt khoát khi bị rủ đi trà sữa, xem phim riêng" },
          { type: "DO", text: "Chặn nick ngay khi đối phương quấy rầy, nài nỉ" },
          { type: "DO", text: "Kể ngay cho cha mẹ hoặc thầy cô để được bảo vệ kịp thời" },
        ],
      },
    ],
    winCondition: "Giữ trọn bí mật + Từ chối gặp riêng ➔ Đạt 80+ Điểm Chiến Thắng!",
  },
  ROOM_SEXTORTION: {
    illustrationUrl: "/images/roleplay/guides/sos-emergency.jpg",
    badge: "🚨 HÀNH TRÌNH 3 BƯỚC KHẨN CẤP ĐỐI ĐẦU TỐNG TIỀN",
    title: "Bình tĩnh đóng băng kẻ xấu & tìm kiếm sự trợ giúp an toàn",
    summary:
      "Kẻ xấu dọa tung ảnh riêng tư, dùng áp lực tâm lý ép chuyển tiền hoặc bắt đi gặp mặt một mình.",
    steps: [
      {
        step: "01",
        tag: "ĐÓNG BĂNG TÂM LÝ",
        title: "Không Hoảng Loạn, Cấm Chuyển Tiền",
        description:
          "Hít thở sâu, kẻ xấu chỉ đang dùng đòn tâm lý hù dọa để chiếm thế thượng phong.",
        highlights: [
          { type: "DO", text: "Ghi nhớ: Bạn là nạn nhân vô tội, kẻ tống tiền mới phạm pháp" },
          { type: "DONT", text: "TUYỆT ĐỐI KHÔNG chuyển tiền (chuyển 1 lần sẽ bị tống tiếp)" },
          { type: "DONT", text: "CẤM đi gặp mặt kẻ xấu ở bất cứ đâu một mình" },
        ],
      },
      {
        step: "02",
        tag: "KHÓA CHỨNG CỨ",
        title: "Lưu Giữ Toàn Bộ Bằng Chứng",
        description:
          "Khóa chặt mọi dữ liệu của kẻ tống tiền trước khi hắn kịp thu hồi tin nhắn hoặc xóa nick.",
        highlights: [
          { type: "DO", text: "Chụp màn hình toàn bộ tin nhắn tống tiền, đe dọa" },
          { type: "DO", text: "Lưu link trang cá nhân, số tài khoản ngân hàng của kẻ xấu" },
          { type: "DONT", text: "Không đôi co, khiêu khích hay chửi bới kẻ tống tiền" },
        ],
      },
      {
        step: "03",
        tag: "KÍCH HOẠT CHI VIỆN",
        title: "Mở Khóa Cơ Quan Bảo Vệ",
        description:
          "Đưa vụ việc ra ánh sáng để cha mẹ, nhà trường và pháp luật bảo vệ bạn 24/7.",
        highlights: [
          { type: "DO", text: "Dũng cảm tâm sự ngay với cha mẹ hoặc thầy cô tin cậy" },
          { type: "DO", text: "Gọi Tổng đài Quốc gia 111 (Bảo vệ trẻ em, miễn phí 24/7)" },
          { type: "DONT", text: "Không giấu kín chịu đựng một mình trong sợ hãi" },
        ],
      },
    ],
    winCondition: "Không thỏa hiệp + Báo ngay cơ quan bảo vệ ➔ Đạt 80+ Điểm Bản Lĩnh!",
  },
  ROOM_DOCTOR: {
    illustrationUrl: "/images/roleplay/guides/doctor-health.jpg",
    badge: "🩺 HÀNH TRÌNH 3 BƯỚC KHÁM BÍ MẬT TUỔI DẬY THÌ",
    title: "Cởi mở giãi bày cùng Bác sĩ & thực hành vệ sinh khoa học",
    summary:
      "Phòng khám tư vấn kín đáo: Giải tỏa mọi băn khoăn về sinh lý và chăm sóc cơ thể tuổi mới lớn.",
    steps: [
      {
        step: "01",
        tag: "CHUẨN BỊ TÂM LÝ",
        title: "Bình Thường Hóa Mọi Biến Đổi",
        description:
          "Cơ thể dậy thì biến đổi là quy luật tự nhiên của sự trưởng thành, không có gì phải xấu hổ.",
        highlights: [
          { type: "DO", text: "Hiểu rằng bạn bè cùng trang lứa ai cũng trải qua biến đổi này" },
          { type: "DO", text: "Sẵn sàng đón nhận thay đổi của cơ thể một cách tích cực" },
          { type: "DONT", text: "Không tự ti, mặc cảm hay trốn tránh trước bác sĩ" },
        ],
      },
      {
        step: "02",
        tag: "MÔ TẢ TRIỆU CHỨNG",
        title: "Hỏi Thẳng Thắn & Chi Tiết",
        description:
          "Chia sẻ cụ thể các triệu chứng bạn đang băn khoăn để bác sĩ hướng dẫn chính xác nhất.",
        highlights: [
          { type: "DO", text: "Kể rõ về mụn trứng cá, mùi cơ thể, vỡ giọng, ngực phát triển" },
          { type: "DO", text: "Thoải mái hỏi về chu kỳ kinh nguyệt, mộng tinh, vệ sinh" },
          { type: "DO", text: "Bác sĩ Minh Trang cam kết giữ bảo mật thông tin 100%" },
        ],
      },
      {
        step: "03",
        tag: "CHĂM SÓC CHUẨN MỰC",
        title: "Thực Hành Vệ Sinh Y Khoa",
        description:
          "Áp dụng thói quen sinh hoạt và vệ sinh cơ thể lành mạnh, chuẩn y khoa mỗi ngày.",
        highlights: [
          { type: "DO", text: "Giữ cơ thể và đồ lót khô thoáng, giặt phơi dưới nắng" },
          { type: "DONT", text: "CẤM tự ý mua thuốc bôi/uống không rõ nguồn gốc" },
          { type: "DONT", text: "Không làm theo các mẹo truyền miệng trôi nổi trên mạng" },
        ],
      },
    ],
    winCondition: "Cởi mở chia sẻ + Tiếp thu lời khuyên y khoa ➔ Đạt 80+ Điểm Cởi Mở!",
  },
  ROOM_TEEN_CHILD: {
    illustrationUrl: "/images/roleplay/guides/family-talk.jpg",
    badge: "💬 HÀNH TRÌNH 3 BƯỚC CẦU NỐI THẤU HIỂU CÙNG CON",
    title: "Lắng nghe con như một người bạn lớn, không phán xét",
    summary:
      "Dành cho phụ huynh: Con trai 14 tuổi đang nhạy cảm, dễ tự ái khi nhắc chuyện bạn bè.",
    steps: [
      {
        step: "01",
        tag: "TẠO KHÔNG GIAN",
        title: "Không Khí Thân Mật, Gần Gũi",
        description:
          "Chọn thời điểm thích hợp và giữ không khí thoải mái, không đặt con vào thế bị xét hỏi.",
        highlights: [
          { type: "DO", text: "Tâm sự khi con đang vui vẻ hoặc cùng làm việc con thích" },
          { type: "DO", text: "Tôn trọng không gian và tâm lý muốn khẳng định mình lớn" },
          { type: "DONT", text: "KHÔNG tra khảo dồn dập hay lục lọi tin nhắn của con" },
        ],
      },
      {
        step: "02",
        tag: "KẾT NỐI ĐỒNG CẢM",
        title: "Lắng Nghe 80% & Kể Chuyện Xưa",
        description:
          "Để con giãi bày hết tâm sự, dùng trải nghiệm tuổi học trò của bố mẹ để đồng cảm.",
        highlights: [
          { type: "DO", text: "Lắng nghe chăm chú, không vội ngắt lời hay chụp mũ con" },
          { type: "DO", text: "Kể chuyện thời tuổi teen của bố mẹ cũng từng rung động ra sao" },
          { type: "DONT", text: "Tuyệt đối không so sánh con với người khác" },
        ],
      },
      {
        step: "03",
        tag: "ĐỊNH HƯỚNG VĂN MINH",
        title: "Thống Nhất Ranh Giới An Toàn",
        description:
          "Cùng con thảo luận về giới hạn an toàn trong tình bạn thay vì áp đặt cấm đoán.",
        highlights: [
          { type: "DO", text: "Định hướng con ranh giới tôn trọng thân thể và giữ tình bạn đẹp" },
          { type: "DO", text: "Khuyến khích con chia sẻ mọi băn khoăn mà không sợ bị la rầy" },
          { type: "DONT", text: "Không cấm đoán thô bạo khiến con khép lòng và yêu lén lút" },
        ],
      },
    ],
    winCondition: "Con tin tưởng mở lòng tâm sự thật lòng ➔ Đạt 80+ Điểm Tin Tưởng!",
  },
  ROOM_BULLYING: {
    illustrationUrl: "/images/roleplay/guides/courage-hero.jpg",
    badge: "🤝 HÀNH TRÌNH 3 BƯỚC HIỆP SĨ BẢO VỆ BẠN BÈ",
    title: "Can đảm bảo vệ bạn trước trò trêu chọc ngoại hình ác ý",
    summary:
      "Linh Chi đang khóc bế tắc vì bị trêu chọc ác ý về cơ thể phát triển sớm ở góc sân trường.",
    steps: [
      {
        step: "01",
        tag: "CHE CHỞ TỨC THÌ",
        title: "Tách Bạn Khỏi Đám Đông",
        description:
          "Chủ động bước tới bên cạnh bạn, đưa khăn giấy và kéo bạn rời khỏi góc sân ồn ào.",
        highlights: [
          { type: "DO", text: "Có mặt ngay lúc bạn đang cô độc, khủng hoảng nhất" },
          { type: "DO", text: "Giúp bạn bình tâm, uống ngụm nước và ổn định nhịp thở" },
          { type: "DONT", text: "Không đứng nhìn thờ ơ xem như trò đùa vui vô hại" },
        ],
      },
      {
        step: "02",
        tag: "TIẾP SỨC TINH THẦN",
        title: "Khẳng Định Lẽ Phải & Ranh Giới",
        description:
          "Khẳng định cơ thể ai cũng thay đổi, kẻ bắt nạt và miệt thị ngoại hình mới là kẻ sai.",
        highlights: [
          { type: "DO", text: "Nói rõ: 'Cơ thể bạn bình thường, cậu không có lỗi gì cả!'" },
          { type: "DONT", text: "CẤM đổ lỗi nạn nhân: 'Tại cậu mặc đồ chật', 'Tại cậu lớn sớm'" },
          { type: "DONT", text: "Tuyệt đối không hùa theo đám đông cười cợt khiếm nhã" },
        ],
      },
      {
        step: "03",
        tag: "ĐỒNG HÀNH TỐ GIÁC",
        title: "Cùng Đến Gặp Thầy Cô",
        description:
          "Nắm tay bạn đi báo ngay cho giáo viên chủ nhiệm hoặc phòng tâm lý học đường xử lý.",
        highlights: [
          { type: "DO", text: "Đồng hành cùng bạn đến phòng giáo viên, không để bạn đi một mình" },
          { type: "DO", text: "Làm nhân chứng dũng cảm bảo vệ sự thật trước nhà trường" },
          { type: "DO", text: "Chặn đứng hành vi bắt nạt tái diễn với các bạn khác" },
        ],
      },
    ],
    winCondition: "Giúp bạn bình tâm & cùng báo nhà trường ➔ Đạt 80+ Điểm Đồng Cảm!",
  },
};

interface GuideScriptViewerProps {
  roomCode?: string;
  rawScript?: string;
  npcName?: string;
  npcAvatarUrl?: string;
}

export default function GuideScriptViewer({
  roomCode = "ROOM_STRANGER",
  rawScript = "",
  npcName = "Nhân vật AI",
  npcAvatarUrl,
}: GuideScriptViewerProps) {
  const [showFullDetails, setShowFullDetails] = useState(false);

  const data: ScenarioJourneyData =
    SCENARIO_JOURNEY_DATA[roomCode] || SCENARIO_JOURNEY_DATA.ROOM_STRANGER;

  return (
    <div className="space-y-6 text-on-surface animate-fade-in">
      {/* 3D Hero Banner: Phù hợp với chủ đề tình huống */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-teal-500/10 to-amber-500/10 border border-primary/20 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div className="relative flex-shrink-0">
          <img
            src={data.illustrationUrl}
            alt={data.title}
            width={112}
            height={112}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white shadow-md ring-4 ring-primary/20 hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute -bottom-2 -right-1 bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Lightning size={11} weight="fill" />
            3S SCAN
          </span>
        </div>

        <div className="space-y-1.5 text-center sm:text-left min-w-0">
          <Badge
            tone="bg-primary/15 border border-primary/30 text-primary"
            uppercase
            icon={<Sparkle size={13} weight="fill" />}
            className="gap-1.5 px-3 py-1 font-black! tracking-wider"
          >
            {data.badge}
          </Badge>
          <h4 className="text-base sm:text-lg font-black text-on-surface leading-snug">
            {data.title}
          </h4>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-normal">
            {data.summary}
          </p>
        </div>
      </div>

      {/* 3 Step Journey Cards Grid (Phong cách ThreeStepJourney signature) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 relative">
        {data.steps.map((item, idx) => (
          <div
            key={idx}
            className="relative bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-outline-variant/30 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
          >
            {/* Step Number Watermark Signature */}
            <span className="absolute top-3 right-5 text-6xl sm:text-7xl font-black text-outline-variant/20 select-none font-mono tracking-tighter group-hover:text-primary/25 group-hover:scale-105 transition-all duration-300 pointer-events-none">
              {item.step}
            </span>

            <div className="space-y-3 relative z-10">
              {/* Tag & Title */}
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {item.tag}
                </span>
                <h5 className="text-sm sm:text-base font-black text-on-surface group-hover:text-primary transition-colors pr-10">
                  {item.title}
                </h5>
              </div>

              {/* Description */}
              <p className="text-xs text-on-surface-variant leading-relaxed font-normal">
                {item.description}
              </p>

              {/* Micro Checklist with CheckCircle / XCircle */}
              <ul className="space-y-2 pt-3 border-t border-outline-variant/20">
                {item.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-on-surface-variant font-medium leading-snug"
                  >
                    {h.type === "DO" ? (
                      <CheckCircle
                        size={15}
                        weight="fill"
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                    ) : (
                      <XCircle
                        size={15}
                        weight="fill"
                        className="text-rose-600 shrink-0 mt-0.5"
                      />
                    )}
                    <span>{h.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Điều kiện thắng cuộc (Trophy Banner) */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/15 border border-amber-300/80 p-3.5 flex items-center gap-3 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs text-xl">
          <Trophy size={22} weight="fill" />
        </div>
        <p className="text-xs sm:text-sm font-black text-amber-950 leading-snug">
          {data.winCondition}
        </p>
      </div>

      {/* Accordion tùy chọn: Chi tiết học thuật cho giáo viên & nghiên cứu */}
      {rawScript && (
        <div className="border border-outline-variant/25 rounded-2xl overflow-hidden bg-surface-container-lowest">
          <button
            type="button"
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info size={14} weight="bold" />
              <span>Xem chi tiết sư phạm &amp; 3 hướng rẽ kịch bản</span>
            </span>
            {showFullDetails ? (
              <CaretUp size={14} weight="bold" />
            ) : (
              <CaretDown size={14} weight="bold" />
            )}
          </button>

          {showFullDetails && (
            <div className="p-4 border-t border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed whitespace-pre-line font-normal bg-white max-h-60 overflow-y-auto">
              {rawScript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
