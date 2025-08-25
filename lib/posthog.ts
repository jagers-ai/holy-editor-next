'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// PostHog 초기화
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      // 개발 환경에서는 비활성화
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
    // 기본 설정
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export { posthog, PostHogProvider };