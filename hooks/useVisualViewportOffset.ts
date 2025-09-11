'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * visualViewport의 offsetTop/Left을 추적해 CSS 변수로 노출
 * - CSS 변수: --vv-top, --vv-left
 * - 미지원 환경 폴백: 0
 */
export function useVisualViewportOffset(enabled: boolean = true) {
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const rafId = useRef<number | null>(null);

  const update = useCallback(() => {
    if (!enabled || typeof window === 'undefined') {
      setTop(0);
      setLeft(0);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--vv-top', '0px');
        document.documentElement.style.setProperty('--vv-left', '0px');
      }
      return;
    }
    const vv = window.visualViewport;
    const nextTop = vv ? Math.max(0, Math.round(vv.offsetTop)) : 0;
    const nextLeft = vv ? Math.max(0, Math.round(vv.offsetLeft)) : 0;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setTop(nextTop);
      setLeft(nextLeft);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--vv-top', `${nextTop}px`);
        document.documentElement.style.setProperty('--vv-left', `${nextLeft}px`);
      }
    });
  }, [enabled]);

  useEffect(() => {
    update();
    if (!enabled || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => update();
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    window.addEventListener('orientationchange', handler);
    window.addEventListener('resize', handler);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('resize', handler);
    };
  }, [enabled, update]);

  return { top, left } as const;
}

export default useVisualViewportOffset;

