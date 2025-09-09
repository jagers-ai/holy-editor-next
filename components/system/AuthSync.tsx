
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Keeps Supabase session cookies in sync with the server via /auth/callback.
 * Required so that server routes (e.g., /api/trpc) can authenticate requests.
 */
export function AuthSync() {
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Notify server of auth state changes to set/unset SSR cookies
      fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, session }),
        credentials: 'include',
      }).catch(() => {});
    });
    return () => { subscription.unsubscribe(); };
  }, []);
  return null;
}
