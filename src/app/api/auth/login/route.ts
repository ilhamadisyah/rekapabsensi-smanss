import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/token';
import { setAuthCookie } from '@/lib/auth/session';
import { checkAuthRateLimit, getClientIp } from '@/lib/auth/rate-limiter';
import { sanitizeInputText } from '@/lib/auth/sanitize';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // 1. Anti-Brute Force Rate Limiting (Maks 5 percobaan gagal per 15 menit)
  const rateCheck = checkAuthRateLimit(ip);
  if (!rateCheck.allowed) {
    const retryAfterSec = Math.ceil(rateCheck.resetTimeMs / 1000);
    return NextResponse.json(
      {
        success: false,
        error: `Terlalu banyak percobaan login gagal. Demi keamanan, silakan coba lagi setelah ${Math.ceil(
          retryAfterSec / 60
        )} menit.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await request.json();
    const identifier = sanitizeInputText(body.identifier || body.username || body.email || '', 100);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    // 2. Cari data admin user
    const user = await db.getAdminUserByIdentifier(identifier);
    if (!user || !user.is_active) {
      // Catat log keamanan
      await db.addAuditLog({
        attendance_id: 'auth_failed',
        employee_id: 'SYSTEM',
        attendance_date: new Date().toISOString().split('T')[0],
        previous_status: 'LOGIN_ATTEMPT',
        new_status: 'FAILED',
        reason: `Percobaan login gagal (user tidak ditemukan / non-aktif): "${identifier}" dari IP ${ip}`,
        changed_by: 'system_security',
      });

      return NextResponse.json(
        { success: false, error: 'Username/Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    // 3. Verifikasi password hash menggunakan timing-safe equal
    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      await db.addAuditLog({
        attendance_id: 'auth_failed',
        employee_id: user.username,
        attendance_date: new Date().toISOString().split('T')[0],
        previous_status: 'LOGIN_ATTEMPT',
        new_status: 'FAILED',
        reason: `Percobaan login kata sandi salah untuk user "${user.username}" dari IP ${ip}`,
        changed_by: 'system_security',
      });

      return NextResponse.json(
        { success: false, error: 'Username/Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    // 4. Perbarui waktu login terakhir
    await db.updateAdminLastLogin(user.id);

    // 5. Buat JWT Session Token
    const sessionToken = await createSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });

    // 6. Buat response & pasang cookie HttpOnly
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });

    setAuthCookie(response, sessionToken);

    // Catat log sukses
    await db.addAuditLog({
      attendance_id: 'auth_success',
      employee_id: user.username,
      attendance_date: new Date().toISOString().split('T')[0],
      previous_status: 'OFFLINE',
      new_status: 'ONLINE',
      reason: `Login berhasil: ${user.full_name} (${user.role}) dari IP ${ip}`,
      changed_by: user.username,
    });

    return response;
  } catch (error: any) {
    console.error('[Auth API] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
