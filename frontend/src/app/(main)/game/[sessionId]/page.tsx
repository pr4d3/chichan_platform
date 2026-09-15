"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Trophy,
  PlayCircle,
  PaperPlaneTilt,
  Brain,
  ArrowCounterClockwise,
  WarningCircle,
  BookOpen,
  X,
  Target,
} from "@phosphor-icons/react";

interface Message {
  id?: string;
  sender: "USER" | "NPC";
  dialogue: string;
  action?: string;
  emotion?: string;
  score_change?: number;
}

interface Session {
  id: string;
  scenario_id: number;
  current_score: number;
  current_emotion: string;
  status: "ACTIVE" | "WON" | "LOST" | "ABANDONED";
  created_at: string;
}

interface Scenario {
  id: number;
  room_code: string;
  title: string;
  npc_name: string;
  npc_avatar_url: string;
  initial_score: number;
  target_audience: string;
  description?: string;
  guide_script?: string;
  first_message_sender?: string;
  opening_message?: string;
  gender_info?: string;
}

const emotionEmojiMap: Record<string, string> = {
  neutral: "😐",
  suspicious: "🤨",
  anxious: "😰",
  friendly: "😊",
  angry: "😡",
  touched: "🥹",
};

const emotionTextMap: Record<string, string> = {
  neutral: "Bình thường",
  suspicious: "Nghi ngờ",
  anxious: "Lo âu",
  friendly: "Thân thiện",
  angry: "Tức giận",
  touched: "Cảm động",
};

const scoreLabelMap: Record<string, string> = {
  ROOM_STRANGER: "Điểm An Toàn",
  ROOM_SEXTORTION: "Điểm Bản Lĩnh",
  ROOM_DOCTOR: "Điểm Cởi Mở",
  ROOM_TEEN_CHILD: "Điểm Tin Tưởng",
  ROOM_BULLYING: "Điểm Đồng Cảm",
};

