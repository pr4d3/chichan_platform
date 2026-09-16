import { NextResponse } from "next/server";

// Bắt buộc dynamic: endpoint này PHẢI đọc process.env theo từng request,
// không được cache hay "bake" giá trị vào lúc build.
// (Route Handlers mặc định không cache từ Next 15; khai báo rõ để khóa hành vi.)
export const dynamic = "force-dynamic";

// Mặc định dev khi không có biến môi trường (`next dev` tự set NODE_ENV=development),
// giúp clone mới chạy `npm run dev` không cần file .env nào.
const LOCAL_API_DEFAULT = "http://127.0.0.1:8000/api/v1";

// Fallback chỉ tồn tại trong thời gian migrate: tái tạo đúng URL mà bundle cũ
// đang dùng, để bản deploy đầu tiên sau refactor hoạt động identically.
// TODO(phase-3): xóa 2 dòng đọc legacy NEXT_PUBLIC_* và PROD_FALLBACK — khi đó
// thiếu API_BASE_URL sẽ trả 500 (fail-loud) thay vì âm thầm trỏ về prod cũ.
const PROD_FALLBACK = "https://sex-education-api.onrender.com/api/v1";

// LƯU Ý: endpoint này chỉ được trả cấu hình công khai (URL API),
// tuyệt đối không trả secret (AI_API_KEY, DATABASE_URL, SECRET_KEY...).
export function GET() {
  // ĐÃ KIỂM CHỨNG THỰC NGHIỆM trên Next 16 + Turbopack:
  // - `process.env.API_BASE_URL` (không tiền tố)  → giữ nguyên là đọc THẬT lúc runtime.
  // - `process.env.NEXT_PUBLIC_*` → bị inline thay bằng literal NGAY LÚC BUILD, kể cả
  //   trong server bundle. Vì vậy 2 dòng đọc legacy dưới đây vẫn bị "đóng băng" lúc
  //   build — chúng chỉ tồn tại để tái tạo đúng URL production đang chạy trong thời
  //   gian migrate (Vercel build với env của dashboard nên giá trị luôn đúng), và sẽ
  //   bị xóa ở phase 3 để đạt độc lập build hoàn toàn.
  const raw = (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim();

  const apiBaseUrl =
    raw ||
    (process.env.NODE_ENV === "development"
      ? LOCAL_API_DEFAULT
      : PROD_FALLBACK);

  return NextResponse.json(
    { apiBaseUrl },
    { headers: { "Cache-Control": "no-store" } },
  );
}
