'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ForumPostSkeleton } from '@/components/Skeleton';
import { useToast } from '@/context/ToastContext';
import {
  MagnifyingGlass,
  X,
  UserCircle,
  Funnel,
  CaretDown,
  Check,
  PaperPlaneTilt,
  ChatCircleDots,
  Heart,
  ChartBar,
  ShareNetwork,
  Trash,
  CircleNotch
} from "@phosphor-icons/react";

interface Category {
    id: number;
    name: string;
    description: string | null;
}

interface Post {
    id: string;
    title: string;
    short_content: string;
    category_name: string;
    category_id: number;
    author: {
        id: string | null;
        full_name: string;
        role: string;
        avatar_url: string | null;
    };
    comment_count: number;
    views_count: number;
    likes_count: number;
    is_liked: boolean;
    is_anonymous: boolean;
    is_owner: boolean;
    created_at: string;
    status: string;
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

function formatCompactNumber(num: number): string {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

export default function ForumPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCat, setSelectedCat] = useState<number | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [search, setSearch] = useState('');
    
    // Quick inline composer states
    const [composerExpanded, setComposerExpanded] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newCatId, setNewCatId] = useState<number | null>(null);
    const [catDropdownOpen, setCatDropdownOpen] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const searchTimer = useRef<any>(null);
    const composerRef = useRef<HTMLDivElement>(null);
    const catDropdownRef = useRef<HTMLDivElement>(null);
    const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomObserverRef = useRef<HTMLDivElement>(null);

    // Filter bar drag-scroll refs
    const filterScrollRef = useRef<HTMLDivElement>(null);
    const isFilterDragging = useRef(false);
    const filterStartX = useRef(0);
    const filterScrollLeft = useRef(0);
    const filterHasDragged = useRef(false);

    const handleFilterMouseDown = (e: React.MouseEvent) => {
        if (!filterScrollRef.current) return;
        isFilterDragging.current = true;
        filterHasDragged.current = false;
        filterStartX.current = e.pageX - filterScrollRef.current.offsetLeft;
        filterScrollLeft.current = filterScrollRef.current.scrollLeft;
    };

    const handleFilterMouseMove = (e: React.MouseEvent) => {
        if (!isFilterDragging.current || !filterScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - filterScrollRef.current.offsetLeft;
        const walk = (x - filterStartX.current) * 1.5;
        if (Math.abs(walk) > 5) {
            filterHasDragged.current = true;
        }
        filterScrollRef.current.scrollLeft = filterScrollLeft.current - walk;
    };

    const handleFilterMouseUpOrLeave = () => {
        isFilterDragging.current = false;
    };

    const handleCategorySelect = (catId: number | null) => {
        if (filterHasDragged.current) return;
        setSelectedCat(catId);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/forum/categories');
                if (res.success) {
                    setCategories(res.data);
                    if (res.data.length > 0) {
                        setNewCatId(res.data[0].id);
                    }
                }
            } catch (err) {
                console.error("Error loading categories", err);
            }
        };
        fetchCategories();
    }, []);

    // Close category dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
                setCatDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchPosts(search);
    }, [selectedCat]);

    const fetchPosts = async (query = '') => {
        setLoading(true);
        try {
            let url = '/forum/posts';
            const params = [];
            if (selectedCat) params.push(`category_id=${selectedCat}`);
            if (query) params.push(`search=${encodeURIComponent(query)}`);
            
            if (params.length > 0) {
                url += '?' + params.join('&');
            }
            
            const res = await api.get(url);
            if (res.success) {
                setPosts(res.data);
            }
        } catch (err) {
            console.error("Error loading posts", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            fetchPosts(val);
        }, 350);
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim() || !newCatId) {
            showToast("Vui lòng điền đầy đủ tiêu đề và nội dung", "error");
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/forum/posts', {
                category_id: newCatId,
                title: newTitle.trim(),
                content: newContent.trim(),
                is_anonymous: isAnonymous
            });
            if (res.success) {
                showToast("Đã đăng bài thảo luận thành công!", "success");
                setNewTitle('');
                setNewContent('');
                setIsAnonymous(false);
                setComposerExpanded(false);
                fetchPosts(search);
            }
        } catch (err: any) {
            showToast(err.message || "Lỗi khi đăng bài", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleLike = async (postId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            showToast("Vui lòng đăng nhập để thích bài viết!", "info");
            router.push("/login");
            return;
        }

        // Optimistic UI update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const nextLiked = !p.is_liked;
                return {
                    ...p,
                    is_liked: nextLiked,
                    likes_count: nextLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1)
                };
            }
            return p;
        }));

        try {
            const res = await api.post(`/forum/posts/${postId}/like`, {});
            if (res.success) {
                setPosts(prev => prev.map(p => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            is_liked: res.data.liked,
                            likes_count: res.data.likes_count
                        };
                    }
                    return p;
                }));
            }
        } catch (err: any) {
            showToast(err.message || "Lỗi khi thích bài viết", "error");
            fetchPosts(search); // Revert on failure
        }
    };

    const handleShare = (postId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/forum/${postId}`;
        navigator.clipboard.writeText(url);
        showToast("Đã sao chép liên kết bài viết vào bộ nhớ tạm!", "success");
    };

    const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
            return;
        }

        try {
            const res = await api.delete(`/forum/posts/${postId}`);
            if (res.success) {
                showToast("Đã xóa bài viết thành công!", "success");
                setPosts(prev => prev.filter(p => p.id !== postId));
            }
        } catch (err: any) {
            showToast(err.message || "Lỗi khi xóa bài viết", "error");
        }
    };

    const selectedCatObject = categories.find(c => c.id === newCatId);

    return (
        <div className="min-h-screen bg-background text-on-surface pb-24">
            {/* Header and Search Controls */}
            <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5"> 
                        <div>
                            <h1 className="text-base sm:text-lg font-bold tracking-tight text-on-surface flex items-center gap-2">
                                Góc Trò Chuyện
                            </h1>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative flex-1 max-w-xs">
                        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                        <input 
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Tìm kiếm trong Góc trò chuyện..."
                            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-outline-variant/30 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 text-on-surface shadow-xs"
                        />
                        {search && (
                            <button 
                                onClick={() => { setSearch(''); fetchPosts(''); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Single Feed Container (Threads Style) */}
            <div className="max-w-2xl mx-auto px-4 pt-2">
                <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
                    
                    {/* Top Section: Integrated Inline Composer */}
                    {user ? (
                        <div 
                            ref={composerRef}
                            className={`p-4 sm:p-5 border-b border-outline-variant/20 transition-all duration-200 ${
                                composerExpanded ? 'bg-surface-container-lowest/50' : 'hover:bg-slate-50/50'
                            }`}
                        >
                            <div className="flex gap-3">
                                {/* Author Avatar or Anonymous Indicator */}
                                <div className="flex-shrink-0">
                                    {isAnonymous ? (
                                        <div className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center text-primary shadow-xs">
                                            <UserCircle size={18} weight="duotone" />
                                        </div>
                                    ) : (user as any).avatar_url ? (
                                        <img
                                            src={(user as any).avatar_url}
                                            alt={user.full_name}
                                            className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shadow-xs flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shadow-xs">
                                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                </div>

                                {/* Composer Form */}
                                <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-on-surface">
                                            {isAnonymous ? (
                                                <span className="text-primary flex items-center gap-1">
                                                    <UserCircle size={14} weight="duotone" />
                                                    Người dùng ẩn danh (Bạn)
                                                </span>
                                            ) : (
                                                user.full_name
                                            )}
                                        </span>

                                        {/* Anonymous Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={() => setIsAnonymous(!isAnonymous)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                isAnonymous 
                                                    ? 'bg-primary text-white shadow-xs' 
                                                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                                            }`}
                                        >
                                            <UserCircle size={14} weight="duotone" />
                                            {isAnonymous ? 'Đang ẩn danh' : 'Đăng ẩn danh'}
                                        </button>
                                    </div>

                                    {composerExpanded && (
                                        <input 
                                            type="text"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="Tiêu đề bài viết (tối thiểu 5 ký tự)..."
                                            required
                                            className="w-full text-sm font-bold bg-transparent border-b border-outline-variant/20 pb-2 focus:outline-none focus:border-primary placeholder:text-on-surface-variant/40 text-on-surface"
                                        />
                                    )}

                                    <textarea
                                        ref={contentTextareaRef}
                                        rows={composerExpanded ? 3 : 2}
                                        value={newContent}
                                        onFocus={() => setComposerExpanded(true)}
                                        onChange={(e) => setNewContent(e.target.value)}
                                        placeholder={composerExpanded ? "Chia sẻ thắc mắc, kiến thức hoặc trải nghiệm của bạn..." : "Bắt đầu chuỗi thảo luận mới..."}
                                        required
                                        className="w-full text-xs sm:text-sm bg-transparent border-0 resize-none focus:outline-none placeholder:text-on-surface-variant/40 text-on-surface"
                                    />

                                    {composerExpanded && (
                                        <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between flex-wrap gap-2">
                                            {/* Custom Category Selection Dropdown */}
                                            <div ref={catDropdownRef} className="relative">
                                                <div className="flex items-center gap-1.5">
                                                    <label className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                                                        <Funnel size={13} weight="bold" /> Chủ đề:
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                                                        className="px-2.5 py-1 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg text-xs font-semibold border border-outline-variant/30 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                                                    >
                                                        <span className="truncate max-w-[150px] sm:max-w-[200px]">
                                                            {selectedCatObject ? selectedCatObject.name : "Chọn chủ đề"}
                                                        </span>
                                                        <CaretDown size={14} weight="bold" className={`text-on-surface-variant/70 transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Floating Dropdown Menu */}
                                                {catDropdownOpen && (
                                                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-lg shadow-lg border border-outline-variant/30 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-on-surface-variant/60 tracking-wider border-b border-outline-variant/10">
                                                            Chọn chuyên mục bài đăng
                                                        </div>
                                                        <div className="max-h-52 overflow-y-auto py-1">
                                                            {categories.map((c) => {
                                                                const isSelected = c.id === newCatId;
                                                                return (
                                                                    <button
                                                                        key={c.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setNewCatId(c.id);
                                                                            setCatDropdownOpen(false);
                                                                        }}
                                                                        className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                                                            isSelected 
                                                                                ? 'bg-primary/10 text-primary font-bold' 
                                                                                : 'text-on-surface hover:bg-surface-container-low'
                                                                        }`}
                                                                    >
                                                                        <span className="truncate pr-2">{c.name}</span>
                                                                        {isSelected && <Check size={14} weight="bold" className="text-primary flex-shrink-0" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setComposerExpanded(false);
                                                        setNewTitle('');
                                                        setNewContent('');
                                                        setIsAnonymous(false);
                                                        setCatDropdownOpen(false);
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                                >
                                                    <PaperPlaneTilt size={14} weight="fill" />
                                                    {submitting ? 'Đang đăng...' : 'Đăng bài'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between gap-4 flex-wrap">
                            <span className="text-xs text-on-surface-variant font-medium">
                                Đăng nhập để tham gia chia sẻ hoặc đặt câu hỏi ẩn danh trong cộng đồng.
                            </span>
                            <Link 
                                href="/login"
                                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
                            >
                                Đăng nhập
                            </Link>
                        </div>
                    )}

                    {/* Category Filter Chips Bar inside Card */}
                    <div className="border-b border-outline-variant/20 bg-surface-container-lowest/30 px-4 py-2.5">
                        <div 
                            ref={filterScrollRef}
                            onMouseDown={handleFilterMouseDown}
                            onMouseMove={handleFilterMouseMove}
                            onMouseUp={handleFilterMouseUpOrLeave}
                            onMouseLeave={handleFilterMouseUpOrLeave}
                            className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none py-0.5"
                        >
                            <button
                                type="button"
                                onClick={() => handleCategorySelect(null)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                                    selectedCat === null 
                                        ? 'bg-primary text-white shadow-xs' 
                                        : 'bg-white hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                                }`}
                            >
                                Tất cả
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat.id)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                                        selectedCat === cat.id 
                                            ? 'bg-primary text-white shadow-xs' 
                                            : 'bg-white hover:bg-surface-container text-on-surface-variant border border-outline-variant/30'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle Section: Posts Feed in Single Continuous Container */}
                    {loading ? (
                        <div className="divide-y divide-outline-variant/20">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <ForumPostSkeleton key={i} />
                            ))}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 px-4 space-y-2">
                            <UserCircle size={32} weight="duotone" className="text-on-surface-variant/40 mx-auto" />
                            <p className="text-sm font-bold text-on-surface">Chưa có bài thảo luận nào</p>
                            <p className="text-xs text-on-surface-variant/70">Hãy là người đầu tiên mở đầu chuỗi thảo luận trong mục này!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-outline-variant/20">
                            {posts.map((post) => {
                                const isLiked = post.is_liked;
                                const isOwner = Boolean(post.is_owner || (user && post.author.id && String(post.author.id) === String(user.id)));
                                const canDelete = isOwner || (user && user.role === "ADMIN");

                                return (
                                    <article 
                                        key={post.id}
                                        className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar Column */}
                                            <div className="flex flex-col items-center">
                                                {post.is_anonymous ? (
                                                    <div className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary shadow-xs flex-shrink-0">
                                                        <UserCircle size={18} weight="duotone" />
                                                    </div>
                                                ) : post.author.avatar_url ? (
                                                    <img
                                                        src={post.author.avatar_url}
                                                        alt={post.author.full_name}
                                                        className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shadow-xs flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shadow-xs flex-shrink-0">
                                                        {post.author.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Column */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                {/* Header row */}
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-xs font-bold text-on-surface hover:underline">
                                                            {post.author.full_name}
                                                        </span>
                                                        
                                                        {post.is_anonymous ? (
                                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                                                                Ẩn danh
                                                            </span>
                                                        ) : (
                                                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                                post.author.role === 'ADMIN' 
                                                                    ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                                                                    : post.author.role === 'INSTRUCTOR'
                                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                                    : 'bg-surface-container text-on-surface-variant'
                                                            }`}>
                                                                {post.author.role === 'ADMIN' ? 'Admin' : post.author.role === 'INSTRUCTOR' ? 'Chuyên gia' : 'Thành viên'}
                                                            </span>
                                                        )}

                                                        <span className="text-on-surface-variant/40 text-xs">•</span>
                                                        <span className="text-[11px] text-on-surface-variant/60">
                                                            {formatRelativeTime(post.created_at)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        <span className="px-2 py-0.5 rounded-md bg-surface-container-low text-[10px] font-semibold text-on-surface-variant border border-outline-variant/20">
                                                            {post.category_name}
                                                        </span>
                                                        {post.status === 'HIDDEN' && (
                                                            <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/25 text-[10px] font-bold">
                                                                Đã ẩn
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Clickable Post body */}
                                                <Link href={`/forum/${post.id}`} className="block space-y-1 group-hover:opacity-95">
                                                    <h2 className="text-sm sm:text-base font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">
                                                        {post.title}
                                                    </h2>
                                                    <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed line-clamp-3">
                                                        {post.short_content}
                                                    </p>
                                                </Link>

                                                {/* Bottom Action Bar */}
                                                <div className="pt-2 flex items-center justify-between text-on-surface-variant/70 border-t border-outline-variant/15 text-xs">
                                                    <div className="flex items-center gap-5 sm:gap-7">
                                                        {/* Reply / Comments */}
                                                        <Link 
                                                             href={`/forum/${post.id}`}
                                                            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                                                            title="Bình luận"
                                                        >
                                                            <ChatCircleDots size={16} weight="duotone" />
                                                            <span>{formatCompactNumber(post.comment_count)}</span>
                                                        </Link>

                                                        {/* Like Toggle */}
                                                        <button 
                                                            onClick={(e) => toggleLike(post.id, e)}
                                                            className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                                                                isLiked ? 'text-red-500' : 'hover:text-red-500'
                                                            }`}
                                                            title={isLiked ? "Bỏ thích" : "Thích"}
                                                        >
                                                            <Heart size={16} weight={isLiked ? "fill" : "regular"} className={`transition-transform active:scale-125 ${isLiked ? 'text-red-500' : ''}`} />
                                                            <span className={isLiked ? 'font-bold text-red-500' : ''}>{formatCompactNumber(post.likes_count)}</span>
                                                        </button>

                                                        {/* Views Count (X-Style) */}
                                                        <div 
                                                            className="flex items-center gap-1.5 text-on-surface-variant/60 select-none"
                                                            title={`${post.views_count || 0} lượt xem`}
                                                        >
                                                            <ChartBar size={16} weight="duotone" />
                                                            <span>{formatCompactNumber(post.views_count || 0)}</span>
                                                        </div>

                                                        {/* Share Button */}
                                                        <button 
                                                            onClick={(e) => handleShare(post.id, e)}
                                                            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                                                            title="Sao chép liên kết"
                                                        >
                                                            <ShareNetwork size={16} weight="duotone" />
                                                        </button>

                                                        {/* Delete Post Button for Owner or Admin */}
                                                        {canDelete && (
                                                            <button 
                                                                onClick={(e) => handleDeletePost(post.id, e)}
                                                                className="flex items-center gap-1.5 hover:text-red-500 text-red-400 transition-colors cursor-pointer"
                                                                title="Xóa bài viết"
                                                            >
                                                                <Trash size={16} weight="duotone" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <Link 
                                                        href={`/forum/${post.id}`}
                                                        className="font-bold text-primary hover:underline hidden sm:inline"
                                                    >
                                                        Xem chi tiết →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom Section of the Card: Threads-style Infinite Loading Animation (only shows when actively loading) */}
                    {loadingMore && (
                        <div className="py-6 flex items-center justify-center gap-2 border-t border-outline-variant/15 bg-slate-50/30 text-on-surface-variant/60 text-xs font-semibold animate-in fade-in duration-200">
                            <div className="w-5 h-5 rounded-full border-2 border-outline-variant/40 border-t-primary animate-spin" />
                            <span>Đang tải thêm nội dung...</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
