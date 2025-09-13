import { RouterPort } from '@/ports/router';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function asRouterPort(router: AppRouterInstance): RouterPort {
  return {
    push: (p) => router.push(p),
    replace: (p) => router.replace(p),
    prefetch: (p) => {
      try { router.prefetch(p); } catch {}
    },
  };
}

