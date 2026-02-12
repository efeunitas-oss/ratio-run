import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- İŞTE SİHRİ YAPAN SATIR BU!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RATIO.RUN - Decision Engine",
  description: "Ultimate Decision Support System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}