import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",
  
  // 성능 모니터링 샘플링 비율 (서버는 더 낮게)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  
  // 프로파일링 샘플링 비율 (서버 성능 분석)
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  
  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === "development",
  
  // 환경 및 릴리즈 정보
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // 무시할 에러들
  ignoreErrors: [
    // 정상적인 중단
    "AbortError",
    // 네트워크 타임아웃
    "TimeoutError",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ECONNRESET",
  ],
  
  // 민감한 정보 필터링
  beforeSend(event, hint) {
    // 환경 변수에서 민감한 정보 제거
    if (event.extra?.env) {
      const sensitiveKeys = [
        'DATABASE_URL',
        'DIRECT_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SENTRY_AUTH_TOKEN',
        'GOOGLE_CLIENT_SECRET',
      ];
      
      sensitiveKeys.forEach(key => {
        if (event.extra.env[key]) {
          event.extra.env[key] = '[REDACTED]';
        }
      });
    }
    
    // 데이터베이스 쿼리에서 민감한 정보 제거
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.category === 'prisma' && breadcrumb.data?.query) {
          // SQL 쿼리에서 실제 값 제거
          breadcrumb.data.query = breadcrumb.data.query.replace(
            /VALUES\s*\([^)]+\)/gi,
            'VALUES ([REDACTED])'
          );
        }
        return breadcrumb;
      });
    }
    
    return event;
  },
  
  // 서버 전용 통합
  integrations: [
    // Prisma 통합 (ORM 에러 추적)
    new Sentry.Integrations.Prisma({ client: true }),
    
    // HTTP 통합 (외부 API 호출 추적)
    new Sentry.Integrations.Http({ 
      tracing: true,
      breadcrumbs: true 
    }),
    
    // 처리되지 않은 예외 캐처
    new Sentry.Integrations.OnUncaughtException({
      onFatalError: (error) => {
        // 치명적인 에러 발생 시 로그 남기고 프로세스 종료
        console.error('Fatal error caught by Sentry:', error);
        process.exit(1);
      },
    }),
    
    // 처리되지 않은 Promise rejection 캐처
    new Sentry.Integrations.OnUnhandledRejection({
      mode: 'warn', // 경고만 하고 프로세스는 계속 실행
    }),
  ],
  
  // 전송 옵션
  transportOptions: {
    // 서버는 더 많은 재시도
    maxRetries: 5,
  },
  
  // 서버 사이드 특정 설정
  autoSessionTracking: true,
  
  // 최대 브레드크럼 수 (서버는 더 많이 보관)
  maxBreadcrumbs: 100,
  
  // 에러 전송 전 대기 시간 (밀리초)
  shutdownTimeout: 5000,
});