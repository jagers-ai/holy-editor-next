'use client';

import { useEffect } from 'react';

/**
 * 모바일 키보드 높이를 감지하여 CSS 변수로 설정하는 훅
 * Android에서 키보드가 나타날 때 툴바 위치를 동적으로 조정
 */
export function useKeyboardInset(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const updateKeyboardInset = () => {
      if (typeof window === 'undefined') return;
      
      // Visual Viewport API를 사용하여 키보드 높이 계산
      if ('visualViewport' in window && window.visualViewport) {
        const viewport = window.visualViewport;
        const keyboardHeight = window.innerHeight - viewport.height;
        
        // CSS 변수로 키보드 높이 설정
        document.documentElement.style.setProperty(
          '--keyboard-inset',
          `${Math.max(0, keyboardHeight)}px`
        );
      }
    };

    // 초기 설정
    updateKeyboardInset();

    // Visual Viewport 변경 감지
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateKeyboardInset);
      window.visualViewport.addEventListener('scroll', updateKeyboardInset);
    }

    // window resize 이벤트도 감지 (fallback)
    window.addEventListener('resize', updateKeyboardInset);

    return () => {
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateKeyboardInset);
        window.visualViewport.removeEventListener('scroll', updateKeyboardInset);
      }
      window.removeEventListener('resize', updateKeyboardInset);
      
      // cleanup: CSS 변수 초기화
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [enabled]);
}