import * as Sentry from '@sentry/nextjs';

export const onRequestError = Sentry.captureRequestError();

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      ignoreErrors: ['NetworkError', 'Failed to fetch', 'AbortError'],
      beforeSend(event) {
        if (event.request?.headers) {
          const headers = event.request.headers as Record<string, string>;
          delete headers['authorization'];
          delete headers['cookie'];
          delete headers['x-supabase-auth'];
        }
        if (event.request?.url) {
          const url = new URL(event.request.url);
          url.searchParams.delete('token');
          url.searchParams.delete('apikey');
          event.request.url = url.toString();
        }
        if (event.extra && typeof event.extra === 'object' && 'env' in event.extra) {
          const env = (event.extra as Record<string, unknown>)['env'] as Record<string, unknown> | undefined;
          if (env && typeof env === 'object') {
            delete (env as Record<string, unknown>)['DATABASE_URL'];
            delete (env as Record<string, unknown>)['DIRECT_URL'];
            delete (env as Record<string, unknown>)['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
            delete (env as Record<string, unknown>)['SUPABASE_SERVICE_ROLE_KEY'];
          }
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      ignoreErrors: ['NetworkError', 'Failed to fetch', 'AbortError'],
      beforeSend(event) {
        if (event.request?.headers) {
          const headers = event.request.headers as Record<string, string>;
          delete headers['authorization'];
          delete headers['cookie'];
        }
        if (event.request?.url) {
          const url = new URL(event.request.url);
          url.searchParams.delete('token');
          url.searchParams.delete('apikey');
          event.request.url = url.toString();
        }
        return event;
      },
    });
  }
}

// onRequestError 훅은 추후 필요 시 도입 (현재는 경고 무시 가능)
