import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { requireAuth, requireSuperAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

/**
 * GET: Ambil daftar seluruh unit kerja
 */
export async function GET() {
  try {
    const workUnits = await db.getWorkUnits();
    return NextResponse.json(
      { success: true, workUnits },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    console.error('[WorkUnits API] Error GET:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat daftar unit kerja.' },
      { status: 500 }
    );
  }
}

/**
 * POST: Buat unit kerja baru (Hanya Superadmin)
 */
export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nama unit kerja wajib diisi.' },
        { status: 400 }
      );
    }

    const existingUnits = await db.getWorkUnits();
    const isDuplicate = existingUnits.some(
      (u) => u.name.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `Unit kerja dengan nama "${name}" sudah terdaftar.` },
        { status: 400 }
      );
    }

    const newUnit = await db.createWorkUnit({
      name,
      description,
    });

    return NextResponse.json(
      { success: true, message: `Unit kerja "${name}" berhasil ditambahkan.`, workUnit: newUnit },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[WorkUnits API] Error POST:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menambahkan unit kerja.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Perbarui data unit kerja (Hanya Superadmin)
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const id = String(body.id || '').trim();
    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const description = body.description !== undefined ? String(body.description).trim() : undefined;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID unit kerja wajib disertakan.' },
        { status: 400 }
      );
    }

    if (name !== undefined && !name) {
      return NextResponse.json(
        { success: false, error: 'Nama unit kerja tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Periksa duplikasi nama jika nama diubah
    if (name) {
      const existingUnits = await db.getWorkUnits();
      const isDuplicate = existingUnits.some(
        (u) => u.id !== id && u.name.toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        return NextResponse.json(
          { success: false, error: `Unit kerja dengan nama "${name}" sudah ada.` },
          { status: 400 }
        );
      }
    }

    const updated = await db.updateWorkUnit(id, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Unit kerja tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Unit kerja berhasil diperbarui.`,
      workUnit: updated,
    });
  } catch (error: any) {
    console.error('[WorkUnits API] Error PATCH:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui unit kerja.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Hapus unit kerja (Hanya Superadmin)
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID unit kerja wajib disertakan.' },
        { status: 400 }
      );
    }

    const success = await db.deleteWorkUnit(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unit kerja tidak ditemukan atau gagal dihapus.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unit kerja berhasil dihapus.',
    });
  } catch (error: any) {
    console.error('[WorkUnits API] Error DELETE:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus unit kerja.' },
      { status: 500 }
    );
  }
}
