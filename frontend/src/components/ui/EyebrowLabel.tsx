"use client";

import type { ElementType, ReactNode } from "react";

// Nhãn micro chữ hoa (eyebrow): 15 chỗ dùng công thức font-bold uppercase tracking-wider text-on-surface-variant
// as="th" cho header bảng, as="label" cho form — caller tự thêm class display (block...) khi cần
interface EyebrowLabelProps {
  as?: "span" | "p" | "th" | "label";
  size?: "9" | "10" | "11";
  className?: string;
  children?: ReactNode;
}

const sizeMap: Record<NonNullable<EyebrowLabelProps["size"]>, string> = {
  "9": "text-[9px]",
  "10": "text-[10px]",
  "11": "text-[11px]",
};

export function EyebrowLabel({
  as = "span",
  size = "9",
  className = "",
  children,
}: EyebrowLabelProps) {
  const Tag: ElementType = as;
  return (
    <Tag
      className={`font-bold uppercase tracking-wider text-on-surface-variant ${sizeMap[size]} ${className}`}
    >
      {children}
    </Tag>
  );
}

export default EyebrowLabel;
