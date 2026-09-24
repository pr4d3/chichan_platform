"use client";

import React from "react";

interface SkeletonBlockProps {
  className?: string;
  rounded?: "none" | "sm" | "md" | "full" | "xl";
  shimmer?: boolean;
}

const radiusMap: Record<NonNullable<SkeletonBlockProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-none", // enforce sharp corners per design tokens
  full: "rounded-none", // enforce sharp corners
  xl: "rounded-none",
};

export function SkeletonBlock({
  className = "",
  rounded = "none",
  shimmer = true,
}: SkeletonBlockProps) {
  const animClass = shimmer ? "animate-shimmer" : "animate-pulse bg-on-surface/10";
  return (
    <div
      className={`${animClass} ${radiusMap[rounded]} ${className}`}
    />
  );
}

// Cụm nhiều dòng skeleton cho đoạn văn
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  shimmer?: boolean;
}

export function SkeletonText({ lines = 3, className = "", shimmer = true }: SkeletonTextProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 ${
            shimmer ? "animate-shimmer" : "animate-pulse bg-on-surface/10"
          } ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// Skeleton cho Card khóa học chuẩn tỷ lệ 16:9 viền sắc nét
export function SkeletonCourseCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border border-outline-variant/40 bg-white p-0 overflow-hidden flex flex-col shadow-xs ${className}`}
    >
      {/* 16:9 Thumbnail Skeleton */}
      <div className="relative aspect-video w-full bg-surface-container overflow-hidden">
        <SkeletonBlock className="w-full h-full" />
      </div>

      <div className="p-6 flex flex-col flex-1 space-y-4">
        {/* Category tag */}
        <div className="flex gap-2">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="h-5 w-16" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-full" />
          <SkeletonBlock className="h-5 w-3/4" />
        </div>

        {/* Description */}
        <SkeletonText lines={2} />

        {/* Footer info */}
        <div className="pt-4 mt-auto border-t border-outline-variant/20 flex items-center justify-between">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

// Skeleton cho Bài viết diễn đàn
export function SkeletonForumPost({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border border-outline-variant/40 bg-white p-6 space-y-4 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
        <SkeletonBlock className="h-5 w-16" />
      </div>

      <div className="space-y-2">
        <SkeletonBlock className="h-5 w-4/5" />
        <SkeletonText lines={2} />
      </div>

      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
        <div className="flex gap-2">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-4 w-12" />
        </div>
        <SkeletonBlock className="h-4 w-20" />
      </div>
    </div>
  );
}

// Skeleton cho Stat tile trong Dashboard
export function SkeletonStatTile({ className = "" }: { className?: string }) {
  return (
    <div
      className={`border border-outline-variant/40 bg-white p-6 space-y-3 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="w-8 h-8" />
      </div>
      <SkeletonBlock className="h-8 w-20" />
      <SkeletonBlock className="h-3 w-36" />
    </div>
  );
}

export default SkeletonBlock;
