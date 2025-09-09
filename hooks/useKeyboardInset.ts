'use client';

import { useEffect, useRef } from 'react';
import { isIOS } from '@/utils/isIOS';

type VK = {
  overlaysContent?: boolean;
  boundingRect?: DOMRect;
};

function getVK(): VK | undefined {
  return (typeof navigator !== 'undefined' ? (navigator as any).virtualKeyboard : undefined) as VK | undefined;
}

/**
 * 키보드 높이를 CSS 변수(--keyboard-inset)에 반영하는 훅
 * - VisualViewport 기반, rAF 스로틀, focusin/out 보정
 * - iOS에서는 offsetTop을 고려하여 더 정확한 높이 계산
 */
export function useKeyboardInset(enabled: boolean = true) {
  const rafId = useRef<number | null>(null);
  const lastInsetRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const setInset = (px: number) => {
      const value = Math.max(0, Math.round(px));
      lastInsetRef.current = value;
      document.documentElement.style.setProperty('--keyboard-inset', `${value}px`);
    };

    const computeInset = () => {
      if (typeof window === 'undefined') return 0;
      const vv = window.visualViewport;
      if (!vv) return 0;
      const vk = getVK();

      // 두 가지 추정치 산출
      const topOffset = vv.offsetTop || 0;
      const layoutH = document.documentElement.clientHeight;

      // 시각 뷰포트 기반 추정: 오버레이(도메인 라벨 등)를 포함할 가능성 있음
      const vvInset = Math.max(0, layoutH - (vv.height + (isIOS() ? topOffset : 0)));

      // 가상 키보드 API 기반 추정: 실제 키보드 높이만 반영(오버레이 제외)
      const vkHeight = vk?.boundingRect ? Math.max(0, Math.round(vk.boundingRect.height)) : 0;
      const VK_OVERHEAD_CLAMP = 12; // iOS에서 약간 과소 보고될 때를 위한 상한 여유
      const vkInset = vkHeight > 0 ? Math.max(0, vkHeight - VK_OVERHEAD_CLAMP) : 0;

      // 둘 다 있다면 더 작은 값을 채택하여 과대 보정(갭 발생) 방지
      // 하나만 있으면 그 값을 사용
      const picked = vkInset > 0 ? Math.min(vvInset, vkInset) : vvInset;
      return Math.max(0, Math.round(picked));
    };

    const schedule = () => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const next = computeInset();
        const prev = lastInsetRef.current;
        // 미세 히스테리시스: ±2~3px 변화는 무시 (단, 0으로 복귀는 항상 허용)
        const tolerance = isIOS() ? 3 : 2;
        if (Math.abs(next - prev) < tolerance && !(next === 0 && prev !== 0)) return;
        setInset(next);
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
      lastInsetRef.current = 0;
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [enabled]);
}
