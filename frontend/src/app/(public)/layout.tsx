'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/app/(public)/_components/Header';
import Footer from '@/app/(public)/_components/Footer';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // Ẩn Header và Footer hoàn toàn trên phòng chơi game mô phỏng (/game/[sessionId])
    const isGameRoom = pathname?.startsWith('/game/') && pathname !== '/game';

    if (isGameRoom) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-on-background">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}

