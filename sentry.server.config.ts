import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",
  
  // 성능 모니터링 샘플링 비율
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 프로파일링 샘플링 비율
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
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
        delete event.request.headers['x-supabase-auth'];
      }
      
      // 쿼리 파라미터 제거
      if (event.request.url) {
        const url = new URL(event.request.url);
        url.searchParams.delete('token');
        url.searchParams.delete('apikey');
        event.request.url = url.toString();
      }
    }
    
    // 환경변수에서 민감한 정보 제거
    if (event.extra && typeof event.extra === 'object' && 'env' in event.extra) {
      const env = event.extra.env as any;
      if (env && typeof env === 'object') {
        delete env.DATABASE_URL;
        delete env.DIRECT_URL;
        delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        delete env.SUPABASE_SERVICE_ROLE_KEY;
      }
    }
    
    return event;
  },
  
  // Next.js 15와 호환되는 기본 통합 사용
});