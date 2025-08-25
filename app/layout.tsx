import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🍞 BREAD - 빵 레시피 원가 계산기",
  description: "베이커리 사업주를 위한 정확한 원가 계산 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <nav className="border-b">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="font-bold text-xl">🍞 BREAD</Link>
                <span className="text-sm text-gray-600">베이커리 원가 계산기</span>
              </div>
              <div className="flex gap-6">
                <Link href="/ingredients" className="hover:underline">재료 관리</Link>
                <Link href="/recipes" className="hover:underline">레시피 관리</Link>
                <Link href="/calculator" className="hover:underline">원가 계산</Link>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
