"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Robot,
  ShieldWarning,
  FirstAid,
  UsersThree,
  HeartStraight,
  ArrowRight,
  Warning,
  Sparkle,
  BookOpen,
  X,
  UserCircle,
  ChatCircleText,
  Target,
  CheckCircle,
} from "@phosphor-icons/react";

interface Scenario {
  id: number;
  room_code: string;
  title: string;
  npc_name: string;
  npc_avatar_url: string;
  initial_score: number;
  target_audience: string;
  is_active: boolean;
  description?: string;
  guide_script?: string;
  first_message_sender?: string;
  opening_message?: string;
  gender_info?: string;
}

interface ScenarioTheme {
  bgGradient: string;
  borderColor: string;
  badgeStyle: string;
  categoryTitle: string;
  IconComponent: any;
  iconColor: string;
  description: string;
}

const scenarioThemeMap: Record<string, ScenarioTheme> = {
  ROOM_STRANGER: {
    bgGradient: "from-white/90 via-red-50/30 to-white/80",
    borderColor: "border-red-200/60 hover:border-red-400/80",
    badgeStyle: "bg-red-50 text-red-600 border border-red-200/80",
    categoryTitle: "Tình huống 1: An toàn mạng & Ranh giới",
    IconComponent: ShieldWarning,
    iconColor: "text-red-600 bg-red-100/60",
    description:
      "Luyện kỹ năng nhận diện nguy cơ dụ dỗ, thao túng tâm lý qua mạng, bảo vệ ranh giới cá nhân khi người lạ đòi hỏi hình ảnh riêng tư và hẹn gặp bí mật.",
  },
  ROOM_SEXTORTION: {
    bgGradient: "from-white/90 via-amber-50/35 to-white/80",
    borderColor: "border-amber-200/70 hover:border-amber-400/80",
    badgeStyle: "bg-amber-50 text-amber-700 border border-amber-200/80",
    categoryTitle: "Tình huống 2: Đối mặt tống tiền ảnh nhạy cảm",
    IconComponent: ShieldWarning,
    iconColor: "text-amber-700 bg-amber-100/70",
    description:
      "Rèn luyện phản xạ bình tĩnh, tuyệt đối không thỏa hiệp chuyển tiền/gặp mặt, thu thập chứng cứ pháp lý và liên hệ cơ quan bảo vệ khi bị tống tiền Sextortion.",
  },
  ROOM_DOCTOR: {
    bgGradient: "from-white/90 via-primary-fixed/15 to-white/80",
    borderColor: "border-primary/20 hover:border-primary/50",
    badgeStyle:
      "bg-primary-fixed text-on-primary-fixed-variant border border-primary/20",
    categoryTitle: "Tình huống 3: Bác sĩ tư vấn dậy thì & SKSS",
    IconComponent: FirstAid,
    iconColor: "text-primary bg-primary-fixed/50",
    description:
      "Chủ động cởi mở đối thoại cùng bác sĩ chuyên khoa để tháo gỡ các băn khoăn thầm kín về cơ thể, dậy thì, sinh lý và biện pháp chăm sóc an toàn.",
  },
  ROOM_TEEN_CHILD: {
    bgGradient: "from-white/90 via-tertiary-fixed/20 to-white/80",
    borderColor: "border-tertiary/20 hover:border-tertiary/50",
    badgeStyle:
      "bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary/20",
    categoryTitle: "Tình huống 4: Nhịp cầu đối thoại cùng con",
    IconComponent: UsersThree,
    iconColor: "text-tertiary bg-tertiary-fixed/50",
    description:
      "Dành riêng cho phụ huynh rèn luyện cách mở lời thấu cảm, lắng nghe không phán xét khi con có những xao xuyến tình cảm đầu đời và thay đổi tâm lý.",
  },
  ROOM_BULLYING: {
    bgGradient: "from-white/90 via-secondary-fixed/20 to-white/80",
    borderColor:
      "border-secondary-container/20 hover:border-secondary-container/50",
    badgeStyle:
      "bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-container/20",
    categoryTitle: "Tình huống 5: Phòng chống kỳ thị & Bắt nạt",
    IconComponent: HeartStraight,
    iconColor: "text-secondary-container bg-secondary-fixed/50",
    description:
      "Đóng vai người bạn tốt an ủi, bảo vệ và đồng hành cùng bạn học bị trêu chọc ác ý vì cơ thể phát triển sớm, tìm kiếm sự can thiệp từ nhà trường.",
  },
};

