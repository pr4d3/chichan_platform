"use client";

import type { ElementType, ReactNode } from "react";

// Khối card trắng: gom 19 chỗ container "bg-white rounded-2xl border-outline-variant p-* shadow-xs"
// tone solid = card trắng chuẩn; glass = stat tile/banner trong suốt; subtle = nền surface-container-lowest
interface CardProps {
  tone?: "solid" | "glass" | "subtle";
  p?: "none" | "4" | "5" | "8";
  shadow?: string;
  className?: string;
  as?: ElementType;
  children?: ReactNode;
}

const toneMap: Record<NonNullable<CardProps["tone"]>, string> = {
  solid: "bg-white border border-outline-variant/30",
  glass: "bg-white/80 backdrop-blur-md border border-white/60",
  subtle: "bg-surface-container-lowest border border-outline-variant/20",
};

const paddingMap: Record<NonNullable<CardProps["p"]>, string> = {
  none: "",
  "4": "p-4",
  "5": "p-5",
  "8": "p-8",
};

export function Card({
  tone = "solid",
  p = "5",
  shadow = "shadow-xs",
  className = "",
  as = "div",
  children,
}: CardProps) {
  const Tag: ElementType = as;
  return (
    <Tag
      className={`rounded-none ${toneMap[tone]} ${paddingMap[p]} ${shadow} ${className}`}
    >
      {children}
    </Tag>
  );
}

export default Card;
