import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { AttendanceMatrixDay, MonthlyAttendanceSummary } from '@/lib/types';
import { getEmployeeNameByMachineId } from '@/lib/attendance/employee-mapping';

export const dynamic = 'force-dynamic';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const allEmployees = await db.getEmployees();
    const employees = [...allEmployees.filter((e) => e.is_active)];
    const attendanceRecords = await db.getAttendanceForMonth(month, year);

    // Ensure all employees with attendance records are present in the list with their real names
    const existingEmpIds = new Set(employees.map((e) => e.machine_id));
    for (const rec of attendanceRecords) {
      if (!existingEmpIds.has(rec.employee_id)) {
        existingEmpIds.add(rec.employee_id);
        const resolvedName =
          rec.employee_name ||
          getEmployeeNameByMachineId(rec.employee_id) ||
          `Pegawai ${rec.employee_id}`;

        employees.push({
          id: `emp-auto-${rec.employee_id}`,
          machine_id: rec.employee_id,
          nik: '',
          full_name: resolvedName,
          department: 'Pegawai',
          excel_row_index: employees.length + 1,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    // Generate days 1 to 30 (matching standard template C:AF)
    const daysInMonth = 30;
    const days: AttendanceMatrixDay[] = [];
    let workingDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayName = DAY_NAMES[dayOfWeek];
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (!isWeekend) {
        workingDaysCount++;
      }

      days.push({
        day,
        dateStr,
        dayName,
        isWeekend,
      });
    }

    // Extract unique dates with real machine punch records
    const datesWithLogs = Array.from(
      new Set(
        attendanceRecords
          .filter((r) => r.tap_count > 0 || r.first_in !== null)
          .map((r) => r.attendance_date)
      )
    ).sort();

    const recordedDays = Array.from(
      new Set(datesWithLogs.map((d) => parseInt(d.split('-')[2], 10)))
    ).sort((a, b) => a - b);

    // Build fast lookup map: employeeId -> day -> DailyAttendance
    const attendanceMap: Record<string, Record<number, any>> = {};
    for (const emp of employees) {
      attendanceMap[emp.machine_id] = {};
    }

    // Populate existing records
    for (const rec of attendanceRecords) {
      const day = parseInt(rec.attendance_date.split('-')[2], 10);
      if (!attendanceMap[rec.employee_id]) {
        attendanceMap[rec.employee_id] = {};
      }
      attendanceMap[rec.employee_id][day] = rec;
    }

    // Count statistics strictly for recorded days or verified records
    let totalHadir = 0;
    let totalUnverifiedRed = 0;
    let totalVerifiedAbsent = 0;

    for (const emp of employees) {
      for (const d of days) {
        if (d.isWeekend) continue;

        const isRecordedDay = recordedDays.includes(d.day);
        const rec = attendanceMap[emp.machine_id]?.[d.day];

        if (isRecordedDay) {
          if (rec) {
            if (rec.final_status === 'HADIR') {
              totalHadir++;
            } else if (rec.final_status === 'A') {
              totalUnverifiedRed++;
            } else {
              totalVerifiedAbsent++;
            }
          } else {
            // No record on an active recorded day -> Alpha (Absent)
            totalUnverifiedRed++;
          }
        } else {
          // Future / unrecorded day: only count if admin manually verified it
          if (rec && rec.is_verified && rec.final_status !== 'HADIR' && rec.final_status !== 'A') {
            totalVerifiedAbsent++;
          }
        }
      }
    }

    const recordedWorkingDaysCount = days.filter(
      (d) => !d.isWeekend && recordedDays.includes(d.day)
    ).length;

    const effectiveWorkingDays = recordedWorkingDaysCount > 0 ? recordedWorkingDaysCount : workingDaysCount;
    const totalPossibleAttendances = employees.length * effectiveWorkingDays;
    const avgAttendanceRate =
      totalPossibleAttendances > 0
        ? Math.round((totalHadir / totalPossibleAttendances) * 1000) / 10
        : 0;

    const totalAbsences = totalUnverifiedRed + totalVerifiedAbsent;
    const verificationProgress =
      totalAbsences > 0
        ? Math.round((totalVerifiedAbsent / totalAbsences) * 1000) / 10
        : 100;

    const summary: MonthlyAttendanceSummary = {
      periodMonth: month,
      periodYear: year,
      totalEmployees: employees.length,
      avgAttendanceRate,
      totalUnverifiedRed,
      verificationProgress,
      totalWorkingDays: effectiveWorkingDays,
    };

    let detectedPeriod = null;
    if (datesWithLogs.length > 0) {
      const minDate = datesWithLogs[0];
      const maxDate = datesWithLogs[datesWithLogs.length - 1];
      const startDay = parseInt(minDate.split('-')[2], 10);
      const endDay = parseInt(maxDate.split('-')[2], 10);
      const mName = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ][month] || `Bulan ${month}`;

      detectedPeriod = {
        month,
        year,
        monthName: mName,
        startDate: minDate,
        endDate: maxDate,
        startDay,
        endDay,
        totalDays: datesWithLogs.length,
        formattedRange: `${startDay} ${mName} ${year} s/d ${endDay} ${mName} ${year}`,
      };
    }

    return NextResponse.json({
      success: true,
      month,
      year,
      summary,
      detectedPeriod,
      recordedDays,
      days,
      employees,
      attendanceMap,
      uploadHistory: db.getUploadHistory(),
    });
  } catch (error: any) {
    console.error('Error fetching attendance data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data presensi' },
      { status: 500 }
    );
  }
}
