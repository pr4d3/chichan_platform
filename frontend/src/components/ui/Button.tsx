"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Spinner from "./Spinner";

// Nút pill: gom 12 chỗ CTA "rounded-full bg-primary text-white text-xs font-bold hover:opacity-90"
// href → render next/link với cùng class; loading → Spinner nhỏ + disabled
interface ButtonProps {
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const variantMap: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white shadow-sm hover:opacity-90",
  danger: "text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200",
  ghost: "text-primary hover:bg-primary/5",
};

const sizeMap: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-2.5",
  lg: "px-8 py-3",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  full = false,
  type = "button",
  onClick,
  href,
  icon,
  className = "",
  children,
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-bold text-xs transition disabled:opacity-50 ${
    variantMap[variant]
  } ${sizeMap[size]} ${full ? "w-full" : ""} ${className}`;

  const inactive = disabled || loading;
  const spinnerTone = variant === "primary" ? "white" : "primary";

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        aria-disabled={inactive}
        className={`${classes} ${inactive ? "pointer-events-none opacity-50" : ""}`}
      >
        {loading && <Spinner size="sm" tone={spinnerTone} />}
        {!loading && icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={inactive}
      className={classes}
    >
      {loading && <Spinner size="sm" tone={spinnerTone} />}
      {!loading && icon}
      {children}
    </button>
  );
}

export default Button;
