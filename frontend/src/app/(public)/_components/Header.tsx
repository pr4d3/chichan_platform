'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BRAND_CONFIG } from '@/config/branding';
import {
  ShieldCheck,
  Heart,
  Robot,
  List,
  X,
  HouseLine,
  BookOpen,
  ChatCircle,
  UserCircle,
  ChartLineUp,
  Info,
} from '@phosphor-icons/react';

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auto close drawer when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const isLinkActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'STUDENT_CHILD':
            case 'STUDENT':
                return { text: 'Học sinh', bg: 'bg-primary/10 text-primary' };
            case 'STUDENT_PARENT':
                return { text: 'Phụ huynh', bg: 'bg-amber-100 text-amber-900' };
            case 'INSTRUCTOR':
                return { text: 'Giáo viên', bg: 'bg-purple-100 text-purple-900' };
            case 'ADMIN':
                return { text: 'Quản trị viên', bg: 'bg-red-100 text-red-900' };
            default:
                return null;
        }
    };

    const roleBadge = getRoleBadge(user?.role);

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface/90 border-b border-outline-variant/30">
            <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-tr from-primary to-emerald-600 rounded-xl group-hover:scale-105 transition-transform shadow-sm">
                        <ShieldCheck size={20} weight="fill" className="text-white" />
                        <Heart size={10} weight="fill" className="text-amber-300 absolute bottom-[3px] right-[3px]" />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-primary">{BRAND_CONFIG.name}</span>
                </Link>
                
                {/* Desktop Nav Links */}
                <nav className="hidden md:flex items-center space-x-8">
                    <Link href="/" className={`text-sm transition-colors ${isLinkActive('/') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary font-medium'}`}>
                        Trang Chủ
                    </Link>
                    <Link href="/courses" className={`text-sm transition-colors ${isLinkActive('/courses') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary font-medium'}`}>
                        Góc Học Tập
                    </Link>
                    <Link href="/game" className={`text-sm transition-all flex items-center gap-1.5 ${isLinkActive('/game') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary font-medium'}`}>
                        <Robot size={18} weight="duotone" className="text-primary" />
                        Góc Giải Trí
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black tracking-wide border border-primary/20">MỚI</span>
                    </Link>
                    <Link href="/forum" className={`text-sm transition-colors ${isLinkActive('/forum') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary font-medium'}`}>
                        Góc Trò Chuyện
                    </Link>
                    <Link href="/about" className={`text-sm transition-colors ${isLinkActive('/about') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary font-medium'}`}>
                        Về Chúng Tôi
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {user ? (
                        <>
                            <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-full border border-primary/30 overflow-hidden bg-surface-container-low shrink-0 group-hover:border-primary transition-colors">
                                    <img
                                        src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc'}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc';
                                        }}
                                    />
                                </div>
                                <span className="hidden sm:inline">Chào, <span className="underline decoration-primary decoration-2 font-semibold text-on-surface">{user.full_name}</span></span>
                            </Link>
                            {(user.role === 'ADMIN' || user.role === 'INSTRUCTOR') && (
                                <Link href="/dashboard" className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-primary-container px-4 text-xs font-semibold text-on-primary-container transition-opacity hover:opacity-90">
                                    Dashboard
                                </Link>
                            )}
                            <button onClick={logout} className="hidden sm:inline-flex h-9 items-center justify-center rounded-full border border-outline/30 px-4 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hidden sm:inline-flex h-9 items-center justify-center text-sm font-medium text-primary hover:bg-surface-container-high px-4 rounded-full transition-colors">
                                Đăng nhập
                            </Link>
                            <Link href="/register" className="hidden sm:inline-flex h-9 items-center justify-center rounded-full bg-primary-container px-4 sm:px-5 text-xs font-semibold text-on-primary-container transition-opacity hover:opacity-90 shadow-sm">
                                Đăng ký
                            </Link>
                        </>
                    )}

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                        aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
                    >
                        {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer (Mounted to document.body via Portal to escape header backdrop-filter stacking context) */}
            {mounted && mobileMenuOpen && createPortal(
                <div className="fixed inset-0 z-[9999] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Slide-out Panel */}
                    <div className="fixed inset-y-0 right-0 w-[290px] max-w-[85vw] h-full h-[100dvh] bg-white shadow-2xl flex flex-col z-[10000] animate-slide-in border-l border-outline-variant/30">
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="relative flex items-center justify-center w-7 h-7 bg-gradient-to-tr from-primary to-emerald-600 rounded-lg shadow-sm">
                                    <ShieldCheck size={16} weight="fill" className="text-white" />
                                </div>
                                <span className="font-extrabold text-sm text-primary">{BRAND_CONFIG.name}</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                                aria-label="Đóng menu"
                            >
                                <X size={20} weight="bold" />
                            </button>
                        </div>

                        {/* User Profile Card (if logged in) */}
                        {user ? (
                            <div className="p-4 border-b border-outline-variant/20 bg-surface-container-lowest flex items-center gap-3 shrink-0">
                                <div className="w-11 h-11 rounded-full border-2 border-primary/20 overflow-hidden bg-surface-container shrink-0">
                                    <img
                                        src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc'}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc';
                                        }}
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-on-surface truncate">{user.full_name}</h4>
                                    <p className="text-[11px] text-on-surface-variant/70 truncate">{user.email}</p>
                                    {roleBadge && (
                                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${roleBadge.bg}`}>
                                            {roleBadge.text}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-b border-outline-variant/20 bg-primary/5 space-y-2 shrink-0">
                                <p className="text-xs text-on-surface-variant">Chào mừng bạn đến với {BRAND_CONFIG.name}!</p>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-center py-2 px-3 rounded-lg border border-primary text-primary font-bold text-xs hover:bg-primary/10 transition-colors"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-center py-2 px-3 rounded-lg bg-primary text-white font-bold text-xs hover:opacity-90 shadow-xs transition-opacity"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Drawer Links */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-white">
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                    isLinkActive('/') && pathname === '/'
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                <HouseLine size={18} weight="duotone" className="text-primary" />
                                <span>Trang Chủ</span>
                            </Link>

                            <Link
                                href="/courses"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                    isLinkActive('/courses')
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                <BookOpen size={18} weight="duotone" className="text-primary" />
                                <span>Góc Học Tập (Khóa học)</span>
                            </Link>

                            <Link
                                href="/game"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                    isLinkActive('/game')
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Robot size={18} weight="duotone" className="text-primary" />
                                    <span>Góc Giải Trí (AI Game)</span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black">MỚI</span>
                            </Link>

                            <Link
                                href="/forum"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                    isLinkActive('/forum')
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                <ChatCircle size={18} weight="duotone" className="text-primary" />
                                <span>Góc Trò Chuyện (Diễn đàn)</span>
                            </Link>

                            <Link
                                href="/about"
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                    isLinkActive('/about')
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                }`}
                            >
                                <Info size={18} weight="duotone" className="text-primary" />
                                <span>Về Chúng Tôi (Nhóm NCKH)</span>
                            </Link>

                            {user && (
                                <Link
                                    href="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                                        pathname === '/profile'
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                                    }`}
                                >
                                    <UserCircle size={18} weight="duotone" className="text-primary" />
                                    <span>Hồ Sơ Cá Nhân</span>
                                </Link>
                            )}

                            {user && (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') && (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors mt-2"
                                >
                                    <ChartLineUp size={18} weight="bold" className="text-amber-700" />
                                    <span>Trang Quản Trị (Dashboard)</span>
                                </Link>
                            )}
                        </div>

                        {/* Drawer Bottom Actions */}
                        {user && (
                            <div className="p-4 border-t border-outline-variant/20 bg-white shrink-0">
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="w-full py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer text-center"
                                >
                                    Đăng xuất tài khoản
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
}

