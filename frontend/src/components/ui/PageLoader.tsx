"use client";

import Spinner from "./Spinner";

// Màn hình loading cả trang: gom 6 chỗ "min-h-screen centered + spinner + text pulse tiếng Việt"
interface PageLoaderProps {
  label?: string;
  minHeight?: "screen" | "calc";
  className?: string;
}

export function PageLoader({
  label,
  minHeight = "screen",
  className = "",
}: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        minHeight === "calc" ? "min-h-[calc(100vh-4rem)]" : "min-h-screen"
      } ${className}`}
    >
      <Spinner size="lg" />
      <p className="mt-4 text-on-surface-variant text-sm font-semibold animate-pulse">
        {label ?? "Đang tải..."}
      </p>
    </div>
  );
}

export default PageLoader;
