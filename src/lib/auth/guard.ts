import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from './session';
import { SessionPayload } from './token';

export interface GuardSuccess {
  user: SessionPayload;
  error: null;
}

export interface GuardError {
  user: null;
  error: NextResponse;
}

export type GuardResult = GuardSuccess | GuardError;

/**
 * Memastikan request dipanggil oleh user yang telah terotentikasi (admin atau superadmin)
 */
export async function requireAuth(request: NextRequest): Promise<GuardResult> {
  const user = await getSessionUser(request);

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          error: 'Sesi login tidak valid atau telah berakhir. Silakan login kembali.',
        },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Memastikan request dipanggil oleh user dengan role SUPERADMIN
 */
export async function requireSuperAdmin(request: NextRequest): Promise<GuardResult> {
  const authCheck = await requireAuth(request);
  if (authCheck.error) {
    return authCheck;
  }

  if (authCheck.user.role !== 'superadmin') {
    return {
      user: null,
      error: NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak. Tindakan ini hanya diizinkan untuk Superadmin.',
        },
        { status: 403 }
      ),
    };
  }

  return authCheck;
}
