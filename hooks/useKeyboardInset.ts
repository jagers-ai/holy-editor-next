'use client';

import { useEffect, useRef } from 'react';
import { isIOS } from '@/utils/isIOS';
import { isAndroid, isAndroidChrome, getAndroidViewportHeight } from '@/utils/isAndroid';

/**
 * 키보드 높이를 CSS 변수(--keyboard-inset)에 반영하는 훅
 * - iOS: VisualViewport 기반, offsetTop 고려
 * - Android: window.innerHeight 변화 감지
 * - rAF 스로틀링으로 성능 최적화
 */
export function useKeyboardInset(enabled: boolean = true) {
  const rafId = useRef<number | null>(null);
  const initialHeight = useRef<number>(0);
  const lastHeight = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Android에서 초기 viewport 높이 저장
    if (isAndroid() && typeof window !== 'undefined') {
      initialHeight.current = window.innerHeight;
      lastHeight.current = window.innerHeight;
    }

    const setInset = (px: number) => {
      document.documentElement.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(px))}px`);
    };

    const computeInset = () => {
      if (typeof window === 'undefined') return 0;

      // Android 전용 처리
      if (isAndroid()) {
        const currentHeight = window.innerHeight;
        
        // Android Chrome에서 visualViewport 시도
        if (isAndroidChrome() && window.visualViewport) {
          const vvHeight = window.visualViewport.height;
          // visualViewport가 신뢰할 수 있는 값인지 확인
          if (vvHeight > 100 && vvHeight < window.innerHeight) {
            return window.innerHeight - vvHeight;
          }
        }
        
        // fallback: 초기 높이와 현재 높이 차이 계산
        if (initialHeight.current > 0) {
          const diff = initialHeight.current - currentHeight;
          // 100px 이상 차이나면 키보드가 열린 것으로 판단
          if (diff > 100) {
            lastHeight.current = currentHeight;
            return diff;
          }
        }
        
        // 키보드가 닫힌 경우
        if (currentHeight > lastHeight.current + 100) {
          lastHeight.current = currentHeight;
          return 0;
        }
        
        return 0;
      }

      // iOS 처리 (기존 로직)
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

    // Android에서 resize 이벤트가 더 중요
    const handleResize = () => {
      if (isAndroid()) {
        // Android에서는 즉시 업데이트
        updateImmediate();
      } else {
        schedule();
      }
    };

    // 초기 적용 + 포커스 시 보정
    updateImmediate();
    document.addEventListener('focusin', schedule, true);
    document.addEventListener('focusout', schedule, true);

    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', handleResize);
    // 일반 스크롤에서도 재계산하여 하강 시 추적 지연 감소
    window.addEventListener('scroll', schedule, { passive: true } as any);
    
    // Android에서 추가 이벤트 리스너
    if (isAndroid()) {
      // orientation change 감지
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          initialHeight.current = window.innerHeight;
          updateImmediate();
        }, 500);
      });
    }

    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      document.removeEventListener('focusin', schedule, true);
      document.removeEventListener('focusout', schedule, true);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', schedule);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', schedule as any);
      if (isAndroid()) {
        window.removeEventListener('orientationchange', updateImmediate);
      }
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [enabled]);
}
