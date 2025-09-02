import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import { BookOpen } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HolyEditor - 성경 구절 에디터",
  description: "성경 구절을 쉽게 삽입할 수 있는 에디터",
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
          <nav className="border-b fixed top-0 left-0 right-0 bg-background z-50">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
              <Link href="/" className="font-bold text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                HolyEditor
              </Link>
            </div>
          </nav>
          <main className="pt-14">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
