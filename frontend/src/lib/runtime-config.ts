// Cấu hình runtime: base URL của backend được giải quyết LÚC CHẠY, không phải lúc build.
//
// TUYỆT ĐỐI không tái sử dụng NEXT_PUBLIC_* cho URL API: Next.js nhúng (inline) giá trị
// NEXT_PUBLIC_* vào bundle client NGAY LÚC `next build`, sau build sẽ không phản ứng với
// thay đổi env nữa (xem node_modules/next/dist/docs/01-app/02-guides/environment-variables.md).
// Kể từ refactor này, build phải độc lập với biến môi trường: cùng một build chạy được ở
// mọi môi trường, giá trị env chỉ được đọc lúc runtime qua /api/app-config.
//
// LƯU Ý: đừng gọi getApiBaseUrl() trong lúc render của route được prerender tĩnh —
// nhánh server sẽ bị đánh giá lúc build và "đóng băng" giá trị. Chỉ gọi bên trong
// effect/handler (api.request() và các hàm async đều thỏa mãn).

const LOCAL_API_DEFAULT = "http://127.0.0.1:8000/api/v1";

// Fallback chỉ tồn tại trong thời gian migrate, giống hệt literal cũ tại api.ts:3
// trước khi refactor, để bundle mới không làm sập site đang chạy nếu /api/app-config lỗi.
// TODO(phase-3): xóa hằng này khi API_BASE_URL đã được xác nhận trên Vercel Production.
const MIGRATION_FALLBACK = "https://sex-education-api.onrender.com/api/v1";

const LS_KEY = "api_base_url_last_good";

let cached: string | null = null;
let pending: Promise<string> | null = null;

function envFallback(): string {
  return process.env.NODE_ENV === "development"
    ? LOCAL_API_DEFAULT
    : MIGRATION_FALLBACK;
}

function readLastGood(): string | null {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

function saveLastGood(value: string): void {
  try {
    localStorage.setItem(LS_KEY, value);
  } catch {
    // bỏ qua: private mode / storage bị chặn
  }
}

export function getApiBaseUrl(): Promise<string> {
  if (cached) return Promise.resolve(cached);

  if (typeof window === "undefined") {
    // SSR/prerender: đọc process.env thật phía server (không bao giờ bị inline lúc build).
    cached = (process.env.API_BASE_URL || "").trim() || LOCAL_API_DEFAULT;
    return Promise.resolve(cached);
  }

  if (!pending) {
    pending = fetch("/api/app-config", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`app-config ${res.status}`);
        return res.json() as Promise<{ apiBaseUrl?: string }>;
      })
      .then((cfg) => {
        const value = (cfg.apiBaseUrl || "").trim();
        if (!value) throw new Error("app-config rỗng");
        cached = value;
        saveLastGood(value);
        return value;
      })
      .catch(() => {
        // /api/app-config hỏng → dùng giá trị tốt cuối cùng (stale-while-down),
        // rồi mới đến fallback theo môi trường. Không âm thầm redirect hay logout.
        cached = readLastGood() || envFallback();
        console.warn(
          "[runtime-config] Không tải được /api/app-config, dùng API base dự phòng:",
          cached,
        );
        return cached;
      });
  }
  return pending;
}

// Warm-start: chủ động gọi getApiBaseUrl() ngay khi module được import phía browser,
// để fetch /api/app-config chạy SONG SONG với hydration thay vì request API đầu tiên
// phải chờ xong config mới bắt đầu (bớt một lượt RTT trên đường đến dữ liệu).
// Lỗi được nuốt ở trên rồi (fallback last-good/env), .catch chỉ để phòng ngừa.
if (typeof window !== "undefined") {
  void getApiBaseUrl().catch(() => {});
}
