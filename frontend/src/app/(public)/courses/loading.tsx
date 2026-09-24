'use client';

import React from 'react';
import { CourseCardSkeleton } from '@/components/Skeleton';
import { BookOpen } from '@phosphor-icons/react';

export default function CoursesLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-16">
      {/* Header matching courses/page.tsx exactly */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-outline-variant/30 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            Góc Học Tập
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl font-light">
            Bài giảng do giáo viên đăng tải, học sinh hoàn thành như một bài giảng trên lớp. Tích hợp E-learning trực quan và kiểm tra đánh giá chuẩn hóa.
          </p>
        </div>

        {/* Filters shell */}
        <div className="flex gap-1 p-1 rounded-none bg-surface-container-low border border-outline-variant/30">
          <span className="px-5 py-2 rounded-none text-xs font-bold bg-primary text-white shadow-depth-1">
            Tất cả
          </span>
          <span className="px-5 py-2 rounded-none text-xs font-bold text-on-surface-variant">
            Dành cho Học sinh
          </span>
          <span className="px-5 py-2 rounded-none text-xs font-bold text-on-surface-variant">
            Dành cho Phụ huynh
          </span>
        </div>
      </div>

      {/* Content list matching courses/page.tsx */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <BookOpen size={22} weight="duotone" className="text-primary" />
            <span>Bài học trực tuyến</span>
          </h2>
          <span className="text-xs text-on-surface-variant">Đang nạp bài giảng...</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
