'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { isIOS } from '@/utils/isIOS';
import { isAndroid } from '@/utils/isAndroid';

/**
 * 키보드 높이와 안정성 상태를 반환하는 개선된 훅
 * - Visual Viewport API를 최대한 활용
 * - RAF와 디바운싱으로 성능 최적화
 * - 안정성 상태 추적으로 부드러운 전환
 */
export function useKeyboardInset(enabled: boolean = true) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isStable, setIsStable] = useState(true);
  
  const rafId = useRef<number | null>(null);
  const lastHeight = useRef<number>(0);
  const stabilityTimer = useRef<number | null>(null);

  const computeHeight = useCallback(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return 0;
    
    const viewport = window.visualViewport;
    
    // Android와 iOS 모두 Visual Viewport API 사용
    const keyboardHeight = window.innerHeight - viewport.height;
    
    // 키보드가 열렸는지 확인 (50px 이상 차이날 때)
    return keyboardHeight > 50 ? keyboardHeight : 0;
  }, []);

  const updateHeight = useCallback(() => {
    const newHeight = computeHeight();
    
    // 높이 변화 감지
    if (Math.abs(newHeight - lastHeight.current) > 10) {
      setIsStable(false);
      lastHeight.current = newHeight;
      
      // RAF로 부드러운 업데이트
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setKeyboardHeight(newHeight);
        
        // 100ms 후 안정화
        if (stabilityTimer.current) clearTimeout(stabilityTimer.current);
        stabilityTimer.current = window.setTimeout(() => {
          setIsStable(true);
        }, 100);
      });
    }
  }, [computeHeight]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setKeyboardHeight(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    // 초기값 설정
    updateHeight();

    // 이벤트 리스너
    const handleViewportChange = () => updateHeight();
    
    viewport.addEventListener('resize', handleViewportChange);
    viewport.addEventListener('scroll', handleViewportChange);
    
    // Android에서 추가 이벤트
    if (isAndroid()) {
      window.addEventListener('resize', handleViewportChange);
      document.addEventListener('focusin', handleViewportChange);
      document.addEventListener('focusout', handleViewportChange);
    }

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (stabilityTimer.current) clearTimeout(stabilityTimer.current);
      
      viewport.removeEventListener('resize', handleViewportChange);
      viewport.removeEventListener('scroll', handleViewportChange);
      
      if (isAndroid()) {
        window.removeEventListener('resize', handleViewportChange);
        document.removeEventListener('focusin', handleViewportChange);
        document.removeEventListener('focusout', handleViewportChange);
      }
    };
  }, [enabled, updateHeight]);

  // CSS 변수 업데이트 (호환성 유지)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--keyboard-inset', `${keyboardHeight}px`);
    }
  }, [keyboardHeight]);

  return { height: keyboardHeight, isStable };
}
