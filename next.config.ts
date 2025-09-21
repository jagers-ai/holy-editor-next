import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Next.js가 상위 디렉터리를 워크스페이스 루트로 잘못 추론하지 않도록 강제 지정
  outputFileTracingRoot: __dirname,
  transpilePackages: ['core'],
  async redirects() {
    return [
      // 단수 표기 잔재 대비 (/folder → /documents)
      { source: '/folder', destination: '/documents', permanent: true },
      { source: '/folder/:folderId', destination: '/documents?folderId=:folderId', permanent: true },
      { source: '/folder/:folderId/:path*', destination: '/documents?folderId=:folderId', permanent: true },

      // 실제 사용 경로 일괄 이전 (/folders → /documents)
      { source: '/folders', destination: '/documents', permanent: true },
      { source: '/folders/:folderId', destination: '/documents?folderId=:folderId', permanent: true },
      { source: '/folders/:folderId/:path*', destination: '/documents?folderId=:folderId', permanent: true },
    ];
  },
};

// Sentry 설정 완료! 🎉
export default withSentryConfig(nextConfig, {
  silent: true, // 빌드 로그 정리
});
