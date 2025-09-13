import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { supabase } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL as string; // e.g., https://holy-editor-next.vercel.app

// Note: Avoid importing server types in RN bundle; keep client untyped for build stability.
export const trpc = createTRPCProxyClient<any>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${API_BASE}/api/trpc`,
      async headers() {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
