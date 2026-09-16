"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export interface CourseItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  target_audience?: "PARENT" | "CHILD" | "BOTH" | string;
  instructor_name: string;
  total_lessons: number;
  short_description?: string;
}

interface CourseCardProps {
  course: CourseItem;
  forcedAudience?: "PARENT" | "CHILD";
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}/intro`}
      className="glass-panel rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group bg-white/80 border border-white/60"
    >
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-surface-container">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          alt={course.title}
          loading="lazy"
          decoding="async"
          src={
            course.thumbnail_url ||
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500"
          }
        />
      </div>

      <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-base font-bold text-on-surface mb-2.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {course.title}
          </h3>

          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-4 font-light">
            {course.short_description ||
              "Khóa học cung cấp lộ trình hướng dẫn chi tiết được xây dựng bởi các bác sĩ và chuyên gia giàu kinh nghiệm."}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium truncate max-w-[140px]">
            GV: <strong className="font-bold text-on-surface">{course.instructor_name}</strong>
          </span>
          <span className="text-xs font-bold text-primary flex items-center gap-1.5 shrink-0 group-hover:text-primary-container transition-colors">
            <span>{course.total_lessons} bài học</span>
            <ArrowRight size={15} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}
