import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu & Báo cáo Nghiên cứu Khoa học | ChiChan",
  description:
    "Đề tài nghiên cứu khoa học cấp trường và thành phố: Thực trạng tiếp cận thông tin giáo dục giới tính của học sinh THPT trên môi trường số và xây dựng nền tảng tương tác ChiChan.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
