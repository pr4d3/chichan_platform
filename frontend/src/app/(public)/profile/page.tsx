'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap,
  Gear,
  Certificate,
  Robot,
} from "@phosphor-icons/react";
import { FormRow } from "@/components/ui";

interface EnrolledCourse {
    course_id: string;
    course_title: string;
    thumbnail_url: string | null;
    status: 'IN_PROGRESS' | 'COMPLETED';
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
}

export default function ProfilePage() {
    const { user, updateUserLocal } = useAuth();

    const [activeTab, setActiveTab] = useState<'progress' | 'settings'>('progress');
    const [profileLoading, setProfileLoading] = useState(true);
    const [myCourses, setMyCourses] = useState<EnrolledCourse[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    // Form states
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bio, setBio] = useState('');
    const [updating, setUpdating] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const bioRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (bioRef.current) {
            bioRef.current.style.height = 'auto';
            if (bio) {
                bioRef.current.style.height = `${bioRef.current.scrollHeight}px`;
            }
        }
    }, [bio]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                if (res.success) {
                    const u = res.data;
                    setFullName(u.full_name || '');
                    setGender(u.gender || '');
                    setDob(u.date_of_birth || '');
                    setPhone(u.phone_number || '');
                    setAvatarUrl(u.avatar_url || '');
                    setBio(u.bio || '');

                    if (u.role === 'STUDENT_PARENT' || u.role === 'STUDENT_CHILD') {
                        setActiveTab('progress');
                        fetchMyCourses();
                    } else {
                        setActiveTab('settings');
                    }
                }
            } catch (err) {
                console.error("Error loading profile", err);
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const fetchMyCourses = async () => {
        setCoursesLoading(true);
        try {
            const res = await api.get('/users/my-courses');
            if (res.success) {
                setMyCourses(res.data);
            }
        } catch (err) {
            console.error("Error loading my courses", err);
        } finally {
            setCoursesLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        setUpdating(true);

        try {
            const res = await api.put('/users/profile', {
                full_name: fullName,
                gender: gender || null,
                date_of_birth: dob || null,
                phone_number: phone || null,
                avatar_url: avatarUrl || null,
                bio: bio || null,
            });

            if (res.success) {
                setMsg({ type: 'success', text: 'Cập nhật hồ sơ cá nhân thành công!' });
                updateUserLocal({ full_name: fullName });
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Lỗi khi cập nhật hồ sơ' });
        } finally {
            setUpdating(false);
        }
    };

    if (profileLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-on-surface-variant text-sm font-semibold animate-pulse">Đang tải thông tin tài khoản...</div>
            </div>
        );
    }

    const isStudent = user?.role === 'STUDENT_PARENT' || user?.role === 'STUDENT_CHILD';

    return (
        <div className="container mx-auto max-w-7xl px-4 md:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Avatar and role widget */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 text-center border border-white/60 shadow-sm space-y-5">
                        <div className="relative mx-auto h-28 w-28 rounded-full overflow-hidden border-4 border-surface-container shadow-sm bg-surface-container-low">
                            <img
                                src={avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrgdc9z0GZMlo2tAx1T7LVSV-OamtTdXT-m_7GazSWUSIPwxGINMVTnUWpfKnSZqvW4Me8RDkJFOoSwnx0gTwIqj7kNGSPqeQItmW2vHH0WZVmackXLPAPMmR0OWYYq9vw6ucWlAUm71KUctPiqTVnbFLdY17vAdPSOILyoR4nGo1i2Vh-Zh30Bads3Dc09BpMNvA2_TZzCwbKpF34Kcu7_ZXU2JA7NJIXgJWoP00Z_Oxx5jPPyB08g'}
                                alt="User Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-on-surface leading-tight">{fullName}</h3>
                            <span className="inline-flex px-3 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-wider">
                                {user?.role === 'ADMIN'
                                    ? 'Quản trị viên'
                                    : user?.role === 'INSTRUCTOR'
                                    ? 'Giảng viên'
                                    : user?.role === 'STUDENT_PARENT'
                                    ? 'Phụ huynh'
                                    : 'Học sinh'}
                            </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-light">
                            {bio || 'Chưa thiết lập tiểu sử.'}
                        </p>
                    </div>

                    {/* Navigation Tab Menu */}
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-2 flex flex-col space-y-1 border border-white/60 shadow-sm">
                        {isStudent && (
                            <button
                                onClick={() => setActiveTab('progress')}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                                    activeTab === 'progress' 
                                        ? 'bg-primary text-white shadow-sm' 
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/40'
                                }`}
                            >
                                <GraduationCap size={18} weight="duotone" />
                                Tiến độ học tập
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                                activeTab === 'settings' 
                                        ? 'bg-primary text-white shadow-sm' 
                                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/40'
                            }`}
                        >
                            <Gear size={18} weight="duotone" />
                            Thông tin tài khoản
                        </button>
                    </div>
                </div>

                {/* Right Side: Tab content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tab 1: Learning Progress */}
                    {activeTab === 'progress' && isStudent && (
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-on-surface">Khóa học của tôi</h2>
                            
                            {coursesLoading ? (
                                <div className="text-on-surface-variant text-xs font-medium py-6 animate-pulse">Đang tải danh mục khóa học...</div>
                            ) : myCourses.length === 0 ? (
                                <div className="text-center py-12 space-y-4">
                                    <p className="text-on-surface-variant text-sm font-light">Bạn chưa đăng ký tham gia khóa học nào.</p>
                                    <Link href="/courses" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity">
                                        Khám phá khóa học ngay
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {myCourses.map((c) => (
                                        <div key={c.course_id} className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 flex flex-col sm:flex-row items-center gap-6 justify-between shadow-sm hover-shadow transition-all duration-300">
                                            <div className="flex-1 w-full space-y-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h3 className="font-bold text-on-surface text-sm sm:text-base leading-snug">{c.course_title}</h3>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                                        c.status === 'COMPLETED'
                                                            ? 'border-primary/20 bg-primary/10 text-primary'
                                                            : 'border-secondary-container/20 bg-secondary-container/10 text-secondary-container'
                                                    }`}>
                                                        {c.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang học'}
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                                                        <span>Hoàn thành: {c.completed_lessons}/{c.total_lessons} bài học</span>
                                                        <span>{c.progress_percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                                                        <div className="bg-primary h-full transition-all duration-500 rounded-full" style={{ width: `${c.progress_percentage}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                                                <Link
                                                    href={`/courses/${c.course_id}/learn`}
                                                    className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                                                >
                                                    Vào học
                                                </Link>
                                                {c.status === 'COMPLETED' && (
                                                    <Link
                                                        href={`/courses/${c.course_id}/certificate`}
                                                        className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary px-4 text-xs font-bold hover:bg-primary/20 transition-colors gap-1"
                                                    >
                                                        <Certificate size={16} weight="duotone" />
                                                        Xem chứng chỉ
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Featured AI Roleplay Hub Card */}
                            <div className="bg-gradient-to-br from-primary-fixed/30 via-secondary-fixed/20 to-tertiary-fixed/30 rounded-3xl p-6 border border-primary/20 flex flex-col sm:flex-row items-center gap-6 justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Robot size={28} weight="duotone" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-on-surface text-sm">Phòng Chơi &amp; Mô Phỏng AI</h3>
                                            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[9px] font-black uppercase">4 Kịch bản</span>
                                        </div>
                                        <p className="text-xs text-on-surface-variant leading-relaxed font-light mt-0.5">
                                            Rèn luyện phản xạ với AI, nhận điểm an toàn và báo cáo đánh giá khoa học y tế.
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/game"
                                    className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-xs font-bold text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all flex-shrink-0"
                                >
                                    Vào phòng chơi
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Settings Profile Update */}
                    {activeTab === 'settings' && (
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white/60 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-on-surface">Chỉnh sửa hồ sơ cá nhân</h2>

                            {msg && (
                                <div className={`rounded-2xl p-4 text-xs font-semibold border ${
                                    msg.type === 'success'
                                        ? 'bg-primary/10 border-primary/20 text-primary'
                                        : 'bg-red-50 border-red-200/50 text-red-600'
                                }`}>
                                    {msg.text}
                                </div>
                            )}

                            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormRow label="Họ và tên" htmlFor="fullName" required className="flex flex-col gap-1.5">
                                    <input
                                        id="fullName"
                                        type="text"
                                        required
                                        className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </FormRow>

                                <FormRow label="Giới tính" htmlFor="gender" className="flex flex-col gap-1.5">
                                    <select
                                        id="gender"
                                        className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                    >
                                        <option value="">Chưa thiết lập</option>
                                        <option value="MALE">Nam</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                </FormRow>

                                <FormRow label="Ngày sinh" htmlFor="dob" className="flex flex-col gap-1.5">
                                    <input
                                        id="dob"
                                        type="date"
                                        className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                    />
                                </FormRow>

                                <FormRow label="Số điện thoại" htmlFor="phone" className="flex flex-col gap-1.5">
                                    <input
                                        id="phone"
                                        type="text"
                                        className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                                        placeholder="0901234567"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </FormRow>

                                <FormRow label="Đường dẫn ảnh đại diện (Avatar URL)" htmlFor="avatarUrl" className="flex flex-col gap-1.5 md:col-span-2">
                                    <input
                                        id="avatarUrl"
                                        type="text"
                                        className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none"
                                        placeholder="https://image-url.com/avatar.jpg"
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                    />
                                </FormRow>

                                <FormRow label="Tiểu sử bản thân (Bio)" htmlFor="bio" className="flex flex-col gap-1.5 md:col-span-2">
                                    <textarea
                                        ref={bioRef}
                                        id="bio"
                                        rows={4}
                                        className="w-full bg-white/50 border border-white/60 rounded-2xl px-4 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary shadow-inner transition-all outline-none resize-none overflow-hidden"
                                        placeholder="Nhập giới thiệu ngắn về bản thân..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    />
                                </FormRow>

                                <div className="md:col-span-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="w-full flex h-11 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
