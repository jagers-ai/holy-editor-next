'use client';

import { trpc } from '@/lib/trpc/client';
import { httpBatchLink } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { PostHogProvider } from '@/lib/posthog';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000, // 5초
      },
    },
  }));
  
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  );

  // PostHog API 키가 있을 때만 Provider 사용
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  const content = (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );

  // PostHog 키가 있으면 PostHogProvider로 감싸기
  if (posthogKey) {
    return (
      <PostHogProvider apiKey={posthogKey}>
        {content}
      </PostHogProvider>
    );
  }

  // 없으면 그냥 기본 Provider만
  return content;
}