'use client';

import React from 'react';
import { ForumPostSkeleton } from '@/components/Skeleton';
import { Funnel, MagnifyingGlass } from '@phosphor-icons/react';

export default function ForumLoading() {
  return (
    <div className="min-h-screen bg-background text-on-surface pb-24">
      {/* Header and Search Controls matching forum/page.tsx exactly */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-on-surface">
              Góc Trò Chuyện
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-xs sm:max-w-sm">
            <div className="h-8 w-8 rounded-none border border-outline-variant/30 bg-white shadow-xs flex items-center justify-center text-on-surface-variant/40">
              <Funnel size={16} />
            </div>
            <div className="flex-1 h-8 rounded-none border border-outline-variant/30 bg-white shadow-xs flex items-center px-3 gap-2 text-on-surface-variant/40 text-xs">
              <MagnifyingGlass size={14} />
              <span>Tìm kiếm...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Single Continuous Card Feed */}
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <div className="bg-white rounded-none border border-outline-variant/30 shadow-xs overflow-hidden">
          <div className="divide-y divide-outline-variant/20">
            {Array.from({ length: 4 }).map((_, i) => (
              <ForumPostSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
