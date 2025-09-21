'use client';

import { createClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import type { AuthPort, AuthSession } from '@/ports/auth';

async function syncSupabaseSession(session: Session | null) {
  try {
    await fetch('/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: session ? 'SIGNED_IN' : 'SIGNED_OUT', session }),
      credentials: 'include',
    });
  } catch (error) {
    console.warn('세션 동기화 실패:', error);
  }
}

function mapSession(session: Session | null): AuthSession {
  if (!session) {
    return { userId: null, accessToken: null, refreshToken: null };
  }
  return {
    userId: session.user?.id ?? null,
    accessToken: session.access_token ?? null,
    refreshToken: session.refresh_token ?? null,
  };
}

export const webAuthPort: AuthPort = {
  async getSession(): Promise<AuthSession> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return mapSession(data.session ?? null);
  },

  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    const session = data.session ?? (await supabase.auth.getSession()).data.session ?? null;
    const mapped = mapSession(session);
    if (session) {
      await syncSupabaseSession(session);
    }
    return mapped;
  },

  async signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    await syncSupabaseSession(null);
  },
};
