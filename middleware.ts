import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // tRPC 인증 디버그: Authorization 헤더 / 쿠키 유무 로깅(민감값 마스킹)
  if (request.nextUrl.pathname.startsWith('/api/trpc')) {
    const auth = request.headers.get('authorization') || '';
    const hasAuthHeader = auth.length > 0;
    const bearerPrefixOk = hasAuthHeader && auth.toLowerCase().startsWith('bearer ');
    const tokenLen = hasAuthHeader ? auth.length : 0;
    const cookieNames = request.cookies.getAll().map(c => c.name);
    // 로그 레벨 info 이상에서만 출력되도록, Vercel에 LOG_LEVEL=info 설정
    console.info('tRPC auth debug (middleware)', {
      hasAuthHeader,
      bearerPrefixOk,
      tokenLen,
      cookieNames,
      path: request.nextUrl.pathname,
      method: request.method,
    });
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
