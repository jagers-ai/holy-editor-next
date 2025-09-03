import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",
  
  // 성능 모니터링 샘플링 비율
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 디버그 모드
  debug: process.env.NODE_ENV === "development",
  
  // 환경 및 릴리즈 정보
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // 무시할 에러들
  ignoreErrors: [
    "NetworkError",
    "Failed to fetch",
    "AbortError",
  ],
  
  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // 민감한 정보 제거
    if (event.request) {
      // 헤더에서 민감한 정보 제거
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      
      // 쿼리 파라미터 제거
      if (event.request.url) {
        const url = new URL(event.request.url);
        url.searchParams.delete('token');
        url.searchParams.delete('apikey');
        event.request.url = url.toString();
      }
    }
    
    return event;
  },
  
  // Edge Runtime은 기본 통합만 사용
});