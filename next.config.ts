import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry 설정 완료! 🎉
export default withSentryConfig(nextConfig, {
  silent: true, // 빌드 로그 정리
});
