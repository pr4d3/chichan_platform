"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  Badge,
  Card,
  EyebrowLabel,
  FormRow,
  Modal,
  Spinner,
} from "@/components/ui";
import {
  Users,
  UserCheck,
  // Phosphor không có UserX — UserMinus là tương đương gần nhất cho tài khoản bị vô hiệu hóa
  UserMinus,
  ShieldWarning,
  MagnifyingGlass,
  X,
  PencilSimple,
  Power,
  ArrowClockwise,
  Key,
  CaretLeft,
  CaretRight,
  ShieldCheck,
  GraduationCap,
  Phone,
  CheckCircle,
  Warning,
  HandHeart,
  BookOpen,
} from "@phosphor-icons/react";

interface RoleItem {
  id: number;
  role_code: string;
  role_name: string;
  description?: string;
}

interface UserItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_code: string;
  role_name: string;
  status: "ACTIVE" | "INACTIVE";
  avatar_url: string | null;
  phone_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

interface StatsData {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_count: number;
  instructor_count: number;
  parent_count: number;
  student_count: number;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    admin_count: 0,
    instructor_count: 0,
    parent_count: 0,
    student_count: 0,
  });

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  // Filter and search states
  // search chỉ nhận giá trị ĐÃ debounce từ UserSearchBox để keystroke không re-render cả trang
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    email: "",
    role_id: 0,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    phone_number: "",
    gender: "",
    date_of_birth: "",
    bio: "",
    new_password: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Status toggle confirmation state
  const [statusTogglingUser, setStatusTogglingUser] = useState<UserItem | null>(
    null,
  );
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Fetch Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/admin/roles");
        if (res.success) {
          setRoles(res.data);
        }
      } catch (err) {
        console.error("Error fetching roles", err);
      }
    };
    fetchRoles();
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(
    async (
      currentPage = page,
      searchVal = search,
      roleVal = selectedRole,
      statusVal = selectedStatus,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(limit));
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (roleVal) params.set("role_code", roleVal);
        if (statusVal) params.set("status", statusVal);

        const res = await api.get(`/admin/users?${params.toString()}`);
        if (res.success) {
          setUsers(res.data.users);
          setTotalPages(res.data.pagination.total_pages);
          setTotalUsers(res.data.pagination.total);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch (err: any) {
        showToast(err.message || "Lỗi khi tải danh sách người dùng", "error");
      } finally {
        setLoading(false);
      }
    },
    [page, search, selectedRole, selectedStatus, showToast],
  );

  useEffect(() => {
    if (!authLoading && user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    if (user && user.role === "ADMIN") {
      fetchUsers(page, search, selectedRole, selectedStatus);
    }
  }, [authLoading, user, page, selectedRole, selectedStatus, router]);

  // Nhận giá trị đã debounce (400ms) từ ô tìm kiếm con, quay về trang 1 và tải lại danh sách
  const handleSearchDebounced = useCallback(
    (val: string) => {
      setSearch(val);
      setPage(1);
      fetchUsers(1, val, selectedRole, selectedStatus);
    },
    [fetchUsers, selectedRole, selectedStatus],
  );

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setPage(1);
    fetchUsers(1, "", selectedRole, selectedStatus);
  }, [fetchUsers, selectedRole, selectedStatus]);

  // Open Edit Modal
  const openEditModal = (targetUser: UserItem) => {
    setEditingUser(targetUser);
    setEditForm({
      full_name: targetUser.full_name || "",
      username: targetUser.username || "",
      email: targetUser.email || "",
      role_id: targetUser.role_id,
      status: targetUser.status,
      phone_number: targetUser.phone_number || "",
      gender: targetUser.gender || "",
      date_of_birth: targetUser.date_of_birth
        ? targetUser.date_of_birth.slice(0, 10)
        : "",
      bio: targetUser.bio || "",
      new_password: "",
    });
  };

  // Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    try {
      const payload: any = {
        full_name: editForm.full_name.trim(),
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        role_id: Number(editForm.role_id),
        status: editForm.status,
        phone_number: editForm.phone_number.trim() || null,
        gender: editForm.gender || null,
        date_of_birth: editForm.date_of_birth || null,
        bio: editForm.bio.trim() || null,
      };

      if (editForm.new_password.trim()) {
        payload.new_password = editForm.new_password.trim();
      }

      const res = await api.put(`/admin/users/${editingUser.id}`, payload);
      if (res.success) {
        showToast("Cập nhật thông tin người dùng thành công!", "success");
        setEditingUser(null);
        fetchUsers(page, search, selectedRole, selectedStatus);
      }
    } catch (err: any) {
      showToast(
        err.message || "Không thể cập nhật thông tin người dùng",
        "error",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Confirm Status Toggle
  const handleConfirmToggleStatus = async () => {
    if (!statusTogglingUser) return;
    const nextStatus =
      statusTogglingUser.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setTogglingStatus(true);
    try {
      const res = await api.put(
        `/admin/users/${statusTogglingUser.id}/status`,
        {
          status: nextStatus,
        },
      );
      if (res.success) {
        showToast(
          res.message || `Đã chuyển trạng thái sang ${nextStatus}`,
          "success",
        );
        setStatusTogglingUser(null);
        fetchUsers(page, search, selectedRole, selectedStatus);
      }
    } catch (err: any) {
      showToast(
        err.message || "Lỗi khi thay đổi trạng thái tài khoản",
        "error",
      );
    } finally {
      setTogglingStatus(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="md" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-outline-variant/30 space-y-3 max-w-md mx-auto mt-12">
        <ShieldWarning
          size={40}
          weight="duotone"
          className="text-red-500 mx-auto"
        />
        <h2 className="text-base font-bold text-on-surface">
          Không có quyền truy cập
        </h2>
        <p className="text-xs text-on-surface-variant">
          Trang này chỉ dành riêng cho Quản trị viên hệ thống (Admin).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2.5">
            <span>Quản lý Người dùng & Hệ thống</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Xem toàn bộ tài khoản, tìm kiếm, chỉnh sửa phân quyền và kích hoạt /
            vô hiệu hóa người dùng.
          </p>
        </div>

        <button
          onClick={() => fetchUsers(page, search, selectedRole, selectedStatus)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          title="Tải lại danh sách"
        >
          <ArrowClockwise
            size={14}
            weight="bold"
            className={loading ? "animate-spin text-primary" : ""}
          />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Tổng tài khoản</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={16} weight="duotone" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-on-surface">
            {stats.total_users}
          </div>
          <div className="text-[11px] text-on-surface-variant/70">
            Bao gồm tất cả vai trò trong hệ thống
          </div>
        </Card>

        {/* Active Users */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Đang hoạt động</span>
            <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
              <UserCheck size={16} weight="duotone" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-green-600">
            {stats.active_users}
          </div>
          <div className="text-[11px] text-green-600/70 font-medium">
            Có thể đăng nhập và học tập
          </div>
        </Card>

        {/* Inactive Users */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">
              Đã vô hiệu hóa (Inactive)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <UserMinus size={16} weight="duotone" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-500">
            {stats.inactive_users}
          </div>
          <div className="text-[11px] text-red-500/70 font-medium">
            Bị khóa quyền truy cập hệ thống
          </div>
        </Card>

        {/* Roles Distribution */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Phân loại vai trò</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <ShieldCheck size={16} weight="duotone" />
            </div>
          </div>
          <div className="text-xs space-y-1.5 font-semibold text-on-surface">
            <button
              onClick={() => {
                const nextRole = selectedRole === "ADMIN" ? "" : "ADMIN";
                setSelectedRole(nextRole);
                setPage(1);
              }}
              className={`w-full flex justify-between items-center px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                selectedRole === "ADMIN"
                  ? "bg-red-50 text-red-600 font-bold"
                  : "hover:bg-slate-50"
              }`}
              title="Lọc theo Quản trị viên"
            >
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <ShieldCheck size={12} weight="bold" className="text-red-500" />
                Quản trị viên:
              </span>
              <span className="text-red-500 font-bold">
                {stats.admin_count}
              </span>
            </button>

            <button
              onClick={() => {
                const nextRole =
                  selectedRole === "INSTRUCTOR" ? "" : "INSTRUCTOR";
                setSelectedRole(nextRole);
                setPage(1);
              }}
              className={`w-full flex justify-between items-center px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                selectedRole === "INSTRUCTOR"
                  ? "bg-blue-50 text-primary font-bold"
                  : "hover:bg-slate-50"
              }`}
              title="Lọc theo Chuyên gia"
            >
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <GraduationCap size={12} weight="bold" className="text-primary" />
                Chuyên gia:
              </span>
              <span className="text-primary font-bold">
                {stats.instructor_count}
              </span>
            </button>

            <button
              onClick={() => {
                const nextRole =
                  selectedRole === "STUDENT_PARENT" ? "" : "STUDENT_PARENT";
                setSelectedRole(nextRole);
                setPage(1);
              }}
              className={`w-full flex justify-between items-center px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                selectedRole === "STUDENT_PARENT"
                  ? "bg-amber-50 text-amber-600 font-bold"
                  : "hover:bg-slate-50"
              }`}
              title="Lọc theo Phụ huynh"
            >
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <HandHeart size={12} weight="bold" className="text-amber-600" />
                Phụ huynh:
              </span>
              <span className="text-amber-600 font-bold">
                {stats.parent_count}
              </span>
            </button>

            <button
              onClick={() => {
                const nextRole =
                  selectedRole === "STUDENT_CHILD" ? "" : "STUDENT_CHILD";
                setSelectedRole(nextRole);
                setPage(1);
              }}
              className={`w-full flex justify-between items-center px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                selectedRole === "STUDENT_CHILD"
                  ? "bg-emerald-50 text-emerald-600 font-bold"
                  : "hover:bg-slate-50"
              }`}
              title="Lọc theo Học sinh"
            >
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <BookOpen size={12} weight="bold" className="text-emerald-600" />
                Học sinh:
              </span>
              <span className="text-emerald-600 font-bold">
                {stats.student_count}
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* Filters & Search Control Bar */}
      <Card
        p="4"
        className="flex flex-col md:flex-row items-center justify-between gap-3"
      >
        {/* Search — state gõ phím nằm ở component con, chỉ giá trị debounce được đẩy lên */}
        <UserSearchBox
          onDebouncedChange={handleSearchDebounced}
          onClear={handleClearSearch}
        />

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface cursor-pointer flex-1 md:flex-initial"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="INSTRUCTOR">Chuyên gia</option>
            <option value="STUDENT_PARENT">Phụ huynh</option>
            <option value="STUDENT_CHILD">Học sinh</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface cursor-pointer flex-1 md:flex-initial"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Vô hiệu hóa</option>
          </select>
        </div>
      </Card>

      {/* Users Data Table */}
      <Card p="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50">
                <EyebrowLabel as="th" size="11" className="py-3.5 px-4 sm:px-6">
                  Người dùng
                </EyebrowLabel>
                <EyebrowLabel as="th" size="11" className="py-3.5 px-4">
                  Email & Liên hệ
                </EyebrowLabel>
                <EyebrowLabel as="th" size="11" className="py-3.5 px-4">
                  Vai trò
                </EyebrowLabel>
                <EyebrowLabel as="th" size="11" className="py-3.5 px-4">
                  Trạng thái
                </EyebrowLabel>
                <EyebrowLabel as="th" size="11" className="py-3.5 px-4">
                  Ngày tham gia
                </EyebrowLabel>
                <EyebrowLabel
                  as="th"
                  size="11"
                  className="py-3.5 px-4 sm:px-6 text-right"
                >
                  Thao tác
                </EyebrowLabel>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-surface-container-high rounded" />
                          <div className="w-16 h-2.5 bg-surface-container rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-36 h-3 bg-surface-container rounded mb-1" />
                      <div className="w-20 h-2.5 bg-surface-container rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-5 bg-surface-container rounded-md" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-5 bg-surface-container rounded-md" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-3 bg-surface-container rounded" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="w-16 h-7 bg-surface-container rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-16 text-center text-on-surface-variant"
                  >
                    <UserMinus
                      size={32}
                      weight="duotone"
                      className="text-on-surface-variant/40 mx-auto mb-2"
                    />
                    <p className="font-bold text-sm text-on-surface">
                      Không tìm thấy người dùng nào
                    </p>
                    <p className="text-xs text-on-surface-variant/70 mt-0.5">
                      Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isSelf = user && String(user.id) === String(item.id);
                  const isAdminRole = item.role_code === "ADMIN";
                  const isInstructor = item.role_code === "INSTRUCTOR";
                  const isParent = item.role_code === "STUDENT_PARENT";
                  const isStudent =
                    item.role_code === "STUDENT_CHILD" ||
                    item.role_code === "STUDENT";
                  const isActive = item.status === "ACTIVE";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !isActive ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {item.avatar_url ? (
                            <img
                              src={item.avatar_url}
                              alt={item.full_name}
                              loading="lazy"
                              className="w-9 h-9 rounded-full object-cover border border-outline-variant/30 shadow-xs"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs uppercase ${
                                isAdminRole
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                  : isInstructor
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : isParent
                                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                      : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              }`}
                            >
                              {item.full_name.charAt(0)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-bold text-on-surface truncate flex items-center gap-1.5">
                              <span>{item.full_name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-primary text-white">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-on-surface-variant/70 block truncate">
                              @{item.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="text-on-surface font-medium block truncate">
                            {item.email}
                          </span>
                          {item.phone_number ? (
                            <span className="text-[11px] text-on-surface-variant/70 flex items-center gap-1">
                              <Phone
                                size={12}
                                weight="bold"
                                className="text-on-surface-variant/50"
                              />
                              {item.phone_number}
                            </span>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant/40 italic">
                              Chưa có SĐT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider ${
                            isAdminRole
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : isInstructor
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : isParent
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : isStudent
                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                    : "bg-surface-container text-on-surface-variant border border-outline-variant/30"
                          }`}
                        >
                          {isAdminRole ? (
                            <ShieldCheck
                              size={12}
                              weight="bold"
                              className="text-red-500"
                            />
                          ) : isInstructor ? (
                            <GraduationCap
                              size={12}
                              weight="bold"
                              className="text-primary"
                            />
                          ) : isParent ? (
                            <HandHeart
                              size={12}
                              weight="bold"
                              className="text-amber-600"
                            />
                          ) : isStudent ? (
                            <BookOpen
                              size={12}
                              weight="bold"
                              className="text-emerald-600"
                            />
                          ) : null}
                          {isParent
                            ? "Phụ huynh"
                            : isStudent
                              ? "Học sinh"
                              : item.role_name}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          tone={
                            isActive
                              ? "bg-green-500/10 text-green-600 border border-green-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }
                          icon={
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                            />
                          }
                        >
                          {isActive ? "Hoạt động" : "Vô hiệu hóa"}
                        </Badge>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-on-surface-variant font-medium text-[11px]">
                        {new Date(item.created_at).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Toggle Active/Inactive Button */}
                          <button
                            disabled={Boolean(isSelf)}
                            onClick={() => setStatusTogglingUser(item)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              isActive
                                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                : "bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                            }`}
                            title={
                              isSelf
                                ? "Không thể tự vô hiệu hóa chính mình"
                                : isActive
                                  ? "Vô hiệu hóa tài khoản (Inactive)"
                                  : "Kích hoạt lại tài khoản (Active)"
                            }
                          >
                            <Power size={14} weight="bold" />
                          </button>

                          {/* Edit User Details */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-surface-container-low hover:bg-primary/10 hover:text-primary text-on-surface-variant border border-outline-variant/30 transition-all cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div>
            Hiển thị{" "}
            <span className="font-bold text-on-surface">{users.length}</span> /{" "}
            <span className="font-bold text-on-surface">{totalUsers}</span>{" "}
            người dùng
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
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
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Trang kế tiếp"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </Card>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <Modal
          open
          onClose={() => setEditingUser(null)}
          size="xl"
          dismissible={false}
          backdropClassName="bg-black/40 backdrop-blur-xs"
          panelClassName="border border-outline-variant/30 flex flex-col"
        >
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <PencilSimple size={16} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Chỉnh sửa thông tin Người dùng
                  </h3>
                  <span className="text-[11px] text-on-surface-variant/70 font-mono">
                    ID: {editingUser.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form
              onSubmit={handleSaveEdit}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <FormRow label="Họ và tên" required>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                  />
                </FormRow>

                {/* Username */}
                <FormRow label="Tên đăng nhập (Username)" required>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                  />
                </FormRow>

                {/* Email */}
                <FormRow label="Địa chỉ Email" required>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                  />
                </FormRow>

                {/* Role */}
                <FormRow label="Vai trò / Phân quyền" required>
                  <select
                    value={editForm.role_id}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        role_id: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-semibold cursor-pointer"
                  >
                    {roles.map((r) => {
                      const label =
                        r.role_code === "ADMIN"
                          ? "🛡️ Quản trị viên (ADMIN)"
                          : r.role_code === "INSTRUCTOR"
                            ? "🎓 Chuyên gia (INSTRUCTOR)"
                            : r.role_code === "STUDENT_PARENT"
                              ? "👨‍👩‍👧 Phụ huynh (STUDENT_PARENT)"
                              : r.role_code === "STUDENT_CHILD"
                                ? "🧒 Học sinh (STUDENT_CHILD)"
                                : `${r.role_name} (${r.role_code})`;
                      return (
                        <option key={r.id} value={r.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </FormRow>

                {/* Status */}
                <FormRow label="Trạng thái tài khoản">
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-semibold cursor-pointer"
                  >
                    <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                    <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
                  </select>
                </FormRow>

                {/* Phone */}
                <FormRow label="Số điện thoại">
                  <input
                    type="text"
                    value={editForm.phone_number}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone_number: e.target.value })
                    }
                    placeholder="09xx..."
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface"
                  />
                </FormRow>

                {/* Gender */}
                <FormRow label="Giới tính">
                  <select
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium cursor-pointer"
                  >
                    <option value="">Chưa chọn</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </FormRow>

                {/* Date of Birth */}
                <FormRow label="Ngày sinh">
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        date_of_birth: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface font-medium cursor-pointer"
                  />
                </FormRow>
              </div>

              {/* Bio */}
              <FormRow label="Tiểu sử / Ghi chú">
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Thông tin giới thiệu ngắn về người dùng..."
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary text-on-surface resize-none"
                />
              </FormRow>

              {/* Reset Password */}
              <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-700">
                  <Key size={14} weight="bold" />
                  <span>Đặt lại mật khẩu mới (Tùy chọn)</span>
                </div>
                <p className="text-[11px] text-amber-700/80">
                  Để trống nếu không muốn thay đổi mật khẩu của người dùng này.
                </p>
                <input
                  type="password"
                  value={editForm.new_password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, new_password: e.target.value })
                  }
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                  className="w-full px-3 py-2 bg-white border border-amber-500/30 rounded-lg focus:outline-none focus:border-amber-600 text-on-surface"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <Spinner size="sm" tone="white" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} weight="bold" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* CONFIRM STATUS TOGGLE MODAL */}
      {statusTogglingUser && (
        <Modal
          open
          onClose={() => setStatusTogglingUser(null)}
          size="sm"
          dismissible={false}
          showClose={false}
          backdropClassName="bg-black/40 backdrop-blur-xs"
          panelClassName="p-6 space-y-4 text-center border border-outline-variant/30"
        >
            <div
              className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
                statusTogglingUser.status === "ACTIVE"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-green-500/10 text-green-600"
              }`}
            >
              <Warning size={24} weight="duotone" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {statusTogglingUser.status === "ACTIVE"
                  ? "Vô hiệu hóa tài khoản?"
                  : "Kích hoạt lại tài khoản?"}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Bạn có chắc chắn muốn{" "}
                {statusTogglingUser.status === "ACTIVE"
                  ? "vô hiệu hóa (Inactive)"
                  : "kích hoạt (Active)"}{" "}
                tài khoản của{" "}
                <strong className="text-on-surface font-bold">
                  {statusTogglingUser.full_name}
                </strong>{" "}
                ({statusTogglingUser.email})?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusTogglingUser(null)}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container border border-outline-variant/30 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={togglingStatus}
                onClick={handleConfirmToggleStatus}
                className={`flex-1 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  statusTogglingUser.status === "ACTIVE"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {togglingStatus ? (
                  <Spinner size="sm" tone="white" />
                ) : (
                  "Xác nhận"
                )}
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
}

// Ô tìm kiếm tách riêng: giữ state gõ phím tại đây để mỗi keystroke chỉ re-render input này,
// giá trị đã debounce (400ms) mới được đẩy lên trang cha qua onDebouncedChange
const UserSearchBox = React.memo(function UserSearchBox({
  onDebouncedChange,
  onClear,
}: {
  onDebouncedChange: (value: string) => void;
  onClear: () => void;
}) {
  const [value, setValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onDebouncedChange(val), 400);
  };

  const handleClear = () => {
    setValue("");
    if (timer.current) clearTimeout(timer.current);
    onClear();
  };

  return (
    <div className="relative w-full md:max-w-md">
      <MagnifyingGlass
        size={16}
        weight="bold"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60"
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Tìm theo họ tên, email, tên đăng nhập..."
        className="w-full pl-9 pr-9 py-2 text-xs bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface transition-all placeholder:text-on-surface-variant/50"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
        >
          <X size={16} weight="bold" />
        </button>
      )}
    </div>
  );
});
