import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // Next.js가 상위 디렉터리를 워크스페이스 루트로 잘못 추론하지 않도록 강제 지정
  outputFileTracingRoot: __dirname,
  transpilePackages: ['core'],
};

// Sentry 설정 완료! 🎉
export default withSentryConfig(nextConfig, {
  silent: true, // 빌드 로그 정리
});
