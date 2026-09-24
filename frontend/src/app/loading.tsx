'use client';

import React from 'react';

/**
 * Global Route Loading Indicator
 * Uses a slim top progress bar with shimmer animation to indicate page transitions
 * without causing full-viewport layout shifts (CLS = 0) or double-skeleton jumps.
 */
export default function GlobalLoading() {
  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] bg-primary/15 z-[9999] overflow-hidden pointer-events-none"
      role="progressbar"
      aria-label="Đang tải trang..."
    >
      <div className="h-full bg-primary animate-shimmer w-full" />
    </div>
  );
}
