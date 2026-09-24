"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import "plyr/dist/plyr.css";
import {
  Play,
  Pause,
  SpeakerHigh,
  SpeakerSimpleX,
  ArrowCounterClockwise,
  ArrowClockwise,
  DownloadSimple,
  ArrowSquareOut,
  Sparkle,
  Headphones,
} from "@phosphor-icons/react";

import {
  detectMediaPlatform,
  DetectedMedia,
  PlatformType,
} from "@/lib/videoPlatformDetector";

export { detectMediaPlatform as detectMediaSource };

interface VideoPlayerProps {
  url: string;
  title?: string;
  contentType?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export function VideoPlayer({
  url,
  title = "Bài học",
  contentType = "HYBRID",
  autoPlay = true,
  onEnded,
}: VideoPlayerProps) {
  const media = useMemo(
    () => detectMediaPlatform(url, contentType),
    [url, contentType]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Audio Player State for direct audio / NotebookLM audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Standard Plyr initialization for YouTube, Vimeo, and MP4 Video
  useEffect(() => {
    if (media.isIframeEmbed || media.platform === "NOTEBOOKLM" || media.platform === "AUDIO") {
      return;
    }

    let isMounted = true;

    async function initPlayer() {
      if (!containerRef.current) return;

      if (playerRef.current) {
        try {
          const prev = playerRef.current;
          playerRef.current = null;
          if (prev && typeof prev.destroy === "function") {
            prev.destroy();
          }
        } catch (e) {
          // ignore
        }
      }

      const targetElement = containerRef.current.querySelector(
        "video, div[data-plyr-provider]"
      ) as HTMLElement | null;

      if (!targetElement) return;

      try {
        const plyrImport: any = await import("plyr");
        const PlyrClass = plyrImport.default || plyrImport;

        if (!isMounted || !containerRef.current) return;

        const player = new PlyrClass(targetElement, {
          autoplay: autoPlay,
          clickToPlay: true,
          hideControls: true,
          resetOnEnd: true,
          controls: [
            "play",
            "progress",
            "current-time",
            "duration",
            "mute",
            "volume",
            "settings",
            "pip",
            "fullscreen",
          ],
          settings: ["quality", "speed"],
          speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] },
          seekTime: 10,
          youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            cc_load_policy: 0,
            cc_lang_pref: "off",
            hl: "vi",
          },
          vimeo: {
            byline: false,
            portrait: false,
            title: false,
            speed: true,
            transparent: false,
          },
          keyboard: { focused: false, global: false },
          tooltips: { controls: true, seek: false },
          i18n: {
            restart: "Phát lại từ đầu",
            rewind: "Tua lại {seektime}s",
            play: "Phát",
            pause: "Tạm dừng",
            fastForward: "Tua tới {seektime}s",
            seek: "Thanh thời gian",
            seekLabel: "{currentTime} trên {duration}",
            played: "Đã xem",
            buffered: "Đã tải",
            currentTime: "Thời gian hiện tại",
            duration: "Tổng thời lượng",
            volume: "Âm lượng",
            mute: "Tắt tiếng",
            unmute: "Bật tiếng",
            enterFullscreen: "Xem toàn màn hình",
            exitFullscreen: "Thoát toàn màn hình",
            frameTitle: "Trình phát {title}",
            settings: "Cài đặt",
            speed: "Tốc độ phát",
            quality: "Chất lượng",
          },
        });

        // Patch player instance against Plyr's unmount destructuring bug
        if (player) {
          const originalDestroy = player.destroy.bind(player);
          player.destroy = () => {
            try {
              if (player.elements && player.elements.container) {
                originalDestroy();
              }
            } catch (e) {}
          };
        }

        const disableCaptions = () => {
          try {
            if (player.captions) player.captions.active = false;
            if (typeof player.toggleCaptions === "function") player.toggleCaptions(false);
            if (player.embed && typeof player.embed.unloadModule === "function") {
              player.embed.unloadModule("captions");
              player.embed.unloadModule("cc");
            }
          } catch (e) {}
        };

        player.on("ready", disableCaptions);
        player.on("play", disableCaptions);
        player.on("playing", disableCaptions);

        playerRef.current = player;

        if (onEnded) {
          player.on("ended", () => {
            onEnded();
          });
        }
      } catch (err) {
        console.error("Failed to initialize Plyr", err);
      }
    }

    initPlayer();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          const p = playerRef.current;
          playerRef.current = null;
          if (p && typeof p.destroy === "function") {
            p.destroy();
          }
        } catch (e) {}
      }
    };
  }, [media, autoPlay, onEnded]);

  // Audio helper handlers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skipAudio = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      Math.max(0, audioRef.current.currentTime + seconds),
      duration
    );
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    audioRef.current.muted = newMute;
    setIsMuted(newMute);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec === 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 1. Iframe Embed Media (Google Drive, Facebook, TikTok, Loom, Dailymotion, Generic)
  if (media.isIframeEmbed && media.embedUrl) {
    return (
      <div className="w-full h-full aspect-video bg-black rounded-none border border-outline-variant/30 overflow-hidden relative group flex flex-col items-center justify-center">
        <iframe
          src={media.embedUrl}
          className="w-full h-full border-0 rounded-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  // 2. NotebookLM Notebook Share Link
  if (media.platform === "NOTEBOOKLM") {
    return (
      <div className="w-full h-full aspect-video bg-[#121316] text-white rounded-none border border-outline-variant/30 flex flex-col items-center justify-center p-8 text-center relative select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white font-bold text-xs uppercase tracking-wider mb-4 border border-white/20">
          <Sparkle size={16} weight="fill" className="text-emerald-400" />
          <span>Google NotebookLM</span>
        </div>
        <h3 className="text-xl font-extrabold max-w-xl mb-2">{title}</h3>
        <p className="text-xs text-white/70 max-w-md mb-6 leading-relaxed">
          Tài liệu & Audio Overview được tạo từ Google NotebookLM. Bạn có thể mở trực tiếp không gian làm việc số để nghiên cứu sâu.
        </p>
        <a
          href={media.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors cursor-pointer border border-primary/40 shadow-sm"
        >
          <span>Mở NotebookLM & Nghe Audio Overview</span>
          <ArrowSquareOut size={16} weight="bold" />
        </a>
      </div>
    );
  }

  // 3. Audio / Podcast Studio Player (NotebookLM Audio Overview .m4a / .mp3 / .wav)
  if (media.platform === "AUDIO") {
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div className="w-full h-full aspect-video bg-[#0f1412] text-white rounded-none border border-outline-variant/30 flex flex-col justify-between p-6 sm:p-8 relative select-none overflow-hidden">
        <audio
          ref={audioRef}
          src={media.originalUrl}
          autoPlay={autoPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (onEnded) onEnded();
          }}
        />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider border border-primary/40">
              <Headphones size={14} weight="bold" />
              NotebookLM Audio Overview
            </span>
            <span className="text-xs text-white/50 hidden sm:inline">• Hai chuyên gia AI đàm luận</span>
          </div>

          <a
            href={media.originalUrl}
            download
            className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors"
            title="Tải tệp âm thanh về máy"
          >
            <DownloadSimple size={14} weight="bold" />
            <span className="hidden sm:inline">Tải audio</span>
          </a>
        </div>

        {/* Center: Title & Sound Wave Visualizer */}
        <div className="flex flex-col items-center justify-center my-auto py-2 text-center">
          <h3 className="text-base sm:text-xl font-black max-w-xl text-white mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-white/60 font-light mb-6">
            Bản tóm tắt phân tích chuyên sâu (Deep Dive Podcast)
          </p>

          {/* Animated sound wave bars */}
          <div className="flex items-end justify-center gap-1 h-12 w-full max-w-xs px-4">
            {[40, 65, 85, 30, 95, 50, 75, 100, 60, 80, 45, 90, 70, 35, 85, 55, 65, 90, 40, 75].map((h, i) => (
              <span
                key={i}
                className="w-1.5 bg-primary transition-all duration-300"
                style={{
                  height: isPlaying ? `${Math.max(12, (h * (0.6 + 0.4 * Math.sin(currentTime * 3 + i))))}%` : "16%",
                  opacity: isPlaying ? 0.9 : 0.35,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom: Player Controls */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          {/* Progress Slider */}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="w-10 text-right font-mono text-[11px]">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleAudioSeek}
                className="w-full h-1.5 bg-white/20 accent-primary rounded-none cursor-pointer appearance-none"
              />
            </div>
            <span className="w-10 font-mono text-[11px]">{formatTime(duration)}</span>
          </div>

          {/* Buttons bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeed}
                className="px-2.5 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
                title="Tốc độ phát"
              >
                {playbackRate}x
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => skipAudio(-10)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                title="Lùi 10 giây"
              >
                <ArrowCounterClockwise size={20} weight="bold" />
              </button>

              <button
                onClick={togglePlayAudio}
                className="w-12 h-12 bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors shadow-md cursor-pointer border border-primary/40"
                title={isPlaying ? "Tạm dừng" : "Phát"}
              >
                {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" className="ml-0.5" />}
              </button>

              <button
                onClick={() => skipAudio(10)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                title="Tiến 10 giây"
              >
                <ArrowClockwise size={20} weight="bold" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
              >
                {isMuted ? <SpeakerSimpleX size={20} weight="bold" /> : <SpeakerHigh size={20} weight="bold" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default: YouTube / Vimeo / Direct Video (Plyr)
  return (
    <div
      ref={containerRef}
      className="custom-video-wrapper w-full aspect-video bg-black rounded-none overflow-hidden border border-outline-variant/30 relative select-none group"
    >
      {media.platform === "YOUTUBE" && media.id ? (
        <div
          key={`yt-${media.id}`}
          data-plyr-provider="youtube"
          data-plyr-embed-id={media.id}
          className="w-full h-full"
        />
      ) : media.platform === "VIMEO" && media.id ? (
        <div
          key={`vimeo-${media.id}`}
          data-plyr-provider="vimeo"
          data-plyr-embed-id={media.id}
          className="w-full h-full"
        />
      ) : (
        <video
          key={`video-${media.originalUrl}`}
          src={media.originalUrl}
          playsInline
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
