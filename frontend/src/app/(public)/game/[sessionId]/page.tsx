"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/runtime-config";
import { Badge, Button, EmptyState, Modal, PageLoader } from "@/components/ui";
import {
  ArrowLeft,
  Trophy,
  PlayCircle,
  PaperPlaneTilt,
  Brain,
  ArrowCounterClockwise,
  WarningCircle,
  Target,
  ShieldWarning,
  Lightbulb,
  Lightning,
  CheckCircle,
  Star,
} from "@phosphor-icons/react";

// Chỉ render trong modal nên nạp lazily (không nằm trong bundle chính của trang game)
const GuideScriptViewer = dynamic(
  () => import("@/components/roleplay/GuideScriptViewer"),
  { ssr: false },
);

// Pill amber "Bí Kíp" dùng chung công thức giữa 2 trang game (trước đây lặp byte-identical)
const GUIDE_PILL_TONE =
  "text-amber-800 bg-amber-500/15 border border-amber-300/60";

interface Message {
  id?: string;
  clientId?: string;
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

interface EmotionConfig {
  emoji: string;
  label: string;
  badgeClass: string;
  ringClass: string;
}

const emotionConfigMap: Record<string, EmotionConfig> = {
  neutral: {
    emoji: "😐",
    label: "Bình tĩnh",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    ringClass: "ring-slate-300",
  },
  suspicious: {
    emoji: "🤨",
    label: "Nghi ngờ / Thăm dò",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    ringClass: "ring-amber-400 shadow-amber-200/60 shadow-lg",
  },
  anxious: {
    emoji: "😰",
    label: "Lo âu / Khép kín",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    ringClass: "ring-orange-400 shadow-orange-200/60 shadow-lg",
  },
  friendly: {
    emoji: "😊",
    label: "Thân thiện / Mở lòng",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    ringClass: "ring-emerald-400 shadow-emerald-200/60 shadow-lg",
  },
  angry: {
    emoji: "😡",
    label: "Gắt gỏng / Đe dọa",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    ringClass: "ring-rose-500 shadow-rose-200/80 shadow-lg animate-pulse",
  },
  touched: {
    emoji: "🥹",
    label: "Cảm động / Nhẹ nhõm",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-300",
    ringClass: "ring-teal-400 shadow-teal-200/60 shadow-lg",
  },
};

const scoreLabelMap: Record<string, string> = {
  ROOM_STRANGER: "Điểm An Toàn",
  ROOM_SEXTORTION: "Điểm Bản Lĩnh",
  ROOM_DOCTOR: "Điểm Cởi Mở",
  ROOM_TEEN_CHILD: "Điểm Tin Tưởng",
  ROOM_BULLYING: "Điểm Đồng Cảm",
};

// Quick Response / Suggestion Pills for learners
const quickSuggestionsMap: Record<string, string[]> = {
  ROOM_STRANGER: [
    "Tại sao bạn lại biết trường và tên của mình vậy?",
    "Mình không chia sẻ ảnh cá nhân cho người mới quen qua mạng đâu nhé.",
    "Mình không đi gặp người lạ qua mạng một mình được đâu bạn ạ.",
  ],
  ROOM_SEXTORTION: [
    "Em tuyệt đối không chuyển tiền hay làm theo bất kỳ yêu cầu nào!",
    "Tôi đã chụp màn hình toàn bộ tin nhắn để gửi đến cơ quan công an!",
    "Em sẽ nói ngay cho bố mẹ và thầy cô biết chuyện này để cùng xử lý.",
  ],
  ROOM_DOCTOR: [
    "Dạ thưa bác sĩ, gần đây cơ thể em có những thay đổi dậy thì khiến em rất lo lắng...",
    "Bác sĩ cho em hỏi cách chăm sóc và vệ sinh cơ thể đúng cách mỗi ngày ạ?",
    "Dạ con cảm ơn bác sĩ đã giải thích rất dễ hiểu và khoa học ạ!",
  ],
  ROOM_TEEN_CHILD: [
    "Bố/mẹ thấy dạo này con có vẻ nhiều tâm sự, bố/mẹ chỉ muốn lắng nghe và chia sẻ cùng con thôi.",
    "Hồi bằng tuổi con, bố/mẹ cũng từng có những rung động đầu đời bối rối như thế đấy.",
    "Bố/mẹ luôn tôn trọng quyền riêng tư của con, có điều gì băn khoăn cứ chia sẻ cùng bố/mẹ nhé.",
  ],
  ROOM_BULLYING: [
    "Cậu đừng khóc nữa, cơ thể cậu phát triển hoàn toàn tự nhiên và cậu không có lỗi gì cả!",
    "Nhóm bạn trêu chọc như vậy là hành vi bắt nạt sai trái, chúng mình cùng đi báo cô chủ nhiệm nhé.",
    "Tớ luôn tin tưởng và đồng hành cùng cậu, cậu không phải chịu đựng một mình đâu!",
  ],
};

interface MessageListProps {
  messages: Message[];
  streamingText: string;
  thinking: boolean;
  npcName?: string;
  npcAvatarUrl?: string;
  scoreLabel: string;
  firstMessageSender?: string;
  endRef: React.RefObject<HTMLDivElement | null>;
}

// Log tin nhắn chat: tách khỏi trang + memo để cả trang không phải re-render theo
// từng token SSE / trạng thái thinking (chỉ khối này re-render khi prop của nó đổi)
const MessageList = React.memo(function MessageList({
  messages,
  streamingText,
  thinking,
  npcName,
  npcAvatarUrl,
  scoreLabel,
  firstMessageSender,
  endRef,
}: MessageListProps) {
  return (
    <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 p-4">
          <PlayCircle
            size={48}
            weight="duotone"
            className="text-primary animate-pulse"
          />
          <h3 className="font-black text-on-surface text-sm sm:text-base">
            {firstMessageSender === "USER"
              ? "Lượt mở đầu thuộc về bạn!"
              : "Đang bắt đầu tình huống"}
          </h3>
          <p className="text-xs text-on-surface-variant font-normal leading-relaxed">
            {firstMessageSender === "USER"
              ? `Theo kịch bản, bạn là người chủ động mở lời với ${npcName}. Bạn có thể chọn gợi ý bên dưới hoặc tự do gõ phản xạ của mình!`
              : `Hãy đọc kỹ lời nhắn của ${npcName} bên dưới để có hướng xử lý khôn ngoan nhất.`}
          </p>
        </div>
      )}

      {messages.map((m) => (
        <div
          key={m.id ?? m.clientId}
          className={`flex gap-3 items-end ${
            m.sender === "USER" ? "justify-end" : "justify-start"
          }`}
        >
          {/* NPC Avatar beside message */}
          {m.sender === "NPC" && (
            <img
              src={
                npcAvatarUrl ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
              }
              alt={npcName}
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
              }}
              className="w-8 h-8 rounded-none object-cover border border-white shadow-xs flex-shrink-0 mb-1"
            />
          )}

          <div
            className={`flex flex-col ${m.sender === "USER" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[78%]`}
          >
            <div className="text-[10px] text-on-surface-variant/80 mb-1 px-1 font-semibold">
              {m.sender === "USER" ? "Bạn" : npcName}
            </div>

            <div
              className={`rounded-none p-4 text-sm leading-relaxed shadow-xs ${
                m.sender === "USER"
                  ? "bg-gradient-to-r from-teal-700 to-primary text-white shadow-md"
                  : "bg-surface-container-low text-on-surface border border-outline-variant/30 shadow-xs"
              }`}
            >
              <p className="font-normal whitespace-pre-line">{m.dialogue}</p>
            </div>

            {/* Score Delta Badge */}
            {m.sender === "NPC" && m.score_change !== 0 && (
              <span
                className={`text-[10px] font-extrabold mt-1 px-2.5 py-0.5 rounded-none ${
                  m.score_change! > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {m.score_change! > 0 ? `+${m.score_change}` : m.score_change}{" "}
                {scoreLabel}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Live Streaming NPC Bubble */}
      {streamingText && (
        <div className="flex gap-3 items-end justify-start">
          <img
            src={
              npcAvatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
            }
            alt={npcName}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
            }}
            className="w-8 h-8 rounded-full object-cover border border-white shadow-xs flex-shrink-0 mb-1"
          />
          <div className="flex flex-col items-start max-w-[85%] sm:max-w-[78%]">
            <div className="text-[10px] text-on-surface-variant/80 mb-1 px-1 font-semibold">
              {npcName}
            </div>
            <div className="rounded-3xl rounded-bl-xs p-4 text-sm leading-relaxed bg-surface-container-low text-on-surface border border-outline-variant/30 shadow-xs">
              <p className="font-normal whitespace-pre-line">
                {streamingText}
                <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-1 animate-pulse align-middle" />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Natural Chat Typing Indicator (Zalo / Messenger / iMessage style) */}
      {thinking && !streamingText && (
        <div className="flex gap-3 items-end justify-start">
          <img
            src={
              npcAvatarUrl ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
            }
            alt={npcName}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
            }}
            className="w-8 h-8 rounded-full object-cover border border-white shadow-xs flex-shrink-0 mb-1"
          />
          <div className="flex flex-col items-start max-w-[85%] sm:max-w-[78%]">
            <div className="text-[10px] text-on-surface-variant/80 mb-1 px-1 font-semibold">
              {npcName}
            </div>
            <div className="bg-surface-container-low text-on-surface rounded-3xl rounded-bl-xs px-4 py-3 border border-outline-variant/30 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-on-surface-variant/50 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
});

interface ChatInputProps {
  roomCode?: string;
  disabled: boolean;
  ended: boolean;
  onSend: (text: string) => void;
}

// Khung nhập chat: uncontrolled (đọc value qua ref lúc submit) để từng keystroke
// không làm re-render trang; quick pills điền thẳng vào ô nhập qua ref
const ChatInput = React.memo(function ChatInput({
  roomCode,
  disabled,
  ended,
  onSend,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasText, setHasText] = useState(false);
  const quickPills = roomCode ? quickSuggestionsMap[roomCode] || [] : [];

  const submit = () => {
    const text = inputRef.current?.value ?? "";
    if (!text.trim() || disabled) return;
    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
    setHasText(false);
  };

  return (
    <>
      {/* Quick Response Pills Area */}
      {!ended && quickPills.length > 0 && (
        <div className="px-4 py-2 bg-surface-container-lowest border-t border-outline-variant/20 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <Lightbulb size={13} weight="fill" className="text-amber-500" />
            Gợi ý phản xạ:
          </span>
          {quickPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = pill;
                setHasText(true);
              }}
              className="text-[11px] font-medium text-on-surface bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-outline-variant/30 px-3 py-1 rounded-none transition-all cursor-pointer text-left truncate max-w-[280px] shadow-2xs"
              title="Nhấn để điền nhanh"
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="p-3 sm:p-4 bg-surface-container-low/70 border-t border-outline-variant/30 flex items-center gap-3"
      >
        <input
          type="text"
          ref={inputRef}
          onChange={(e) => setHasText(e.target.value.trim().length > 0)}
          disabled={disabled || ended}
          placeholder={
            ended
              ? "Phiên chơi đã kết thúc. Vui lòng xem đánh giá hoặc chơi lại."
              : "Nhập phản xạ hoặc cách xử lý của bạn..."
          }
          className="flex-grow bg-white border border-outline-variant/40 rounded-none px-5 py-3 text-xs sm:text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface disabled:bg-surface-container disabled:text-on-surface-variant/50"
        />
        <button
          disabled={!hasText || disabled || ended}
          type="submit"
          className="w-11 h-11 flex-shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-none flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-depth-1 hover:shadow-depth-2"
        >
          <PaperPlaneTilt size={20} weight="fill" />
        </button>
      </form>
    </>
  );
});

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // 1. Chuẩn hóa các lỗi markdown và dọn sạch emoji LLM sinh ra
  const normalized = text
    .replace(EMOJI_REGEX, "")
    .replace(/\*\*([^*]+):\*/g, "**$1:**")
    .replace(/\*([^*]+):\*\*/g, "**$1:**")
    .replace(/:\s*\*+\s*$/, ":")
    .replace(/\*+\s*([.,;!?])/g, "$1") // xóa dấu sao trước dấu chấm/phẩy (vd: tuyệt đối*.)
    .replace(/([.,;!?])\s*\*+/g, "$1 ") // xóa dấu sao sau dấu chấm
    .replace(/:\s*\*+/g, ": "); // xóa ": *" thành ": "

  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      // Làm sạch bất kỳ ký tự `*` mồ côi nào còn sót lại
      const plain = normalized.substring(lastIndex, match.index).replace(/\*/g, "");
      if (plain) parts.push(plain);
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      const content = token.slice(2, -2).replace(/\*/g, "").trim();
      if (content) {
        parts.push(
          <strong key={match.index} className="font-bold text-on-surface">
            {content}
          </strong>,
        );
      }
    } else if (token.startsWith("*") && token.endsWith("*")) {
      const content = token.slice(1, -1).replace(/\*/g, "").trim();
      if (content) {
        parts.push(
          <span key={match.index} className="font-bold text-primary">
            {content}
          </span>,
        );
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    const trailing = normalized.substring(lastIndex).replace(/\*/g, "");
    if (trailing) parts.push(trailing);
  }

  return parts;
}

function PedagogicalFeedback({ content }: { content: string }) {
  if (!content) return null;

  const paragraphs = content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2 text-xs text-on-surface leading-relaxed">
      {paragraphs.map((p, idx) => {
        const lower = p.toLowerCase();
        const isGoldRule = lower.includes("nguyên tắc vàng") || lower.includes("cần ghi nhớ");
        const isGoodPoint = /Điểm tốt/i.test(p);
        const isImprovePoint = /(Điểm cần khắc phục|Cần lưu ý|khắc phục)/i.test(p);
        const isHeading = /^[*_#\s]*[1-3][.)]/.test(p);

        if (isGoldRule) {
          const ruleContent = p
            .replace(EMOJI_REGEX, "")
            .replace(/^[\s*•\-_—]*/, "")
            .replace(/\*?Nguyên tắc vàng(\s+cần ghi nhớ)?:?\*?/i, "")
            .replace(/^[\s*•\-_—:]+/, "")
            .replace(/[\s*]+$/, "")
            .trim();
          return (
            <div
              key={idx}
              className="mt-1.5 p-2.5 rounded-none bg-amber-500/10 border border-amber-300/60 text-amber-950 font-medium space-y-1 shadow-2xs"
            >
              <div className="flex items-center gap-1.5 font-black text-amber-800 text-[11px] uppercase tracking-wide">
                <Star size={15} weight="fill" className="text-amber-600" />
                <span>Nguyên Tắc Vàng Cần Ghi Nhớ</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-950/90 font-medium">
                {parseInlineMarkdown(ruleContent)}
              </p>
            </div>
          );
        }

        if (isGoodPoint) {
          const cleanText = p
            .replace(EMOJI_REGEX, "")
            .replace(/^[\s*•\-_—]*/, "")
            .replace(/\*?\*?Điểm tốt:\*?\*?/i, "")
            .replace(/^[\s*•\-_—:]+/, "")
            .replace(/[\s*]+$/, "")
            .trim();
          return (
            <div
              key={idx}
              className="p-2.5 rounded-none bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 text-[11px] leading-relaxed flex items-start gap-2"
            >
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                <span className="font-extrabold text-emerald-800">
                  Điểm tốt:
                </span>
              </div>
              <span className="flex-1 text-emerald-900">
                {parseInlineMarkdown(cleanText)}
              </span>
            </div>
          );
        }

        if (isImprovePoint) {
          const cleanText = p
            .replace(EMOJI_REGEX, "")
            .replace(/^[\s*•\-_—]*/, "")
            .replace(/\*?\*?(Điểm cần khắc phục|Cần lưu ý):\*?\*?/i, "")
            .replace(/^[\s*•\-_—:]+/, "")
            .replace(/[\s*]+$/, "")
            .trim();
          return (
            <div
              key={idx}
              className="p-2.5 rounded-none bg-orange-50/90 border border-orange-200/80 text-orange-950 text-[11px] leading-relaxed flex items-start gap-2"
            >
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <WarningCircle size={15} weight="fill" className="text-orange-600" />
                <span className="font-extrabold text-orange-800">
                  Cần lưu ý:
                </span>
              </div>
              <span className="flex-1 text-orange-900">
                {parseInlineMarkdown(cleanText)}
              </span>
            </div>
          );
        }

        if (isHeading) {
          // Làm sạch dấu `*` ở đầu và cuối heading (ví dụ: *1. Hướng đi...:*)
          const cleanHeading = p
            .replace(EMOJI_REGEX, "")
            .replace(/^[\s*•\-_—#]+/, "")
            .replace(/:\s*\*+\s*$/, ":")
            .replace(/[\s*]+$/, "")
            .trim();
          return (
            <div key={idx} className="pt-1.5 first:pt-0">
              <p className="font-extrabold text-[12px] text-primary">
                {parseInlineMarkdown(cleanHeading)}
              </p>
            </div>
          );
        }

        const cleanParagraph = p
          .replace(EMOJI_REGEX, "")
          .replace(/^[\s*•\-_—]+/, "")
          .replace(/[\s*]+$/, "")
          .trim();

        return (
          <p key={idx} className="text-on-surface/90">
            {parseInlineMarkdown(cleanParagraph)}
          </p>
        );
      })}
    </div>
  );
}

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
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );

  // Chat state
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
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // Cảnh báo khi người dùng vô tình reload hoặc đóng tab khi đang trò chuyện
  useEffect(() => {
    if (session?.status !== "ACTIVE") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session?.status]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat (throttle 1 lần/frame để không cuộn liên tục theo từng token stream)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
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
      if (res.result_outcome === "THẮNG CUỘC" || res.final_score >= 70) {
        // Nạp canvas-confetti lazily ngay trước khi bắn (tránh nằm trong bundle chính)
        const confetti = (await import("canvas-confetti")).default;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      console.warn(
        "Chưa có báo cáo đánh giá hoặc đang được tổng hợp:",
        err?.message,
      );
    } finally {
      setLoadingEval(false);
    }
  };

  const handleSendMessage = async (messageToSend: string) => {
    if (!messageToSend.trim() || thinking || streamingText) return;

    setError("");
    setLastFailedMessage(null);

    // Thêm tin nhắn của User vào UI ngay lập tức (clientId để key danh sách ổn định)
    setMessages((prev) => [
      ...prev,
      {
        sender: "USER",
        dialogue: messageToSend,
        clientId: crypto.randomUUID(),
      },
    ]);
    setThinking(true);
    setThinkingStatus("AI đang phân tích phản xạ...");
    setStreamingText("");

    try {
      const token = api.getToken();
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      // Base URL giải quyết lúc runtime — luồng SSE giữ nguyên đường đi trực tiếp
      // browser → Render, không qua Vercel Function (tránh bị cắt/buffer stream).
      const BASE_URL = await getApiBaseUrl();

      const response = await fetch(
        `${BASE_URL}/roleplay/sessions/${sessionId}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: messageToSend }),
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          api.clearAuth();
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Có lỗi xảy ra khi truyền tin");
      }

      const reader = response.body?.getReader();
      if (!reader)
        throw new Error("Không thể khởi động luồng truyền dữ liệu stream");

      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let turnFinalized = false;

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
          } else if (
            eventName === "turn_complete" ||
            eventName === "complete"
          ) {
            if (turnFinalized) continue;
            turnFinalized = true;
            setThinking(false);
            setError("");
            setLastFailedMessage(null);
            try {
              const data = JSON.parse(dataText);
              const emotion = data.current_emotion || data.emotion || "neutral";

              // Cập nhật session điểm & biểu cảm
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      current_score: data.current_score,
                      current_emotion: emotion,
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
                  emotion: emotion,
                  score_change: data.score_change,
                  clientId: crypto.randomUUID(),
                },
              ]);

