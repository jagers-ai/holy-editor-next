/**
 * 글로벌 에러 핸들러
 * 전체 애플리케이션의 에러를 중앙에서 처리
 */

import * as Sentry from '@sentry/nextjs';
import { posthog } from '@/lib/posthog';
import { logger, logError } from '@/lib/logger';
import type { AppError, ErrorCategory, ErrorSeverity, ErrorReport } from './types';
import { getErrorSeverity, getUserMessage } from './types';

/**
 * 글로벌 에러 핸들러 클래스
 */
export class GlobalErrorHandler {
  private static isInitialized = false;
  private static errorQueue: ErrorReport[] = [];
  private static maxQueueSize = 50;
  
  /**
   * 에러 핸들러 초기화
   */
  static initialize() {
    // 중복 초기화 방지
    if (this.isInitialized) {
      return;
    }
    
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      // 처리되지 않은 Promise rejection
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          new Error(event.reason?.message || 'Unhandled Promise Rejection'),
          'unhandledRejection'
        );
        // 기본 브라우저 동작 방지
        event.preventDefault();
      });

      // 전역 에러 처리
      window.addEventListener('error', (event) => {
        this.handleError(event.error || new Error(event.message), 'globalError');
        // 기본 브라우저 동작 방지
        event.preventDefault();
      });
      
      // 페이지 언로드 시 큐에 있는 에러 전송
      window.addEventListener('beforeunload', () => {
        this.flushErrorQueue();
      });
    }
    
    this.isInitialized = true;
    logger.info('Global error handler initialized');
  }

  /**
   * 에러 처리 메인 메서드
   */
  static handleError(
    error: Error | AppError,
    source: string,
    userId?: string,
    context?: Record<string, unknown>
  ) {
    // 에러 정보 수집
    const errorReport: ErrorReport = {
      error,
      source,
      context,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
    };

    // 에러 큐에 추가
    this.addToQueue(errorReport);

    // 로깅
    logError(error, source);

    // Sentry로 전송
    this.sendToSentry(error, source, userId, context);

    // PostHog 이벤트 (브라우저에서만)
    this.sendToPostHog(error, source);
    
    // 심각도가 높은 에러는 즉시 플러시
    const severity = getErrorSeverity(error);
    if (severity === 'critical' || severity === 'high') {
      this.flushErrorQueue();
    }
  }

  /**
   * Sentry로 에러 전송
   */
  private static sendToSentry(
    error: Error | AppError,
    source: string,
    userId?: string,
    context?: Record<string, unknown>
  ) {
    try {
      const severity = getErrorSeverity(error);
      
      Sentry.captureException(error, {
        level: this.mapSeverityToSentryLevel(severity),
        tags: {
          source,
          category: 'category' in error ? error.category : 'unknown'
        },
        user: userId ? { id: userId } : undefined,
        extra: {
          ...context,
          timestamp: new Date().toISOString(),
          userMessage: 'userMessage' in error ? error.userMessage : undefined,
          metadata: 'metadata' in error ? error.metadata : undefined
        }
      });
    } catch (sentryError) {
      // Sentry 전송 실패 시 로그만 남기고 계속 진행
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  /**
   * PostHog로 이벤트 전송
   */
  private static sendToPostHog(error: Error | AppError, source: string) {
    if (typeof window === 'undefined' || !posthog) {
      return;
    }
    
    try {
      const severity = getErrorSeverity(error);
      
      posthog.capture('error_occurred', {
        error_message: error.message,
        error_source: source,
        error_severity: severity,
        error_category: 'category' in error ? error.category : 'unknown',
        error_stack: error.stack?.substring(0, 500), // 스택 트레이스 일부만
        page_url: window.location.href,
        timestamp: new Date().toISOString()
      });
    } catch (posthogError) {
      // PostHog 전송 실패 시 로그만 남기고 계속 진행
      console.error('Failed to send event to PostHog:', posthogError);
    }
  }

  /**
   * 에러 큐에 추가
   */
  private static addToQueue(report: ErrorReport) {
    this.errorQueue.push(report);
    
    // 큐 크기 제한
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // 가장 오래된 에러 제거
    }
  }

  /**
   * 에러 큐 플러시
   */
  private static flushErrorQueue() {
    if (this.errorQueue.length === 0) {
      return;
    }
    
    // 배치로 에러 전송 (Sentry는 자동으로 배치 처리)
    logger.info(`Flushing ${this.errorQueue.length} errors from queue`);
    
    // 큐 비우기
    this.errorQueue = [];
  }

  /**
   * 심각도를 Sentry 레벨로 매핑
   */
  private static mapSeverityToSentryLevel(severity: string): Sentry.SeverityLevel {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  /**
   * AppError 생성 헬퍼
   */
  static createAppError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    userMessage?: string,
    metadata?: Record<string, unknown>
  ): AppError {
    const error = new Error(message) as AppError;
    error.category = category;
    error.severity = severity;
    error.userMessage = userMessage || getUserMessage(undefined);
    error.metadata = metadata;
    error.timestamp = new Date();
    return error;
  }

  /**
   * 비동기 에러 처리 래퍼
   */
  static async wrapAsync<T>(
    fn: () => Promise<T>,
    errorContext?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
        errorContext || 'asyncOperation'
      );
      return null;
    }
  }

  /**
   * 동기 에러 처리 래퍼
   */
  static wrap<T>(
    fn: () => T,
    errorContext?: string
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error)),
        errorContext || 'syncOperation'
      );
      return null;
    }
  }

  /**
   * 재시도 로직을 포함한 에러 처리
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000,
    backoff: 'linear' | 'exponential' = 'exponential'
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          this.handleError(lastError, 'retryOperation', undefined, {
            attempts: maxAttempts,
            finalAttempt: true
          });
          throw lastError;
        }
        
        // 재시도 대기
        const waitTime = backoff === 'exponential' 
          ? delay * Math.pow(2, attempt - 1)
          : delay * attempt;
          
        logger.warn(`Retry attempt ${attempt}/${maxAttempts} after ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError || new Error('Max retry attempts reached');
  }

  /**
   * 에러 통계 가져오기 (디버깅용)
   */
  static getErrorStats() {
    return {
      queueSize: this.errorQueue.length,
      isInitialized: this.isInitialized,
      recentErrors: this.errorQueue.slice(-5).map(report => ({
        message: report.error.message,
        source: report.source,
        timestamp: report.timestamp
      }))
    };
  }
}

// 기본 export
export default GlobalErrorHandler;