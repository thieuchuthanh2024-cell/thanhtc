import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VIETSIM TELECOM - Đại Lý Phân Phối Sim Số Đẹp Phong Thủy",
  description: "Hệ thống mua bán, tư vấn và phân tích sim số đẹp phong thủy hàng đầu Việt Nam dựa trên nền tảng lai Hybrid AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
