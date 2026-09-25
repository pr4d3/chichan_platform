import type { Metadata, Viewport } from "next";
import { Inter, Mea_Culpa, WindSong } from "next/font/google";
import "@/styles/global.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

// Font chính Inter self-host qua next/font, tối ưu hóa và hỗ trợ tiếng Việt toàn diện.
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const meaCulpa = Mea_Culpa({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-mea-culpa",
});

const windSong = WindSong({
  weight: ["400", "500"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-windsong",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ChiChan - Nền tảng Giáo dục Giới tính Trực tuyến",
  description:
    "Nền tảng e-learning chuẩn y khoa giúp phụ huynh và thanh thiếu niên thấu hiểu giới tính, tâm lý dậy thì và kỹ năng bảo vệ bản thân.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${meaCulpa.variable} ${windSong.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-on-background font-sans antialiased flex flex-col"
      >
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
