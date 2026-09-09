import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const employees = await db.getEmployees();
    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat master pegawai.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'ID dan data update wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await db.updateEmployee(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Pegawai tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pegawai.' },
      { status: 500 }
    );
  }
}
