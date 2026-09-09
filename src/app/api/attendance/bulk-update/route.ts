import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { AttendanceCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_ids, dates, final_status, notes, changed_by } = body;

    if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar pegawai wajib dipilih.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar tanggal wajib dipilih.' },
        { status: 400 }
      );
    }

    if (!final_status) {
      return NextResponse.json(
        { success: false, error: 'Status kehadiran wajib dipilih.' },
        { status: 400 }
      );
    }

    const result = await db.bulkUpdateAttendance({
      employee_ids,
      dates,
      final_status: final_status as AttendanceCode,
      notes,
      changed_by: changed_by || 'admin_tu',
    });

    return NextResponse.json({
      success: true,
      updated_count: result.updatedCount,
    });
  } catch (error: any) {
    console.error('Error in bulk-update:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui presensi massal.' },
      { status: 500 }
    );
  }
}
