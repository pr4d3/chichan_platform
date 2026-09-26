"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ForumPostDetailSkeleton } from "@/components/Skeleton";
import { useToast } from "@/context/ToastContext";
import { Badge, Button, EmptyState } from "@/components/ui";
import {
  ArrowLeft,
  ChatCircleDots,
  ShieldWarning,
  ArrowBendUpLeft,
  Trash,
  EyeSlash,
  Eye,
  Heart,
  ShareNetwork,
  UserCircle,
  PaperPlaneTilt,
  ArrowElbowDownRight,
  ChartBar,
  ShieldCheck,
} from "@phosphor-icons/react";

interface CommentAuthor {
  id: string | null;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  parent_comment_id: string | null;
  status: "PUBLISHED" | "HIDDEN" | "DELETED";
  is_anonymous: boolean;
  author: CommentAuthor;
  reply_to_author?: CommentAuthor | null;
  created_at: string;
  replies: Comment[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "vừa xong";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function formatCompactNumber(num: number): string {
  if (!num) return "0";
  if (num >= 1000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
}

function flattenReplies(comment: Comment): Comment[] {
  let list: Comment[] = [];
  if (!comment.replies || comment.replies.length === 0) return list;
  for (const child of comment.replies) {
    list.push(child);
    if (child.replies && child.replies.length > 0) {
      list = list.concat(flattenReplies(child));
    }
  }
  return list;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const postId = params.postId as string;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Main comment form state
  const [mainComment, setMainComment] = useState("");
  const [mainAnonymous, setMainAnonymous] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Active comment id for replies
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);

  // Real like state for this post
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const mainCommentRef = useRef<HTMLTextAreaElement>(null);
  const viewRecordedRef = useRef(false);

  // Giữ nội dung mới nhất qua ref để handler submit ổn định định danh (useCallback)
  // mà vẫn đọc được giá trị đang gõ — điều kiện để memo CommentItem có hiệu lực
  const mainCommentValueRef = useRef("");
  const replyContentValueRef = useRef("");

  useEffect(() => {
    if (mainCommentRef.current) {
      mainCommentRef.current.style.height = "auto";
      if (mainComment) {
        mainCommentRef.current.style.height = `${mainCommentRef.current.scrollHeight}px`;
      }
    }
  }, [mainComment]);

  useEffect(() => {
    mainCommentValueRef.current = mainComment;
  }, [mainComment]);

  useEffect(() => {
    replyContentValueRef.current = replyContent;
  }, [replyContent]);

  const fetchPostDetail = useCallback(async () => {
    try {
      const res = await api.get(`/forum/posts/${postId}`);
      if (res.success) {
        setPost(res.data);
        setIsLiked(Boolean(res.data.is_liked));
        setLikesCount(res.data.likes_count || 0);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải chi tiết bài viết");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;
    // Gọi qua setTimeout(0) để setState không chạy đồng bộ trong thân effect
    const timer = setTimeout(fetchPostDetail, 0);

    // Record view exactly once on mount
    if (!viewRecordedRef.current) {
      viewRecordedRef.current = true;
      api.post(`/forum/posts/${postId}/view`, {}).catch(() => {});
    }

    return () => clearTimeout(timer);
  }, [postId, fetchPostDetail]);

  const handleToggleLike = async () => {
    if (!user) {
      showToast("Vui lòng đăng nhập để thích bài viết!", "info");
      router.push("/login");
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await api.post(`/forum/posts/${postId}/like`, {});
      if (res.success) {
        setIsLiked(res.data.liked);
        setLikesCount(res.data.likes_count);
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi thích bài viết", "error");
      fetchPostDetail();
    }
  };

  const handleCommentSubmit = useCallback(async (
    e: React.FormEvent,
    parentId: string | null,
    isAnon: boolean = false,
  ) => {
    e.preventDefault();
    const content = parentId ? replyContentValueRef.current : mainCommentValueRef.current;
    if (!content.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/forum/posts/${postId}/comments`, {
        content: content.trim(),
        parent_comment_id: parentId,
        is_anonymous: isAnon,
      });
      if (res.success) {
        showToast("Gửi phản hồi thành công!", "success");
        if (parentId) {
          setReplyToId(null);
          setReplyContent("");
          setReplyAnonymous(false);
        } else {
          setMainComment("");
          setMainAnonymous(false);
        }
        fetchPostDetail();
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi gửi phản hồi", "error");
    } finally {
      setSubmittingComment(false);
    }
  }, [postId, fetchPostDetail, showToast]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa bình luận này? Các phản hồi bên dưới cũng sẽ bị xóa.",
      )
    ) {
      return;
    }
    try {
      const res = await api.delete(`/forum/comments/${commentId}`);
      if (res.success) {
        showToast("Đã xóa bình luận thành công!", "success");
        fetchPostDetail();
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi khi xóa bình luận", "error");
    }
  }, [fetchPostDetail, showToast]);

  const handleDeleteMyPost = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) {
      return;
    }
    try {
      const res = await api.delete(`/forum/posts/${postId}`);
      if (res.success) {
        showToast("Đã xóa bài viết thành công!", "success");
        router.push("/forum");
      }
    } catch (err: any) {
      showToast(err.message || "Không thể xóa bài viết", "error");
    }
  };

  const handleModeratePost = async (action: "HIDE" | "DELETE" | "UNHIDE") => {
    if (
      !confirm(
        `Bạn chắc chắn muốn [${action === "HIDE" ? "Ẩn" : action === "DELETE" ? "Xóa" : "Hiện"}] bài viết này?`,
      )
    )
      return;
    try {
      const res = await api.put(`/admin/forum/posts/${postId}/moderate`, {
        action,
      });
      if (res.success) {
        showToast("Kiểm duyệt bài viết thành công!", "success");
        router.push("/forum");
      }
    } catch (err: any) {
      showToast(err.message || "Không thể kiểm duyệt bài viết", "error");
    }
  };

  const handleModerateComment = useCallback(async (
    commentId: string,
    action: "HIDE" | "DELETE" | "UNHIDE",
  ) => {
    if (
      !confirm(
        `Bạn chắc chắn muốn [${action === "HIDE" ? "Ẩn" : action === "DELETE" ? "Xóa" : "Hiện"}] bình luận này?`,
      )
    )
      return;
    try {
      const res = await api.put(`/admin/forum/comments/${commentId}/moderate`, {
        action,
      });
      if (res.success) {
        showToast("Kiểm duyệt bình luận thành công!", "success");
        fetchPostDetail();
      }
    } catch (err: any) {
      showToast(err.message || "Không thể kiểm duyệt bình luận", "error");
    }
  }, [fetchPostDetail, showToast]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Đã sao chép liên kết bài viết vào bộ nhớ tạm!", "success");
  };

  const countComments = (commentsList: Comment[]): number => {
    let count = 0;
    for (const c of commentsList) {
      if (c.status === "PUBLISHED") {
        count += 1;
      }
      if (c.replies && c.replies.length > 0) {
        count += countComments(c.replies);
      }
    }
    return count;
  };

  // Flatten replies của từng root comment một lần mỗi khi post thay đổi
  // (trước đây flattenReplies bị tính lại inline cho mọi root comment ở mỗi render)
  const flattenedReplies = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const root of (post?.comments ?? []) as Comment[]) {
      map.set(root.id, flattenReplies(root));
    }
    return map;
  }, [post]);

  if (loading) {
    return <ForumPostDetailSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <EmptyState
          tone="error"
          glass
          icon={<ShieldWarning size={28} weight="duotone" />}
          title={error || "Bài viết không tồn tại hoặc đã bị gỡ."}
          action={{ label: "Quay lại Góc trò chuyện", href: "/forum" }}
        />
      </div>
    );
  }

  const isAdmin = user && user.role === "ADMIN";
  const isPostOwner = Boolean(
    post?.is_owner ||
    (user &&
      post?.author?.id &&
      String(post.author.id).toLowerCase() === String(user.id).toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background text-on-surface pb-24">
      {/* Top navigation bar */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <Link
            href="/forum"
            className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Góc trò chuyện</span>
          </Link>

          <span className="text-xs font-bold text-on-surface truncate max-w-[200px] sm:max-w-xs text-center">
            Bài đăng của {post?.author?.full_name || "thành viên"}
          </span>

          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors cursor-pointer"
            title="Chia sẻ"
          >
            <ShareNetwork size={16} weight="duotone" />
          </button>
        </div>
      </div>

      {/* Main Single Continuous Card (Threads Style) */}
      <div className="max-w-2xl mx-auto px-4 pt-2">
        <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
          {/* Top Section: Main Post */}
          <article className="p-5 sm:p-6 space-y-4 border-b border-outline-variant/20">
            {/* Author Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {post.is_anonymous ? (
                  <div className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary shadow-xs flex-shrink-0">
                    <UserCircle size={22} weight="duotone" />
                  </div>
                ) : post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover border border-outline-variant/30 shadow-xs flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-base shadow-xs flex-shrink-0">
                    {post.author.full_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-on-surface">
                      {post.author.full_name}
                    </span>

                    {post.is_anonymous ? (
                      <Badge size="xs" uppercase tone="bg-primary/10 text-primary border border-primary/20">
                        Ẩn danh
                      </Badge>
                    ) : (
                      <Badge
                        size="xs"
                        uppercase
                        tone={
                          post.author.role === "ADMIN"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : post.author.role === "INSTRUCTOR"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-surface-container text-on-surface-variant"
                        }
                      >
                        {post.author.role === "ADMIN"
                          ? "Admin"
                          : post.author.role === "INSTRUCTOR"
                            ? "Chuyên gia"
                            : "Thành viên"}
                      </Badge>
                    )}
                  </div>

                  <span className="text-[11px] text-on-surface-variant/60 block mt-0.5">
                    {formatRelativeTime(post.created_at)} •{" "}
                    {new Date(post.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-surface-container-low text-[11px] font-semibold text-on-surface-variant border border-outline-variant/20">
                  {post.category_name}
                </span>
                {post.status === "HIDDEN" && (
                  <span className="px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/25">
                    Đã ẩn
                  </span>
                )}
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-bold text-on-surface leading-snug">
                {post.title}
              </h1>
              <div className="text-on-surface-variant text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal">
                {post.content}
              </div>
            </div>

            {/* Admin Control Bar (if Admin) */}
            {isAdmin && (
              <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-red-500 border-t border-outline-variant/15">
                <span className="flex items-center gap-1 font-bold uppercase text-[10px] text-on-surface-variant">
                  <ShieldWarning size={14} weight="duotone" />
                  Kiểm duyệt:
                </span>
                {post.status !== "HIDDEN" ? (
                  <button
                    onClick={() => handleModeratePost("HIDE")}
                    className="hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <EyeSlash size={14} weight="duotone" /> Ẩn bài
                  </button>
                ) : (
                  <button
                    onClick={() => handleModeratePost("UNHIDE")}
                    className="hover:underline cursor-pointer text-green-500 flex items-center gap-1"
                  >
                    <Eye size={14} weight="duotone" /> Hiện bài
                  </button>
                )}
                <span>•</span>
                <button
                  onClick={() => handleModeratePost("DELETE")}
                  className="hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash size={14} weight="duotone" /> Xóa bài
                </button>
              </div>
            )}

            {/* Bottom Action Bar (Threads / X Style) */}
            <div className="pt-3 flex items-center justify-between text-on-surface-variant/70 border-t border-outline-variant/15 text-xs">
              <div className="flex items-center gap-6">
                {/* Replies count */}
                <span className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <ChatCircleDots size={16} weight="duotone" className="text-primary" />
                  <span>{countComments(post.comments)} phản hồi</span>
                </span>

                {/* Likes button */}
                <button
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                    isLiked ? "text-red-500" : "hover:text-red-500"
                  }`}
                  title={isLiked ? "Bỏ thích" : "Thích"}
                >
                  <Heart
                    size={16}
                    weight={isLiked ? "fill" : "regular"}
                    className={`transition-transform active:scale-125 ${isLiked ? "text-red-500" : ""}`}
                  />
                  <span className={isLiked ? "font-bold text-red-500" : ""}>
                    {formatCompactNumber(likesCount)}
                  </span>
                </button>

                {/* Views count (X-style) */}
                <div
                  className="flex items-center gap-1.5 text-on-surface-variant/60 select-none"
                  title={`${post.views_count || 0} lượt xem`}
                >
                  <ChartBar size={16} weight="duotone" />
                  <span>{formatCompactNumber(post.views_count || 0)}</span>
                </div>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
                  title="Sao chép liên kết"
                >
                  <ShareNetwork size={16} weight="duotone" />
                </button>

                {/* Delete Post for Author */}
                {isPostOwner && !isAdmin && (
                  <button
                    onClick={handleDeleteMyPost}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors cursor-pointer font-semibold"
                    title="Xóa bài viết của bạn"
                  >
                    <Trash size={16} weight="duotone" />
                    <span>Xóa bài</span>
                  </button>
                )}
              </div>
            </div>
          </article>

          {/* Middle Section: Integrated Reply Box */}
          {user ? (
            <div className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface-container-lowest/30">
              <form
                onSubmit={(e) => handleCommentSubmit(e, null, mainAnonymous)}
                className="flex gap-3"
              >
                <div className="flex-shrink-0">
                  {mainAnonymous ? (
                    <div className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary shadow-xs">
                      <UserCircle size={18} weight="duotone" />
                    </div>
                  ) : (user as any).avatar_url ? (
                    <img
                      src={(user as any).avatar_url}
                      alt={user.full_name}
                      loading="lazy"
                      className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shadow-xs flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shadow-xs">
                      {user.full_name
                        ? user.full_name.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">
                      {mainAnonymous ? (
                        <span className="text-primary flex items-center gap-1">
                          <UserCircle size={14} weight="duotone" />
                          Người dùng ẩn danh (Bạn)
                        </span>
                      ) : (
                        user.full_name
                      )}
                    </span>

                    {/* Anonymous Mode Button */}
                    <button
                      type="button"
                      onClick={() => setMainAnonymous(!mainAnonymous)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        mainAnonymous
                          ? "bg-primary text-white shadow-xs"
                          : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/30"
                      }`}
                    >
                      <UserCircle size={14} weight="duotone" />
                      {mainAnonymous ? "Ẩn danh" : "Bình luận ẩn danh"}
                    </button>
                  </div>

                  <textarea
                    ref={mainCommentRef}
                    rows={2}
                    value={mainComment}
                    onChange={(e) => setMainComment(e.target.value)}
                    placeholder={`Phản hồi bài viết của ${post.author.full_name}...`}
                    required
                    className="w-full text-xs sm:text-sm bg-transparent border-0 resize-none focus:outline-none placeholder:text-on-surface-variant/40 text-on-surface"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-on-surface-variant/60 flex items-center gap-1 font-medium select-none" title="Hệ thống tự động lọc và loại bỏ từ ngữ thô tục để bảo vệ không gian học đường">
                      <ShieldCheck size={14} weight="fill" className="text-primary" />
                      <span>Kiểm duyệt tự động</span>
                    </span>
                    <Button
                      type="submit"
                      size="sm"
                      loading={submittingComment}
                      disabled={!mainComment.trim()}
                      icon={<PaperPlaneTilt size={14} weight="fill" />}
                    >
                      {submittingComment ? "Đang gửi..." : "Gửi phản hồi"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-4 text-center border-b border-outline-variant/20 bg-surface-container-lowest flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs text-on-surface-variant font-medium">
                Vui lòng đăng nhập để tham gia thảo luận cùng mọi người.
              </span>
              <Button href="/login" size="sm">
                Đăng nhập
              </Button>
            </div>
          )}

          {/* Bottom Section: Comments Chain inside the Single Card */}
          <div className="divide-y divide-outline-variant/15">
            {post.comments.length === 0 ? (
              <EmptyState
                icon={<ChatCircleDots size={28} weight="duotone" />}
                title="Chưa có bình luận nào"
                body="Hãy mở đầu cuộc trò chuyện!"
                className="py-12 px-4"
              />
            ) : (
              post.comments.map((rootComment: Comment) => {
                const allReplies = flattenedReplies.get(rootComment.id) ?? [];

                return (
                  <div
                    key={rootComment.id}
                    className="p-4 sm:p-5 transition-colors hover:bg-slate-50/30"
                  >
                    {/* Top Level / Root Comment */}
                    <CommentItem
                      comment={rootComment}
                      user={user}
                      isAdmin={Boolean(isAdmin)}
                      isReply={false}
                      replyToId={replyToId}
                      replyContent={replyContent}
                      replyAnonymous={replyAnonymous}
                      setReplyToId={setReplyToId}
                      setReplyContent={setReplyContent}
                      setReplyAnonymous={setReplyAnonymous}
                      handleCommentSubmit={handleCommentSubmit}
                      handleDeleteComment={handleDeleteComment}
                      handleModerateComment={handleModerateComment}
                    />

                    {/* TikTok-Style 1-Level Indented Replies Column */}
                    {allReplies.length > 0 && (
                      <div className="mt-3 ml-6 sm:ml-10 border-l-2 border-outline-variant/30 pl-3 sm:pl-4 space-y-3">
                        {allReplies.map((reply) => (
                          <CommentItem
                            key={reply.id}
                            comment={reply}
                            user={user}
                            isAdmin={Boolean(isAdmin)}
                            isReply={true}
                            replyToId={replyToId}
                            replyContent={replyContent}
                            replyAnonymous={replyAnonymous}
                            setReplyToId={setReplyToId}
                            setReplyContent={setReplyContent}
                            setReplyAnonymous={setReplyAnonymous}
                            handleCommentSubmit={handleCommentSubmit}
                            handleDeleteComment={handleDeleteComment}
                            handleModerateComment={handleModerateComment}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  user: any;
  isAdmin: boolean;
  replyToId: string | null;
  replyContent: string;
  replyAnonymous: boolean;
  setReplyToId: (id: string | null) => void;
  setReplyContent: (content: string) => void;
  setReplyAnonymous: (anon: boolean) => void;
  handleCommentSubmit: (
    e: React.FormEvent,
    parentId: string | null,
    isAnon: boolean,
  ) => void;
  handleDeleteComment: (commentId: string) => void;
  handleModerateComment: (
    commentId: string,
    action: "HIDE" | "DELETE" | "UNHIDE",
  ) => void;
}

// So sánh thủ công cho React.memo: một row chỉ cần re-render khi dữ liệu bình luận/user đổi,
// form trả lời của CHÍNH row này bật/tắt, hoặc đang gõ trong form đó —
// nhờ vậy gõ bình luận không re-render cả thread
function areCommentItemPropsEqual(
  prev: CommentItemProps,
  next: CommentItemProps,
): boolean {
  if (prev.comment !== next.comment) return false;
  if (prev.user !== next.user) return false;
  if (prev.isAdmin !== next.isAdmin) return false;
  if (prev.isReply !== next.isReply) return false;
  if (prev.setReplyToId !== next.setReplyToId) return false;
  if (prev.setReplyContent !== next.setReplyContent) return false;
  if (prev.setReplyAnonymous !== next.setReplyAnonymous) return false;
  if (prev.handleCommentSubmit !== next.handleCommentSubmit) return false;
  if (prev.handleDeleteComment !== next.handleDeleteComment) return false;
  if (prev.handleModerateComment !== next.handleModerateComment) return false;
  // Form trả lời của row này bật/tắt → re-render để hiện/ẩn form
  const wasOpen = prev.replyToId === prev.comment.id;
  const isOpen = next.replyToId === next.comment.id;
  if (wasOpen !== isOpen) return false;
  // Form đang mở: gõ nội dung / đổi ẩn danh phải re-render đúng row đó
  if (isOpen) {
    if (prev.replyContent !== next.replyContent) return false;
    if (prev.replyAnonymous !== next.replyAnonymous) return false;
  }
  return true;
}

const CommentItem = React.memo(function CommentItem({
  comment,
  isReply = false,
  user,
  isAdmin,
  replyToId,
  replyContent,
  replyAnonymous,
  setReplyToId,
  setReplyContent,
  setReplyAnonymous,
  handleCommentSubmit,
  handleDeleteComment,
  handleModerateComment,
}: CommentItemProps) {
  const showReplyForm = replyToId === comment.id;
  const isOwner =
    user && comment.author.id && String(comment.author.id) === String(user.id);

  return (
    <div
      className={`space-y-2 ${
        comment.status === "HIDDEN" ? "opacity-60 grayscale-[0.2]" : ""
      }`}
    >
      {/* Comment Author Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {comment.is_anonymous ? (
            <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center text-primary shadow-xs flex-shrink-0">
              <UserCircle size={16} weight="duotone" />
            </div>
          ) : comment.author.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.full_name}
              loading="lazy"
              className="w-8 h-8 rounded-full object-cover border border-outline-variant/30 shadow-xs flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shadow-xs flex-shrink-0">
              {comment.author.full_name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-on-surface">
                {comment.author.full_name}
              </span>

              {/* TikTok Style Target Author Indicator */}
              {comment.reply_to_author && isReply && (
                <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/70 font-medium">
                  <span className="text-on-surface-variant/40">▸</span>
                  <span className="text-primary font-semibold">
                    {comment.reply_to_author.full_name}
                  </span>
                </span>
              )}

              {comment.is_anonymous ? (
                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase">
                  Ẩn danh
                </span>
              ) : (
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                    comment.author.role === "ADMIN"
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : comment.author.role === "INSTRUCTOR"
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {comment.author.role === "ADMIN"
                    ? "Admin"
                    : comment.author.role === "INSTRUCTOR"
                      ? "Chuyên gia"
                      : "Thành viên"}
                </span>
              )}
            </div>

            <span className="text-[10px] text-on-surface-variant/60 block">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>
        </div>

        {comment.status !== "PUBLISHED" && (
          <span className="text-[9px] text-red-500 font-bold border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">
            {comment.status}
          </span>
        )}
      </div>

      {/* Comment Content */}
      <p className="text-xs sm:text-sm text-on-surface leading-relaxed pl-1">
        {comment.content}
      </p>

      {/* Comment Actions Toolbar */}
      <div className="flex items-center justify-between pt-1 text-xs text-on-surface-variant/70 border-t border-outline-variant/15">
        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={() => {
                setReplyToId(showReplyForm ? null : comment.id);
                setReplyContent("");
                setReplyAnonymous(false);
              }}
              className="flex items-center gap-1 font-semibold hover:text-primary transition-colors cursor-pointer text-[11px]"
            >
              <ArrowBendUpLeft size={14} weight="bold" />
              <span>Trả lời</span>
            </button>
          )}

          {/* Self Delete Button (for Owner) */}
          {isOwner && !isAdmin && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="flex items-center gap-1 font-semibold text-red-400 hover:text-red-500 transition-colors cursor-pointer text-[11px]"
              title="Xóa bình luận của bạn"
            >
              <Trash size={14} weight="duotone" />
              <span>Xóa</span>
            </button>
          )}
        </div>

        {/* Admin Moderation Actions */}
        {isAdmin && (
          <div className="flex items-center gap-3 text-[11px] font-semibold text-red-400">
            {comment.status !== "HIDDEN" ? (
              <button
                onClick={() => handleModerateComment(comment.id, "HIDE")}
                className="flex items-center gap-1 hover:underline cursor-pointer"
              >
                <EyeSlash size={14} weight="duotone" />
                <span>Ẩn</span>
              </button>
            ) : (
              <button
                onClick={() => handleModerateComment(comment.id, "UNHIDE")}
                className="flex items-center gap-1 hover:underline cursor-pointer text-green-500"
              >
                <Eye size={14} weight="duotone" />
                <span>Hiện</span>
              </button>
            )}
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="flex items-center gap-1 hover:underline cursor-pointer text-red-500"
            >
              <Trash size={14} weight="duotone" />
              <span>Xóa</span>
            </button>
          </div>
        )}
      </div>

      {/* Nested Reply Form */}
      {showReplyForm && (
        <form
          onSubmit={(e) => handleCommentSubmit(e, comment.id, replyAnonymous)}
          className="pt-2 space-y-2 border-t border-outline-variant/15"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
              <ArrowElbowDownRight size={14} weight="bold" className="text-primary" />
              Trả lời {comment.author.full_name}:
            </span>

            <button
              type="button"
              onClick={() => setReplyAnonymous(!replyAnonymous)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                replyAnonymous
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant border border-outline-variant/30"
              }`}
            >
              <UserCircle size={14} weight="duotone" />
              {replyAnonymous ? "Ẩn danh" : "Trả lời ẩn danh"}
            </button>
          </div>

          <textarea
            rows={2}
            required
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Viết phản hồi của bạn..."
            className="w-full text-xs bg-surface-container-low/80 p-2.5 rounded-lg border border-outline-variant/30 focus:outline-none focus:border-primary text-on-surface resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplyToId(null)}
              className="px-3 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="px-4 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              Gửi
            </button>
          </div>
        </form>
      )}
    </div>
  );
}, areCommentItemPropsEqual);
