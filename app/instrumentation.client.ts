import * as Sentry from '@sentry/nextjs';

export async function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    ignoreErrors: [
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'NetworkError',
      'Failed to fetch',
      'AbortError',
    ],
    allowUrls: [
      /https?:\/\/(www\.)?holy-editor.*\.vercel\.app/,
      /https?:\/\/localhost:\d+/,
    ],
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
        url.searchParams.delete('secret');
        event.request.url = url.toString();
      }
      if (event.user?.email) {
        const [local, domain] = event.user.email.split('@');
        event.user.email = `${local.substring(0, 2)}***@${domain}`;
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') return null;
      if ((breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') && breadcrumb.data?.url) {
        const url = new URL(breadcrumb.data.url);
        url.searchParams.delete('token');
        url.searchParams.delete('apikey');
        breadcrumb.data.url = url.toString();
      }
      return breadcrumb;
    },
  });
}
