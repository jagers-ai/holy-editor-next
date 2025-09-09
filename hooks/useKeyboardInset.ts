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
      if (!vv) return 0;

      // iOS Safari에서 address bar 숨김/표시로 window.innerHeight가 요동함.
      // layout viewport(documentElement.clientHeight) 기준 계산으로 하강 스크롤 시 지연을 방지.
      const layoutH = document.documentElement.clientHeight;
      const topOffset = vv.offsetTop || 0; // Android는 0, iOS는 상단 오프셋 존재
      const inset = layoutH - (vv.height + (isIOS() ? topOffset : 0));
      return inset > 0 ? Math.round(inset) : 0;
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
    // 일반 스크롤에서도 재계산하여 하강 시 추적 지연 감소
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true } as any);

    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      document.removeEventListener('focusin', schedule, true);
      document.removeEventListener('focusout', schedule, true);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', schedule);
        window.visualViewport.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule as any);
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [enabled]);
}
