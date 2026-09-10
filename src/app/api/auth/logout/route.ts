import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getSessionUser } from '@/lib/auth/session';
import { db } from '@/lib/storage/store';
import { getClientIp } from '@/lib/auth/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  const ip = getClientIp(request);

  if (user) {
    try {
      await db.addAuditLog({
        attendance_id: 'auth_logout',
        employee_id: user.username,
        attendance_date: new Date().toISOString().split('T')[0],
        previous_status: 'ONLINE',
        new_status: 'LOGOUT',
        reason: `User logout: ${user.fullName} (${user.role}) dari IP ${ip}`,
        changed_by: user.username,
      });
    } catch (e) {
      console.warn('Gagal mencatat audit log logout:', e);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil.',
  });

  clearAuthCookie(response);
  return response;
}