export default function GamePlayPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chat state
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [scoreChangeFlash, setScoreChangeFlash] = useState<{
    value: number;
    key: number;
  } | null>(null);

  // End Game State
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loadingEval, setLoadingEval] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, thinking]);

  // Load session & history
  const loadSessionData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/roleplay/sessions/${sessionId}`);
      setSession(res.data.session);
      setScenario(res.data.scenario);
      setMessages(res.data.messages || []);

      // Nếu session đã kết thúc, tự động nạp kết quả đánh giá
      if (
        res.data.session.status === "WON" ||
        res.data.session.status === "LOST"
      ) {
        fetchEvaluation();
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải phiên chơi này");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    loadSessionData();
  }, [sessionId]);

  const fetchEvaluation = async () => {
    try {
      setLoadingEval(true);
      const res = await api.get(`/roleplay/evaluations/${sessionId}`);
      setEvaluation(res);
      setShowEvalModal(true);
      if (res.result_outcome === "THẮNG CUỘC") {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      console.error("Failed to load evaluation", err);
    } finally {
      setLoadingEval(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || thinking || streamingText) return;

    const messageText = input;
    setInput("");

    // Thêm tin nhắn của User vào UI ngay lập tức
    setMessages((prev) => [...prev, { sender: "USER", dialogue: messageText }]);
    setThinking(true);
    setThinkingStatus("AI đang suy nghĩ...");
    setStreamingText("");

    try {
      const token = api.getToken();
      const BASE_URL = (
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "https://sex-education-api.onrender.com/api/v1"
      ).trim();

      const response = await fetch(
        `${BASE_URL}/roleplay/sessions/${sessionId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: messageText }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Có lỗi xảy ra khi truyền tin");
      }

      const reader = response.body?.getReader();
      if (!reader)
        throw new Error("Không thể khởi động luồng truyền dữ liệu stream");

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || ""; // Giữ lại phần chưa hoàn chỉnh nếu có

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          const lines = rawEvent.split("\n");
          let eventName = "message";
          let dataText = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventName = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              dataText = line.replace("data: ", "").trim();
            }
          }

          if (eventName === "thinking") {
            try {
              const data = JSON.parse(dataText);
              setThinkingStatus(data.status || "AI đang phân tích ngữ cảnh...");
            } catch (e) {}
          } else if (eventName === "delta") {
            setThinking(false);
            try {
              const data = JSON.parse(dataText);
              if (data.dialogue_chunk) {
                setStreamingText((prev) => prev + data.dialogue_chunk);
              }
            } catch (e) {}
          } else if (eventName === "turn_complete") {
            setThinking(false);
            try {
              const data = JSON.parse(dataText);

              // Cập nhật session điểm & biểu cảm
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      current_score: data.current_score,
                      current_emotion: data.current_emotion,
                      status: data.status,
                    }
                  : null,
              );

              // Bắn hiệu ứng flash điểm số
              if (data.score_change !== 0) {
                setScoreChangeFlash({
                  value: data.score_change,
                  key: Date.now(),
                });
                setTimeout(() => setScoreChangeFlash(null), 3000);
              }

              // Chuyển streaming text thành tin nhắn NPC hoàn chỉnh
              setMessages((prev) => [
                ...prev,
                {
                  sender: "NPC",
                  dialogue: data.dialogue,
                  action: data.action,
                  emotion: data.current_emotion,
                  score_change: data.score_change,
                },
              ]);

              setStreamingText("");

              // Kiểm tra nếu màn chơi kết thúc
              if (data.status === "WON" || data.status === "LOST") {
                setTimeout(() => {
                  fetchEvaluation();
                }, 1500);
              }
            } catch (e) {}
          } else if (eventName === "error") {
            try {
              const data = JSON.parse(dataText);
              setError(data.detail || "Có lỗi từ AI Engine");
            } catch (e) {}
            setThinking(false);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối phòng chat");
      setThinking(false);
    }
  };

  const handleAbandon = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn thoát phòng chơi này? Điểm số hiện tại của bạn sẽ không được ghi nhận tối ưu.",
      )
    )
      return;
    try {
      await api.post(`/roleplay/sessions/${sessionId}/abandon`, {});
      router.push("/game");
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra");
    }
  };

  // Hàm chọn màu cho thanh điểm số
  const getScoreColor = (score: number) => {
    if (score < 30) return "bg-rose-500";
    if (score < 70) return "bg-amber-500";
    return "bg-primary";
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-on-surface-variant text-sm font-semibold animate-pulse">
          Đang nạp không gian kịch bản...
        </p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-4">
        <WarningCircle
          size={40}
          weight="duotone"
          className="text-error mx-auto"
        />
        <h3 className="text-xl font-bold text-on-surface">Đã xảy ra lỗi</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => router.push("/game")}
          className="bg-primary text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
        >
          Trở về Góc giải trí
        </button>
      </div>
    );
  }

  const isSessionEnded =
    session && (session.status === "WON" || session.status === "LOST");
  const scoreLabel = scenario
    ? scoreLabelMap[scenario.room_code] || "Điểm số"
    : "Điểm số";

  return (
    <div className="flex-grow flex flex-col bg-gradient-to-br from-surface via-surface-container-low/40 to-surface-container-high/20 min-h-[calc(100vh-4rem)] text-on-surface">
      {/* Header bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-outline-variant/30 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/game")}
            className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant hover:text-primary cursor-pointer flex items-center justify-center"
            title="Quay lại Góc giải trí"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-on-surface tracking-tight leading-tight">
              {scenario?.title}
            </h2>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Nhân vật AI:{" "}
              <strong className="text-primary font-bold">
                {scenario?.npc_name}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {scenario?.guide_script && (
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BookOpen size={16} weight="bold" />
              <span className="hidden sm:inline">Kịch bản &amp; Hướng dẫn</span>
            </button>
          )}
          {!isSessionEnded && (
            <button
              onClick={handleAbandon}
              className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 px-4 py-2 rounded-full transition-all cursor-pointer"
            >
              Thoát chơi
            </button>
          )}
          {isSessionEnded && (
            <button
              onClick={() => setShowEvalModal(true)}
              className="bg-primary hover:opacity-90 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Trophy size={16} weight="fill" />
              Xem Đánh giá
            </button>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 items-stretch">
        {/* Left panel: NPC state widget */}
        <div className="lg:col-span-1 bg-white/85 backdrop-blur-md border border-white/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm relative min-h-[220px] lg:min-h-auto">
          {/* Score change floating notification */}
          {scoreChangeFlash && (
            <div
              key={scoreChangeFlash.key}
              className={`absolute top-4 right-4 text-xs font-black animate-bounce px-3 py-1 rounded-full shadow-sm ${
                scoreChangeFlash.value > 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-600 border border-red-200"
              }`}
            >
              {scoreChangeFlash.value > 0
                ? `+${scoreChangeFlash.value}`
                : scoreChangeFlash.value}{" "}
              {scoreLabel}
            </div>
          )}

          {/* NPC Face representation */}
          <div className="relative mb-3 group">
            <img
              src={
                scenario?.npc_avatar_url ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
              }
              alt={scenario?.npc_name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300"
            />
            {/* Live status badge */}
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <h3 className="text-base font-extrabold text-on-surface">
            {scenario?.npc_name}
          </h3>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {scenario?.target_audience === "CHILD"
              ? "Học sinh"
              : "Cố vấn chuyên gia"}
          </p>

          {/* Score meter */}
          <div className="w-full mt-6 bg-surface-container-low/80 rounded-2xl p-4 border border-outline-variant/30 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-on-surface-variant">
                {scoreLabel}
              </span>
              <span className="font-extrabold text-primary text-sm">
                {session?.current_score || 0}/100
              </span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-teal-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, session?.current_score || 0))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right panel: Chat Window */}
        <div className="lg:col-span-3 flex flex-col bg-white/85 backdrop-blur-md border border-white/80 rounded-3xl overflow-hidden shadow-sm h-[580px] lg:h-[640px]">
          {/* Messages container */}
          <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 p-4">
                <PlayCircle
                  size={44}
                  weight="duotone"
                  className="text-primary animate-pulse"
                />
                <h4 className="font-extrabold text-on-surface text-sm">
                  {scenario?.first_message_sender === "USER"
                    ? "Lượt nhắn đầu tiên thuộc về bạn!"
                    : "Bắt đầu mô phỏng tình huống"}
                </h4>
                <p className="text-xs text-on-surface-variant font-light leading-relaxed">
                  {scenario?.first_message_sender === "USER"
                    ? `Theo kịch bản, bạn là người chủ động mở lời hoặc đặt câu hỏi trước với ${scenario?.npc_name}. Hãy gõ lời thoại ở khung bên dưới!`
                    : `Hãy nhập lời thoại bên dưới để trò chuyện cùng ${scenario?.npc_name} và giải quyết tình huống theo cách của bạn.`}
                </p>
                {scenario?.guide_script && (
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 hover:bg-primary/20 px-3.5 py-1.5 rounded-full cursor-pointer transition-colors"
                  >
                    <BookOpen size={14} weight="bold" />
                    Xem lại hướng dẫn kịch bản
                  </button>
                )}
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === "USER" ? "items-end" : "items-start"}`}
              >
                <div className="text-[10px] text-on-surface-variant/80 mb-1 px-2 font-semibold">
                  {m.sender === "USER" ? "Bạn" : scenario?.npc_name}
                </div>
                <div
                  className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-xs ${
                    m.sender === "USER"
                      ? "bg-primary text-white rounded-tr-xs shadow-sm"
                      : "bg-surface-container-low text-on-surface rounded-tl-xs border border-outline-variant/30 shadow-xs"
                  }`}
                >
                  {/* Action description inside NPC bubble */}
                  {m.sender === "NPC" && m.action && (
                    <div className="text-primary text-xs font-semibold italic mb-1.5">
                      {m.action}
                    </div>
                  )}

                  {/* Dialogue text */}
                  <p className="font-medium">{m.dialogue}</p>
                </div>

                {/* Score change hint on UI */}
                {m.sender === "NPC" && m.score_change !== 0 && (
                  <span
                    className={`text-[10px] font-extrabold mt-1 px-2 ${
                      m.score_change! > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {m.score_change! > 0
                      ? `+${m.score_change}`
                      : m.score_change}{" "}
                    {scoreLabel}
                  </span>
                )}
              </div>
            ))}

            {/* Streaming AI text bubble */}
            {streamingText && (
              <div className="flex flex-col items-start">
                <div className="text-[10px] text-on-surface-variant/80 mb-1 px-2 font-semibold">
                  {scenario?.npc_name}
                </div>
                <div className="max-w-[85%] rounded-3xl rounded-tl-xs p-4 text-sm leading-relaxed bg-surface-container-low text-on-surface border border-primary/40 shadow-xs">
                  <p className="font-medium animate-pulse border-r-2 border-primary pr-0.5">
                    {streamingText}
                  </p>
                </div>
              </div>
            )}

            {/* Thinking/loading state bubble */}
            {thinking && (
              <div className="flex flex-col items-start">
                <div className="text-[10px] text-on-surface-variant/80 mb-1 px-2 font-semibold">
                  {scenario?.npc_name}
                </div>
                <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-xs px-4 py-3 border border-outline-variant/30 flex items-center gap-2 shadow-xs">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-xs text-primary font-medium italic">
                    {thinkingStatus}
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input box */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-surface-container-low/60 border-t border-outline-variant/30 flex items-center gap-3"
          >
            <input
              disabled={isSessionEnded || thinking || !!streamingText}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isSessionEnded
                  ? "Trận chơi đã kết thúc"
                  : thinking || streamingText
                    ? "Đang chờ AI trả lời..."
                    : "Nhập phản hồi hoặc cách xử lý của bạn..."
              }
              className="flex-grow bg-white border border-outline-variant/40 rounded-full px-5 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
            />
            <button
              disabled={
                isSessionEnded || thinking || !!streamingText || !input.trim()
              }
              type="submit"
              className="w-11 h-11 flex-shrink-0 bg-primary hover:opacity-90 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
            >
              <PaperPlaneTilt size={20} weight="fill" />
            </button>
          </form>
        </div>
      </div>

      {/* Evaluation Modal (Thắng/Thua overlay) */}
      {showEvalModal && evaluation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white/95 border border-white/80 p-6 md:p-10 rounded-[2rem] max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[85vh] relative space-y-6">
            {/* Title Outcome */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-primary-fixed text-primary flex items-center justify-center mx-auto text-3xl shadow-sm">
                {session?.status === "WON" ? "🏆" : "⚠️"}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
                {session?.status === "WON"
                  ? "Màn Chơi Hoàn Thành Xuất Sắc!"
                  : "Màn Chơi Chưa Đạt Yêu Cầu"}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Kết quả:{" "}
                <strong className="text-primary font-bold">
                  {evaluation.result_outcome}
                </strong>{" "}
                • Kịch bản: {scenario?.title}
              </p>
            </div>

            {/* Quantitative specs */}
            <div className="grid grid-cols-3 gap-4 bg-surface-container-low/80 rounded-2xl border border-outline-variant/30 p-4">
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Điểm Cuối Cùng
                </p>
                <p className="text-xl font-extrabold text-primary mt-1">
                  {evaluation.final_score}/100
                </p>
              </div>
              <div className="text-center border-x border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Số Lượt Chat
                </p>
                <p className="text-xl font-extrabold text-on-surface mt-1">
                  {evaluation.total_turns} lượt
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Thời Gian Chơi
                </p>
                <p className="text-xl font-extrabold text-on-surface mt-1">
                  {Math.floor(evaluation.duration_seconds / 60)}m{" "}
                  {evaluation.duration_seconds % 60}s
                </p>
              </div>
            </div>

            {/* Qualitative analysis of AI */}
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Brain size={20} weight="duotone" className="text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                  Nhận Xét Khoa Học Từ AI Cố Vấn:
                </h4>
              </div>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-line font-light">
                {evaluation.ai_feedback_summary}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={async () => {
                  setShowEvalModal(false);
                  if (scenario) {
                    try {
                      setLoading(true);
                      const res = await api.post("/roleplay/sessions", {
                        scenario_id: scenario.id,
                      });
                      router.push(`/game/${res.id}`);
                      loadSessionData();
                    } catch (err: any) {
                      alert(err.message || "Không thể tạo phiên chơi lại");
                      setLoading(false);
                    }
                  }
                }}
                className="h-11 px-8 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <ArrowCounterClockwise size={18} weight="bold" />
                Chơi lại
              </button>
              <button
                onClick={() => {
                  setShowEvalModal(false);
                  router.push("/game");
                }}
                className="h-11 px-8 rounded-full border border-outline/30 bg-white/50 hover:bg-white text-on-surface font-bold text-xs cursor-pointer transition-all"
              >
                Chọn kịch bản khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Script In-Game Modal */}
      {showGuideModal && scenario?.guide_script && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white/95 border border-white/80 p-6 md:p-8 rounded-3xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[85vh] relative space-y-5">
            {/* Close button */}
            <button
              onClick={() => setShowGuideModal(false)}
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
                  Kịch Bản &amp; Hướng Dẫn Tình Huống
                </span>
                <h3 className="text-xl font-extrabold text-on-surface mt-1">
                  {scenario.title}
                </h3>
              </div>
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/30 text-xs">
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold">NHÂN VẬT ĐỐI THOẠI</p>
                <p className="font-semibold text-on-surface mt-0.5">{scenario.npc_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold">LƯỢT NHẮN ĐẦU TIÊN</p>
                <p className="font-semibold text-primary mt-0.5">
                  {scenario.first_message_sender === "NPC" ? "Nhân vật nhắn trước" : "Bạn nhắn trước"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant font-bold">CHỈ SỐ ĐÁNH GIÁ</p>
                <p className="font-semibold text-on-surface mt-0.5">{scoreLabel}</p>
              </div>
            </div>

            {/* Guide Script Content */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/20 space-y-3">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <Target size={16} weight="bold" className="text-primary" />
                Chi Tiết Bối Cảnh, Mục Tiêu &amp; 3 Hướng Đi Khả Dĩ:
              </h4>
              <div className="text-xs text-on-surface leading-relaxed whitespace-pre-line font-light">
                {scenario.guide_script}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="h-10 px-6 rounded-full bg-primary hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Tiếp tục trò chơi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
