'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CourseIntroSkeleton } from '@/components/Skeleton';
import { useToast } from '@/context/ToastContext';
import { BRAND_CONFIG } from '@/config/branding';
import { EmptyState } from '@/components/ui';
import {
  WarningCircle,
  ShieldCheck,
  Sparkle,
  CheckCircle,
  CaretDown,
  Clock,
  Play,
  BookOpen,
  UsersThree,
  Infinity as InfinityIcon,
  ArrowRight,
} from "@phosphor-icons/react";

interface SyllabusItem {
    id: string;
    order_index: number;
    title: string;
    duration_minutes: number | null;
}

export default function CourseIntroPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const courseId = params.courseId as string;
    
    const [courseData, setCourseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);
    const [expandedSyllabus, setExpandedSyllabus] = useState<boolean>(true);
    const { showToast } = useToast();

    useEffect(() => {
        if (!courseId) return;

        const fetchCourseDetail = async () => {
            try {
                const res = await api.get(`/courses/${courseId}/intro`);
                if (res.success) {
                    setCourseData(res.data);
                }
            } catch (err: any) {
                const msg = err.message || 'Lỗi khi tải chi tiết khóa học';
                if (msg.includes('quyền') || msg.includes('dành riêng') || msg.includes('không thể xem')) {
                    router.replace(`/invalid?reason=${encodeURIComponent(msg)}`);
                    return;
                }
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchCourseDetail();
    }, [courseId, router]);

    const handleAction = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (courseData.is_enrolled) {
            router.push(`/courses/${courseId}/learn`);
            return;
        }

        setEnrolling(true);
        try {
            const res = await api.post(`/courses/${courseId}/enroll`, {});
            if (res.success) {
                showToast("Đăng ký khóa học thành công!", "success");
                router.push(`/courses/${courseId}/learn`);
            }
        } catch (err: any) {
            const msg = err.message || "Lỗi khi đăng ký khóa học";
            if (msg.includes('quyền') || msg.includes('dành riêng') || msg.includes('không thể')) {
                router.replace(`/invalid?reason=${encodeURIComponent(msg)}`);
                return;
            }
            showToast(msg, "error");
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return <CourseIntroSkeleton />;
    }

    if (error || !courseData) {
        return (
            <EmptyState
                tone="error"
                icon={<WarningCircle size={32} weight="duotone" />}
                title="Không tìm thấy khóa học này"
                body={error ?? undefined}
                action={{ label: 'Quay lại danh mục', href: '/courses' }}
                className="py-16 max-w-md mx-auto"
            />
        );
    }

    const isParent = courseData.target_audience === 'PARENT';
    const isChild = courseData.target_audience === 'CHILD';
    const audienceText = isParent ? 'Phụ huynh' : isChild ? 'Học sinh' : 'Mọi đối tượng';

    return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12 flex flex-col lg:flex-row gap-8">
            {/* Left Column: Main Content (70%) */}
            <div className="w-full lg:w-[70%] space-y-10">
                {/* Hero section */}
                <section className="space-y-6">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-semibold">
                        <ShieldCheck size={16} weight="fill" />
                        Dành cho {audienceText}
                    </div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-on-surface leading-tight">
                        {courseData.title}
                    </h1>
                    <p className="text-base text-on-surface-variant font-light leading-relaxed">
                        {courseData.description || 'Chưa có mô tả chi tiết cho khóa học này. Hãy bắt đầu lộ trình học tập để tích lũy kiến thức chuẩn khoa học ngay hôm nay.'}
                    </p>

                    {/* Learning Objectives */}
                    {courseData.learning_objectives ? (
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white/50 mt-8">
                            <h2 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                                <Sparkle size={22} weight="fill" className="text-primary" />
                                Mục tiêu học tập
                            </h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {courseData.learning_objectives
                                    .split('\n')
                                    .map((line: string) => line.trim().replace(/^[-*•]\s*/, ''))
                                    .filter((line: string) => line.length > 0)
                                    .map((obj: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3 bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                                            <CheckCircle size={20} weight="fill" className="text-primary mt-0.5 flex-shrink-0" />
                                            <span className="text-sm text-on-surface font-medium leading-relaxed">{obj}</span>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white/50 mt-8">
                            <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                                <Sparkle size={22} weight="fill" className="text-primary" />
                                Mục tiêu học tập
                            </h2>
                            <p className="text-sm text-on-surface-variant font-light">
                                Khóa học giúp người học trang bị kiến thức giáo dục giới tính toàn diện, an toàn và phát triển kỹ năng tự bảo vệ cơ thể theo đúng lộ trình khoa học.
                            </p>
                        </div>
                    )}
                </section>

                {/* Syllabus Accordion */}
                <section className="space-y-6">
                    <button 
                        onClick={() => setExpandedSyllabus(!expandedSyllabus)}
                        className="w-full flex items-center justify-between border-b border-outline-variant/30 pb-3 text-left cursor-pointer select-none"
                    >
                        <h2 className="text-lg font-bold text-on-surface">Đề cương bài học</h2>
                        <CaretDown size={20} weight="bold" className={`text-on-surface-variant transition-transform ${expandedSyllabus ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {expandedSyllabus && (
                        <div className="space-y-4 transition-all">
                            {courseData.syllabus.length === 0 ? (
                                <p className="text-sm text-on-surface-variant/80">Đề cương đang được cập nhật.</p>
                            ) : (
                                courseData.syllabus.map((lesson: SyllabusItem) => (
                                    <div key={lesson.id} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50 flex justify-between items-center transition-all hover:border-primary/20">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 text-primary w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                                                {lesson.order_index}
                                            </div>
                                            <h3 className="font-bold text-on-surface text-sm">{lesson.title}</h3>
                                        </div>
                                        {lesson.duration_minutes && (
                                            <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                                                <Clock size={16} weight="bold" />
                                                {lesson.duration_minutes} phút
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </section>

                {/* Instructor Card */}
                <section className="pt-4">
                    <h2 className="text-lg font-bold text-on-surface mb-6">Giảng viên phụ trách</h2>
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white/50 flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        <img
                            loading="lazy"
                            className="w-20 h-20 rounded-full object-cover shadow-sm bg-primary-fixed border-2 border-primary/20"
                            alt={courseData.instructor.full_name}
                            src={courseData.instructor.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLgNlt8oxrJXRkbLEhGWQB1WaLOqf9Zm7fBANEhyCLI3WBvhBT1fFopS25w1iSYvOj7ChfPef3vVnlOy4-2IfSJh9cSEEDdOHVz1f0RxGNFvC6S9pytVBlevtz6tEDiHNgYyDr2GmyZE3sjiypqLWOCkhf2du7uRwTKYADj9nXtFS3CrbKEQUi9agqpKyN-LZtQr9-UkMUYQ-Z1npuTPGg-Zb0iumqS2vauThTOXStUxw7mMeHr-dUXw'}
                        />
                        <div className="text-center sm:text-left space-y-2">
                            <h3 className="text-base font-bold text-on-surface">{courseData.instructor.full_name}</h3>
                            <p className="text-xs text-on-surface-variant font-light leading-relaxed pt-1">
                                {courseData.instructor.bio || `Chuyên gia phụ trách biên soạn và điều phối nội dung khóa học trên nền tảng ${BRAND_CONFIG.name}.`}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Column: Sticky Sidebar (30%) */}
            <aside className="w-full lg:w-[30%]">
                <div className="sticky top-24 bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-white/50 overflow-hidden">
                    {/* Course Thumbnail */}
                    <div className="relative w-full h-48 sm:h-56 bg-surface-container">
                        <img
                            loading="lazy"
                            className="w-full h-full object-cover"
                            alt={courseData.title}
                            src={courseData.thumbnail_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9-sxq6hwgyme01rYTAWAZzCHGgH8DuSQtNxeTBNyeagcRB66jUv-pKFaK84qEbPi-1JCa6Apc_NeHXJCFfYyURKkzLpD4ZwIAmfCzJ_MqJxX598zjHbSPR66nKvVfG5hpgqfgP7Lgh8aPTVF10p2aeCZqQQEKXgG_Go_krqDOYALphZ_tJUPtZqrshdB0Y57Q-fI1nmcOBVyQFaqp5ytmflg2-mbg3FWJWKJa5Ik9ZY-zNZoxf9Qkjg'}
                        />
                        <div onClick={handleAction} className="absolute inset-0 flex items-center justify-center bg-black/15 hover:bg-black/25 transition-all cursor-pointer">
                            <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                                <Play size={26} weight="fill" className="text-primary ml-0.5" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Course Meta */}
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between text-on-surface-variant border-b border-outline-variant/20 pb-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} weight="duotone" className="text-primary" />
                                    <span>Quy mô</span>
                                </div>
                                <span className="font-bold text-on-surface">{courseData.total_lessons} bài học</span>
                            </div>
                            <div className="flex items-center justify-between text-on-surface-variant border-b border-outline-variant/20 pb-3">
                                <div className="flex items-center gap-2">
                                    <UsersThree size={18} weight="duotone" className="text-secondary-container" />
                                    <span>Đối tượng</span>
                                </div>
                                <span className="font-bold text-on-surface">{audienceText}</span>
                            </div>
                            <div className="flex items-center justify-between text-on-surface-variant pb-1">
                                <div className="flex items-center gap-2">
                                    <InfinityIcon size={18} weight="bold" className="text-primary" />
                                    <span>Thời hạn truy cập</span>
                                </div>
                                <span className="font-bold text-on-surface">Không giới hạn</span>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button 
                            onClick={handleAction}
                            disabled={enrolling}
                            className="w-full bg-gradient-to-r from-secondary-container to-secondary text-white text-xs font-bold py-4 px-6 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {enrolling ? 'Đang xử lý...' : courseData.is_enrolled ? 'Vào học ngay' : 'Bắt đầu học'}
                            <ArrowRight size={18} weight="bold" />
                        </button>
                    </div>
                </div>
            </aside>
        </main>
    );
}
