import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { requireSuperAdmin } from '@/lib/auth/guard';
import { hashPassword } from '@/lib/auth/password';
import { sanitizeUsername, sanitizeEmail, sanitizeInputText } from '@/lib/auth/sanitize';

export const dynamic = 'force-dynamic';

/**
 * GET: Ambil daftar seluruh admin (HANYA SUPERADMIN)
 */
export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const rawUsers = await db.getAdminUsers();
    // Hilangkan password_hash sebelum dikirim ke client
    const admins = rawUsers.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      last_login_at: u.last_login_at,
      created_at: u.created_at,
    }));

    return NextResponse.json({ success: true, admins });
  } catch (error: any) {
    console.error('[AdminUsers API] Error GET:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar admin.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Tambah admin baru (HANYA SUPERADMIN)
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const rawUsername = sanitizeUsername(body.username || '');
    const rawEmail = sanitizeEmail(body.email || '');
    const rawFullName = sanitizeInputText(body.full_name || '', 100);
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    const role = body.role === 'superadmin' ? 'superadmin' : 'admin';

    // Validasi kelengkapan data
    if (!rawUsername || !rawEmail || !rawFullName || !password) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom (username, email, nama lengkap, password) wajib diisi.' },
        { status: 400 }
      );
    }

    if (rawUsername.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Username minimal 3 karakter (huruf, angka, _, ., -).' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi minimal 8 karakter demi keamanan.' },
        { status: 400 }
      );
    }

    // Periksa apakah username atau email sudah terdaftar
    const existingUser = await db.getAdminUserByIdentifier(rawUsername);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Username "${rawUsername}" sudah digunakan.` },
        { status: 400 }
      );
    }

    const existingEmail = await db.getAdminUserByIdentifier(rawEmail);
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: `Email "${rawEmail}" sudah terdaftar.` },
        { status: 400 }
      );
    }

    // Hash password menggunakan crypto.scrypt
    const passwordHash = hashPassword(password);

    const newUser = await db.createAdminUser({
      username: rawUsername,
      email: rawEmail,
      password_hash: passwordHash,
      full_name: rawFullName,
      role,
      is_active: true,
    });

    if (!newUser) {
      throw new Error('Gagal menyimpan user admin ke database.');
    }

    // Catat log audit oleh superadmin
    await db.addAuditLog({
      attendance_id: 'admin_management',
      employee_id: newUser.username,
      attendance_date: new Date().toISOString().split('T')[0],
      previous_status: 'NONE',
      new_status: 'CREATED',
      reason: `Superadmin "${auth.user.username}" menambahkan akun admin baru: "${newUser.username}" (${newUser.role})`,
      changed_by: auth.user.username,
    });

    return NextResponse.json({
      success: true,
      message: `Admin "${newUser.full_name}" berhasil ditambahkan sebagai ${newUser.role}.`,
      admin: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at,
      },
    });
  } catch (error: any) {
    console.error('[AdminUsers API] Error POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menambahkan admin baru.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Hapus akun admin berdasarkan ID (HANYA SUPERADMIN)
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID admin wajib disertakan.' },
        { status: 400 }
      );
    }

    // Proteksi Self-Deletion: Superadmin tidak boleh menghapus akun dirinya sendiri!
    if (id === auth.user.userId) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' },
        { status: 400 }
      );
    }

    const success = await db.deleteAdminUser(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Admin dengan ID tersebut tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Catat log audit
    await db.addAuditLog({
      attendance_id: 'admin_management',
      employee_id: id,
      attendance_date: new Date().toISOString().split('T')[0],
      previous_status: 'ACTIVE',
      new_status: 'DELETED',
      reason: `Superadmin "${auth.user.username}" menghapus akun admin ID "${id}"`,
      changed_by: auth.user.username,
    });

    return NextResponse.json({
      success: true,
      message: 'Akun admin berhasil dihapus.',
    });
  } catch (error: any) {
    console.error('[AdminUsers API] Error DELETE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus admin.' },
      { status: 500 }
    );
  }
}
