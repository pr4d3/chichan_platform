"use client";

import type { ReactNode } from "react";

// Hàng form có label: gom 17 chỗ label + dấu * đỏ + control viết tay (QuizEditorModal, profile, about...)
// children là control (input/select/textarea) người gọi tự render
interface FormRowProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  tone?: "default" | "warn";
  hint?: string;
  className?: string;
  children?: ReactNode;
}

export function FormRow({
  label,
  required = false,
  htmlFor,
  tone = "default",
  hint,
  className = "",
  children,
}: FormRowProps) {
  const labelClasses =
    tone === "warn"
      ? "block text-[11px] font-semibold text-amber-950 mb-1.5"
      : "block font-bold text-[11px] text-on-surface-variant mb-1.5";

  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}

export default FormRow;
