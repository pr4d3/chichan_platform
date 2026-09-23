"use client";

import React, { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Badge, Button, Modal, Spinner } from "@/components/ui";
import {
  Robot,
  ShieldWarning,
  FirstAid,
  UsersThree,
  HeartStraight,
  ArrowRight,
  Warning,
  Sparkle,
  ChatCircleText,
  Target,
  Lightning,
  GameController,
  ShieldCheck,
  Trophy,
  Info,
  Clock,
  ArrowCounterClockwise,
  Play,
} from "@phosphor-icons/react";

// Chỉ render trong modal nên nạp lazily (không nằm trong bundle chính của trang game)
const GuideScriptViewer = dynamic(
  () => import("@/components/roleplay/GuideScriptViewer"),
  { ssr: false },
);

// Pill amber "Bí Kíp" dùng chung công thức giữa 2 trang game (trước đây lặp byte-identical)
const GUIDE_PILL_TONE =
  "text-amber-800 bg-amber-500/15 border border-amber-300/60";

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
  categoryKey: "SAFETY" | "HEALTH" | "FAMILY_SCHOOL";
  bgGradient: string;
  borderColor: string;
  accentGlow: string;
  badgeStyle: string;
  categoryTitle: string;
  IconComponent: any;
  iconColor: string;
  tagColor: string;
  difficultyLabel: string;
  summaryQuote: string;
}

const scenarioThemeMap: Record<string, ScenarioTheme> = {
  ROOM_STRANGER: {
    categoryKey: "SAFETY",
    bgGradient: "bg-white",
    borderColor: "border-outline-variant/40 hover:border-primary",
    accentGlow: "hover:shadow-depth-3",
    badgeStyle: "bg-rose-50 text-rose-700 border border-rose-200",
    categoryTitle: "Tình huống 1: An toàn mạng & Ranh giới",
    IconComponent: ShieldWarning,
    iconColor: "text-rose-600 bg-rose-100/70",
    tagColor: "bg-rose-500 text-white",
    difficultyLabel: "Mức độ cảnh giác: Cao",
    summaryQuote:
      "Nhận diện bẫy thao túng tâm lý, từ chối gặp mặt bí mật và bảo vệ dữ liệu riêng tư.",
  },
  ROOM_SEXTORTION: {
    categoryKey: "SAFETY",
    bgGradient: "bg-white",
    borderColor: "border-outline-variant/40 hover:border-primary",
    accentGlow: "hover:shadow-depth-3",
    badgeStyle: "bg-amber-50 text-amber-800 border border-amber-200",
    categoryTitle: "Tình huống 2: Ứng phó tống tiền mạng",
    IconComponent: ShieldCheck,
    iconColor: "text-amber-700 bg-amber-100/80",
    tagColor: "bg-amber-600 text-white",
    difficultyLabel: "Mức độ rủi ro: Khẩn cấp",
    summaryQuote:
      "Bình tĩnh không thỏa hiệp, lưu giữ bằng chứng và tìm kiếm sự hỗ trợ pháp lý an toàn.",
  },
  ROOM_DOCTOR: {
    categoryKey: "HEALTH",
    bgGradient: "bg-white",
    borderColor: "border-outline-variant/40 hover:border-primary",
    accentGlow: "hover:shadow-depth-3",
    badgeStyle: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    categoryTitle: "Tình huống 3: Bác sĩ tư vấn dậy thì & SKSS",
    IconComponent: FirstAid,
    iconColor: "text-emerald-700 bg-emerald-100/70",
    tagColor: "bg-emerald-600 text-white",
    difficultyLabel: "Chủ đề: Thầm kín & Khoa học",
    summaryQuote:
      "Chủ động cởi mở, giải tỏa các băn khoăn về biến đổi sinh lý và vệ sinh cơ thể an toàn.",
  },
  ROOM_TEEN_CHILD: {
    categoryKey: "FAMILY_SCHOOL",
    bgGradient: "bg-white",
    borderColor: "border-outline-variant/40 hover:border-primary",
    accentGlow: "hover:shadow-depth-3",
    badgeStyle: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    categoryTitle: "Tình huống 4: Cầu nối đối thoại cùng con",
    IconComponent: UsersThree,
    iconColor: "text-indigo-700 bg-indigo-100/70",
    tagColor: "bg-indigo-600 text-white",
    difficultyLabel: "Dành cho: Phụ huynh đồng hành",
    summaryQuote:
      "Rèn luyện cách lắng nghe thấu cảm, tránh phán xét khi con bước vào tuổi dậy thì.",
  },
  ROOM_BULLYING: {
    categoryKey: "FAMILY_SCHOOL",
    bgGradient: "bg-white",
    borderColor: "border-outline-variant/40 hover:border-primary",
    accentGlow: "hover:shadow-depth-3",
    badgeStyle: "bg-teal-50 text-teal-700 border border-teal-200",
    categoryTitle: "Tình huống 5: Chống kỳ thị & Bắt nạt",
    IconComponent: HeartStraight,
    iconColor: "text-teal-700 bg-teal-100/70",
    tagColor: "bg-teal-600 text-white",
    difficultyLabel: "Kỹ năng: Thấu cảm & Đồng hành",
    summaryQuote:
      "Đóng vai người bạn tốt an ủi, khẳng định ranh giới cơ thể và cùng báo cáo nhà trường.",
  },
};

