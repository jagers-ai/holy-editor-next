'use client';

import { useEffect } from 'react';
import { GlobalErrorHandler } from '@/lib/errors/global-handler';

/**
 * 에러 핸들링 시스템 초기화 컴포넌트
 * 클라이언트 사이드에서 글로벌 에러 핸들러를 초기화
 */
export function ErrorInitializer() {
  useEffect(() => {
    // 글로벌 에러 핸들러 초기화
    GlobalErrorHandler.initialize();
    
    // 초기화 로그 (브라우저 콘솔에만)
    if (typeof window !== 'undefined') {
      console.log('[INFO]: Error handling system initialized');
    }
    
    // 클린업 함수 (현재는 필요 없지만 향후 확장 가능)
    return () => {
      // 필요시 클린업 로직 추가
    };
  }, []);

  // UI를 렌더링하지 않는 초기화 전용 컴포넌트
  return null;
}

export default ErrorInitializer;