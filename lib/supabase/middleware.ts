import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  // 보호된 라우트 정의
  const protectedPaths = ['/documents', '/editor', '/folders'];
  const authPaths = ['/login', '/signup'];
  const currentPath = request.nextUrl.pathname;

  // 보호된 라우트 체크
  const isProtectedPath = protectedPaths.some(path => 
    currentPath.startsWith(path)
  );
  
  // 인증 페이지 체크
  const isAuthPath = authPaths.some(path => 
    currentPath === path
  );

  // 로그인하지 않은 사용자가 보호된 라우트에 접근하려고 할 때
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', currentPath);
    return NextResponse.redirect(redirectUrl);
  }

  // 로그인한 사용자가 로그인/회원가입 페이지에 접근하려고 할 때
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL('/folders', request.url));
  }

  return supabaseResponse;
}
