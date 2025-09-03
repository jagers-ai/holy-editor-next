import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",
  
  // 성능 모니터링 샘플링 비율 (프로덕션에서는 낮춰야 함)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 세션 재생 샘플링 비율
  replaysSessionSampleRate: 0.1, // 일반 세션의 10%만 녹화
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100% 녹화
  
  // 프로파일링 샘플링 비율 (성능 분석)
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // 디버그 모드 (개발 환경에서만)
  debug: process.env.NODE_ENV === "development",
  
  // 환경 및 릴리즈 정보
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // 무시할 에러들
  ignoreErrors: [
    // 브라우저 확장 프로그램 관련 에러
    "top.GLOBALS",
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    // 네트워크 관련 일시적 에러
    "NetworkError",
    "Failed to fetch",
    // 취소된 요청
    "AbortError",
  ],
  
  // 허용된 도메인 (XHR/fetch 추적)
  allowUrls: [
    /https?:\/\/(www\.)?holy-editor.*\.vercel\.app/,
    /https?:\/\/localhost:\d+/,
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
      
      // URL에서 민감한 쿼리 파라미터 제거
      if (event.request.url) {
        const url = new URL(event.request.url);
        url.searchParams.delete('token');
        url.searchParams.delete('apikey');
        url.searchParams.delete('secret');
        event.request.url = url.toString();
      }
    }
    
    // 개인정보 마스킹
    if (event.user) {
      if (event.user.email) {
        // 이메일 부분 마스킹
        const [local, domain] = event.user.email.split('@');
        event.user.email = `${local.substring(0, 2)}***@${domain}`;
      }
    }
    
    return event;
  },
  
  // 브레드크럼 설정
  beforeBreadcrumb(breadcrumb, hint) {
    // console.log 브레드크럼 필터링 (너무 많을 수 있음)
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    
    // XHR 브레드크럼에서 민감한 정보 제거
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      if (breadcrumb.data?.url) {
        const url = new URL(breadcrumb.data.url);
        url.searchParams.delete('token');
        url.searchParams.delete('apikey');
        breadcrumb.data.url = url.toString();
      }
    }
    
    return breadcrumb;
  },
  
  // 통합 설정 - Next.js 15에서는 자동으로 설정됨
  // Replay와 BrowserTracing은 이제 자동으로 포함됨
});