"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { WarningCircle } from "@phosphor-icons/react";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await login({
        username_or_email: usernameOrEmail.trim(),
        password,
      });

      if (res.success) {
        showToast("Đăng nhập thành công!", "success");
        router.push("/");
      }
    } catch (err: any) {
      const errMsg = err.message || "Sai thông tin đăng nhập";
      setError(errMsg);
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Username/Email Input Container */}
        <div className="relative">
          <input
            id="username"
            type="text"
            required
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
            type="password"
            required
            placeholder=" "
            className="peer block w-full px-5 pt-[22px] pb-[10px] rounded-none bg-white border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label
            htmlFor="password"
            className="absolute left-5 top-[16px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[10px] scale-[0.8] -translate-y-[10px] text-on-surface-variant/70 peer-focus:text-primary font-medium"
          >
            Mật khẩu
          </label>
        </div>

        <div className="flex items-center justify-between mt-2 px-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded-none border-outline-variant accent-primary focus:ring-primary w-4 h-4 bg-white cursor-pointer"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-xs text-on-surface-variant font-medium">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <a
            className="text-xs font-semibold text-primary hover:underline hover:text-primary-container transition-colors"
            href="#"
          >
            Quên mật khẩu?
          </a>
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