type FilterCategory = "ALL" | "SAFETY" | "HEALTH" | "FAMILY_SCHOOL";

export default function GameLandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingSessionId, setCreatingSessionId] = useState<number | null>(
    null,
  );
  const [checkingSessionId, setCheckingSessionId] = useState<number | null>(
    null,
  );
  const [pendingActiveSession, setPendingActiveSession] = useState<{
    scenario: Scenario;
    session: {
      id: string;
      scenario_id: number;
      current_score: number;
      current_emotion: string;
      status: string;
      created_at: string;
      updated_at: string;
    };
  } | null>(null);
  const [selectedGuideScenario, setSelectedGuideScenario] =
    useState<Scenario | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("ALL");

  useEffect(() => {
    if (!user) return;

    const fetchScenarios = async () => {
      try {
        const data = await api.get("/roleplay/scenarios");
        // Sắp xếp thứ tự phòng chuẩn TH1 -> TH5
        const order = [
          "ROOM_STRANGER",
          "ROOM_SEXTORTION",
          "ROOM_DOCTOR",
          "ROOM_TEEN_CHILD",
          "ROOM_BULLYING",
        ];
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

  const filteredScenarios = useMemo(() => {
    if (activeFilter === "ALL") return scenarios;
    return scenarios.filter((sc) => {
      const theme = scenarioThemeMap[sc.room_code];
      return theme?.categoryKey === activeFilter;
    });
  }, [scenarios, activeFilter]);

  const handleStartSession = async (scenario: Scenario) => {
    try {
      setCheckingSessionId(scenario.id);
      // Kiểm tra xem người dùng có session dở dang ở kịch bản này không
      const checkRes = await api.get(
        `/roleplay/scenarios/${scenario.id}/active-session`,
      );
      if (checkRes?.has_active_session && checkRes.session) {
        setPendingActiveSession({
          scenario,
          session: checkRes.session,
        });
        return;
      }

      // Chưa có ván dở -> tạo mới và vào phòng luôn
      await createAndEnterSession(scenario.id);
    } catch (err: any) {
      alert(err.message || "Không thể kiểm tra phòng chơi");
    } finally {
      setCheckingSessionId(null);
    }
  };

  const createAndEnterSession = async (scenarioId: number) => {
    try {
      setCreatingSessionId(scenarioId);
      const res = await api.post("/roleplay/sessions", {
        scenario_id: scenarioId,
      });
      window.location.href = `/game/${res.id}`;
    } catch (err: any) {
      alert(err.message || "Không thể khởi tạo phòng chơi");
    } finally {
      setCreatingSessionId(null);
    }
  };

  const handleResumeSession = (sessionId: string) => {
    setPendingActiveSession(null);
    router.push(`/game/${sessionId}`);
  };

  const handleStartNewOverridingOld = async (scenarioId: number) => {
    const oldSessionId = pendingActiveSession?.session?.id;
    setPendingActiveSession(null);
    if (oldSessionId) {
      try {
        await api.delete(`/roleplay/sessions/${oldSessionId}`);
      } catch (_) {}
    }
    await createAndEnterSession(scenarioId);
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-surface via-surface-container-low/40 to-surface-container-high/30">
        <div className="bg-white p-8 sm:p-12 rounded-none border border-outline-variant/30 shadow-depth-2 max-w-lg text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-none mx-auto flex items-center justify-center">
            <GameController size={36} weight="duotone" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">
              Phòng Mô Phỏng Phản Xạ AI
            </h2>
            <p className="text-sm text-on-surface-variant font-normal leading-relaxed">
              Bạn cần đăng nhập tài khoản học sinh hoặc phụ huynh để tham gia
              rèn luyện các tình huống thực tế an toàn cùng AI ChiChan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/login")}
              className="h-11 px-8 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Đăng nhập ngay
            </button>
            <button
              onClick={() => router.push("/register")}
              className="h-11 px-8 rounded-full border border-outline/30 bg-white/70 hover:bg-white font-bold text-xs text-on-surface transition-all cursor-pointer"
            >
              Đăng ký tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full py-10 px-4 sm:px-6 lg:px-12 bg-surface">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Section with Gamified Stats */}
        <div className="relative overflow-hidden rounded-none bg-primary text-white p-8 sm:p-12 shadow-depth-3 border border-outline-variant/30">
          <div className="relative z-10 max-w-3xl space-y-5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Góc Giải Trí &amp; Rèn Luyện Phản Xạ Ứng Phó
            </h1>

            <p className="text-sm sm:text-base text-teal-50/90 font-light leading-relaxed max-w-2xl">
              Nhập vai tương tác thời gian thực với AI trong các tình huống ranh
              giới an toàn, phòng chống dụ dỗ mạng, giải đáp tâm sinh lý thầm
              kín và đối thoại gia đình.
            </p>

            {/* Quick Stats Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-teal-100/90">
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-none border border-white/20 shadow-depth-1">
                <Target size={18} weight="bold" className="text-amber-300" />
                <span>
                  <strong>5</strong> Kịch bản thực tế
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-none border border-white/20 shadow-depth-1">
                <Lightning
                  size={18}
                  weight="fill"
                  className="text-emerald-300"
                />
                <span>Phản hồi AI Stream tức thì</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-none border border-white/20 shadow-depth-1">
                <Trophy size={18} weight="fill" className="text-yellow-300" />
                <span>Báo cáo đánh giá sư phạm sau màn chơi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                key: "ALL",
                label: "Tất cả tình huống",
                count: scenarios.length,
              },
              { key: "SAFETY", label: "An toàn mạng & Dụ dỗ", count: 2 },
              { key: "HEALTH", label: "Dậy thì & SKSS", count: 1 },
              { key: "FAMILY_SCHOOL", label: "Gia đình & Học đường", count: 2 },
            ].map((tab) => {
              const active = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key as FilterCategory)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    active
                      ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
                      : "bg-white/80 hover:bg-white text-on-surface-variant border border-outline-variant/30"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5">
            <Info size={16} weight="bold" className="text-primary" />
            <span>Mỗi màn chơi kéo dài từ 3 – 5 lượt chat tương tác</span>
          </div>
        </div>

        {/* Scenarios Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="lg" />
            <p className="mt-4 text-on-surface-variant text-sm font-semibold animate-pulse">
              Đang chuẩn bị các phòng mô phỏng tình huống...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white/85 backdrop-blur-md border border-red-200 p-8 rounded-3xl text-center max-w-md mx-auto shadow-sm space-y-4">
            <Warning
              size={40}
              weight="duotone"
              className="text-error mx-auto"
            />
            <p className="text-sm text-error font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-sm cursor-pointer hover:opacity-90"
            >
              Tải lại trang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((sc) => {
              const theme = scenarioThemeMap[sc.room_code] || {
                categoryKey: "SAFETY",
                bgGradient: "from-white via-surface-container/20 to-white",
                borderColor:
                  "border-outline-variant/30 hover:border-primary/50",
                accentGlow: "group-hover:shadow-primary/10",
                badgeStyle:
                  "bg-surface-container text-on-surface-variant border border-outline-variant/30",
                categoryTitle: "Kịch bản thực hành",
                IconComponent: Robot,
                iconColor: "text-primary bg-primary-fixed/50",
                tagColor: "bg-primary text-white",
                difficultyLabel: "Tình huống mô phỏng",
                summaryQuote:
                  "Rèn luyện phản xạ đối thoại thông minh cùng trợ lý AI.",
              };

              const isRecommended =
                (sc.target_audience === "CHILD" &&
                  (user.role === "STUDENT_CHILD" || user.role === "STUDENT")) ||
                (sc.target_audience === "PARENT" &&
                  (user.role === "STUDENT_PARENT" || user.role === "PARENT"));

              const ScenarioIcon = theme.IconComponent;
              const isNpcFirst = sc.first_message_sender === "NPC";

              return (
                <div
                  key={sc.id}
                  className="group relative bg-white rounded-none p-6 sm:p-7 border border-outline-variant/40 hover:border-primary shadow-depth-1 hover:shadow-depth-3 transition-all duration-200 flex flex-col justify-between hover:-translate-y-1"
                >
                  {/* Top Bar inside Card */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${theme.iconColor}`}
                        >
                          <ScenarioIcon size={22} weight="duotone" />
                        </div>
                        <Badge
                          tone={theme.badgeStyle}
                          uppercase
                          className="py-1 font-extrabold"
                        >
                          {theme.categoryTitle}
                        </Badge>
                      </div>

                      {isRecommended && (
                        <Badge
                          tone="bg-emerald-500 text-white shadow-xs"
                          uppercase
                          icon={<Sparkle size={12} weight="fill" />}
                          className="font-black! animate-pulse"
                        >
                          Khuyên dùng
                        </Badge>
                      )}
                    </div>

                    {/* Meta Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                      {/* Badge người nhắn trước (giữ nguyên thông tin của bản cũ) */}
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

                      {/* Badge giới tính/nhân vật (giữ nguyên thông tin của bản cũ) */}
                      {sc.gender_info && (
                        <span className="bg-white/80 border border-outline-variant/30 text-on-surface-variant px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                          {sc.gender_info}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                        <Sparkle size={12} weight="fill" />
                        {sc.target_audience === "CHILD"
                          ? "Học sinh"
                          : "Phụ huynh"}
                      </span>

                      <span className="bg-amber-500/10 text-amber-800 border border-amber-300/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                        <Lightning
                          size={12}
                          weight="fill"
                          className="text-amber-600"
                        />
                        Phản xạ tình huống
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-black text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors leading-snug">
                      {sc.title}
                    </h3>

                    {/* Core takeaway / Quote */}
                    <p className="text-xs text-on-surface-variant font-normal leading-relaxed mb-6 line-clamp-3">
                      {sc.description || theme.summaryQuote}
                    </p>
                  </div>

                  {/* Character Avatar & Action Controls */}
                  <div className="border-t border-outline-variant/20 pt-4 mt-auto space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={
                              sc.npc_avatar_url ||
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                            }
                            alt={sc.npc_name}
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
                            }}
                            className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            Nhân vật AI
                          </p>
                          <p className="text-xs font-black text-on-surface">
                            {sc.npc_name}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedGuideScenario(sc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 transition-all cursor-pointer shadow-2xs"
                      >
                        <Lightning
                          size={14}
                          weight="fill"
                          className="text-amber-600"
                        />
                        <span>Bí kíp 3s</span>
                      </button>
                    </div>

                    <Button
                      full
                      loading={
                        checkingSessionId === sc.id ||
                        creatingSessionId === sc.id
                      }
                      disabled={
                        checkingSessionId !== null || creatingSessionId !== null
                      }
                      onClick={() => handleStartSession(sc)}
                      className="h-11 font-black! shadow-md! hover:shadow-lg! shadow-primary/20 group/btn cursor-pointer"
                    >
                      {creatingSessionId === sc.id ? (
                        "Đang vào phòng..."
                      ) : checkingSessionId === sc.id ? (
                        "Đang kiểm tra phòng..."
                      ) : (
                        <>
                          <span>Bắt đầu tình huống</span>
                          <ArrowRight
                            size={16}
                            weight="bold"
                            className="group-hover/btn:translate-x-1 transition-transform"
                          />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mission Briefing Guide Modal */}
      <Modal
        open={selectedGuideScenario !== null}
        onClose={() => setSelectedGuideScenario(null)}
        size="xl"
        panelClassName="border border-white/80 p-6 sm:p-8 rounded-none sm:max-w-4xl lg:max-w-5xl space-y-6"
      >
        {selectedGuideScenario && (
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pr-10">
              <div className="w-12 h-12 rounded-none bg-amber-500/10 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
                <Lightning size={26} weight="fill" />
              </div>
              <div>
                <Badge tone={GUIDE_PILL_TONE} uppercase className="font-black!">
                  ⚡ Bí Kíp Xử Lý &amp; Phản Xạ 3 Giây
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-on-surface mt-1 tracking-tight">
                  {selectedGuideScenario.title}
                </h3>
              </div>
            </div>

            {/* Rich Visual DO vs DON'T Guide Content (Fast-content for Gen Z) */}
            <GuideScriptViewer
              roomCode={selectedGuideScenario.room_code}
              rawScript={selectedGuideScenario.guide_script || ""}
              npcName={selectedGuideScenario.npc_name}
            />

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedGuideScenario(null)}
                className="h-11 px-6 rounded-none border border-outline/30 bg-white hover:bg-surface-container text-on-surface font-bold text-xs transition-all cursor-pointer"
              >
                Đóng lại
              </button>
              <button
                disabled={
                  creatingSessionId !== null || checkingSessionId !== null
                }
                onClick={() => {
                  const sc = selectedGuideScenario;
                  setSelectedGuideScenario(null);
                  handleStartSession(sc);
                }}
                className="h-11 px-7 rounded-none bg-primary hover:opacity-90 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Vào phòng chơi ngay</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal: Xác nhận tiếp tục phiên chơi dở dang hay chơi mới */}
      <Modal
        open={pendingActiveSession !== null}
        onClose={() => setPendingActiveSession(null)}
        size="md"
        showClose={false}
        panelClassName="p-6 sm:p-8 space-y-6 text-center rounded-none"
      >
        {pendingActiveSession && (
          <>
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-black text-on-surface tracking-tight">
                {pendingActiveSession.scenario.title}
              </h3>
            </div>

            {/* Nút hành động */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={creatingSessionId !== null}
                onClick={() =>
                  handleStartNewOverridingOld(pendingActiveSession.scenario.id)
                }
                className="w-full sm:w-auto h-10 px-5 rounded-none border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowCounterClockwise size={15} weight="bold" />
                <span>Chơi lại từ đầu</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleResumeSession(pendingActiveSession.session.id)
                }
                className="w-full sm:w-auto h-10 px-6 rounded-none bg-primary hover:opacity-90 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play size={15} weight="fill" />
                <span>Tiếp tục chơi</span>
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
