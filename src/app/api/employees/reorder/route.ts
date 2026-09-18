import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { requireSuperAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar urutan pegawai (orders) tidak valid atau kosong.' },
        { status: 400 }
      );
    }

    const cleanOrders: { id: string; excel_row_index: number }[] = [];
    for (const item of orders) {
      if (item && item.id) {
        cleanOrders.push({
          id: String(item.id),
          excel_row_index: Math.max(1, Number(item.excel_row_index) || 1),
        });
      }
    }

    if (cleanOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada data urutan pegawai yang valid untuk disimpan.' },
        { status: 400 }
      );
    }

    const success = await db.reorderEmployees(cleanOrders);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui urutan pegawai di database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memperbarui urutan untuk ${cleanOrders.length} pegawai.`,
      updatedCount: cleanOrders.length,
    });
  } catch (error: any) {
    console.error('Error in /api/employees/reorder:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat menyimpan urutan pegawai.' },
      { status: 500 }
    );
  }
}
