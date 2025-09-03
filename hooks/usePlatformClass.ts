'use client';

import { useEffect } from 'react';
import { applyPlatformClasses } from '@/utils/isIOS';

/**
 * HTML 루트에 is-ios / is-mobile-safari / is-standalone 클래스를 부여
 */
export function usePlatformClass() {
  useEffect(() => {
    applyPlatformClasses();
  }, []);
}

