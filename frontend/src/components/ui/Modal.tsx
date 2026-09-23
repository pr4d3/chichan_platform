"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";

// Modal overlay: gom 10 chỗ backdrop + panel + nút X viết tay (6 biến thể backdrop đang lệch nhau)
// KHÔNG dùng createPortal để giữ đúng CSS cascade như 10 chỗ hiện tại; body scroll-lock khi mở
interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  dismissible?: boolean;
  showClose?: boolean;
  panelClassName?: string;
  backdropClassName?: string;
  children?: ReactNode;
}

const sizeMap: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-4xl",
};

// animate-fade-in/animate-scale-up KHÔNG có định nghĩa trong globals.css (các trang đang dùng
// đều là class chết), nên keyframes được tự inject vào <head> — đếm tham chiếu để dọn sạch
const ANIM_STYLE_ID = "ui-modal-keyframes";
const ANIM_CSS =
  "@keyframes uiModalFadeIn{from{opacity:0}to{opacity:1}}" +
  "@keyframes uiModalScaleUp{from{opacity:0;transform:scale(0.96) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}";
let animUsers = 0;

export function Modal({
  open,
  onClose,
  size = "md",
  dismissible = true,
  showClose = true,
  panelClassName = "",
  backdropClassName = "",
  children,
}: ModalProps) {
  // Inject keyframes 1 lần cho mọi modal đang mở
  useEffect(() => {
    let el = document.getElementById(ANIM_STYLE_ID);
    if (!el) {
      el = document.createElement("style");
      el.id = ANIM_STYLE_ID;
      el.textContent = ANIM_CSS;
      document.head.appendChild(el);
    }
    animUsers += 1;
    return () => {
      animUsers -= 1;
      if (animUsers <= 0) document.getElementById(ANIM_STYLE_ID)?.remove();
    };
  }, []);

  // Đóng bằng phím Esc (chỉ khi dismissible)
  useEffect(() => {
    if (!open || !dismissible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, dismissible, onClose]);

  // Khoá cuộn body khi modal mở, trả lại giá trị cũ khi đóng
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const hasCustomOverflow = /\boverflow-(hidden|auto|y-auto|x-auto|scroll)\b/.test(panelClassName);
  const defaultOverflow = hasCustomOverflow ? "" : "overflow-y-auto";

  return (
    <div
      onClick={() => dismissible && onClose()}
      style={{ animation: "uiModalFadeIn 0.2s ease-out both" }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 ${backdropClassName}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "uiModalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
        className={`relative w-full bg-white rounded-none shadow-2xl max-h-[90vh] overflow-hidden ${defaultOverflow} ${
          sizeMap[size]
        } ${panelClassName}`}
      >
        {dismissible && showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            title="Đóng"
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-none bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default Modal;
