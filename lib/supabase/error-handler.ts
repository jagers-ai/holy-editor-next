/**
 * Supabase 전용 에러 핸들러
 * Auth와 Database 에러를 체계적으로 처리
 */

import { AuthError, PostgrestError } from '@supabase/supabase-js';
import { GlobalErrorHandler } from '@/lib/errors/global-handler';
import type { AppError, ErrorCategory, ErrorSeverity } from '@/lib/errors/types';
import { getUserMessage } from '@/lib/errors/types';
import { logger } from '@/lib/logger';
import { ToastManager } from '@/lib/toast';

/**
 * Supabase 에러 코드 매핑
 */
const SUPABASE_ERROR_CODES: Record<string, { severity: ErrorSeverity; userMessage: string }> = {
  // Auth 에러
  'invalid_credentials': {
    severity: 'low' as ErrorSeverity,
    userMessage: '이메일 또는 비밀번호가 올바르지 않습니다.'
  },
  'email_not_confirmed': {
    severity: 'medium' as ErrorSeverity,
    userMessage: '이메일 인증이 필요합니다. 이메일을 확인해주세요.'
  },
  'user_already_exists': {
    severity: 'low' as ErrorSeverity,
    userMessage: '이미 등록된 이메일입니다.'
  },
  'weak_password': {
    severity: 'low' as ErrorSeverity,
    userMessage: '비밀번호는 최소 6자 이상이어야 합니다.'
  },
  'over_request_rate_limit': {
    severity: 'high' as ErrorSeverity,
    userMessage: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
  },
  'session_not_found': {
    severity: 'medium' as ErrorSeverity,
    userMessage: '세션이 만료되었습니다. 다시 로그인해주세요.'
  },
  
  // Database 에러
  '23505': { // unique_violation
    severity: 'medium' as ErrorSeverity,
    userMessage: '이미 존재하는 데이터입니다.'
  },
  '23503': { // foreign_key_violation
    severity: 'high' as ErrorSeverity,
    userMessage: '참조하는 데이터가 존재하지 않습니다.'
  },
  '23502': { // not_null_violation
    severity: 'medium' as ErrorSeverity,
    userMessage: '필수 입력 항목이 누락되었습니다.'
  },
  '42501': { // insufficient_privilege
    severity: 'high' as ErrorSeverity,
    userMessage: '권한이 없습니다.'
  },
  'PGRST301': { // JWT expired
    severity: 'medium' as ErrorSeverity,
    userMessage: '인증이 만료되었습니다. 다시 로그인해주세요.'
  },
  'PGRST204': { // no rows found
    severity: 'low' as ErrorSeverity,
    userMessage: '요청한 데이터를 찾을 수 없습니다.'
  }
};

/**
 * Supabase 에러 핸들러 클래스
 */
export class SupabaseErrorHandler {
  /**
   * Auth 에러 처리
   */
  static handleAuthError(
    error: AuthError,
    context?: string,
    showToast: boolean = true
  ): AppError {
    // 에러 코드 추출
    const errorCode = error.message?.toLowerCase().replace(/\s+/g, '_') || 'unknown_error';
    const errorInfo = SUPABASE_ERROR_CODES[errorCode] || {
      severity: 'medium' as ErrorSeverity,
      userMessage: '인증 처리 중 문제가 발생했습니다.'
    };
    
    // AppError 생성
    const appError = GlobalErrorHandler.createAppError(
      error.message,
      ErrorCategory.AUTH,
      errorInfo.severity,
      errorInfo.userMessage,
      {
        errorCode,
        status: error.status,
        context
      }
    );
    
    // 로깅
    logger.error('Supabase Auth Error:', {
      message: error.message,
      code: errorCode,
      status: error.status,
      context
    });
    
    // 글로벌 핸들러로 전송
    GlobalErrorHandler.handleError(appError, 'SupabaseAuth', undefined, { context });
    
    // Toast 표시
    if (showToast && typeof window !== 'undefined') {
      ToastManager.showError(appError);
    }
    
    return appError;
  }

