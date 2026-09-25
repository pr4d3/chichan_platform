"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  WarningCircle,
  CheckCircle,
  ArrowLeft,
  EnvelopeSimple,
} from "@phosphor-icons/react";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Bộ đếm ngược 60 giây trước khi cho phép gửi lại
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      if (res.success) {
        setSubmitted(true);
        setCountdown(60);
        showToast("Đã gửi yêu cầu khôi phục mật khẩu!", "success");
      } else {
        setError(res.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setError(
        err.message || "Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="rounded-none bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600 flex items-center gap-2.5">
          <WarningCircle
            size={18}
            weight="fill"
            className="text-red-500 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="flex flex-col items-center text-center space-y-5 py-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <EnvelopeSimple size={36} weight="duotone" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-on-surface">
              Kiểm tra hộp thư của bạn
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến:
            </p>
            <p className="text-sm font-bold text-primary bg-surface-container-low py-1 px-3 border border-outline-variant/30 inline-block">
              {email}
            </p>
          </div>

          <div className="p-3.5 bg-surface-container-lowest border-l-4 border-amber-500 text-left text-xs text-on-surface-variant space-y-1">
            <p className="font-semibold text-amber-700">Lưu ý:</p>
            <p>
              • Liên kết đặt lại mật khẩu chỉ có hiệu lực trong vòng{" "}
              <strong>15 phút</strong>.
            </p>
            <p>
              • Nếu không thấy trong Hộp thư đến, vui lòng kiểm tra thư mục{" "}
              <strong>Spam / Thư rác</strong>.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <button
              type="button"
              disabled={loading || countdown > 0}
              onClick={handleSubmit}
              className="w-full py-3 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 rounded-none text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {countdown > 0
                ? `Gửi lại email sau (${countdown}s)`
                : "Chưa nhận được? Gửi lại email"}
            </button>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline transition-colors w-full py-2"
            >
              <ArrowLeft size={16} />
              Quay lại trang Đăng nhập
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          method="POST"
          action="#"
          className="flex flex-col gap-5"
        >
          <div className="text-xs text-on-surface-variant leading-relaxed">
            Nhập địa chỉ email liên kết với tài khoản của bạn. Hệ thống sẽ gửi
            cho bạn liên kết an toàn để tạo mật khẩu mới.
          </div>

          {/* Email Input Container */}
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder=" "
              className="peer block w-full px-5 pt-[22px] pb-[10px] rounded-none bg-white border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label
              htmlFor="email"
              className="absolute left-5 top-[16px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[10px] scale-[0.8] -translate-y-[10px] text-on-surface-variant/70 peer-focus:text-primary font-medium"
            >
              Địa chỉ Email tài khoản
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-white py-3.5 rounded-none font-bold text-xs transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-depth-1 hover:shadow-depth-2"
          >
            {loading ? "Đang gửi liên kết..." : "Gửi liên kết khôi phục"}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Quay lại Đăng nhập
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
