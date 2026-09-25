"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { WarningCircle, Eye, EyeSlash } from "@phosphor-icons/react";

const REMEMBER_LOGIN_KEY = "chichan_remember_login";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khôi phục thông tin đăng nhập đã ghi nhớ khi tải trang
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(REMEMBER_LOGIN_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed?.usernameOrEmail) {
          setUsernameOrEmail(parsed.usernameOrEmail);
        }
        if (parsed?.password) {
          setPassword(parsed.password);
        }
        setRememberMe(true);
      }
    } catch {
      // Bỏ qua lỗi nếu dữ liệu localStorage hỏng
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await login({
        username_or_email: usernameOrEmail.trim(),
        password,
      });

      if (res.success) {
        // Lưu hoặc xóa thông tin ghi nhớ tùy theo checkbox
        if (rememberMe) {
          localStorage.setItem(
            REMEMBER_LOGIN_KEY,
            JSON.stringify({
              usernameOrEmail: usernameOrEmail.trim(),
              password,
            })
          );
        } else {
          localStorage.removeItem(REMEMBER_LOGIN_KEY);
        }

        showToast("Đăng nhập thành công!", "success");
        router.push("/");
      }
    } catch (err: any) {
      const errMsg = err.message || "Sai thông tin đăng nhập";
      setError(errMsg);
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      // Nếu người dùng bỏ tích, xóa ngay thông tin đã lưu trong máy
      localStorage.removeItem(REMEMBER_LOGIN_KEY);
    }
  };

  return (
    <>
      {error && (
        <div className="rounded-none bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600 flex items-center gap-2.5">
          <WarningCircle size={18} weight="fill" className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} method="POST" action="#" className="flex flex-col gap-5">
        {/* Username/Email Input Container */}
        <div className="relative">
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder=" "
            className="peer block w-full px-5 pt-[22px] pb-[10px] rounded-none bg-white border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
          />
          <label
            htmlFor="username"
            className="absolute left-5 top-[16px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[10px] scale-[0.8] -translate-y-[10px] text-on-surface-variant/70 peer-focus:text-primary font-medium"
          >
            Tên đăng nhập hoặc Email
          </label>
        </div>

        {/* Password Input Container */}
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder=" "
            className="peer block w-full px-5 pt-[22px] pb-[10px] pr-12 rounded-none bg-white border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label
            htmlFor="password"
            className="absolute left-5 top-[16px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[10px] scale-[0.8] -translate-y-[10px] text-on-surface-variant/70 peer-focus:text-primary font-medium"
          >
            Mật khẩu
          </label>
          {/* Nút bật/tắt hiển thị mật khẩu */}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-4 top-[18px] text-on-surface-variant/70 hover:text-primary focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              className="rounded-none border-outline-variant accent-primary focus:ring-primary w-4 h-4 bg-white cursor-pointer"
              checked={rememberMe}
              onChange={(e) => handleRememberMeChange(e.target.checked)}
            />
            <span className="text-xs text-on-surface-variant font-medium">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link
            className="text-xs font-semibold text-primary hover:underline hover:text-primary-container transition-colors"
            href="/forgot-password"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-primary text-white py-3.5 rounded-none font-bold text-xs transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-depth-1 hover:shadow-depth-2"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="text-center text-xs text-on-surface-variant mt-2">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-bold text-primary hover:underline hover:text-primary-hover transition-colors"
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </>
  );
}
