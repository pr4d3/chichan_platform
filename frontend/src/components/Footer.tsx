import React from 'react';
import Link from 'next/link';
import { BRAND_CONFIG } from '@/config/branding';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';

export default function Footer() {
    return (
        <footer className="w-full py-12 px-4 md:px-16 bg-surface-container-lowest border-t border-outline-variant/30 mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Brand Column */}
                <div className="flex flex-col gap-4">
                    <Link href="/" className="flex items-center gap-2.5 group hover:opacity-80 transition-all duration-300 w-fit">
                        <div className="relative flex items-center justify-center w-8 h-8 bg-gradient-to-tr from-primary to-emerald-600 rounded-xl shadow-sm">
                            <ShieldCheck size={18} weight="fill" className="text-white" />
                        </div>
                        <span className="text-md font-bold text-primary">{BRAND_CONFIG.fullName}</span>
                    </Link>
                    <p className="text-xs text-on-surface-variant/80">
                        {BRAND_CONFIG.copyright}
                    </p>
                </div>
                
                {/* Links Column 1 */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Pháp lý & Điều khoản</h4>
                    <Link className="text-on-surface-variant hover:text-primary transition-colors text-xs w-fit" href="#">
                        Chính sách bảo mật
                    </Link>
                    <Link className="text-on-surface-variant hover:text-primary transition-colors text-xs w-fit" href="#">
                        Điều khoản sử dụng
                    </Link>
                </div>
                
                {/* Links Column 2 */}
                <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">Khám phá</h4>
                    <Link className="text-on-surface-variant hover:text-primary transition-colors text-xs w-fit" href="/about">
                        Nhóm NCKH THPT Giồng Ông Tố
                    </Link>
                    <Link className="text-on-surface-variant hover:text-primary transition-colors text-xs w-fit" href="/courses">
                        Góc học tập
                    </Link>
                    <Link className="text-on-surface-variant hover:text-primary transition-colors text-xs w-fit flex items-center gap-1.5" href="/game">
                        <span>Góc giải trí (Trò chơi AI)</span>
                        <span className="px-1 py-0.2 rounded bg-primary/10 text-primary text-[8px] font-bold">MỚI</span>
                    </Link>
                    <Link className="text-on-surface-variant hover:text-primary transition-colors text-xs w-fit" href="/forum">
                        Góc trò chuyện
                    </Link>
                </div>
            </div>
        </footer>
    );
}
