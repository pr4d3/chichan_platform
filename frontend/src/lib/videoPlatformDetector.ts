/**
 * Video & Media Platform Detector
 * Parses and normalizes media URLs from YouTube, Vimeo, Google Drive, Facebook, TikTok, Loom, Dailymotion, Audio, and Direct Video.
 */

export type PlatformType =
  | 'YOUTUBE'
  | 'VIMEO'
  | 'GOOGLE_DRIVE'
  | 'NOTEBOOKLM'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'LOOM'
  | 'DAILYMOTION'
  | 'AUDIO'
  | 'DIRECT_VIDEO'
  | 'GENERIC_IFRAME';

export interface DetectedMedia {
  platform: PlatformType;
  id?: string;
  embedUrl?: string;
  originalUrl: string;
  isIframeEmbed: boolean;
}

export function detectMediaPlatform(rawUrl: string, contentType?: string): DetectedMedia {
  const url = (rawUrl || '').trim();

  // If user pasted an entire <iframe> code snippet, extract the src
  if (url.startsWith('<iframe') && url.includes('src=')) {
    const srcMatch = url.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return detectMediaPlatform(srcMatch[1], contentType);
    }
  }

  // 1. Audio types or extensions
  const isAudioExtension = /\.(m4a|mp3|wav|ogg|aac|flac)(\?.*)?$/i.test(url);
  if (contentType === 'AUDIO' || isAudioExtension) {
    const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
    if (driveMatch) {
      return {
        platform: 'GOOGLE_DRIVE',
        id: driveMatch[1],
        embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
        originalUrl: url,
        isIframeEmbed: true,
      };
    }
    return {
      platform: 'AUDIO',
      originalUrl: url,
      isIframeEmbed: false,
    };
  }

  // 2. YouTube
  if (/^[\w-]{11}$/.test(url)) {
    return {
      platform: 'YOUTUBE',
      id: url,
      embedUrl: `https://www.youtube.com/embed/${url}`,
      originalUrl: url,
      isIframeEmbed: false, // Plyr handles this directly
    };
  }
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch) {
    return {
      platform: 'YOUTUBE',
      id: ytMatch[1],
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      originalUrl: url,
      isIframeEmbed: false,
    };
  }

  // 3. Google Drive
  const driveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
  if (driveMatch) {
    return {
      platform: 'GOOGLE_DRIVE',
      id: driveMatch[1],
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      originalUrl: url,
      isIframeEmbed: true,
    };
  }

  // 4. NotebookLM Share Link
  const nblmMatch = url.match(/notebooklm\.google\.com\/notebook\/([a-zA-Z0-9_-]+)/i);
  if (nblmMatch) {
    return {
      platform: 'NOTEBOOKLM',
      id: nblmMatch[1],
      embedUrl: url,
      originalUrl: url,
      isIframeEmbed: false,
    };
  }

  // 5. Vimeo
  if (/^\d{6,12}$/.test(url)) {
    return {
      platform: 'VIMEO',
      id: url,
      embedUrl: `https://player.vimeo.com/video/${url}`,
      originalUrl: url,
      isIframeEmbed: false,
    };
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      platform: 'VIMEO',
      id: vimeoMatch[3],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
      originalUrl: url,
      isIframeEmbed: false,
    };
  }

  // 6. Facebook Video / Reels
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    const encoded = encodeURIComponent(url);
    return {
      platform: 'FACEBOOK',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=1280`,
      originalUrl: url,
      isIframeEmbed: true,
    };
  }

  // 7. TikTok
  const tiktokMatch = url.match(/tiktok\.com\/(?:@[^\/]+\/video\/|v\/)(\d+)/i);
  if (tiktokMatch && tiktokMatch[1]) {
    return {
      platform: 'TIKTOK',
      id: tiktokMatch[1],
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`,
      originalUrl: url,
      isIframeEmbed: true,
    };
  }

  // 8. Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  if (loomMatch && loomMatch[1]) {
    return {
      platform: 'LOOM',
      id: loomMatch[1],
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      originalUrl: url,
      isIframeEmbed: true,
    };
  }

  // 9. Dailymotion
  const dailyMatch = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dailyMatch && dailyMatch[1]) {
    return {
      platform: 'DAILYMOTION',
      id: dailyMatch[1],
      embedUrl: `https://www.dailymotion.com/embed/video/${dailyMatch[1]}`,
      originalUrl: url,
      isIframeEmbed: true,
    };
  }

  // 10. Direct video files (.mp4, .webm, .ogg, .m3u8)
  const isDirectVideo = /\.(mp4|webm|ogv|m3u8)(\?.*)?$/i.test(url);
  if (isDirectVideo) {
    return {
      platform: 'DIRECT_VIDEO',
      originalUrl: url,
      isIframeEmbed: false,
    };
  }

  // Fallback: If starts with http:// or https:// and might be an embeddable page
  return {
    platform: 'DIRECT_VIDEO',
    originalUrl: url,
    isIframeEmbed: false,
  };
}
