'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Funnel, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Badge, EyebrowLabel, SkeletonBlock, SkeletonText } from '@/components/ui';

interface ManagedCourse {
    course_id: string;
    title: string;
}

interface StudentProgress {
    student_id: string;
    full_name: string;
    email: string;
    role: 'STUDENT_PARENT' | 'STUDENT_CHILD';
    enrolled_at: string;
    completed_at: string | null;
    status: 'IN_PROGRESS' | 'COMPLETED';
    progress_percentage: number;
    completed_lessons_count: number;
}

export default function DashboardStudentsPage() {
    const { user } = useAuth();
    
    const [courses, setCourses] = useState<ManagedCourse[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);

    // Phân trang mirror trang admin users: BE trả {students, pagination} khi truyền page/limit
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const limit = 50;

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/instructor/dashboard/courses');
                if (res.success && res.data.length > 0) {
                    setCourses(res.data);
                    setSelectedCourseId(res.data[0].course_id);
                }
            } catch (err) {
                console.error("Error loading courses list", err);
            } finally {
                setCoursesLoading(false);
            }
        };
        fetchCourses();
    }, []);

    useEffect(() => {
        if (!selectedCourseId) return;
        fetchStudentsProgress();
    }, [selectedCourseId, page]);

    const fetchStudentsProgress = async () => {
        setStudentsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            const res = await api.get(`/instructor/dashboard/courses/${selectedCourseId}/students?${params.toString()}`);
            if (res.success) {
                setStudents(res.data.students);
                setTotalPages(res.data.pagination.total_pages);
                setTotalStudents(res.data.pagination.total);
            }
        } catch (err) {
            console.error("Error loading students progress list", err);
        } finally {
            setStudentsLoading(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-outline-variant/30 pb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-on-surface">Theo Dõi Học Viên</h1>
                    <p className="text-xs text-on-surface-variant font-light mt-1">Đánh giá tiến trình học tập phục vụ nghiên cứu khoa học</p>
                </div>

                {/* Course Selector Dropdown */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Funnel size={20} weight="bold" className="text-on-surface-variant" />
                    {coursesLoading ? (
                        <SkeletonBlock rounded="full" className="h-9 w-full sm:w-40" />
                    ) : (
                        <select
                            className="w-full sm:w-64 bg-white/80 border border-outline-variant/30 rounded-full px-5 py-2.5 text-xs text-on-surface font-semibold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            value={selectedCourseId}
                            onChange={(e) => {
                                setSelectedCourseId(e.target.value);
                                setPage(1);
                            }}
                        >
                            {courses.length === 0 ? (
                                <option value="">Không tìm thấy khóa học nào</option>
                            ) : (
                                courses.map((c) => (
                                    <option key={c.course_id} value={c.course_id}>{c.title}</option>
                                ))
                            )}
                        </select>
                    )}
                </div>
            </div>

            {/* Students Progress Table Wrapper */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-white/60 shadow-sm space-y-6">
                {studentsLoading ? (
                    <SkeletonText lines={3} className="max-w-sm mx-auto py-12" />
                ) : !selectedCourseId ? (
                    <div className="text-on-surface-variant/80 py-12 text-center text-sm font-light">Vui lòng chọn hoặc tạo mới khóa học để theo dõi.</div>
                ) : students.length === 0 ? (
                    <div className="text-on-surface-variant/80 py-12 text-center text-sm font-light">Chưa có học viên nào đăng ký tham gia khóa học này.</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-outline-variant/30">
                                    <EyebrowLabel as="th" size="9" className="py-4 px-4 bg-white/20">Học viên</EyebrowLabel>
                                    <EyebrowLabel as="th" size="9" className="py-4 px-4 bg-white/20">Vai trò</EyebrowLabel>
                                    <EyebrowLabel as="th" size="9" className="py-4 px-4 bg-white/20">Ngày tham gia</EyebrowLabel>
                                    <EyebrowLabel as="th" size="9" className="py-4 px-4 bg-white/20">Tiến độ</EyebrowLabel>
                                    <EyebrowLabel as="th" size="9" className="py-4 px-4 bg-white/20">Trạng thái</EyebrowLabel>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {students.map((student) => {
                                    const isParent = student.role === 'STUDENT_PARENT';
                                    const roleText = isParent ? 'Phụ huynh' : 'Học sinh';
                                    const roleClass = isParent 
                                        ? 'border-secondary-container/20 bg-secondary-container/10 text-secondary-container' 
                                        : 'border-primary/20 bg-primary/10 text-primary';

                                    const isCompleted = student.status === 'COMPLETED';
                                    
                                    return (
                                        <tr key={student.student_id} className="hover:bg-white/40 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                        {student.full_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong className="text-on-surface text-xs block leading-tight font-bold">{student.full_name}</strong>
                                                        <span className="text-[10px] text-on-surface-variant mt-0.5 block">{student.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge uppercase tone={`border ${roleClass}`}>
                                                    {roleText}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-on-surface-variant font-medium">
                                                {new Date(student.enrolled_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="py-4 px-4 space-y-1.5 w-60">
                                                <div className="flex justify-between font-bold text-on-surface text-[10px]">
                                                    <span>Đã học: {student.completed_lessons_count} bài</span>
                                                    <span>{student.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full transition-all duration-300 rounded-full" style={{ width: `${student.progress_percentage}%` }} />
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                    isCompleted 
                                                        ? 'bg-primary/10 text-primary border border-primary/20' 
                                                        : 'bg-secondary-container/10 text-secondary-container border border-secondary-container/20'
                                                }`}>
                                                    {isCompleted ? 'Hoàn thành' : 'Đang học'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                        {/* Pager: cùng pattern với trang admin users */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                            <div>
                                Hiển thị{" "}
                                <span className="font-bold text-on-surface">{students.length}</span> /{" "}
                                <span className="font-bold text-on-surface">{totalStudents}</span>{" "}
                                học viên
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1 || studentsLoading}
                                    className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    title="Trang trước"
                                >
                                    <CaretLeft size={16} weight="bold" />
                                </button>

                                <span className="px-3 py-1 font-bold text-on-surface bg-surface-container-low rounded-lg border border-outline-variant/20">
                                    Trang {page} / {totalPages || 1}
                                </span>

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages || studentsLoading}
                                    className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                    title="Trang kế tiếp"
                                >
                                    <CaretRight size={16} weight="bold" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
