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
  const baseInnerHRef = useRef<number>(0);
  const baseVVBottomRef = useRef<number>(0);
  const isOpenRef = useRef<boolean>(false);
  const focusKickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const vk = getVK();
    try { if (vk && 'overlaysContent' in vk) (vk as any).overlaysContent = true; } catch {}

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

      // 기준 대비 감소량 기반 계산(overlay/resize 모두 커버)
      const topOffset = vv.offsetTop || 0;
      const vvBottom = vv.height + topOffset;

      if (baseInnerHRef.current === 0) baseInnerHRef.current = window.innerHeight;
      if (baseVVBottomRef.current === 0) baseVVBottomRef.current = vvBottom;

      // 키보드가 닫힌 상태로 보이면 기준 높이를 최신화하여 주소창 애니메이션을 흡수
      const deltaInnerNow = Math.max(0, baseInnerHRef.current - window.innerHeight);
      const deltaVVNow = Math.max(0, baseVVBottomRef.current - vvBottom);
      const OPEN_THRESHOLD = 24; // px
      const openHeuristic = Math.max(deltaInnerNow, deltaVVNow);
      if (!isOpenRef.current && openHeuristic < OPEN_THRESHOLD) {
        baseInnerHRef.current = Math.max(baseInnerHRef.current, window.innerHeight);
        baseVVBottomRef.current = Math.max(baseVVBottomRef.current, vvBottom);
      }

      // visualViewport / innerHeight 기준의 최대 감소량을 사용해 과소추정을 방지
      const vvInset = Math.max(
        0,
        Math.round(
          Math.max(baseVVBottomRef.current - vvBottom, baseInnerHRef.current - window.innerHeight)
        )
      );

      // 가상 키보드 API 기반 추정: 실제 키보드 높이만 반영(오버레이 제외)
      const vkHeight = vk?.boundingRect ? Math.max(0, Math.round(vk.boundingRect.height)) : 0;
      const VK_OVERHEAD_CLAMP = 12; // iOS에서 약간 과소 보고될 때를 위한 상한 여유
      const vkInset = vkHeight > 0 ? Math.max(0, vkHeight - VK_OVERHEAD_CLAMP) : 0;

      // VK 값이 있으면 상한으로 사용(과대 보정 방지), 없으면 vvInset 사용
      const SAFE_MAX = 720; // px
      const candidate = vkInset > 0 ? Math.min(vvInset, vkInset) : vvInset;
      const picked = Math.max(0, Math.min(candidate, SAFE_MAX));
      isOpenRef.current = picked >= OPEN_THRESHOLD;
      return picked;
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

    // 기준치 초기화
    baseInnerHRef.current = window.innerHeight;
    baseVVBottomRef.current = (window.visualViewport?.height || 0) + (window.visualViewport?.offsetTop || 0);

    // 초기 적용 + 포커스 시 보정
    updateImmediate();
    const onFocusIn = () => {
      schedule();
      if (focusKickTimerRef.current) window.clearTimeout(focusKickTimerRef.current);
      // 키보드 애니메이션 초반/중반 타이밍에 재평가하여 즉시 부착
      focusKickTimerRef.current = window.setTimeout(() => {
        updateImmediate();
        window.setTimeout(updateImmediate, 160);
      }, 60) as unknown as number;
    };
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', schedule, true);

    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', schedule);
      window.visualViewport.addEventListener('scroll', schedule);
    }
    if (vk && typeof (vk as any).addEventListener === 'function') {
      try { (vk as any).addEventListener('geometrychange', schedule); } catch {}
    }
    // 일반 스크롤에서도 재계산하여 하강 시 추적 지연 감소
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true } as any);
    window.addEventListener('orientationchange', schedule as any);

    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
      if (focusKickTimerRef.current) window.clearTimeout(focusKickTimerRef.current);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', schedule, true);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', schedule);
        window.visualViewport.removeEventListener('scroll', schedule);
      }
      if (vk && typeof (vk as any).removeEventListener === 'function') {
        try { (vk as any).removeEventListener('geometrychange', schedule); } catch {}
      }
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule as any);
      window.removeEventListener('orientationchange', schedule as any);
      lastInsetRef.current = 0;
      document.documentElement.style.setProperty('--keyboard-inset', '0px');
    };
  }, [enabled]);
}
