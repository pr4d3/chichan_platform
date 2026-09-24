"use client";

import React from "react";

export const CourseCardSkeleton = () => {
  return (
    <div className="glass-panel rounded-none overflow-hidden shadow-xs flex flex-col h-full bg-white border border-outline-variant/40">
      {/* Thumbnail placeholder matching h-52 sm:h-56 */}
      <div className="relative h-52 sm:h-56 w-full bg-surface-container overflow-hidden">
        <div className="w-full h-full animate-shimmer" />
      </div>

      <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Title */}
          <div className="h-5 w-4/5 animate-shimmer" />
          <div className="h-5 w-3/5 animate-shimmer" />
          {/* Description */}
          <div className="space-y-1.5 pt-1.5">
            <div className="h-3.5 w-full animate-shimmer" />
            <div className="h-3.5 w-3/4 animate-shimmer" />
          </div>
        </div>

        {/* Footer info placeholder */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/20">
          <div className="h-4 w-28 animate-shimmer" />
          <div className="h-4 w-20 animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const ForumPostSkeleton = () => {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        {/* Avatar Placeholder */}
        <div className="w-9 h-9 rounded-none bg-surface-container-high flex-shrink-0 animate-shimmer" />

        {/* Content Column */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Author header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-28 h-3.5 bg-surface-container-high rounded-none animate-shimmer" />
              <div className="w-16 h-3 bg-surface-container rounded-none animate-shimmer" />
            </div>
            <div className="w-14 h-4 bg-surface-container rounded-none animate-shimmer" />
          </div>

          {/* Title */}
          <div className="w-3/4 h-4.5 bg-surface-container-high rounded-none animate-shimmer" />

          {/* Content snippet */}
          <div className="space-y-1.5 pt-0.5">
            <div className="w-full h-3.5 bg-surface-container rounded-none animate-shimmer" />
            <div className="w-4/5 h-3.5 bg-surface-container rounded-none animate-shimmer" />
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center gap-6 pt-2">
            <div className="w-14 h-3 bg-surface-container rounded-none animate-shimmer" />
            <div className="w-10 h-3 bg-surface-container rounded-none animate-shimmer" />
            <div className="w-10 h-3 bg-surface-container rounded-none animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const CourseIntroSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-8">
      {/* Left Content Column */}
      <div className="w-full lg:w-[70%] space-y-8">
        <div className="space-y-4">
          <div className="w-24 h-6 bg-surface-container rounded-none animate-shimmer" />
          <div className="w-3/4 h-10 bg-surface-container-high rounded-none animate-shimmer" />
          <div className="w-1/2 h-5 bg-surface-container rounded-none animate-shimmer" />
        </div>
        {/* Hero Image/Video Block */}
        <div className="w-full h-[350px] bg-surface-container-high rounded-none animate-shimmer" />
        <div className="space-y-3">
          <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
          <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
          <div className="w-4/5 h-4 bg-surface-container rounded-none animate-shimmer" />
        </div>
      </div>
      {/* Right Action Column */}
      <div className="w-full lg:w-[30%] space-y-6">
        <div className="bg-white p-8 rounded-none border border-outline-variant/30 shadow-xs space-y-6">
          <div className="w-full h-48 bg-surface-container-high rounded-none animate-shimmer" />
          <div className="space-y-3">
            <div className="w-full h-12 bg-surface-container-high rounded-none animate-shimmer" />
            <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ForumPostDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-on-surface pb-24">
      {/* Top Navigation Bar */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="w-20 h-4 bg-surface-container-high rounded-none animate-shimmer" />
          <div className="w-36 h-4 bg-surface-container-high rounded-none animate-shimmer" />
          <div className="w-7 h-7 bg-surface-container rounded-none animate-shimmer" />
        </div>
      </div>

      {/* Main Single Continuous Card */}
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <div className="bg-white rounded-none border border-outline-variant/30 shadow-xs overflow-hidden">
          {/* Top Section: Main Post */}
          <div className="p-5 sm:p-6 space-y-4 border-b border-outline-variant/20">
            {/* Author row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-surface-container-high flex-shrink-0 animate-shimmer" />
                <div className="space-y-1.5">
                  <div className="w-32 h-4 bg-surface-container-high rounded-none animate-shimmer" />
                  <div className="w-24 h-3 bg-surface-container rounded-none animate-shimmer" />
                </div>
              </div>
              <div className="w-16 h-5 bg-surface-container rounded-none animate-shimmer" />
            </div>

            {/* Title */}
            <div className="w-3/4 h-6 bg-surface-container-high rounded-none animate-shimmer" />

            {/* Content */}
            <div className="space-y-2">
              <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-2/3 h-4 bg-surface-container rounded-none animate-shimmer" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-outline-variant/15">
              <div className="w-16 h-3.5 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-12 h-3.5 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-12 h-3.5 bg-surface-container rounded-none animate-shimmer" />
            </div>
          </div>

          {/* Middle Section: Reply Box Skeleton */}
          <div className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface-container-lowest/30 flex gap-3">
            <div className="w-9 h-9 rounded-none bg-surface-container-high flex-shrink-0 animate-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="w-24 h-3 bg-surface-container-high rounded-none animate-shimmer" />
                <div className="w-20 h-5 bg-surface-container rounded-none animate-shimmer" />
              </div>
              <div className="w-full h-10 bg-surface-container rounded-none animate-shimmer" />
            </div>
          </div>

          {/* Bottom Section: Comments Chain */}
          <div className="divide-y divide-outline-variant/15">
            {/* Root comment 1 */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-surface-container-high flex-shrink-0 animate-shimmer" />
                <div className="space-y-1">
                  <div className="w-28 h-3.5 bg-surface-container-high rounded-none animate-shimmer" />
                  <div className="w-16 h-2.5 bg-surface-container rounded-none animate-shimmer" />
                </div>
              </div>
              <div className="w-5/6 h-3.5 bg-surface-container rounded-none pl-1 animate-shimmer" />

              {/* Nested reply */}
              <div className="mt-3 ml-6 sm:ml-10 border-l-2 border-outline-variant/30 pl-3 sm:pl-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-none bg-surface-container-high flex-shrink-0 animate-shimmer" />
                  <div className="space-y-1">
                    <div className="w-32 h-3.5 bg-surface-container-high rounded-none animate-shimmer" />
                    <div className="w-14 h-2.5 bg-surface-container rounded-none animate-shimmer" />
                  </div>
                </div>
                <div className="w-4/5 h-3.5 bg-surface-container rounded-none pl-1 animate-shimmer" />
              </div>
            </div>

            {/* Root comment 2 */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none bg-surface-container-high flex-shrink-0 animate-shimmer" />
                <div className="space-y-1">
                  <div className="w-24 h-3.5 bg-surface-container-high rounded-none animate-shimmer" />
                  <div className="w-16 h-2.5 bg-surface-container rounded-none animate-shimmer" />
                </div>
              </div>
              <div className="w-3/4 h-3.5 bg-surface-container rounded-none pl-1 animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LearnPageSkeleton = () => {
  return (
    <div className="flex flex-col h-screen w-full bg-background text-on-background font-sans antialiased overflow-hidden">
      {/* Header Skeleton */}
      <header className="glass-panel border-b border-outline-variant/30 flex flex-col h-auto w-full bg-white/85">
        <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-2xl mx-auto">
          <div className="w-20 h-8 bg-surface-container-high rounded-none animate-shimmer" />
          <div className="w-1/3 h-6 bg-surface-container-high rounded-none animate-shimmer" />
          <div className="w-12 h-6 bg-surface-container-high rounded-none animate-shimmer" />
        </div>
        <div className="w-full h-1.5 bg-surface-container-high" />
      </header>

      {/* Main Area */}
      <div className="flex-grow w-full max-w-screen-2xl mx-auto flex flex-col lg:flex-row h-[calc(100vh-72px)] overflow-hidden">
        {/* Left Area: Content Canvas Skeleton */}
        <div className="flex-grow flex flex-col h-full overflow-y-auto bg-surface p-6 md:p-10">
          <div className="w-full aspect-video bg-surface-container-high rounded-none animate-shimmer mb-8" />
          <div className="max-w-4xl mx-auto space-y-6 w-full">
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-20 h-5 bg-surface-container rounded-none animate-shimmer" />
            </div>
            <div className="w-3/4 h-8 bg-surface-container-high rounded-none animate-shimmer" />
            <div className="space-y-3">
              <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-full h-4 bg-surface-container rounded-none animate-shimmer" />
              <div className="w-5/6 h-4 bg-surface-container rounded-none animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton */}
        <aside className="w-full lg:w-[360px] flex-shrink-0 glass-panel border-l border-outline-variant/30 flex flex-col h-full overflow-hidden hidden lg:flex bg-white/70">
          <div className="p-6 border-b border-outline-variant/30">
            <div className="w-1/2 h-5 bg-surface-container-high rounded-none animate-shimmer mb-2" />
            <div className="w-3/4 h-8 bg-surface-container rounded-none animate-shimmer" />
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex gap-4 p-4 border border-transparent">
                <div className="w-5 h-5 rounded-none bg-surface-container-high animate-shimmer mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="w-full h-4 bg-surface-container-high rounded-none animate-shimmer" />
                  <div className="w-24 h-3 bg-surface-container rounded-none animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
