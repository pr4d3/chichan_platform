'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const getHeaderInfo = () => {
        if (pathname === '/login') {
            return {
                title: 'Khởi đầu Hành trình',
                subtitle: 'Đăng nhập vào hệ thống',
            };
        }
        if (pathname === '/forgot-password') {
            return {
                title: 'Khôi phục Mật khẩu',
                subtitle: 'Lấy lại quyền truy cập vào tài khoản',
            };
        }
        if (pathname === '/reset-password') {
            return {
                title: 'Đặt lại Mật khẩu',
                subtitle: 'Thiết lập mật khẩu mới cho tài khoản',
            };
        }
        return {
            title: 'Khởi đầu Hành trình',
            subtitle: 'Tạo tài khoản mới',
        };
    };

    const header = getHeaderInfo();

    return (
        <div className="bg-surface text-on-surface min-h-screen w-full flex flex-col lg:flex-row p-4 lg:p-6 gap-6 font-sans antialiased overflow-x-hidden">
            {/* Left Side: Illustration & Message */}
            <div className="hidden lg:flex w-1/2 bg-surface-container-lowest rounded-none flex-col justify-center items-center p-12 relative overflow-hidden border border-outline-variant/30 shadow-depth-1">
                <div className="z-10 max-w-md text-center">
                    <img 
                        className="w-full h-auto mb-8 rounded-none object-contain" 
                        alt="Safe Sex Education Illustration" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsiyh6bFSuXSuCrjsf6Bf7piF2fQ-fR_AqzwgGj7Rt6vN9NJ3eR8thPqU3NI6ckUUgpJhtE2eJLicVNwUh2dATYjkI-s462wFpkkCIrJVfjBhOwJK5TiWdc5--DEgJY38IV6u5JzNw9zEhYNOGx7fO2X1aoKwqzkcq6hhC1Bl9HM25dJPdaUjWhwl3GQfivxkudE6XgYPLllKQc0c_FSjpY9nPzU19zYAEFCFtWO7jTD5507bWPcILbg"
                    />
                    <h1 className="text-2xl font-bold text-primary mb-4">Kiến thức là Sức mạnh</h1>
                    <p className="text-sm text-on-surface-variant font-normal leading-relaxed">
                        Nền tảng giáo dục giới tính an toàn, khoa học và đáng tin cậy. Xây dựng môi trường học tập cởi mở và tôn trọng.
                    </p>
                </div>
            </div>

            {/* Right Side: Auth Forms */}
            <div className="w-full lg:w-1/2 flex justify-center items-center py-6 lg:py-12 overflow-y-auto min-h-[calc(100vh-3rem)]">
                <div className="w-full max-w-md bg-white rounded-none p-6 lg:p-8 flex flex-col gap-5 lg:gap-6 border border-outline-variant/30 shadow-depth-2">
                    {/* Branding */}
                    <div className="text-center mb-2">
                        <h2 className="text-2xl font-extrabold text-primary">{header.title}</h2>
                        <p className="text-sm text-on-surface-variant mt-2">
                            {header.subtitle}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
