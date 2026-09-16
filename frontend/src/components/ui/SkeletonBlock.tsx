"use client";

// Khối skeleton pulse: thay 14+ div animate-pulse viết tay (dashboard dùng bg-on-surface/10)
// className truyền w-/h- (vd "h-6 w-12 mx-auto")
interface SkeletonBlockProps {
  className?: string;
  rounded?: "md" | "full" | "xl";
}

const radiusMap: Record<NonNullable<SkeletonBlockProps["rounded"]>, string> = {
  md: "rounded",
  full: "rounded-full",
  xl: "rounded-xl",
};

export function SkeletonBlock({
  className = "",
  rounded = "md",
}: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse bg-on-surface/10 ${radiusMap[rounded]} ${className}`}
    />
  );
}

// Cụm nhiều dòng skeleton cho đoạn văn — dòng cuối ngắn (w-2/3) như mẫuForumPostSkeleton
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 rounded animate-pulse bg-on-surface/10 ${
            i === lines - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

export default SkeletonBlock;
