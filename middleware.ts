import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { config as appConfig } from './lib/config';

// 需要登入才能訪問的路由
const protectedRoutes = ['/profile', '/orders', '/settings'];

// 已登入用戶不應訪問的路由（應重定向到首頁）
const authRoutes = ['/login', '/register'];

/**
 * Middleware 函數
 * 檢查需要保護的路由並驗證 Session
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 檢查是否為保護路由
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // 取得 Session Cookie
  const sessionCookie = request.cookies.get('session')?.value;

  // 如果訪問保護路由但沒有 Session，重定向到登入頁
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果已登入用戶訪問登入/註冊頁，重定向到首頁
  if (isAuthRoute && sessionCookie) {
    try {
      const secret = new TextEncoder().encode(appConfig.jwt.secret);
      await jwtVerify(sessionCookie, secret);
      // Session 有效，重定向到首頁
      return NextResponse.redirect(new URL('/', request.url));
    } catch {
      // Session 無效，清除 Cookie 並允許訪問
      const response = NextResponse.next();
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

/**
 * Middleware 匹配配置
 * Next.js 要求使用 config 作為導出名稱
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路徑，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

