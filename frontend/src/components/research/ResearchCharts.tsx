"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Custom Tooltip chung đồng bộ giao diện rounded-none và kích thước chữ to rõ
function CustomChartTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name =
      data.label ||
      data.source ||
      data.fullLevel ||
      data.level ||
      data.cause ||
      data.importance ||
      data.solution ||
      data.wish;
    const pct = data.percentage ?? data.agreement_rate ?? data.support_rate;
    const count = data.count;

    return (
      <div className="bg-white p-3.5 border border-outline-variant/60 shadow-depth-2 rounded-none space-y-1.5 z-50 max-w-xs">
        <p className="font-bold text-on-surface text-xs sm:text-sm leading-snug">
          {name}
        </p>
        <div className="flex items-center gap-2 pt-1.5 border-t border-outline-variant/20">
          <span className="font-extrabold text-primary text-base">
            {pct}%
          </span>
          {count !== undefined && (
            <span className="text-on-surface-variant font-medium text-xs">
              ({count} / 401 học sinh)
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// ============================================================================
// 1. BIỂU ĐỒ 2.1.1: MỨC ĐỘ TIẾP CẬN GDGT TẠI TRƯỜNG HỌC (Donut Chart)
// ============================================================================
const data211 = [
  { label: "Có, ở mức cơ bản", percentage: 40.9, count: 164, fill: "#005039" }, // Xanh chủ đạo đậm nhất
  { label: "Có, khá đầy đủ", percentage: 23.0, count: 92, fill: "#10B981" },   // Xanh lục tươi
  { label: "Có, rất ít", percentage: 19.0, count: 76, fill: "#6EE7B7" },       // Xanh xô thơm sáng
  { label: "Chưa bao giờ", percentage: 17.1, count: 69, fill: "#A7F3D0" },     // Xanh bạc hà nhạt
];

export function Chart211() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-72 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomChartTooltip />} />
            <Pie
              data={data211}
              dataKey="percentage"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data211.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend tuỳ chỉnh chữ to, rõ ràng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm text-on-surface-variant w-full pt-3 px-2 border-t border-outline-variant/20">
        {data211.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 shrink-0 border border-black/10" style={{ backgroundColor: d.fill }} />
            <span className="truncate">{d.label}: <strong className="text-on-surface font-bold">{d.percentage}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 2. BIỂU ĐỒ 2.1.2: CÁC NGUỒN THÔNG TIN HỌC SINH SỬ DỤNG (Horizontal Bar Chart)
// ============================================================================
const data212 = [
  { source: "Mạng xã hội (TikTok, FB...)", count: 293, percentage: 73.1, fill: "#005039" },
  { source: "Gia đình (Cha mẹ, người thân)", count: 233, percentage: 58.1, fill: "#006E50" },
  { source: "Giáo viên / Nhân viên trường", count: 213, percentage: 53.1, fill: "#008B67" },
  { source: "Bạn bè, anh chị cùng trang lứa", count: 193, percentage: 48.1, fill: "#059669" },
  { source: "Sách giáo khoa, tài liệu chuẩn", count: 178, percentage: 44.4, fill: "#10B981" },
  { source: "Website / Ứng dụng giáo dục", count: 174, percentage: 43.4, fill: "#34D399" },
  { source: "Sách, báo, tạp chí in", count: 149, percentage: 37.2, fill: "#6EE7B7" },
  { source: "Cơ sở y tế, phòng khám chuyên gia", count: 142, percentage: 35.4, fill: "#9AE6B4" },
];

export function Chart212() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-96 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data212}
          layout="vertical"
          margin={{ top: 10, right: 35, left: 15, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#475569" }} />
          <YAxis
            type="category"
            dataKey="source"
            width={220}
            tick={{ fontSize: 12, fill: "#1E293B", fontWeight: 500 }}
          />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="percentage" radius={[0, 0, 0, 0]} barSize={22}>
            {data212.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// 3. BIỂU ĐỒ 2.1.3: MỨC ĐỘ TỰ ĐÁNH GIÁ HIỂU BIẾT (Vertical Bar Chart)
// ============================================================================
const data213 = [
  { level: "Mức 1", fullLevel: "Mức 1: Hầu như không biết gì", count: 20, percentage: 5.0, fill: "#C6F6D5" },
  { level: "Mức 2", fullLevel: "Mức 2: Biết một chút ít", count: 18, percentage: 4.5, fill: "#9AE6B4" },
  { level: "Mức 3", fullLevel: "Mức 3: Biết ở mức cơ bản", count: 148, percentage: 36.9, fill: "#34D399" },
  { level: "Mức 4", fullLevel: "Mức 4: Biết khá", count: 98, percentage: 24.4, fill: "#059669" },
  { level: "Mức 5", fullLevel: "Mức 5: Biết đầy đủ", count: 117, percentage: 29.2, fill: "#005039" },
];

export function Chart213() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-72 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data213} margin={{ top: 20, right: 20, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="level" tick={{ fontSize: 12, fontWeight: 600, fill: "#1E293B" }} />
          <YAxis unit="%" domain={[0, 45]} tick={{ fontSize: 12, fill: "#475569" }} />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="percentage" radius={[0, 0, 0, 0]} barSize={42}>
            {data213.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// 4. BIỂU ĐỒ 2.1.4: NGUYÊN NHÂN KHIẾN HỌC SINH GẶP KHÓ KHĂN (Horizontal Bar Chart)
// ============================================================================
const data214 = [
  { cause: "Tâm lý e ngại, sợ bị trêu chọc", agreement_rate: 84.5, fill: "#005039" },
  { cause: "Chưa được giảng dạy thường xuyên", agreement_rate: 78.2, fill: "#006E50" },
  { cause: "Thiếu tài liệu chính thống, dễ hiểu", agreement_rate: 71.3, fill: "#008B67" },
  { cause: "Rào cản từ phụ huynh né tránh", agreement_rate: 66.8, fill: "#10B981" },
  { cause: "Khó phân biệt tin giả trên mạng", agreement_rate: 62.4, fill: "#34D399" },
];

export function Chart214() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-72 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data214}
          layout="vertical"
          margin={{ top: 10, right: 35, left: 15, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#475569" }} />
          <YAxis
            type="category"
            dataKey="cause"
            width={210}
            tick={{ fontSize: 12, fill: "#1E293B", fontWeight: 500 }}
          />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="agreement_rate" radius={[0, 0, 0, 0]} barSize={24}>
            {data214.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// 5. BIỂU ĐỒ 2.1.5: TẦM QUAN TRỌNG CỦA VIỆC TRIỂN KHAI GDGT (Donut Chart)
// ============================================================================
const data215 = [
  { importance: "Rất quan trọng", percentage: 74.3, count: 298, fill: "#005039" },
  { importance: "Khá quan trọng", percentage: 19.0, count: 76, fill: "#10B981" },
  { importance: "Trung lập", percentage: 5.0, count: 20, fill: "#6EE7B7" },
  { importance: "Ít / Không quan trọng", percentage: 1.7, count: 7, fill: "#C6F6D5" },
];

export function Chart215() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-72 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomChartTooltip />} />
            <Pie
              data={data215}
              dataKey="percentage"
              nameKey="importance"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data215.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm text-on-surface-variant w-full pt-3 px-2 border-t border-outline-variant/20">
        {data215.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 shrink-0 border border-black/10" style={{ backgroundColor: d.fill }} />
            <span className="truncate">{d.importance}: <strong className="text-on-surface font-bold">{d.percentage}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. BIỂU ĐỒ 2.1.6: GIẢI PHÁP TIẾP CẬN GDGT HIỆU QUẢ HƠN (Horizontal Bar Chart)
// ============================================================================
const data216 = [
  { solution: "Môi trường phù hợp, không kỳ thị", support_rate: 83.3, fill: "#005039" },
  { solution: "Phát triển website, tài liệu video", support_rate: 59.9, fill: "#006E50" },
  { solution: "Phối hợp Gia đình - Nhà trường", support_rate: 54.4, fill: "#008B67" },
  { solution: "Hướng dẫn kỹ năng tự bảo vệ", support_rate: 53.1, fill: "#059669" },
  { solution: "Tập huấn phương pháp cho giáo viên", support_rate: 51.9, fill: "#10B981" },
  { solution: "Tăng thời lượng tiết học định kỳ", support_rate: 41.1, fill: "#34D399" },
];

export function Chart216() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-80 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data216}
          layout="vertical"
          margin={{ top: 10, right: 35, left: 15, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#475569" }} />
          <YAxis
            type="category"
            dataKey="solution"
            width={210}
            tick={{ fontSize: 12, fill: "#1E293B", fontWeight: 500 }}
          />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="support_rate" radius={[0, 0, 0, 0]} barSize={22}>
            {data216.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// 7. BIỂU ĐỒ 2.1.7: MỨC ĐỘ CẦN THIẾT CỦA WEBSITE TRỰC TUYẾN (Donut Chart)
// ============================================================================
const data217 = [
  { level: "Rất cần thiết", percentage: 39.4, count: 158, fill: "#005039" },
  { level: "Trung lập", percentage: 29.4, count: 118, fill: "#10B981" },
  { level: "Khá cần thiết", percentage: 25.2, count: 101, fill: "#6EE7B7" },
  { level: "Ít / Không cần", percentage: 5.9, count: 24, fill: "#C6F6D5" },
];

export function Chart217() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-72 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomChartTooltip />} />
            <Pie
              data={data217}
              dataKey="percentage"
              nameKey="level"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={3}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data217.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-on-surface-variant w-full pt-3 px-2 border-t border-outline-variant/20">
        {data217.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 shrink-0 border border-black/10" style={{ backgroundColor: d.fill }} />
            <span className="truncate">{d.level}: <strong className="text-on-surface font-bold">{d.percentage}%</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 8. BIỂU ĐỒ 2.1.8: MONG MUỐN CỦA HỌC SINH ĐỐI VỚI NHÀ TRƯỜNG (Horizontal Bar Chart)
// ============================================================================
const data218 = [
  { wish: "Kiến thức chuẩn xác, đầy đủ", count: 272, percentage: 67.8, fill: "#005039" },
  { wish: "Hỏi đáp cởi mở, không phán xét", count: 260, percentage: 64.8, fill: "#006E50" },
  { wish: "Nội dung gắn liền thực tế", count: 246, percentage: 61.3, fill: "#008B67" },
  { wish: "Kiến thức cảm xúc, tình yêu, SKSS", count: 222, percentage: 55.4, fill: "#059669" },
  { wish: "Tăng game tương tác, thảo luận", count: 210, percentage: 52.4, fill: "#10B981" },
  { wish: "Kênh tư vấn riêng tư ẩn danh", count: 153, percentage: 38.2, fill: "#34D399" },
];

export function Chart218() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-80 w-full bg-surface-container-lowest animate-pulse" />;

  return (
    <div className="w-full h-80 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data218}
          layout="vertical"
          margin={{ top: 10, right: 35, left: 15, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: "#475569" }} />
          <YAxis
            type="category"
            dataKey="wish"
            width={210}
            tick={{ fontSize: 12, fill: "#1E293B", fontWeight: 500 }}
          />
          <Tooltip content={<CustomChartTooltip />} />
          <Bar dataKey="percentage" radius={[0, 0, 0, 0]} barSize={22}>
            {data218.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
