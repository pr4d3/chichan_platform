"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { WarningCircle, CheckCircle, Check, Eye, EyeSlash, ArrowLeft, LockKey } from "@phosphor-icons/react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { showToast } = useToast();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Trạng thái kiểm tra và chạm (touched)
  const [touched, setTouched] = useState<{
    newPassword?: boolean;
    confirmPassword?: boolean;
  }>({});
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Hàm kiểm tra tiêu chí mật khẩu (đồng bộ với trang Đăng ký)
  const validatePassword = (val: string) => {
    if (!val) return "Mật khẩu không được để trống";
    if (/\s/.test(val)) return "Mật khẩu không được chứa khoảng trắng";
    if (val.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    const hasLetter = /[a-zA-Z]/.test(val);
    const hasNumber = /\d/.test(val);
    if (!hasLetter || !hasNumber) return "Mật khẩu phải chứa cả chữ cái và chữ số";
    return "";
  };

  const validateConfirmPassword = (val: string, original: string) => {
    if (!val) return "Vui lòng xác nhận lại mật khẩu";
    if (val !== original) return "Mật khẩu xác nhận không khớp";
    return "";
  };

  useEffect(() => {
    if (touched.newPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        newPassword: validatePassword(newPassword),
      }));
    }
  }, [newPassword, touched.newPassword]);

  useEffect(() => {
    if (touched.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(confirmPassword, newPassword),
      }));
    }
  }, [confirmPassword, newPassword, touched.confirmPassword]);

  // 1. Xác thực tính hợp lệ của token khi tải trang
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setVerifyError("Không tìm thấy mã xác thực. Vui lòng nhấp vào liên kết trong email được gửi tới bạn.");
      return;
    }

    const checkToken = async () => {
      try {
        const res = await api.post("/auth/verify-reset-token", { token });
        if (res.success && res.data?.valid) {
          setTokenValid(true);
          setAccountEmail(res.data.email || "");
        } else {
          setTokenValid(false);
          setVerifyError(res.message || "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }
      } catch (err: any) {
        setTokenValid(false);
        setVerifyError(err.message || "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.");
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  // 2. Xử lý đặt lại mật khẩu mới
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setTouched({
      newPassword: true,
      confirmPassword: true,
    });

    const pErr = validatePassword(newPassword);
    const cErr = validateConfirmPassword(confirmPassword, newPassword);

    if (pErr || cErr) {
      setFieldErrors({
        newPassword: pErr,
        confirmPassword: cErr,
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });

      if (res.success) {
        setSuccess(true);
        showToast("Đặt lại mật khẩu thành công!", "success");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(res.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại hoặc yêu cầu liên kết mới.");
    } finally {
      setSubmitting(false);
    }
  };

  // Trạng thái đang kiểm tra token
  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-on-surface-variant font-medium">Đang kiểm tra mã bảo mật...</p>
      </div>
    );
  }

  // Trạng thái token không hợp lệ hoặc đã hết hạn
  if (!tokenValid) {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600">
          <WarningCircle size={32} weight="fill" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-on-surface">Liên kết không hợp lệ hoặc đã hết hạn</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
            {verifyError}
          </p>
        </div>
        <div className="w-full space-y-2 pt-2">
          <Link
            href="/forgot-password"
            className="w-full inline-block py-3 bg-primary text-white rounded-none text-xs font-bold transition-all hover:bg-primary-hover shadow-depth-1"
          >
            Yêu cầu liên kết mới
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors py-2"
          >
            <ArrowLeft size={16} />
            Quay lại Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Trạng thái thành công
  if (success) {
    return (
      <div className="flex flex-col items-center text-center space-y-4 py-6">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
          <CheckCircle size={36} weight="fill" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-on-surface">Đổi mật khẩu thành công!</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Mật khẩu mới của bạn đã được cập nhật an toàn. Đang tự động chuyển hướng đến trang đăng nhập...
          </p>
        </div>
        <Link
          href="/login"
          className="w-full mt-2 py-3 bg-primary text-white rounded-none text-xs font-bold transition-all hover:bg-primary-hover"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  // Form nhập mật khẩu mới
  return (
    <>
      {error && (
        <div className="rounded-none bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600 flex items-center gap-2.5">
          <WarningCircle size={18} weight="fill" className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {accountEmail && (
        <div className="p-3 bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant flex items-center gap-2">
          <LockKey size={18} weight="duotone" className="text-primary shrink-0" />
          <span>Đang tạo mật khẩu mới cho tài khoản: <strong className="text-on-surface">{accountEmail}</strong></span>
        </div>
      )}

      <form onSubmit={handleSubmit} method="POST" action="#" className="flex flex-col gap-4">
        {/* Mật khẩu mới Container */}
        <div>
          <div className="relative">
            <input
              id="new_password"
              name="new_password"
              type={showNewPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder=" "
              className={`peer block w-full px-5 pt-[22px] pb-[10px] pr-12 rounded-none bg-white border transition-colors text-sm text-on-surface placeholder:text-transparent focus:outline-none ${
                touched.newPassword && fieldErrors.newPassword
                  ? "border-red-400 focus:ring-1 focus:ring-red-400"
                  : "border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary"
              }`}
              value={newPassword}
              onBlur={() => setTouched((p) => ({ ...p, newPassword: true }))}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label
              htmlFor="new_password"
              className={`absolute left-5 top-[16px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[10px] scale-[0.8] -translate-y-[10px] font-medium ${
                touched.newPassword && fieldErrors.newPassword
                  ? "text-red-500"
                  : "text-on-surface-variant/70 peer-focus:text-primary"
              }`}
            >
              Mật khẩu mới
            </label>
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-4 top-[18px] text-on-surface-variant/70 hover:text-primary focus:outline-none transition-colors"
              tabIndex={-1}
              aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showNewPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {touched.newPassword && fieldErrors.newPassword === "Mật khẩu không được để trống" && (
            <span className="text-[10px] text-red-500 font-semibold ml-2 mt-1 block">
              {fieldErrors.newPassword}
            </span>
          )}

          {/* Danh sách tiêu chí mật khẩu chuẩn theo trang Đăng ký */}
          <div className="flex flex-col gap-1.5 mt-2.5 px-1 bg-surface-container-lowest p-2.5 border border-outline-variant/20">
            <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
              {newPassword.length >= 6 ? (
                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
              )}
              <span className={newPassword.length >= 6 ? "text-emerald-600 font-semibold" : "text-on-surface-variant/60"}>
                Tối thiểu 6 ký tự
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
              {/[a-zA-Z]/.test(newPassword) ? (
                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
              )}
              <span className={/[a-zA-Z]/.test(newPassword) ? "text-emerald-600 font-semibold" : "text-on-surface-variant/60"}>
                Chứa ít nhất 1 chữ cái
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
              {/\d/.test(newPassword) ? (
                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
              )}
              <span className={/\d/.test(newPassword) ? "text-emerald-600 font-semibold" : "text-on-surface-variant/60"}>
                Chứa ít nhất 1 chữ số
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
              {newPassword && !/\s/.test(newPassword) ? (
                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
              )}
              <span className={newPassword && !/\s/.test(newPassword) ? "text-emerald-600 font-semibold" : "text-on-surface-variant/60"}>
                Không chứa khoảng trắng
              </span>
            </div>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới Container */}
        <div>
          <div className="relative">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              placeholder=" "
              className={`peer block w-full px-5 pt-[22px] pb-[10px] pr-12 rounded-none bg-white border transition-colors text-sm text-on-surface placeholder:text-transparent focus:outline-none ${
                touched.confirmPassword && fieldErrors.confirmPassword
                  ? "border-red-400 focus:ring-1 focus:ring-red-400"
                  : "border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary"
              }`}
              value={confirmPassword}
              onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <label
              htmlFor="confirm_password"
              className={`absolute left-5 top-[16px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[10px] scale-[0.8] -translate-y-[10px] font-medium ${
                touched.confirmPassword && fieldErrors.confirmPassword
                  ? "text-red-500"
                  : "text-on-surface-variant/70 peer-focus:text-primary"
              }`}
            >
              Xác nhận lại mật khẩu mới
            </label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-[18px] text-on-surface-variant/70 hover:text-primary focus:outline-none transition-colors"
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {touched.confirmPassword && fieldErrors.confirmPassword && (
            <span className="text-[10px] text-red-500 font-semibold ml-2 mt-1 block">
              {fieldErrors.confirmPassword}
            </span>
          )}

          {confirmPassword && confirmPassword === newPassword && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold ml-2 mt-1.5">
              <Check size={14} weight="bold" />
              <span>Mật khẩu xác nhận trùng khớp</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 bg-primary text-white py-3.5 rounded-none font-bold text-xs transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-depth-1 hover:shadow-depth-2"
        >
          {submitting ? "Đang lưu mật khẩu..." : "Lưu mật khẩu mới"}
        </button>

        <div className="text-center pt-1">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Hủy và quay lại Đăng nhập
          </Link>
        </div>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-on-surface-variant font-medium">Đang tải...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
