import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, setAuthCookie } from '@/lib/auth/session';
import { createSessionToken } from '@/lib/auth/token';
import { db } from '@/lib/storage/store';
import { hashPassword } from '@/lib/auth/password';
import { sanitizeUsername, sanitizeEmail, sanitizeInputText } from '@/lib/auth/sanitize';
import { AdminUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET: Ambil informasi user yang sedang login
 */
export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);

  if (!session) {
    return NextResponse.json({
      success: false,
      user: null,
    });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.userId,
      username: session.username,
      email: session.email,
      full_name: session.fullName,
      role: session.role,
    },
  });
}

/**
 * PATCH: Edit profil pengguna yang sedang login (Admin & Superadmin)
 */
export async function PATCH(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Sesi login tidak valid atau telah kedaluwarsa.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const rawFullName = sanitizeInputText(body.full_name || '', 100);
    const rawUsername = sanitizeUsername(body.username || '');
    const rawEmail = sanitizeEmail(body.email || '');
    const newPassword = typeof body.new_password === 'string' ? body.new_password.trim() : '';

    if (!rawFullName || !rawUsername || !rawEmail) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap, username, dan email wajib diisi.' },
        { status: 400 }
      );
    }

    if (rawUsername.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username minimal 3 karakter (huruf, angka, ., -, _).' },
        { status: 400 }
      );
    }

    // Periksa apakah username sudah dipakai user lain
    if (rawUsername.toLowerCase() !== session.username.toLowerCase()) {
      const existingUser = await db.getAdminUserByIdentifier(rawUsername);
      if (existingUser && existingUser.id !== session.userId) {
        return NextResponse.json(
          { success: false, error: `Username "${rawUsername}" sudah digunakan oleh akun lain.` },
          { status: 400 }
        );
      }
    }

    // Periksa apakah email sudah dipakai user lain
    if (rawEmail.toLowerCase() !== session.email.toLowerCase()) {
      const existingEmail = await db.getAdminUserByIdentifier(rawEmail);
      if (existingEmail && existingEmail.id !== session.userId) {
        return NextResponse.json(
          { success: false, error: `Email "${rawEmail}" sudah digunakan oleh akun lain.` },
          { status: 400 }
        );
      }
    }

    const updates: Partial<AdminUser> = {
      full_name: rawFullName,
      username: rawUsername,
      email: rawEmail,
    };

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi baru minimal 8 karakter demi keamanan.' },
          { status: 400 }
        );
      }
      updates.password_hash = hashPassword(newPassword);
    }

    const updatedUser = await db.updateAdminUser(session.userId, updates);
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui data profil pengguna.' },
        { status: 500 }
      );
    }

    // Buat JWT baru dengan identitas teranyar
    const newToken = await createSessionToken({
      userId: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      role: updatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        role: updatedUser.role,
        is_active: updatedUser.is_active,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    });

    setAuthCookie(response, newToken);
    return response;
  } catch (error: any) {
    console.error('[Auth Me PATCH] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem.' },
      { status: 500 }
    );
  }
}
