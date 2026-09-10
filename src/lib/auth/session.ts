import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, SessionPayload } from './token';

export const AUTH_COOKIE_NAME = 'smanss_auth_token';

export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Mendapatkan payload user sesi aktif dari NextRequest atau next/headers
 */
export async function getSessionUser(request?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      return null;
    }
  }

  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Pasang cookie auth pada NextResponse
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());
}

/**
 * Hapus cookie auth pada NextResponse (Logout)
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    ...getCookieOptions(),
    maxAge: 0,
  });
}
