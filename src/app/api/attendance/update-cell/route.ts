import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { AttendanceCode } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, date, final_status, notes, changed_by } = body;

    if (!employee_id || !date || !final_status) {
      return NextResponse.json(
        { success: false, error: 'Parameter employee_id, date, dan final_status wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await db.updateAttendanceCell({
      employee_id,
      date,
      final_status: final_status as AttendanceCode,
      notes,
      changed_by: changed_by || 'admin_tu',
    });

    let color = 'GREEN';
    if (final_status === 'A') {
      color = 'RED';
    } else if (final_status !== 'HADIR') {
      color = 'YELLOW';
    }

    return NextResponse.json({
      success: true,
      updated_cell: {
        employee_id,
        date,
        final_status,
        notes: result.record.notes,
        color,
      },
      audit: result.audit,
    });
  } catch (error: any) {
    console.error('Error in update-cell:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui status kehadiran.' },
      { status: 500 }
    );
  }
}
