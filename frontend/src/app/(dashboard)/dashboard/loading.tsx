'use client';

import React from 'react';
import { SkeletonBlock, SkeletonStatTile } from '@/components/ui/SkeletonBlock';

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-page-appear">
      {/* Title skeleton */}
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="h-4 w-80" />
      </div>

      {/* Stat Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStatTile key={i} className={`stagger-${i}`} />
        ))}
      </div>

      {/* Main Content Area Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-outline-variant/40 bg-white p-6 space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-outline-variant/20">
                <SkeletonBlock className="h-4 w-48" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="border border-outline-variant/40 bg-white p-6 space-y-4">
          <SkeletonBlock className="h-5 w-32" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className="w-8 h-8 shrink-0" />
                <div className="space-y-1 flex-1">
                  <SkeletonBlock className="h-3 w-3/4" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
