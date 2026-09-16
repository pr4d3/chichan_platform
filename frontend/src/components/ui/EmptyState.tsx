"use client";

import type { ReactNode } from "react";
import Button from "./Button";

// Trạng thái rỗng/lỗi: gom 8 chỗ block "icon tile + title + body + CTA pill"
// tone error = tile đỏ w-16 (intro/learn/certificate); tone neutral = icon duotone muted (forum empty)
// LƯU Ý: token --color-error chưa có trong @theme nên dùng text-red-600 (text-error ở các trang
// hiện tại là class không sinh CSS); khi owner thêm token thì đổi lại cho đồng bộ
interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: string;
  tone?: "error" | "neutral";
  action?: EmptyStateAction;
  glass?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  body,
  tone = "neutral",
  action,
  glass = false,
  className = "",
}: EmptyStateProps) {
  const isError = tone === "error";

  const content = (
    <div className={isError ? "space-y-5" : "space-y-3"}>
      {isError ? (
        // Tile icon đỏ giống block lỗi ở intro/learn/certificate
        <div className="w-16 h-16 mx-auto bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
          {icon}
        </div>
      ) : (
        // Empty list: icon duotone muted không tile (giống forum/page.tsx)
        <div className="flex justify-center text-on-surface-variant/40">{icon}</div>
      )}
      {isError ? (
        <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      ) : (
        <p className="text-sm font-bold text-on-surface">{title}</p>
      )}
      {body && (
        <p
          className={
            isError
              ? "text-sm text-on-surface-variant leading-relaxed"
              : "text-xs text-on-surface-variant/70"
          }
        >
          {body}
        </p>
      )}
      {action &&
        (action.href ? (
          <Button href={action.href} onClick={action.onClick}>
            {action.label}
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        ))}
    </div>
  );

  return (
    <div className={`text-center py-12 ${className}`}>
      {glass ? (
        // Bọc glass card như trang certificate
        <div className="bg-white p-8 rounded-xl border border-outline-variant/30 text-center max-w-md mx-auto">
          {content}
        </div>
      ) : (
        content
      )}
    </div>
  );
}

export default EmptyState;
