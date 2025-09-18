import { RouterPort } from '@/ports/router';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export function asRouterPort(router: AppRouterInstance): RouterPort {
  return {
    push: (p) => router.push(p),
    replace: (p) => router.replace(p),
    prefetch: async (p) => {
      try {
        await router.prefetch(p);
      } catch (error) {
        console.warn('router.prefetch failed', error);
      }
    },
  };
}
