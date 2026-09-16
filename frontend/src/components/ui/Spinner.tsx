"use client";

// Spinner viền xoay: gom 13 chỗ viết tay border-spinner với 3 size/kind khác lệch nhau
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "white" | "muted";
  className?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-12 h-12 border-4",
};

const toneMap: Record<NonNullable<SpinnerProps["tone"]>, string> = {
  primary: "border-primary border-t-transparent",
  white: "border-white border-t-transparent",
  muted: "border-outline-variant/40 border-t-primary",
};

export function Spinner({
  size = "md",
  tone = "primary",
  className = "",
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Đang tải"
      className={`rounded-full animate-spin ${sizeMap[size]} ${toneMap[tone]} ${className}`}
    />
  );
}

export default Spinner;
