import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",
  
  // 성능 모니터링 샘플링 비율 (Edge는 최소한으로)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 1.0,
  
  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === "development",
  
  // 환경 및 릴리즈 정보
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // 무시할 에러들
  ignoreErrors: [
    // Edge Runtime 특정 에러
    "EdgeRuntimeError",
    // 네트워크 관련
    "FetchError",
    "AbortError",
  ],
  
  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // Edge에서는 제한적인 환경이므로 간단하게 처리
    
    // 헤더 정보 제거
    if (event.request?.headers) {
      const sensitiveHeaders = [
        'authorization',
        'cookie',
        'x-api-key',
        'x-supabase-auth',
      ];
      
      sensitiveHeaders.forEach(header => {
        if (event.request?.headers?.[header]) {
          event.request.headers[header] = '[REDACTED]';
        }
      });
    }
    
    // URL 쿼리 파라미터 정리
    if (event.request?.url) {
      try {
        const url = new URL(event.request.url);
        const sensitiveParams = ['token', 'apikey', 'secret', 'key'];
        
        sensitiveParams.forEach(param => {
          if (url.searchParams.has(param)) {
            url.searchParams.set(param, '[REDACTED]');
          }
        });
        
        event.request.url = url.toString();
      } catch (e) {
        // URL 파싱 실패 시 그대로 둠
      }
    }
    
    return event;
  },
  
  // Edge Runtime 특정 설정
  // Edge는 제한된 환경이므로 최소한의 설정만 사용
  transportOptions: {
    // Edge에서는 재시도 최소화 (성능 우선)
    maxRetries: 2,
  },
  
  // 최대 브레드크럼 수 (Edge는 메모리 절약)
  maxBreadcrumbs: 20,
});