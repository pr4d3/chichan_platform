import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Mea_Culpa, WindSong } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

// Font chính self-host qua next/font (thay cho @import Google Fonts chặn render trước đây).
// Là variable font nên không khai báo weight — nhận đủ dải 200-800, hiện cả 300-800 cũ.
// Biến --font-jakarta được globals.css tham chiếu trong token --font-sans.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
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
      className={`${jakarta.variable} ${meaCulpa.variable} ${windSong.variable} h-full`}
    >
      <body className="min-h-full bg-background text-on-background font-sans antialiased flex flex-col">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
