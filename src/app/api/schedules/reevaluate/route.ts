import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { evaluateAttendanceStatus } from '@/lib/attendance/parser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const month = parseInt(body.month || '9', 10);
    const year = parseInt(body.year || '2026', 10);

    const attendanceRecords = await db.getAttendanceForMonth(month, year);
    const schedules = await db.getEmployeeSchedules(month, year);
    const shifts = await db.getShiftTemplates();
    const holidays = await db.getHolidays(month, year);

    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const holidayMap = new Map(holidays.map((h) => [h.date, h]));

    // Map schedule by `employeeId_date`
    const scheduleMap = new Map(schedules.map((s) => [`${s.employee_id}_${s.date}`, s]));

    let updatedCount = 0;

    for (const rec of attendanceRecords) {
      const key = `${rec.employee_id}_${rec.attendance_date}`;
      const sched = scheduleMap.get(key);
      const shift = sched ? shiftMap.get(sched.shift_id) : null;
      const holiday = holidayMap.get(rec.attendance_date);

      const d = new Date(rec.attendance_date + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const scheduleContext = {
        startTime: sched?.custom_start_time || shift?.start_time,
        endTime: sched?.custom_end_time || shift?.end_time,
        gracePeriodMinutes: shift?.grace_period_minutes,
        isOvernight: shift?.is_overnight,
        isOffDay: shift?.is_off_day,
        isHoliday: Boolean(holiday),
        holidayName: holiday?.name,
      };

      // Only re-evaluate automatic statuses (HADIR or A) without overwriting manual excuse overrides like DL, I, IL, etc.
      const isAutomaticStatus = rec.final_status === 'HADIR' || rec.final_status === 'A';

      if (isAutomaticStatus) {
        const { systemStatus, finalStatus } = evaluateAttendanceStatus(
          rec.first_in,
          rec.last_out,
          rec.tap_count,
          isWeekend,
          scheduleContext
        );

        if (rec.system_status !== systemStatus || rec.final_status !== finalStatus) {
          rec.system_status = systemStatus;
          rec.final_status = finalStatus;
          rec.shift_id = shift?.id;
          rec.shift_code = shift?.code;
          rec.shift_name = shift?.name;
          rec.updated_at = new Date().toISOString();
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      const history = await db.getUploadHistory();
      const currentUpload = history.find((h) => h.period_month === month && h.period_year === year) || {
        id: `upload-${month}-${year}`,
        file_name: 'Evaluasi Otomatis Shift',
        period_month: month,
        period_year: year,
        total_raw_rows: attendanceRecords.length,
        uploaded_by: 'system_reevaluate',
        created_at: new Date().toISOString(),
      };
      await db.saveAttendanceBatch(currentUpload, attendanceRecords);
    }

    return NextResponse.json({
      success: true,
      month,
      year,
      totalRecords: attendanceRecords.length,
      updatedCount,
      message: `Berhasil mengevaluasi ulang presensi. ${updatedCount} data kehadiran disesuaikan dengan jadwal shift.`,
    });
  } catch (error: any) {
    console.error('Error re-evaluating attendance:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
