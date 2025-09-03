/**
 * 에러 분류 및 심각도 정의
 * Holy Editor 프로젝트의 모든 에러를 체계적으로 관리
 */

/**
 * 에러 심각도 레벨
 */
export enum ErrorSeverity {
  LOW = 'low',       // 사용자 경험에 거의 영향 없음
  MEDIUM = 'medium', // 기능 일부 제한
  HIGH = 'high',     // 주요 기능 장애
  CRITICAL = 'critical' // 시스템 전체 장애
}

/**
 * 에러 카테고리
 */
export enum ErrorCategory {
  AUTH = 'auth',           // 인증/인가 관련
  DATABASE = 'database',   // 데이터베이스 작업
  API = 'api',            // API 요청/응답
  CLIENT = 'client',      // 클라이언트 사이드
  EXTERNAL = 'external',  // 외부 서비스
  VALIDATION = 'validation', // 입력 검증
  EDITOR = 'editor'       // 에디터 관련
}

/**
 * 애플리케이션 에러 인터페이스
 */
export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage?: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
  errorCode?: string;
  retryable?: boolean;
}

/**
 * 에러 정보 (React Error Boundary용)
 */
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryProps?: Record<string, unknown>;
}

/**
 * 에러 리포트 인터페이스
 */
export interface ErrorReport {
  error: AppError | Error;
  source: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
  timestamp: Date;
}

/**
 * 에러 복구 전략
 */
export interface ErrorRecoveryStrategy {
  retry?: {
    maxAttempts: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
  };
  fallback?: () => void;
  notify?: boolean;
}

/**
 * 사용자 친화적 메시지 매핑
 */
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  // Auth 에러
  'auth/invalid-credentials': '로그인 정보가 올바르지 않습니다.',
  'auth/email-not-confirmed': '이메일 인증이 필요합니다.',
  'auth/too-many-requests': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  'auth/session-expired': '세션이 만료되었습니다. 다시 로그인해주세요.',
  
  // Database 에러
  'database/connection-failed': '데이터베이스 연결에 실패했습니다.',
  'database/query-timeout': '요청 처리 시간이 초과되었습니다.',
  'database/unique-constraint': '이미 존재하는 데이터입니다.',
  
  // API 에러
  'api/network-error': '네트워크 연결을 확인해주세요.',
  'api/server-error': '서버 오류가 발생했습니다.',
  'api/rate-limit': '요청 한도를 초과했습니다.',
  
  // Editor 에러
  'editor/save-failed': '문서 저장에 실패했습니다.',
  'editor/load-failed': '문서를 불러올 수 없습니다.',
  'editor/invalid-content': '문서 내용이 유효하지 않습니다.',
  
  // 기본 메시지
  'default': '예상치 못한 오류가 발생했습니다.'
};

/**
 * 에러 코드로 사용자 메시지 가져오기
 */
export function getUserMessage(errorCode: string | undefined): string {
  if (!errorCode) return USER_FRIENDLY_MESSAGES.default;
  return USER_FRIENDLY_MESSAGES[errorCode] || USER_FRIENDLY_MESSAGES.default;
}

/**
 * 에러가 재시도 가능한지 확인
 */
export function isRetryableError(error: AppError | Error): boolean {
  if ('retryable' in error) {
    return error.retryable === true;
  }
  
  // 네트워크 및 타임아웃 에러는 기본적으로 재시도 가능
  const retryableMessages = [
    'network',
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'rate limit'
  ];
  
  return retryableMessages.some(msg => 
    error.message?.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * 에러 심각도 판단
 */
export function getErrorSeverity(error: Error | AppError): ErrorSeverity {
  if ('severity' in error) {
    return error.severity;
  }
  
  // 에러 메시지 기반 심각도 판단
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('critical') || message.includes('fatal')) {
    return ErrorSeverity.CRITICAL;
  }
  if (message.includes('auth') || message.includes('unauthorized')) {
    return ErrorSeverity.HIGH;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorSeverity.MEDIUM;
  }
  
  return ErrorSeverity.LOW;
}