export default function GameLandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingSessionId, setCreatingSessionId] = useState<number | null>(null);
  const [selectedGuideScenario, setSelectedGuideScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchScenarios = async () => {
      try {
        const data = await api.get("/roleplay/scenarios");
        // Sắp xếp thứ tự phòng: ROOM_STRANGER (1), ROOM_SEXTORTION (2), ROOM_DOCTOR (3), ROOM_TEEN_CHILD (4), ROOM_BULLYING (5)
        const order = ["ROOM_STRANGER", "ROOM_SEXTORTION", "ROOM_DOCTOR", "ROOM_TEEN_CHILD", "ROOM_BULLYING"];
        const sorted = (data as Scenario[]).sort((a, b) => {
          const idxA = order.indexOf(a.room_code);
          const idxB = order.indexOf(b.room_code);
          return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
        setScenarios(sorted);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách kịch bản chơi");
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, [user]);

  const handleStartSession = async (scenarioId: number) => {
    try {
      setCreatingSessionId(scenarioId);
      const res = await api.post("/roleplay/sessions", {
        scenario_id: scenarioId,
      });
      router.push(`/game/${res.id}`);
    } catch (err: any) {
      alert(err.message || "Không thể khởi tạo phòng chơi");
    } finally {
      setCreatingSessionId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-surface via-surface-container-low/40 to-surface-container-high/30">
        <div className="bg-white/85 backdrop-blur-xl p-10 md:p-14 rounded-3xl border border-white/80 shadow-sm max-w-xl text-center space-y-6">
          <div className="w-16 h-16 bg-primary-fixed text-primary rounded-3xl mx-auto flex items-center justify-center shadow-sm">
            <Robot size={36} weight="duotone" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-on-surface">
              Góc Giải Trí — Trò Chơi Phản Xạ Cùng AI
            </h2>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Bạn cần đăng nhập tài khoản học sinh hoặc phụ huynh để tham gia trò chơi tương tác tình huống cùng trí tuệ nhân tạo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="h-11 px-8 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={() => router.push("/register")}
              className="h-11 px-8 rounded-full border border-outline/30 bg-white/50 hover:bg-white font-bold text-xs text-on-surface transition-all cursor-pointer"
            >
              Đăng ký tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full py-12 px-4 md:px-16 bg-gradient-to-br from-surface via-surface-container-low/40 to-surface-container-high/20">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold uppercase tracking-wider shadow-xs">
          <Robot size={18} weight="duotone" />
          Góc Giải Trí &amp; Rèn Luyện Kỹ Năng AI
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
          5 Kịch Bản Trò Chơi Nhập Vai Tương Tác
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant font-light leading-relaxed max-w-2xl mx-auto">
          Mỗi kịch bản được xây dựng bám sát thực tế tâm sinh lý học đường, cung cấp bản hướng dẫn mục tiêu trước khi chơi, hỗ trợ 3 nhánh lựa chọn và phân tích hậu quả thực tế sau màn chơi.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-on-surface-variant text-sm font-semibold animate-pulse">
            Đang tải danh sách 5 kịch bản game...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white/80 backdrop-blur-md border border-red-200 p-8 rounded-3xl text-center max-w-md mx-auto my-10 shadow-sm space-y-4">
          <Warning size={40} weight="duotone" className="text-error mx-auto" />
          <p className="text-sm text-error font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
          >
            Tải lại trang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {scenarios.map((sc) => {
            const theme = scenarioThemeMap[sc.room_code] || {
              bgGradient: "from-white/90 via-surface-container/30 to-white/80",
              borderColor: "border-outline-variant/30 hover:border-primary/50",
              badgeStyle:
                "bg-surface-container text-on-surface-variant border border-outline-variant/30",
              categoryTitle: "Kịch bản AI",
              IconComponent: Robot,
              iconColor: "text-primary bg-primary-fixed/50",
              description: "Phòng chơi nhập vai tương tác thông minh với AI.",
            };

            const isRecommended =
              (sc.target_audience === "CHILD" &&
                user.role === "STUDENT_CHILD") ||
              (sc.target_audience === "PARENT" &&
                user.role === "STUDENT_PARENT");

            const ScenarioIcon = theme.IconComponent;
            const isNpcFirst = sc.first_message_sender === "NPC";

            return (
              <div
                key={sc.id}
                className={`bg-gradient-to-br ${theme.bgGradient} backdrop-blur-md rounded-3xl p-6 border ${theme.borderColor} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden`}
              >
                {/* Header in Card */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${theme.iconColor}`}
                      >
                        <ScenarioIcon size={22} weight="duotone" />
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${theme.badgeStyle}`}
                      >
                        {theme.categoryTitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {/* Badge người nhắn trước */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isNpcFirst
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                          : "bg-teal-50 text-teal-700 border border-teal-200/80"
                      }`}
                    >
                      <ChatCircleText size={12} weight="bold" />
                      {isNpcFirst ? "NPC nhắn trước" : "Bạn nhắn trước"}
                    </span>

                    {/* Badge giới tính/nhân vật */}
                    {sc.gender_info && (
                      <span className="bg-white/80 border border-outline-variant/30 text-on-surface-variant px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                        {sc.gender_info}
                      </span>
                    )}

                    {isRecommended && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                        Phù hợp bạn
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-extrabold text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors leading-snug">
                    {sc.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-light leading-relaxed mb-5 line-clamp-3">
                    {sc.description || theme.description}
                  </p>
                </div>

                {/* Bottom segment */}
                <div className="border-t border-outline-variant/20 pt-4 mt-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white text-primary flex items-center justify-center font-bold text-xs shadow-xs border border-outline-variant/30">
                        {sc.npc_name[0]}
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-medium">
                          Đối thoại cùng
                        </p>
                        <p className="text-xs font-bold text-on-surface">
                          {sc.npc_name}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedGuideScenario(sc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <BookOpen size={14} weight="bold" />
                      <span>Xem kịch bản</span>
                    </button>
                  </div>

                  <button
                    disabled={creatingSessionId !== null}
                    onClick={() => handleStartSession(sc.id)}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {creatingSessionId === sc.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang khởi tạo...</span>
                      </>
                    ) : (
                      <>
                        <span>Vào phòng chơi</span>
                        <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guide Script Modal */}
      {selectedGuideScenario && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white/95 border border-white/80 p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[85vh] relative space-y-5">
            {/* Close button */}
            <button
              onClick={() => setSelectedGuideScenario(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors cursor-pointer"
            >
              <X size={18} weight="bold" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 pr-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center text-xl shadow-xs">
                <BookOpen size={24} weight="duotone" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  Bản Hướng Dẫn Kịch Bản
                </span>
                <h3 className="text-xl font-extrabold text-on-surface mt-1">
                  {selectedGuideScenario.title}
                </h3>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/30 text-xs">
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold">NHÂN VẬT ĐỐI THOẠI</p>
                <p className="font-semibold text-on-surface mt-0.5">{selectedGuideScenario.npc_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold">LƯỢT NHẮN ĐẦU TIÊN</p>
                <p className="font-semibold text-primary mt-0.5">
                  {selectedGuideScenario.first_message_sender === "NPC" ? "Nhân vật nhắn trước" : "Bạn nhắn trước"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold">ĐỐI TƯỢNG PHÙ HỢP</p>
                <p className="font-semibold text-on-surface mt-0.5">
                  {selectedGuideScenario.target_audience === "CHILD" ? "Học sinh THCS/THPT" : "Phụ huynh"}
                </p>
              </div>
            </div>

            {/* Guide Script Content */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 space-y-3">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Target size={16} weight="bold" className="text-primary" />
                Chi Tiết Bối Cảnh, Mục Tiêu &amp; 3 Hướng Đi Khả Dĩ:
              </h4>
              <div className="text-xs text-on-surface leading-relaxed whitespace-pre-line font-light">
                {selectedGuideScenario.guide_script}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGuideScenario(null)}
                className="h-10 px-5 rounded-full border border-outline/30 bg-white/60 hover:bg-white text-on-surface font-bold text-xs transition-all cursor-pointer"
              >
                Đóng
              </button>
              <button
                disabled={creatingSessionId !== null}
                onClick={() => {
                  const id = selectedGuideScenario.id;
                  setSelectedGuideScenario(null);
                  handleStartSession(id);
                }}
                className="h-10 px-6 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Bắt đầu chơi ngay</span>
                <ArrowRight size={15} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
