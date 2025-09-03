'use client';

import { useEffect, useRef } from 'react';
import { isIOS } from '@/utils/isIOS';

/**
 * 키보드 높이를 CSS 변수(--keyboard-inset)에 반영하는 훅
 * - VisualViewport 기반, rAF 스로틀, focusin/out 보정
 * - iOS에서는 offsetTop을 고려하여 더 정확한 높이 계산
 */
export function useKeyboardInset(enabled: boolean = true) {
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const setInset = (px: number) => {
      document.documentElement.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(px))}px`);
    };

    const computeInset = () => {
      if (typeof window === 'undefined') return 0;
      const vv = (window as any).visualViewport as VisualViewport | undefined;
      if (vv) {
        const inset = window.innerHeight - (vv.height + (isIOS() ? vv.offsetTop : 0));
        return inset > 0 ? inset : 0;
      }
      return 0;
    };

    const schedule = () => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        setInset(computeInset());
      });
    };

    const updateImmediate = () => setInset(computeInset());

    // 초기 적용 + 포커스 시 보정
    updateImmediate();
    document.addEventListener('focusin', schedule, true);
    document.addEventListener('focusout', schedule, true);

    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', schedule);
      window.visualViewport.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', schedule);

    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      document.removeEventListener('focusin', schedule, true);
      document.removeEventListener('focusout', schedule, true);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', schedule);
        window.visualViewport.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [enabled]);
}

