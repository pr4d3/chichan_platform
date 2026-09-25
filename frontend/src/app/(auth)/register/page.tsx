'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { HouseLine, Backpack, Check } from "@phosphor-icons/react";

export default function RegisterPage() {
    const { register, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    const [role, setRole] = useState<'STUDENT_PARENT' | 'STUDENT_CHILD'>('STUDENT_PARENT');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Advanced client-side validation states
    const [errors, setErrors] = useState<{
        fullName?: string;
        username?: string;
        email?: string;
        password?: string;
    }>({});

    const [touched, setTouched] = useState<{
        fullName?: boolean;
        username?: boolean;
        email?: boolean;
        password?: boolean;
    }>({});

    const validateFullName = (val: string) => {
        const trimmed = val.trim();
        if (!trimmed) return "Nickname không được để trống";
        if (trimmed.length < 2) return "Nickname phải có ít nhất 2 ký tự";
        if (trimmed.length > 50) return "Nickname không được vượt quá 50 ký tự";
        return "";
    };

    const validateUsername = (val: string) => {
        if (!val) return "Tên đăng nhập không được để trống";
        if (val.length < 3) return "Tên đăng nhập phải từ 3 ký tự trở lên";
        if (val.length > 20) return "Tên đăng nhập không được vượt quá 20 ký tự";
        const re = /^[a-zA-Z0-9_]+$/;
        if (!re.test(val)) return "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới";
        return "";
    };

    const validateEmail = (val: string) => {
        if (!val) return "Email không được để trống";
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(val)) return "Email không đúng định dạng (ví dụ: name@domain.com)";
        return "";
    };

    const validatePassword = (val: string) => {
        if (!val) return "Mật khẩu không được để trống";
        if (/\s/.test(val)) return "Mật khẩu không được chứa khoảng trắng";
        if (val.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
        const hasLetter = /[a-zA-Z]/.test(val);
        const hasNumber = /\d/.test(val);
        if (!hasLetter || !hasNumber) return "Mật khẩu phải chứa cả chữ cái và chữ số";
        return "";
    };

    // Run validation on changes when touched
    useEffect(() => {
        if (touched.fullName) {
            setErrors(prev => ({ ...prev, fullName: validateFullName(fullName) }));
        }
    }, [fullName, touched.fullName]);

    useEffect(() => {
        if (touched.username) {
            setErrors(prev => ({ ...prev, username: validateUsername(username) }));
        }
    }, [username, touched.username]);

    useEffect(() => {
        if (touched.email) {
            setErrors(prev => ({ ...prev, email: validateEmail(email) }));
        }
    }, [email, touched.email]);

    useEffect(() => {
        if (touched.password) {
            setErrors(prev => ({ ...prev, password: validatePassword(password) }));
        }
    }, [password, touched.password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Mark all fields as touched
        setTouched({
            fullName: true,
            username: true,
            email: true,
            password: true
        });

        // Run all validations
        const fError = validateFullName(fullName);
        const uError = validateUsername(username);
        const eError = validateEmail(email);
        const pError = validatePassword(password);

        if (fError || uError || eError || pError) {
            setErrors({
                fullName: fError,
                username: uError,
                email: eError,
                password: pError
            });
            showToast("Vui lòng kiểm tra và sửa các lỗi nhập liệu trước khi tiếp tục.", "error");
            return;
        }

        try {
            const res = await register({
                username,
                email,
                password,
                full_name: fullName,
                role_code: role,
            });

            if (res.success) {
                setSuccess(true);
                showToast("Đăng ký tài khoản thành công!", "success");
                setTimeout(() => {
                    router.push('/login');
                }, 1500);
            }
        } catch (err: any) {
            const errMsg = err.message || 'Lỗi đăng ký tài khoản';
            setError(errMsg);
            showToast(errMsg, 'error');
        }
    };

    return (
        <>
            {error && (
                <div className="rounded-none bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-600">
                    {error}
                </div>
            )}

             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Role Selector */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-on-surface ml-1">
                        Bạn tham gia với tư cách nào?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={() => setRole('STUDENT_PARENT')}
                            className={`flex flex-col items-center justify-center p-3 rounded-none border cursor-pointer transition-all select-none ${
                                role === 'STUDENT_PARENT' 
                                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-depth-1' 
                                    : 'border-outline-variant/30 bg-white hover:bg-surface-container-low'
                            }`}
                        >
                            <HouseLine size={24} weight="duotone" className="text-primary mb-1.5" />
                            <span className="text-xs font-bold text-on-surface">Phụ huynh</span>
                        </div>
                        <div
                            onClick={() => setRole('STUDENT_CHILD')}
                            className={`flex flex-col items-center justify-center p-3 rounded-none border cursor-pointer transition-all select-none ${
                                role === 'STUDENT_CHILD' 
                                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-depth-1' 
                                    : 'border-outline-variant/30 bg-white hover:bg-surface-container-low'
                            }`}
                        >
                            <Backpack size={24} weight="duotone" className="text-primary mb-1.5" />
                            <span className="text-xs font-bold text-on-surface">Học sinh</span>
                        </div>
                    </div>
                </div>

                {/* Inputs */}
                {/* Nickname Input Container */}
                <div>
                    <div className="relative">
                        <input
                            id="fullName"
                            type="text"
                            required
                            placeholder=" "
                            className={`peer block w-full px-5 pt-[20px] pb-[8px] rounded-none bg-white border focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent ${
                                touched.fullName && errors.fullName
                                    ? 'border-red-400 focus:ring-red-400'
                                    : 'border-outline-variant/60'
                            }`}
                            value={fullName}
                            onBlur={() => setTouched(p => ({ ...p, fullName: true }))}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                        <label
                            htmlFor="fullName"
                            className={`absolute left-5 top-[14px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[8px] scale-[0.8] -translate-y-[8px] ${
                                touched.fullName && errors.fullName
                                    ? 'text-red-500 peer-focus:text-red-500'
                                    : 'text-on-surface-variant/70 peer-focus:text-primary font-medium'
                            }`}
                        >
                            Nickname
                        </label>
                    </div>
                    {touched.fullName && errors.fullName ? (
                        <span className="text-[10px] text-red-500 font-semibold ml-2 mt-1 block">{errors.fullName}</span>
                    ) : (
                        <span className="text-[11px] text-on-surface-variant/60 font-normal ml-2 mt-1 block">
                            Bạn muốn mọi người gọi bạn bằng gì?
                        </span>
                    )}
                </div>

                {/* Username Input Container */}
                <div className="relative">
                    <input
                        id="username"
                        type="text"
                        required
                        placeholder=" "
                        className={`peer block w-full px-5 pt-[20px] pb-[8px] rounded-none bg-white border focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent ${
                            touched.username && errors.username
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-outline-variant/60'
                        }`}
                        value={username}
                        onBlur={() => setTouched(p => ({ ...p, username: true }))}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <label
                        htmlFor="username"
                        className={`absolute left-5 top-[14px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[8px] scale-[0.8] -translate-y-[8px] ${
                            touched.username && errors.username
                                ? 'text-red-500 peer-focus:text-red-500'
                                : 'text-on-surface-variant/70 peer-focus:text-primary font-medium'
                        }`}
                    >
                        Tên đăng nhập
                    </label>
                    {touched.username && errors.username && (
                        <span className="text-[10px] text-red-500 font-semibold ml-2 mt-1 block">{errors.username}</span>
                    )}
                </div>

                {/* Email Input Container */}
                <div className="relative">
                    <input
                        id="email"
                        type="email"
                        required
                        placeholder=" "
                        className={`peer block w-full px-5 pt-[20px] pb-[8px] rounded-none bg-white border focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent ${
                            touched.email && errors.email
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-outline-variant/60'
                        }`}
                        value={email}
                        onBlur={() => setTouched(p => ({ ...p, email: true }))}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <label
                        htmlFor="email"
                        className={`absolute left-5 top-[14px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[8px] scale-[0.8] -translate-y-[8px] ${
                            touched.email && errors.email
                                ? 'text-red-500 peer-focus:text-red-500'
                                : 'text-on-surface-variant/70 peer-focus:text-primary font-medium'
                        }`}
                    >
                        Địa chỉ Email
                    </label>
                    {touched.email && errors.email && (
                        <span className="text-[10px] text-red-500 font-semibold ml-2 mt-1 block">{errors.email}</span>
                    )}
                </div>

                {/* Password Input Container */}
                <div className="relative">
                    <input
                        id="password"
                        type="password"
                        required
                        placeholder=" "
                        className={`peer block w-full px-5 pt-[20px] pb-[8px] rounded-none bg-white border focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-sm text-on-surface placeholder:text-transparent ${
                            touched.password && errors.password
                                ? 'border-red-400 focus:ring-red-400'
                                : 'border-outline-variant/60'
                        }`}
                        value={password}
                        onBlur={() => setTouched(p => ({ ...p, password: true }))}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <label
                        htmlFor="password"
                        className={`absolute left-5 top-[14px] text-sm transition-all duration-300 transform origin-[0] pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.8] peer-focus:-translate-y-[8px] scale-[0.8] -translate-y-[8px] ${
                            touched.password && errors.password
                                ? 'text-red-500 peer-focus:text-red-500'
                                : 'text-on-surface-variant/70 peer-focus:text-primary font-medium'
                        }`}
                    >
                        Mật khẩu
                    </label>
                    {touched.password && errors.password === "Mật khẩu không được để trống" && (
                        <span className="text-[10px] text-red-500 font-semibold ml-2 mt-1 block">{errors.password}</span>
                    )}
                    
                    {/* Password requirements list */}
                    <div className="flex flex-col gap-1 mt-2 px-1">
                        <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
                            {password.length >= 6 ? (
                                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
                            )}
                            <span className={password.length >= 6 ? "text-emerald-600 font-semibold" : "text-on-surface-variant/50"}>
                                Tối thiểu 6 ký tự
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
                            {/[a-zA-Z]/.test(password) ? (
                                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
                            )}
                            <span className={/[a-zA-Z]/.test(password) ? "text-emerald-600 font-semibold" : "text-on-surface-variant/50"}>
                                Chứa ít nhất 1 chữ cái
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
                            {/\d/.test(password) ? (
                                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
                            )}
                            <span className={/\d/.test(password) ? "text-emerald-600 font-semibold" : "text-on-surface-variant/50"}>
                                Chứa ít nhất 1 chữ số
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-medium transition-all">
                            {password && !/\s/.test(password) ? (
                                <Check size={14} weight="bold" className="text-emerald-500 shrink-0" />
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-none bg-on-surface-variant/40 ml-1.5 mr-1" />
                            )}
                            <span className={password && !/\s/.test(password) ? "text-emerald-600 font-semibold" : "text-on-surface-variant/50"}>
                                Không chứa khoảng trắng
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full mt-2 bg-primary text-white py-3.5 rounded-none font-bold text-xs transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 cursor-pointer shadow-depth-1 hover:shadow-depth-2"
                >
                    {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                </button>

                <p className="text-center text-xs text-on-surface-variant mt-2">
                    Đã có tài khoản?{' '}
                    <Link
                        href="/login"
                        className="font-bold text-primary hover:underline hover:text-primary-hover transition-colors"
                    >
                        Đăng nhập ngay
                    </Link>
                </p>
            </form>
        </>
    );
}
