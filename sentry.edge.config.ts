import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // 개발 환경에서는 비활성화
  enabled: process.env.NODE_ENV === "production",
  
  // 성능 모니터링 (테스트용 100%)
  tracesSampleRate: 1.0,
  
  // 디버그 모드 비활성화
  debug: false,
  
  // 릴리즈 버전
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
});