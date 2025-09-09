'use client';

import React, { useEffect, useState } from 'react';
import { useKeyboardInset } from '@/hooks/useKeyboardInset';

interface KeyboardStickyViewProps {
  children: React.ReactNode;
  offset?: { 
    closed: number;  // 키보드가 닫혔을 때 오프셋
    opened: number;  // 키보드가 열렸을 때 오프셋
  };
  enabled?: boolean;
  className?: string;
}

/**
 * 키보드에 "sticky"하게 붙어서 움직이는 뷰 컴포넌트
 * React Native Keyboard Controller의 KeyboardStickyView 패턴을 웹에 적용
 */
export const KeyboardStickyView: React.FC<KeyboardStickyViewProps> = ({
  children,
  offset = { closed: 0, opened: 0 },
  enabled = true,
  className = ''
}) => {
  const { height: keyboardHeight, isStable } = useKeyboardInset(enabled);
  const [transform, setTransform] = useState(0);
  
  useEffect(() => {
    if (!enabled) {
      setTransform(0);
      return;
    }
    
    // 키보드 높이에 따른 transform 계산
    const targetTransform = keyboardHeight > 0 
      ? -(keyboardHeight + offset.opened)
      : offset.closed;
    
    setTransform(targetTransform);
  }, [keyboardHeight, offset, enabled]);
  
  return (
    <div
      className={`keyboard-sticky-view ${className}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        transform: `translateY(${transform}px)`,
        transition: isStable ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        willChange: 'transform',
        zIndex: 1000,
        // 하드웨어 가속
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
};