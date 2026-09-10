import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/token';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';
import { checkGlobalRateLimit, getClientIp } from '@/lib/auth/rate-limiter';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Abaikan file statis, aset Next.js, dan favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Global Anti-DDoS Rate Limiting untuk Endpoint API (/api/*)
  if (pathname.startsWith('/api')) {
    // Kecualikan preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return NextResponse.next();
    }

    const rateCheck = checkGlobalRateLimit(ip);
    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil(rateCheck.resetTimeMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Terlalu banyak permintaan (Rate limit exceeded). Silakan tunggu sejenak.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // 3. Verifikasi Cookie Sesi
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 4. Rute Publik: /login, /api/auth/*, serta /panduan dan /kalkulator (dapat diakses tanpa login)
  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth');
  const isPublicPage =
    pathname === '/login' ||
    pathname.startsWith('/panduan') ||
    pathname.startsWith('/kalkulator');

  // Jika sudah login dan mencoba mengakses /login -> redirect ke dashboard utama /
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Jika mengakses halaman publik atau API auth -> izinkan tanpa login
  if (isPublicPage || isAuthApi) {
    return NextResponse.next();
  }

  // 5. Rute Terproteksi:
  // Jika akses API tanpa sesi -> kembalikan 401 JSON
  if (pathname.startsWith('/api')) {
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sesi login tidak ditemukan atau telah kedaluwarsa. Silakan login kembali.',
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Jika akses Halaman Frontend (Dashboard, Jadwal, dll) tanpa sesi -> redirect ke /login
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
