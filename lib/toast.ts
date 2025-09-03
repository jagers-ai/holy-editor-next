/**
 * Toast 알림 시스템
 * react-hot-toast를 래핑하여 일관된 알림 인터페이스 제공
 */

import toast from 'react-hot-toast';
import type { AppError } from '@/lib/errors/types';
import { getUserMessage } from '@/lib/errors/types';
import { logger } from '@/lib/logger';

/**
 * Toast 옵션 인터페이스
 */
interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  className?: string;
  icon?: string;
}

/**
 * Toast 스타일 프리셋
 */
const toastStyles = {
  error: {
    background: '#ef4444',
    color: 'white',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  success: {
    background: '#22c55e',
    color: 'white',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  warning: {
    background: '#f59e0b',
    color: 'white',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  info: {
    background: '#3b82f6',
    color: 'white',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
};

/**
 * Toast 매니저 클래스
 */
export class ToastManager {
  /**
   * 에러 토스트 표시
   */
  static showError(
    error: AppError | Error | string,
    options?: ToastOptions
  ): string {
    let message: string;
    
    if (typeof error === 'string') {
      message = error;
    } else if ('userMessage' in error && error.userMessage) {
      message = error.userMessage;
    } else if ('errorCode' in error && error.errorCode) {
      message = getUserMessage(error.errorCode);
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = '알 수 없는 오류가 발생했습니다.';
    }
    
    // 로그 남기기
    logger.error(`Toast Error: ${message}`);
    
    return toast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      style: toastStyles.error,
      className: options?.className,
      icon: options?.icon || '❌',
      ariaProps: {
        role: 'alert',
        'aria-live': 'assertive'
      }
    });
  }

  /**
   * 성공 토스트 표시
   */
  static showSuccess(
    message: string,
    options?: ToastOptions
  ): string {
    logger.info(`Toast Success: ${message}`);
    
    return toast.success(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
      style: toastStyles.success,
      className: options?.className,
      icon: options?.icon || '✅',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    });
  }

  /**
   * 경고 토스트 표시
   */
  static showWarning(
    message: string,
    options?: ToastOptions
  ): string {
    logger.warn(`Toast Warning: ${message}`);
    
    return toast(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      style: toastStyles.warning,
      className: options?.className,
      icon: options?.icon || '⚠️',
      ariaProps: {
        role: 'alert',
        'aria-live': 'polite'
      }
    });
  }

  /**
   * 정보 토스트 표시
   */
  static showInfo(
    message: string,
    options?: ToastOptions
  ): string {
    logger.info(`Toast Info: ${message}`);
    
    return toast(message, {
      duration: options?.duration || 3000,
      position: options?.position || 'top-right',
      style: toastStyles.info,
      className: options?.className,
      icon: options?.icon || 'ℹ️',
      ariaProps: {
        role: 'status',
        'aria-live': 'polite'
      }
    });
  }

  /**
   * 로딩 토스트 표시 (Promise 기반)
   */
  static showLoading<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ): Promise<T> {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error
      },
      {
        position: options?.position || 'top-right',
        className: options?.className,
        loading: {
          icon: '⏳'
        },
        success: {
          duration: options?.duration || 3000,
          icon: '✅',
          style: toastStyles.success
        },
        error: {
          duration: options?.duration || 5000,
          icon: '❌',
          style: toastStyles.error
        }
      }
    );
  }

  /**
   * 커스텀 토스트 표시
   */
  static showCustom(
    content: React.ReactNode,
    options?: ToastOptions & { style?: React.CSSProperties }
  ): string {
    return toast.custom(content as any, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      className: options?.className,
      style: options?.style
    });
  }

  /**
   * 특정 토스트 제거
   */
  static dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  /**
   * 모든 토스트 제거
   */
  static dismissAll() {
    toast.remove();
  }

  /**
   * 네트워크 에러 전용 토스트
   */
  static showNetworkError() {
    return this.showError('네트워크 연결을 확인해주세요.', {
      duration: 6000,
      icon: '🌐'
    });
  }

  /**
   * 인증 에러 전용 토스트
   */
  static showAuthError(message?: string) {
    return this.showError(message || '로그인이 필요합니다.', {
      duration: 5000,
      icon: '🔒'
    });
  }

  /**
   * 저장 성공 전용 토스트
   */
  static showSaveSuccess(itemName?: string) {
    return this.showSuccess(
      itemName ? `${itemName}이(가) 저장되었습니다.` : '저장되었습니다.',
      { icon: '💾' }
    );
  }

  /**
   * 삭제 성공 전용 토스트
   */
  static showDeleteSuccess(itemName?: string) {
    return this.showSuccess(
      itemName ? `${itemName}이(가) 삭제되었습니다.` : '삭제되었습니다.',
      { icon: '🗑️' }
    );
  }

  /**
   * 복사 성공 전용 토스트
   */
  static showCopySuccess() {
    return this.showSuccess('클립보드에 복사되었습니다.', {
      duration: 2000,
      icon: '📋'
    });
  }
}

// 간편 사용을 위한 export
export const showError = ToastManager.showError;
export const showSuccess = ToastManager.showSuccess;
export const showWarning = ToastManager.showWarning;
export const showInfo = ToastManager.showInfo;
export const showLoading = ToastManager.showLoading;
export const dismissToast = ToastManager.dismiss;

export default ToastManager;