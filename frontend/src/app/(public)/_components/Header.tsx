'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BRAND_CONFIG } from '@/config/branding';
import { ShieldCheck, Heart, Robot } from '@phosphor-icons/react';

export default function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const isLinkActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-surface/80 border-b border-outline-variant/30">
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
                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors group">
                                <div className="w-8 h-8 rounded-none border border-primary/30 overflow-hidden bg-surface-container-low shrink-0 group-hover:border-primary transition-colors">
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
                            <button onClick={logout} className="h-9 items-center justify-center rounded-full border border-outline/30 px-4 text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer">
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hidden md:inline-flex h-9 items-center justify-center text-sm font-medium text-primary hover:bg-surface-container-high px-4 rounded-full transition-colors">
                                Đăng nhập
                            </Link>
                            <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-full bg-primary-container px-5 text-xs font-semibold text-on-primary-container transition-opacity hover:opacity-90 shadow-sm">
                                Đăng ký
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
