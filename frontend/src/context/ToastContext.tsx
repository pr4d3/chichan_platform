'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Warning, Info, X } from "@phosphor-icons/react";
import { Card } from "@/components/ui";

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string | any, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: any, type: ToastType = 'info') => {
        let text = 'Thông báo';
        if (typeof message === 'string') {
            text = message;
        } else if (message instanceof Error) {
            text = message.message;
        } else if (message && typeof message === 'object') {
            text = message.message || message.msg || message.detail || JSON.stringify(message);
        } else if (message !== undefined && message !== null) {
            text = String(message);
        }

        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message: text, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                {toasts.map((toast) => {
                    let IconComponent = Info;
                    let iconColorClass = 'text-primary';

                    if (toast.type === 'success') {
                        IconComponent = CheckCircle;
                        iconColorClass = 'text-emerald-600';
                    } else if (toast.type === 'error') {
                        IconComponent = XCircle;
                        iconColorClass = 'text-red-600';
                    } else if (toast.type === 'warning') {
                        IconComponent = Warning;
                        iconColorClass = 'text-amber-600';
                    }

                    return (
                        <Card
                            key={toast.id}
                            tone="glass"
                            p="none"
                            shadow="shadow-2xl"
                            className="pointer-events-auto flex items-center gap-3 text-on-surface px-5 py-4 transition-all duration-300 animate-slide-in"
                        >
                            <IconComponent size={22} weight="fill" className={`${iconColorClass} shrink-0`} />
                            <div className="flex-grow text-xs font-bold text-on-surface leading-relaxed">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-outline hover:text-on-surface transition-colors cursor-pointer flex-shrink-0"
                            >
                                <X size={16} weight="bold" />
                            </button>
                        </Card>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