              setStreamingText("");

              // Kiểm tra nếu màn chơi kết thúc
              if (data.status === "WON" || data.status === "LOST") {
                setTimeout(() => {
                  fetchEvaluation();
                }, 1200);
              }
            } catch (e) {}
          } else if (eventName === "error") {
            try {
              const data = JSON.parse(dataText);
              setError(data.detail || "Có lỗi từ AI Engine");
              setLastFailedMessage(messageToSend);
            } catch (e) {
              setError("Có lỗi từ AI Engine");
              setLastFailedMessage(messageToSend);
            }
            setThinking(false);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối phòng chat");
      setLastFailedMessage(messageToSend);
    } finally {
      setThinking(false);
    }
  };

  const handleRequestExit = () => {
    if (session?.status === "ACTIVE") {
      setShowExitConfirmModal(true);
    } else {
      router.push("/game");
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirmModal(false);
    router.push("/game");
  };

  // Dynamic status text and color for safety gauge
  const score = session?.current_score ?? 50;
  const scoreTheme = useMemo(() => {
    if (score < 30) {
      return {
        barColor: "from-rose-500 to-red-600",
        textColor: "text-rose-600",
        badgeBg: "bg-rose-50 border-rose-200 text-rose-700",
        statusText: "Mức Nguy Hiểm! Cần cảnh giác cao độ",
      };
    }
    if (score < 70) {
      return {
        barColor: "from-amber-400 to-orange-500",
        textColor: "text-amber-700",
        badgeBg: "bg-amber-50 border-amber-200 text-amber-800",
        statusText: "Đang Thăm Dò / Cần giữ vững ranh giới",
      };
    }
    return {
      barColor: "from-teal-400 to-emerald-500",
      textColor: "text-emerald-700",
      badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      statusText: "An Toàn & Bảo Vệ Ranh Giới Tốt",
    };
  }, [score]);

  const scoreLabel = scenario
    ? scoreLabelMap[scenario.room_code] || "Điểm An Toàn"
    : "Điểm An Toàn";
  const currentEmotion = session?.current_emotion || "neutral";
  const emotionConfig =
    emotionConfigMap[currentEmotion] || emotionConfigMap.neutral;
  const isSessionEnded =
    session?.status === "WON" ||
    session?.status === "LOST" ||
    session?.status === "ABANDONED";

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <PageLoader
          minHeight="screen"
          className="py-20"
          label="Đang chuẩn bị buồng mô phỏng tình huống..."
        />
      </div>
    );
  }

  // Lỗi tải phiên: hiển thị màn lỗi thay vì render phòng chơi rỗng (giữ nguyên hành vi bản cũ)
  if (error && !session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-surface">
        <EmptyState
          icon={<WarningCircle size={40} weight="duotone" />}
          title="Đã xảy ra lỗi"
          body={error}
          tone="error"
          action={{
            label: "Trở về Góc giải trí",
            onClick: () => router.push("/game"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col overflow-hidden bg-gradient-to-br from-surface via-surface-container-low/30 to-surface-container-high/20">
      {/* Top HUD Bar */}
      <header className="w-full h-14 sm:h-16 bg-white/90 backdrop-blur-xl border-b border-outline-variant/30 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleRequestExit}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer flex-shrink-0"
            title="Quay lại danh sách"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-on-surface truncate">
                {scenario?.title}
              </h1>
              {session?.status === "ACTIVE" && (
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Đang diễn ra
                </span>
              )}
              {session?.status === "WON" && (
                <Badge tone="bg-teal-50 text-teal-800 border border-teal-200">
                  🏆 Thắng cuộc
                </Badge>
              )}
              {session?.status === "LOST" && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  ⚠️ Chưa an toàn
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant font-medium truncate">
              Nhân vật đối thoại:{" "}
              <strong className="text-primary">{scenario?.npc_name}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {scenario?.guide_script && (
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="text-xs font-black text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 px-3.5 py-2 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Lightning size={16} weight="fill" className="text-amber-600" />
              <span className="hidden md:inline">Bí kíp 3s</span>
            </button>
          )}

          {!isSessionEnded ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleRequestExit}
              className="cursor-pointer shadow-xs"
            >
              Thoát chơi
            </Button>
          ) : (
            <button
              onClick={() => setShowEvalModal(true)}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-black px-4 py-2 rounded-none flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
            >
              <Trophy size={16} weight="fill" />
              Xem Đánh giá
            </button>
          )}
        </div>
      </header>

      {/* Main Simulation Workspace Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-5 gap-4 lg:gap-6 items-stretch overflow-hidden">
        {/* Left Panel: NPC Cockpit & Dynamic Safety Gauge */}
        <aside className="lg:col-span-4 flex flex-col h-full min-h-0 overflow-y-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-none p-5 lg:p-6 shadow-sm flex flex-col items-center text-center relative overflow-y-auto h-full justify-between gap-3">
            {/* Score change floating pulse */}
            {scoreChangeFlash && (
              <div
                key={scoreChangeFlash.key}
                className={`absolute top-4 right-4 text-xs font-black animate-bounce px-3 py-1 rounded-none shadow-md z-10 ${
                  scoreChangeFlash.value > 0
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
              >
                {scoreChangeFlash.value > 0
                  ? `+${scoreChangeFlash.value}`
                  : scoreChangeFlash.value}{" "}
                {scoreLabel}
              </div>
            )}

            {/* NPC Avatar with Dynamic Emotion Ring */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3 mt-1">
                <img
                  src={
                    scenario?.npc_avatar_url ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
                  }
                  alt={scenario?.npc_name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200";
                  }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-none object-cover border-4 border-white shadow-lg transition-all duration-500 ring-4 ${emotionConfig.ringClass}`}
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-white rounded-none shadow-sm" />
              </div>

              <h2 className="text-base sm:text-lg font-black text-on-surface">
                {scenario?.npc_name}
              </h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {scenario?.target_audience === "CHILD"
                  ? "Học sinh"
                  : "Cố vấn chuyên gia"}
              </p>

              {/* Dynamic Emotion Badge */}
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-bold border shadow-xs transition-all duration-300">
                <span className="text-sm">{emotionConfig.emoji}</span>
                <span className={emotionConfig.badgeClass.split(" ")[1]}>
                  {emotionConfig.label}
                </span>
              </div>
            </div>

            {/* Dynamic Safety/Openness Gauge */}
            <div className="w-full bg-surface-container-low/90 rounded-none p-4 border border-outline-variant/30 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-on-surface-variant">
                  {scoreLabel}
                </span>
                <span
                  className={`font-black text-base ${scoreTheme.textColor}`}
                >
                  {score}/100
                </span>
              </div>

              {/* Progress Bar with Color Shift */}
              <div className="w-full bg-surface-container h-3 rounded-none overflow-hidden p-0.5 border border-outline-variant/20">
                <div
                  className={`bg-gradient-to-r ${scoreTheme.barColor} h-full rounded-none transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className={`font-semibold ${scoreTheme.textColor}`}>
                  {scoreTheme.statusText}
                </span>
              </div>
            </div>

            {/* Core Mission Mini Card */}
            <div className="w-full bg-primary/5 rounded-none p-3.5 border border-primary/20 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Target size={15} weight="bold" />
                <span>Nhiệm vụ cốt lõi</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                {scenario?.description ||
                  "Bình tĩnh lắng nghe, giữ vững ranh giới bảo mật thông tin và xử lý an toàn."}
              </p>
            </div>
          </div>
        </aside>

        {/* Right Panel: Chat Simulation Cockpit */}
        <main className="lg:col-span-8 flex flex-col bg-white/90 backdrop-blur-xl border border-white/80 rounded-none overflow-hidden shadow-sm h-full min-h-0">
          {/* Chat Messages Log */}
          <MessageList
            messages={messages}
            streamingText={streamingText}
            thinking={thinking}
            npcName={scenario?.npc_name}
            npcAvatarUrl={scenario?.npc_avatar_url}
            scoreLabel={scoreLabel}
            firstMessageSender={scenario?.first_message_sender}
            endRef={chatEndRef}
          />

          {/* Error Alert Bar with Retry */}
          {error && session && (
            <div className="mx-4 sm:mx-6 mb-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <WarningCircle
                  size={18}
                  weight="fill"
                  className="text-rose-600 flex-shrink-0"
                />
                <span className="truncate font-medium">{error}</span>
              </div>
              {error.includes("đăng nhập") ? (
                <Link
                  href="/login"
                  className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-xs inline-block"
                >
                  Đăng nhập lại
                </Link>
              ) : lastFailedMessage ? (
                <button
                  type="button"
                  onClick={() => handleSendMessage(lastFailedMessage)}
                  className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-xs"
                >
                  Thử lại
                </button>
              ) : null}
            </div>
          )}

          <ChatInput
            roomCode={scenario?.room_code}
            disabled={thinking || !!streamingText}
            ended={isSessionEnded}
            onSend={handleSendMessage}
          />
        </main>
      </div>

      {/* Evaluation Modal (Thắng/Thua Certificate Screen) */}
      <Modal
        open={showEvalModal && !!evaluation}
        onClose={() => setShowEvalModal(false)}
        dismissible={false}
        size="xl"
        backdropClassName="bg-black/60 backdrop-blur-md"
        panelClassName="border border-white/80 p-5 sm:p-6 rounded-none max-h-[86vh] flex flex-col overflow-hidden shadow-2xl space-y-3 sm:max-w-2xl"
      >
        {showEvalModal && evaluation && (
          <>
            {/* Outcome Header */}
            <div className="text-center shrink-0 space-y-1">
              <div
                className={`w-12 h-12 rounded-none flex items-center justify-center mx-auto text-2xl shadow-sm ${
                  session?.status === "WON" || evaluation.final_score >= 70
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {session?.status === "WON" || evaluation.final_score >= 70 ? (
                  <Trophy size={28} weight="fill" />
                ) : (
                  <ShieldWarning size={28} weight="fill" />
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-on-surface">
                {session?.status === "WON" || evaluation.final_score >= 70
                  ? "Hoàn Thành Tình Huống Xuất Sắc!"
                  : "Màn Chơi Cần Rút Kinh Nghiệm"}
              </h2>
            </div>

            {/* Quantitative Stats */}
            <div className="shrink-0 grid grid-cols-3 gap-2 bg-surface-container-low/80 rounded-none border border-outline-variant/30 py-2.5 px-3">
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Điểm Phản Xạ
                </p>
                <p className="text-lg sm:text-xl font-black text-primary mt-0.5">
                  {evaluation.final_score}/100
                </p>
              </div>
              <div className="text-center border-x border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Số Lượt Chat
                </p>
                <p className="text-lg sm:text-xl font-black text-on-surface mt-0.5">
                  {evaluation.total_turns} lượt
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Thời Gian
                </p>
                <p className="text-lg sm:text-xl font-black text-on-surface mt-0.5">
                  {Math.floor(evaluation.duration_seconds / 60)}m{" "}
                  {evaluation.duration_seconds % 60}s
                </p>
              </div>
            </div>

            {/* AI Pedagogical Feedback Section */}
            <div className="flex-1 min-h-0 flex flex-col bg-primary/5 rounded-none border border-primary/20 p-3.5 sm:p-4 overflow-hidden">
              <div className="shrink-0 flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-wider mb-2">
                <Brain size={18} weight="duotone" />
                <span>Nhận Xét &amp; Phân Tích Sư Phạm Từ AI</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5">
                <PedagogicalFeedback content={evaluation.ai_feedback_summary} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="shrink-0 flex flex-col sm:flex-row justify-center gap-2.5 pt-1">
              <button
                onClick={async () => {
                  setShowEvalModal(false);
                  if (scenario) {
                    try {
                      setLoading(true);
                      try {
                        await api.delete(`/roleplay/sessions/${sessionId}`);
                      } catch (_) {}
                      const res = await api.post("/roleplay/sessions", {
                        scenario_id: scenario.id,
                      });
                      window.location.href = `/game/${res.id}`;
                    } catch (err: any) {
                      alert(err.message || "Không thể tạo phiên chơi lại");
                      setLoading(false);
                    }
                  }
                }}
                className="h-10 px-6 rounded-none bg-primary hover:bg-primary/90 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
              >
                <ArrowCounterClockwise size={16} weight="bold" />
                Chơi lại tình huống
              </button>
              <button
                onClick={() => {
                  setShowEvalModal(false);
                  router.push("/game");
                }}
                className="h-10 px-6 rounded-none border border-outline/30 bg-white hover:bg-surface-container text-on-surface font-bold text-xs cursor-pointer transition-all"
              >
                Chọn kịch bản khác
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Guide Script In-Game Modal */}
      <Modal
        open={showGuideModal && !!scenario?.guide_script}
        onClose={() => setShowGuideModal(false)}
        size="xl"
        panelClassName="border border-white/80 p-6 sm:p-8 rounded-none sm:max-w-4xl lg:max-w-5xl space-y-5"
      >
        {showGuideModal && scenario?.guide_script && (
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
                <h3 className="text-xl sm:text-2xl font-black text-on-surface mt-1">
                  {scenario.title}
                </h3>
              </div>
            </div>

            {/* Rich Visual DO vs DON'T Guide Content */}
            <GuideScriptViewer
              roomCode={scenario.room_code}
              rawScript={scenario.guide_script}
              npcName={scenario.npc_name}
            />

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="h-11 px-7 rounded-none bg-primary hover:bg-primary/90 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Tiếp tục tình huống
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal: Xác nhận khi thoát cuộc trò chuyện dở dang */}
      <Modal
        open={showExitConfirmModal}
        onClose={() => setShowExitConfirmModal(false)}
        size="md"
        showClose={false}
        panelClassName="p-6 sm:p-8 space-y-6 text-center rounded-none"
      >
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-black text-on-surface tracking-tight">
            Bạn có chắc muốn rời cuộc trò chuyện?
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowExitConfirmModal(false)}
            className="h-10 px-6 rounded-none border border-outline-variant/40 bg-white hover:bg-surface-container text-on-surface font-bold text-xs transition-all cursor-pointer"
          >
            Ở lại
          </button>
          <button
            type="button"
            onClick={handleConfirmExit}
            className="h-10 px-7 rounded-none bg-primary hover:opacity-90 text-white font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            Thoát
          </button>
        </div>
      </Modal>
    </div>
  );
}
