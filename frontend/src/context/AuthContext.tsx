'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import { api } from '@/lib/api';

interface User {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (credentials: any) => Promise<any>;
    register: (details: any) => Promise<any>;
    logout: () => Promise<void>;
    updateUserLocal: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            const token = api.getToken();
            const userInfo = api.getUserInfo();
            if (token && userInfo) {
                setUser(userInfo);
            } else {
                api.clearAuth();
                setUser(null);
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    // Các hàm bọc useCallback để tham chiếu ổn định, tránh consumer re-render vô ích
    const login = useCallback(async (credentials: any) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', credentials);
            if (res.success) {
                const { access_token, refresh_token, user: userData } = res.data;
                api.saveAuth(access_token, refresh_token, userData);
                setUser(userData);
                return res;
            }
        } catch (err) {
            api.clearAuth();
            setUser(null);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (details: any) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/register', details);
            return res;
        } catch (err) {
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
            if (refresh) {
                await api.post('/auth/logout', { refresh_token: refresh });
            }
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            api.clearAuth();
            setUser(null);
            setLoading(false);
            window.location.href = '/login';
        }
    }, []);

    const updateUserLocal = useCallback((updatedUser: Partial<User>) => {
        if (user) {
            const newUserData = { ...user, ...updatedUser };
            setUser(newUserData);
            localStorage.setItem('user_info', JSON.stringify(newUserData));
        }
    }, [user]);

    // value được memo lại: consumer chỉ re-render khi user/loading thực sự đổi
    const value = useMemo(
        () => ({ user, loading, login, register, logout, updateUserLocal }),
        [user, loading, login, register, logout, updateUserLocal],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
