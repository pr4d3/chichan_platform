'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BRAND_CONFIG } from '@/config/branding';
import { Spinner } from '@/components/ui';
import {
  ChartLineUp,
  UserGear,
  UsersThree,
  Robot,
  ArrowLeft,
} from "@phosphor-icons/react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace('/login');
            } else if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
                router.replace('/invalid?reason=' + encodeURIComponent('Trang quản trị hệ thống chỉ dành cho Quản trị viên và Chuyên gia giảng dạy.'));
            } else if (pathname.startsWith('/dashboard/users') && user.role !== 'ADMIN') {
                router.replace('/invalid?reason=' + encodeURIComponent('Chức năng Quản lý người dùng chỉ dành riêng cho Quản trị viên cấp cao.'));
            }
        }
    }, [user, loading, pathname, router]);

    const isLinkActive = (path: string) => {
        return pathname === path;
    };

    if (loading || (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR'))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-background text-on-background antialiased font-sans">
            {/* Sidebar navigation */}
            <aside className="w-64 border-r border-outline-variant/30 bg-white/80 backdrop-blur-md flex flex-col justify-between shrink-0 h-screen sticky top-0">
                <div className="p-6 space-y-8">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-lg font-extrabold text-primary">
                            {BRAND_CONFIG.name}
                        </Link>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant uppercase">
                            Admin
                        </span>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block font-bold mb-3 px-3">
                            Mục quản trị
                        </span>
                        
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                                isLinkActive('/dashboard') 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
                            }`}
                        >
                            <ChartLineUp size={18} weight="bold" />
                            Tổng quan số liệu
                        </Link>

                        {user?.role === 'ADMIN' && (
                            <Link
                                href="/dashboard/users"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                                    isLinkActive('/dashboard/users') 
                                        ? 'bg-primary text-white shadow-sm' 
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
                                }`}
                            >
                                <UserGear size={18} weight="bold" />
                                Quản lý người dùng
                            </Link>
                        )}

                        <Link
                            href="/dashboard/students"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                                isLinkActive('/dashboard/students') 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
                            }`}
                        >
                            <UsersThree size={18} weight="bold" />
                            Theo dõi học viên
                        </Link>

                        <Link
                            href="/game"
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                                isLinkActive('/game') 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
                            }`}
                        >
                            <Robot size={18} weight="duotone" />
                            Phòng Chơi AI Roleplay
                        </Link>
                    </div>
                </div>

                {/* Sidebar footer */}
                <div className="p-4 border-t border-outline-variant/20 space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 border border-white/80 shadow-sm">
                        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold uppercase">
                            {user?.full_name?.charAt(0) || 'G'}
                        </div>
                        <div className="truncate">
                            <strong className="text-on-surface text-xs font-bold block truncate">{user?.full_name}</strong>
                            <span className="text-[10px] text-on-surface-variant block truncate">{user?.email}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-white/50 transition-all cursor-pointer"
                    >
                        <ArrowLeft size={18} weight="bold" />
                        Về trang chủ
                    </button>
                </div>
            </aside>

            {/* Main content page area */}
            <main className="flex-grow p-8 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
