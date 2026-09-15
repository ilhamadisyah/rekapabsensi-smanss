import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { evaluateMonthlyAttendanceMatrix } from '@/lib/attendance/matrix-evaluator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const allEmployees = await db.getEmployees();
    const employees = [...allEmployees.filter((e) => e.is_active)];
    const attendanceRecords = await db.getAttendanceForMonth(month, year);
    const shifts = await db.getShiftTemplates();
    const schedules = await db.getEmployeeSchedules(month, year);
    const holidays = await db.getHolidays(month, year);

    const evaluated = evaluateMonthlyAttendanceMatrix({
      month,
      year,
      employees,
      attendanceRecords,
      shifts,
      schedules,
      holidays,
    });

    return NextResponse.json({
      success: true,
      month,
      year,
      summary: evaluated.summary,
      detectedPeriod: evaluated.detectedPeriod,
      recordedDays: evaluated.recordedDays,
      days: evaluated.days,
      employees: evaluated.employees,
      attendanceMap: evaluated.attendanceMap,
      shifts,
      defaultShift: evaluated.defaultShift,
      schedules,
      holidays,
      uploadHistory: await db.getUploadHistory(),
    });
  } catch (error: any) {
    console.error('Error fetching attendance data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data presensi' },
      { status: 500 }
    );
  }
}
