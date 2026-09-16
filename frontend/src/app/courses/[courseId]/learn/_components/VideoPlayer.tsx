"use client";

import React, { useEffect, useRef } from "react";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  url: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export function VideoPlayer({
  url,
  title = "Bài học",
  autoPlay = true,
  onEnded,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const trimmedUrl = (url || "").trim();

  // Detect YouTube ID (supports raw 11-char ID or full URL)
  let youtubeId: string | null = null;
  if (/^[\w-]{11}$/.test(trimmedUrl)) {
    youtubeId = trimmedUrl;
  } else {
    const ytMatch = trimmedUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
    );
    youtubeId = ytMatch ? ytMatch[1] : null;
  }

  // Detect Vimeo ID (supports raw digits ID or full URL)
  let vimeoId: string | null = null;
  if (/^\d{6,12}$/.test(trimmedUrl)) {
    vimeoId = trimmedUrl;
  } else {
    const vimeoMatch = trimmedUrl.match(/vimeo\.com\/(\d+)/i);
    vimeoId = vimeoMatch ? vimeoMatch[1] : null;
  }

  useEffect(() => {
    let isMounted = true;

    async function initPlayer() {
      if (!containerRef.current) return;

      // Safe destroy existing instance if any
      if (playerRef.current) {
        try {
          const prev = playerRef.current;
          playerRef.current = null;
          if (prev && typeof prev.destroy === "function") {
            prev.destroy();
          }
        } catch (e) {
          // ignore cleanup race conditions
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
          speed: { selected: 1, options: [0.75, 1, 1.25, 1.5] },
          seekTime: 0,
          captions: { active: false, language: "auto", update: false },
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
            enableCaptions: "Bật phụ đề",
            disableCaptions: "Tắt phụ đề",
            download: "Tải xuống",
            enterFullscreen: "Xem toàn màn hình",
            exitFullscreen: "Thoát toàn màn hình",
            frameTitle: "Trình phát {title}",
            captions: "Phụ đề",
            settings: "Cài đặt",
            pip: "Hình trong hình (PiP)",
            speed: "Tốc độ phát",
            quality: "Chất lượng",
            loop: "Lặp lại",
            normal: "Bình thường",
            qualityBadge: {
              2160: "4K",
              1440: "2K",
              1080: "FHD",
              720: "HD",
              576: "SD",
              480: "SD",
            },
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
            } catch (e) {
              // Suppress internal Plyr unmount race condition
            }
          };
        }

        // Forcefully ensure YouTube native captions and subtitles are unloaded and disabled
        const disableCaptions = () => {
          try {
            if (player.captions) {
              player.captions.active = false;
            }
            if (typeof player.toggleCaptions === "function") {
              player.toggleCaptions(false);
            }
            if (player.embed) {
              if (typeof player.embed.unloadModule === "function") {
                player.embed.unloadModule("captions");
                player.embed.unloadModule("cc");
              }
              if (typeof player.embed.setOption === "function") {
                player.embed.setOption("captions", "track", {});
                player.embed.setOption("cc", "track", {});
              }
            }
          } catch (e) {}
        };

        player.on("ready", disableCaptions);
        player.on("play", disableCaptions);
        player.on("playing", disableCaptions);

        playerRef.current = player;

        let maxWatchedTime = 0;
        player.on("timeupdate", () => {
          if (player.currentTime > maxWatchedTime) {
            maxWatchedTime = player.currentTime;
          }
        });

        player.on("seeking", () => {
          if (player.currentTime > maxWatchedTime + 0.5) {
            player.currentTime = maxWatchedTime;
          }
        });

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
        } catch (e) {
          // ignore
        }
      }
    };
  }, [trimmedUrl, autoPlay]);

  return (
    <div
      ref={containerRef}
      className="custom-video-wrapper w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg border border-white/80 relative select-none group"
    >
      {youtubeId ? (
        <div
          key={`yt-${youtubeId}`}
          data-plyr-provider="youtube"
          data-plyr-embed-id={youtubeId}
          className="w-full h-full"
        />
      ) : vimeoId ? (
        <div
          key={`vimeo-${vimeoId}`}
          data-plyr-provider="vimeo"
          data-plyr-embed-id={vimeoId}
          className="w-full h-full"
        />
      ) : (
        <video
          key={`video-${trimmedUrl}`}
          src={trimmedUrl}
          playsInline
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
