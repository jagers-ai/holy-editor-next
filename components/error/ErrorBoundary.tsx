'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { GlobalErrorHandler } from '@/lib/errors/global-handler';
import { ErrorCategory, ErrorSeverity } from '@/lib/errors/types';
import { logger } from '@/lib/logger';

/**
 * 에러 폴백 컴포넌트 Props
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * 기본 에러 폴백 UI 컴포넌트
 */
function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4 text-center max-w-lg">
        <AlertTriangle className="h-12 w-12 text-destructive animate-pulse" />
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            문제가 발생했습니다
          </h2>
          <p className="text-muted-foreground">
            예상치 못한 오류가 발생했습니다. 불편을 드려 죄송합니다.
          </p>
          
          {/* 개발 환경에서만 에러 메시지 표시 */}
          {isDevelopment && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg text-left">
              <p className="text-sm font-mono text-destructive">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    스택 트레이스 보기
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48 p-2 bg-background rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={resetError}
            className="w-full sm:w-auto"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
          
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            홈으로 이동
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          이 문제가 계속 발생한다면 고객지원팀에 문의해주세요.
        </p>
      </div>
    </div>
  );
}

/**
 * 에디터 전용 에러 폴백 UI
 */
function EditorErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-6 bg-muted/30 rounded-lg m-4">
      <div className="flex flex-col items-center space-y-4 text-center max-w-md">
        <AlertTriangle className="h-10 w-10 text-warning" />
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">에디터 오류</h3>
          <p className="text-sm text-muted-foreground">
            에디터를 로드하는 중 문제가 발생했습니다.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={resetError}
            size="sm"
            variant="default"
          >
            에디터 재시작
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            variant="outline"
          >
            페이지 새로고침
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  isolate?: boolean;
  level?: 'app' | 'page' | 'component';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

/**
 * 향상된 Error Boundary 컴포넌트
 */
export function ErrorBoundary({
  children,
  fallback: Fallback = ErrorFallback,
  onError,
  isolate = false,
  level = 'component',
  resetKeys = [],
  resetOnPropsChange = true
}: ErrorBoundaryProps) {
  
  const handleError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    // 에러 로깅
    logger.error(`Error Boundary [${level}]:`, {
      error: error.message,
      componentStack: errorInfo.componentStack,
      level
    });
    
    // Sentry로 에러 전송
    Sentry.captureException(error, {
      contexts: {
        errorBoundary: {
          componentStack: errorInfo.componentStack,
          level,
          isolate
        }
      },
      tags: {
        errorBoundaryLevel: level
      }
    });
    
    // 글로벌 에러 핸들러로 전송
    GlobalErrorHandler.handleError(
      GlobalErrorHandler.createAppError(
        error.message,
        ErrorCategory.CLIENT,
        level === 'app' ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
        '애플리케이션 오류가 발생했습니다.',
        {
          componentStack: errorInfo.componentStack,
          level
        }
      ),
      'ErrorBoundary'
    );
    
    // 커스텀 에러 핸들러 실행
    onError?.(error, errorInfo);
    
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught error:', error);
      console.error('Error Info:', errorInfo);
    }
  }, [level, isolate, onError]);
  
  const handleReset = React.useCallback(() => {
    logger.info(`Error Boundary reset [${level}]`);
  }, [level]);
  
  return (
    <ReactErrorBoundary
      FallbackComponent={Fallback as any}
      onError={handleError}
      onReset={handleReset}
      resetKeys={resetKeys}
    >
      {children}
    </ReactErrorBoundary>
  );
}

/**
 * 에디터 전용 Error Boundary
 */
export function EditorErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={EditorErrorFallback}
      level="component"
      isolate={true}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * 페이지 레벨 Error Boundary
 */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * 앱 레벨 Error Boundary
 */
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      level="app"
      resetOnPropsChange={false}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;