  /**
   * Database 에러 처리
   */
  static handleDatabaseError(
    error: PostgrestError | any,
    context?: string,
    showToast: boolean = true
  ): AppError {
    // PostgrestError 타입 체크
    const isPostgrestError = error && typeof error === 'object' && 'code' in error;
    
    // 에러 코드 추출
    const errorCode = isPostgrestError ? error.code : 'unknown_database_error';
    const errorInfo = SUPABASE_ERROR_CODES[errorCode] || {
      severity: 'high' as ErrorSeverity,
      userMessage: '데이터베이스 작업 중 오류가 발생했습니다.'
    };
    
    // AppError 생성
    const appError = GlobalErrorHandler.createAppError(
      error.message || 'Database error',
      ErrorCategory.DATABASE,
      errorInfo.severity,
      errorInfo.userMessage,
      {
        code: errorCode,
        details: error.details,
        hint: error.hint,
        context
      }
    );
    
    // 로깅
    logger.error('Supabase Database Error:', {
      message: error.message,
      code: errorCode,
      details: error.details,
      hint: error.hint,
      context
    });
    
    // 글로벌 핸들러로 전송
    GlobalErrorHandler.handleError(appError, 'SupabaseDatabase', undefined, { context });
    
    // Toast 표시
    if (showToast && typeof window !== 'undefined') {
      ToastManager.showError(appError);
    }
    
    return appError;
  }

  /**
   * Supabase 응답 처리 헬퍼
   */
  static async handleSupabaseResponse<T>(
    response: { data: T | null; error: PostgrestError | AuthError | null },
    context?: string
  ): Promise<T> {
    if (response.error) {
      // Auth 에러인지 Database 에러인지 구분
      if ('status' in response.error && 'message' in response.error) {
        throw this.handleAuthError(response.error as AuthError, context);
      } else {
        throw this.handleDatabaseError(response.error as PostgrestError, context);
      }
    }
    
    if (!response.data) {
      throw GlobalErrorHandler.createAppError(
        'No data returned from Supabase',
        ErrorCategory.DATABASE,
        'medium' as ErrorSeverity,
        '데이터를 불러올 수 없습니다.'
      );
    }
    
    return response.data;
  }

  /**
   * 재시도 가능 여부 판단
   */
  static isRetryable(error: AuthError | PostgrestError | any): boolean {
    // Rate limit 에러는 재시도 가능
    if (error.message?.includes('rate_limit')) {
      return true;
    }
    
    // 네트워크 에러는 재시도 가능
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return true;
    }
    
    // 타임아웃은 재시도 가능
    if (error.message?.includes('timeout')) {
      return true;
    }
    
    // 특정 데이터베이스 에러는 재시도 불가
    const nonRetryableCodes = ['23505', '23503', '23502', '42501'];
    if ('code' in error && nonRetryableCodes.includes(error.code)) {
      return false;
    }
    
    return false;
  }

  /**
   * 에러 복구 전략 제안
   */
  static getRecoveryStrategy(error: AppError | Error): string[] {
    const strategies: string[] = [];
    
    if ('category' in error) {
      switch (error.category) {
        case ErrorCategory.AUTH:
          strategies.push('다시 로그인 시도');
          strategies.push('비밀번호 재설정');
          strategies.push('이메일 인증 확인');
          break;
          
        case ErrorCategory.DATABASE:
          strategies.push('페이지 새로고침');
          strategies.push('입력 데이터 확인');
          strategies.push('잠시 후 재시도');
          break;
          
        default:
          strategies.push('페이지 새로고침');
          strategies.push('브라우저 캐시 삭제');
      }
    }
    
    return strategies;
  }

  /**
   * Supabase 작업 래퍼 (자동 에러 처리)
   */
  static async wrapSupabaseCall<T>(
    fn: () => Promise<{ data: T | null; error: any }>,
    context?: string,
    options?: {
      retry?: boolean;
      maxAttempts?: number;
      showToast?: boolean;
    }
  ): Promise<T | null> {
    const { retry = true, maxAttempts = 3, showToast = true } = options || {};
    
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= (retry ? maxAttempts : 1); attempt++) {
      try {
        const response = await fn();
        
        if (response.error) {
          lastError = response.error;
          
          // 재시도 불가능한 에러면 즉시 중단
          if (!this.isRetryable(response.error)) {
            break;
          }
          
          // 마지막 시도가 아니면 대기 후 재시도
          if (attempt < maxAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            logger.warn(`Retrying Supabase call (${attempt}/${maxAttempts}) after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        return response.data;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }
      }
    }
    
    // 모든 시도 실패
    if (lastError) {
      if ('status' in lastError && 'message' in lastError) {
        this.handleAuthError(lastError as AuthError, context, showToast);
      } else {
        this.handleDatabaseError(lastError, context, showToast);
      }
    }
    
    return null;
  }
}

export default SupabaseErrorHandler;