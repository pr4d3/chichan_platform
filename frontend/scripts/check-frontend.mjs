// Guard chống hồi quy "build dính env" — chạy trước `next build` (xem package.json).
//
// Bối cảnh: Next.js nhúng giá trị NEXT_PUBLIC_* vào bundle client NGAY LÚC BUILD,
// khiến artifact phụ thuộc vào môi trường lúc build. Refactor này chuyển sang runtime
// config (/api/app-config + lib/runtime-config.ts), nên các quy tắc sau được ép buộc:
//
//  1. Cấm NEXT_PUBLIC_API_* / NEXT_PUBLIC_SITE_* trong src, TRỪ các dòng đọc legacy
//     phía server trong app-config/route.ts (chỉ tồn tại trong thời gian migrate).
//  2. Cấm literal onrender.com trong src, TRỪ fallback migration trong
//     lib/runtime-config.ts và app-config/route.ts (sẽ xóa ở phase 3).
//  3. Bất biến SSE: trang game/[sessionId] phải lấy base URL qua getApiBaseUrl() —
//     stream chat PHẢI giữ đường đi trực tiếp browser → Render. Nếu ai đó "dọn dẹp"
//     thành đường dẫn tương đối /api/..., stream sẽ đi qua Vercel Function và bị cắt
//     (maxDuration) hoặc bị buffer — lỗi âm thầm, rất khó debug.
//
// TODO(phase-3): khi đã xóa fallback migration, thu hẹp 2 ALLOWLIST bên dưới về rỗng.

import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src");

const NEXT_PUBLIC_RE = /NEXT_PUBLIC_(API_BASE_URL|API_URL|SITE_URL)/;
const ONRENDER_RE = /sex-education-api\.onrender\.com/;

// Đường dẫn chuẩn hóa dùng '/' để chạy đúng trên cả Windows và Linux (Vercel).
const ALLOW_NEXT_PUBLIC = new Set(["app/api/app-config/route.ts"]);
const ALLOW_ONRENDER = new Set([
  "lib/runtime-config.ts",
  "app/api/app-config/route.ts",
]);

const GAME_PAGE_REL =
  "app/(public)/game/[sessionId]/page.tsx";

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTS.has("." + entry.name.split(".").pop())) out.push(full);
  }
  return out;
}

const errors = [];
let sawGamePage = false;

for (const file of walk(srcDir)) {
  const rel = relative(srcDir, file).split(sep).join("/");
  const content = readFileSync(file, "utf8");

  if (NEXT_PUBLIC_RE.test(content) && !ALLOW_NEXT_PUBLIC.has(rel)) {
    errors.push(
      `${rel}: dùng NEXT_PUBLIC_* — giá trị sẽ bị nhúng lúc BUILD. Hãy dùng getApiBaseUrl() từ lib/runtime-config.ts.`,
    );
  }
  if (ONRENDER_RE.test(content) && !ALLOW_ONRENDER.has(rel)) {
    errors.push(
      `${rel}: chứa literal cứng sex-education-api.onrender.com — URL API phải đến từ runtime config.`,
    );
  }
  if (rel === GAME_PAGE_REL) {
    sawGamePage = true;
    if (!content.includes("getApiBaseUrl")) {
      errors.push(
        `${rel}: thiếu getApiBaseUrl() — luồng SSE chat phải resolve base URL lúc runtime và giữ đường đi trực tiếp browser → Render.`,
      );
    }
  }
}

if (!sawGamePage) {
  errors.push(
    `Không tìm thấy ${GAME_PAGE_REL} — script guard cần cập nhật lại đường dẫn bất biến SSE.`,
  );
}

if (errors.length > 0) {
  console.error("\n✖ check-frontend THẤT BẠI — phát hiện hồi quy build-time env:");
  for (const e of errors) console.error("  - " + e);
  console.error(
    "\nXem scripts/check-frontend.mjs để hiểu quy tắc / cập nhật allowlist (chỉ khi thật sự cần).",
  );
  process.exit(1);
}

console.log("✔ check-frontend: không có hồi quy build-time env (NEXT_PUBLIC_*/literal cứng).");
