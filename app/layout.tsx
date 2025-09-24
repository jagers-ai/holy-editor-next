import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { TRPCReactProvider } from "@/app/providers";
import { PlatformFlags } from "@/components/system/PlatformFlags";
import { AuthSync } from "@/components/system/AuthSync";
import { AppErrorBoundary } from "@/components/error/ErrorBoundary";
import { ErrorInitializer } from "@/components/system/ErrorInitializer";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "홀리해빗",
  description: "나만의 AI 신앙생활 파트너 : 홀리해빗",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#ffcc00",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} antialiased`}
      >
        <AppErrorBoundary>
          <ErrorInitializer />
          <PlatformFlags />
          <TRPCReactProvider>
            <AuthSync />
            <Navigation />
            <main>
              {children}
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '8px',
                  padding: '12px 16px',
                },
              }}
            />
          </TRPCReactProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
