"use client";

import type { ReactNode } from "react";

// Pill/badge nhỏ: gom 38 chỗ span pill trùng công thức (px py + rounded-full + text-[9-10px] + font-bold)
// tone/className là chuỗi màu người gọi truyền vào (vd "${statusClass}", "bg-emerald-50 text-emerald-700")
interface BadgeProps {
  tone?: string;
  className?: string;
  size?: "xs" | "sm";
  uppercase?: boolean;
  solid?: boolean;
  dot?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Badge({
  tone = "",
  className = "",
  size = "sm",
  uppercase = false,
  solid = false,
  dot = false,
  icon,
  children,
}: BadgeProps) {
  const shape =
    size === "xs"
      ? "px-1.5 py-0.2 text-[9px] rounded-none"
      : "px-2.5 py-0.5 text-[10px] rounded-none";

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold whitespace-nowrap ${shape} ${
        uppercase ? "uppercase tracking-wider" : ""
      } ${solid ? "bg-primary text-white shadow-xs" : ""} ${tone} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-none bg-current shrink-0" />}
      {icon}
      {children}
    </span>
  );
}

export default Badge;
