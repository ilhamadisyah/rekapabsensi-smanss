import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { AttendanceMatrixDay, MonthlyAttendanceSummary } from '@/lib/types';
import { getEmployeeNameByMachineId } from '@/lib/attendance/employee-mapping';
import { evaluateAttendanceStatus, addMinutesToTime } from '@/lib/attendance/parser';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

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

    // Build lookup maps for shifts, schedules, and holidays
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const defaultShift =
      shifts.find((s) => s.is_default) ||
      shifts.find((s) => s.code === 'NORM') || {
        id: 'shift-normal',
        code: 'NORM',
        name: 'Jam Kerja Normal (Reguler)',
        start_time: '08:00:00',
        end_time: '14:30:00',
        grace_period_minutes: 0,
        check_in_window_minutes: 120,
        check_out_window_minutes: 240,
        is_overnight: false,
        is_off_day: false,
        color: '#2563eb',
      };

    const holidayMap = new Map(holidays.map((h) => [h.date, h]));
    const scheduleMap = new Map(schedules.map((s) => [`${s.employee_id}___${s.date}`, s]));

    // Ensure all employees with attendance records are present in the list with their real names
    const existingEmpKeys = new Set(
      employees.flatMap((e) => [e.id, e.nik, e.machine_id].filter(Boolean))
    );
    for (const rec of attendanceRecords) {
      if (!existingEmpKeys.has(rec.employee_id)) {
        existingEmpKeys.add(rec.employee_id);
        const resolvedName =
          rec.employee_name ||
          getEmployeeNameByMachineId(rec.employee_id) ||
          `Pegawai ${rec.employee_id}`;

        employees.push({
          id: rec.employee_id,
          machine_id: rec.employee_id,
          nik: rec.employee_id,
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
    let standardWorkingDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayName = DAY_NAMES[dayOfWeek];
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hol = holidayMap.get(dateStr);

      if (!isWeekend && !hol) {
        standardWorkingDaysCount++;
      }

      days.push({
        day,
        dateStr,
        dayName,
        isWeekend,
        holiday: hol || null,
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

    // Build fast lookup map: employeeId (nik, machine_id, id) -> day -> DailyAttendance
    const attendanceMap: Record<string, Record<number, any>> = {};
    for (const emp of employees) {
      const dayRecord: Record<number, any> = {};
      if (emp.nik) attendanceMap[emp.nik] = dayRecord;
      if (emp.machine_id) attendanceMap[emp.machine_id] = dayRecord;
      if (emp.id) attendanceMap[emp.id] = dayRecord;
    }

    // Populate existing records with tap priority protection
    for (const rec of attendanceRecords) {
      const day = parseInt(rec.attendance_date.split('-')[2], 10);
      let dayRecord = attendanceMap[rec.employee_id];
      if (!dayRecord) {
        dayRecord = {};
        attendanceMap[rec.employee_id] = dayRecord;
      }

      const current = dayRecord[day];
      if (current) {
        const currentHasTap = (current.tap_count || 0) > 0 || current.first_in !== null;
        const incomingHasTap = (rec.tap_count || 0) > 0 || rec.first_in !== null;
        const currentIsVerified = current.is_verified && current.verified_by && current.verified_by !== 'system';
        const incomingIsVerified = rec.is_verified && rec.verified_by && rec.verified_by !== 'system';

        if (incomingIsVerified) {
          dayRecord[day] = { ...rec };
        } else if (currentIsVerified) {
          // Keep human verification
        } else if (incomingHasTap && !currentHasTap) {
          dayRecord[day] = { ...rec };
        } else if (!incomingHasTap && currentHasTap) {
          // Real tap record exists - NEVER overwrite with 0-tap placeholder!
        } else {
          if ((rec.tap_count || 0) >= (current.tap_count || 0)) {
            dayRecord[day] = { ...rec };
          }
        }
      } else {
        dayRecord[day] = { ...rec };
      }
    }

    // Evaluate attendance dynamically against database schedules & shifts
    let totalHadir = 0;
    let totalUnverifiedRed = 0;
    let totalVerifiedAbsent = 0;
    let totalRequiredWorkSessions = 0;

    for (const emp of employees) {
      const empKey = emp.nik || emp.machine_id || emp.id;
      const empDayMap =
        (emp.nik && attendanceMap[emp.nik]) ||
        attendanceMap[emp.machine_id] ||
        (emp.id && attendanceMap[emp.id]) ||
        {};
      if (emp.nik) attendanceMap[emp.nik] = empDayMap;
      if (emp.machine_id) attendanceMap[emp.machine_id] = empDayMap;
      if (emp.id) attendanceMap[emp.id] = empDayMap;

      for (const d of days) {
        const isRecordedDay = recordedDays.includes(d.day);
        const sched =
          (emp.nik ? scheduleMap.get(`${emp.nik}___${d.dateStr}`) : undefined) ||
          scheduleMap.get(`${emp.machine_id}___${d.dateStr}`) ||
          (emp.id ? scheduleMap.get(`${emp.id}___${d.dateStr}`) : undefined);
        const hol = holidayMap.get(d.dateStr);
        const shift = sched ? shiftMap.get(sched.shift_id) : null;

        const isHoliday = Boolean(hol);
        const isExplicitOffShift = Boolean(sched && (shift?.is_off_day === true || shift?.code === 'OFF'));
        const hasAssignedDuty = Boolean(sched && !isExplicitOffShift);
        const isWeekendLibur = d.isWeekend && !hasAssignedDuty;
        const isOffDay = isExplicitOffShift;

        const isWorkRequired = sched ? !isExplicitOffShift : (!d.isWeekend && !isHoliday);

        const startTime = sched?.custom_start_time || shift?.start_time || defaultShift.start_time;
        const endTime = sched?.custom_end_time || shift?.end_time || defaultShift.end_time;
        const gracePeriod = shift?.grace_period_minutes ?? defaultShift.grace_period_minutes;
        const isOvernight = Boolean(shift?.is_overnight ?? defaultShift.is_overnight ?? (startTime > endTime));
        const checkInWindowMinutes = shift?.check_in_window_minutes ?? (isOvernight ? 300 : 120);
        const checkOutWindowMinutes = shift?.check_out_window_minutes ?? 240;
        const shiftCode = sched?.shift_code || shift?.code || (isHoliday ? 'LIBUR' : (d.isWeekend ? 'LIBUR' : defaultShift.code));
        const shiftName = sched?.shift_name || shift?.name || (isHoliday ? (hol?.name || 'Hari Libur Resmi') : (d.isWeekend ? 'Akhir Pekan' : defaultShift.name));
        const shiftColor = shift?.color || (isHoliday ? '#f43f5e' : (d.isWeekend ? '#94a3b8' : defaultShift.color));

        let rec = empDayMap[d.day];

        if (rec) {
          // Record exists from biometric punch or manual verification
          rec.shift_id = sched?.shift_id || (isWorkRequired ? defaultShift.id : undefined);
          rec.shift_code = shiftCode;
          rec.shift_name = shiftName;
          rec.shift_color = shiftColor;
          rec.scheduled_start = isWorkRequired ? startTime : null;
          rec.scheduled_end = isWorkRequired ? endTime : null;
          rec.is_off_day = isOffDay || isWeekendLibur;
          rec.is_holiday = isHoliday || isWeekendLibur;
          rec.is_custom_schedule = Boolean(sched);
          rec.has_assigned_duty = hasAssignedDuty;

          if (!rec.is_verified) {
            let isCrossDaySession = Boolean(rec.is_cross_day);
            // Dynamic Cross-Day Punch Pairing for overnight shifts:
            // An overnight shift MUST pair with the next calendar day (beda hari)!
            if (isOvernight) {
              const earliestEveningIn = addMinutesToTime(startTime, -checkInWindowMinutes);
              const latestMorningOut = addMinutesToTime(endTime, checkOutWindowMinutes);

              // Only pair if starting punch is legitimately in the check-in window (>= earliestEveningIn)
              if (rec.first_in && rec.first_in >= earliestEveningIn && (!rec.last_out || rec.last_out >= earliestEveningIn || rec.tap_count < 2)) {
                const nextDayRec = empDayMap[d.day + 1];
                if (nextDayRec && nextDayRec.first_in && nextDayRec.first_in <= latestMorningOut) {
                  const dStart = new Date(`${d.dateStr}T${rec.first_in}`);
                  const nextDateObj = new Date(year, month - 1, d.day + 1);
                  const nextDateStr = `${nextDateObj.getFullYear()}-${String(nextDateObj.getMonth() + 1).padStart(2, '0')}-${String(nextDateObj.getDate()).padStart(2, '0')}`;
                  const dEnd = new Date(`${nextDateStr}T${nextDayRec.first_in}`);
                  const diffHours = (dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60);

                  if (diffHours >= 3 && diffHours <= 23) {
                    rec.last_out = nextDayRec.first_in;
                    rec.tap_count = Math.max(rec.tap_count || 1, 2);
                    isCrossDaySession = true;

                    // Consume next day's morning checkout punch
                    if (nextDayRec.last_out) {
                      nextDayRec.first_in = nextDayRec.last_out;
                      nextDayRec.last_out = null;
                      nextDayRec.tap_count = Math.max(1, (nextDayRec.tap_count || 2) - 1);
                    } else {
                      nextDayRec.first_in = null;
                      nextDayRec.last_out = null;
                      nextDayRec.tap_count = 0;
                    }
                    nextDayRec.is_cross_day = false;
                  } else if (diffHours > 23) {
                    rec.notes = 'Rentang tap melebihi batas maksimal 23 jam';
                  }
                }
              }
              rec.is_cross_day = isCrossDaySession;
            }

            // Dynamic evaluation according to assigned shift rules
            const scheduleContext = {
              startTime,
              endTime,
              gracePeriodMinutes: gracePeriod,
              checkInWindowMinutes,
              checkOutWindowMinutes,
              isOvernight,
              isOffDay,
              isHoliday,
              holidayName: hol?.name,
              hasAssignedDuty,
              isCrossDaySession,
            };

            const evaluated = evaluateAttendanceStatus(
              rec.first_in,
              rec.last_out,
              rec.tap_count,
              d.isWeekend,
              scheduleContext
            );

            rec.system_status = evaluated.systemStatus;
            rec.final_status = evaluated.finalStatus;
          }
        } else {
          // No record in biometric logs
          if (isRecordedDay || d.isWeekend) {
            if ((isHoliday || isWeekendLibur) && !hasAssignedDuty) {
              // Designated Holiday or Weekend without assigned active duty -> LIBUR
              rec = {
                id: `att-hol-${empKey}-${d.dateStr}`,
                upload_id: 'virtual-holiday',
                employee_id: empKey,
                employee_name: emp.full_name,
                attendance_date: d.dateStr,
                first_in: null,
                last_out: null,
                tap_count: 0,
                system_status: 'TIDAK_HADIR',
                final_status: 'LIBUR',
                is_off_day: true,
                is_holiday: isHoliday,
                shift_code: 'LIBUR',
                shift_name: isHoliday ? (hol?.name || 'Hari Libur Resmi') : 'Akhir Pekan (Libur Rutin)',
                shift_color: '#f43f5e',
                is_verified: false,
                is_custom_schedule: false,
                updated_at: new Date().toISOString(),
              };
              empDayMap[d.day] = rec;
            } else if (isOffDay) {
              // Explicit OFF shift schedule -> OFF
              rec = {
                id: `att-off-${empKey}-${d.dateStr}`,
                upload_id: 'virtual-schedule',
                employee_id: empKey,
                employee_name: emp.full_name,
                attendance_date: d.dateStr,
                first_in: null,
                last_out: null,
                tap_count: 0,
                system_status: 'TIDAK_HADIR',
                final_status: 'OFF',
                is_off_day: true,
                is_holiday: false,
                shift_id: sched?.shift_id,
                shift_code: 'OFF',
                shift_name: shiftName || 'Libur Shift (Bebas Tugas)',
                shift_color: '#64748b',
                is_verified: false,
                is_custom_schedule: Boolean(sched),
                updated_at: new Date().toISOString(),
              };
              empDayMap[d.day] = rec;
            } else if (isWorkRequired) {
              // Required to work on this recorded day, but absent -> Alpha (A)
              rec = {
                id: `att-alpha-${empKey}-${d.dateStr}`,
                upload_id: 'virtual-alpha',
                employee_id: empKey,
                employee_name: emp.full_name,
                attendance_date: d.dateStr,
                first_in: null,
                last_out: null,
                tap_count: 0,
                system_status: 'TIDAK_HADIR',
                final_status: 'A',
                is_off_day: false,
                is_holiday: isHoliday,
                shift_id: sched?.shift_id || defaultShift.id,
                shift_code: shiftCode,
                shift_name: shiftName,
                shift_color: shiftColor,
                scheduled_start: startTime,
                scheduled_end: endTime,
                is_verified: false,
                is_custom_schedule: Boolean(sched),
                updated_at: new Date().toISOString(),
              };
              empDayMap[d.day] = rec;
            }
          } else {
            // Future / unrecorded day
            if (sched) {
              rec = {
                id: `att-plan-${empKey}-${d.dateStr}`,
                upload_id: 'virtual-plan',
                employee_id: empKey,
                employee_name: emp.full_name,
                attendance_date: d.dateStr,
                first_in: null,
                last_out: null,
                tap_count: 0,
                system_status: 'TIDAK_HADIR',
                final_status: isOffDay ? 'OFF' : ('-' as any),
                is_off_day: isOffDay,
                is_holiday: isHoliday,
                shift_id: sched.shift_id,
                shift_code: shiftCode,
                shift_name: shiftName,
                shift_color: shiftColor,
                scheduled_start: startTime,
                scheduled_end: endTime,
                is_verified: false,
                is_custom_schedule: true,
                updated_at: new Date().toISOString(),
              };
              empDayMap[d.day] = rec;
            } else if (isHoliday) {
              rec = {
                id: `att-hol-${empKey}-${d.dateStr}`,
                upload_id: 'virtual-holiday',
                employee_id: empKey,
                employee_name: emp.full_name,
                attendance_date: d.dateStr,
                first_in: null,
                last_out: null,
                tap_count: 0,
                system_status: 'TIDAK_HADIR',
                final_status: 'LIBUR',
                is_off_day: true,
                is_holiday: true,
                shift_code: 'LIBUR',
                shift_name: hol?.name || 'Hari Libur',
                shift_color: '#f43f5e',
                is_verified: false,
                is_custom_schedule: false,
                updated_at: new Date().toISOString(),
              };
              empDayMap[d.day] = rec;
            } else {
              // Unrecorded regular workday (logs not uploaded yet)
              rec = {
                id: `att-unrecorded-${empKey}-${d.dateStr}`,
                upload_id: 'virtual-unrecorded',
                employee_id: empKey,
                employee_name: emp.full_name,
                attendance_date: d.dateStr,
                first_in: null,
                last_out: null,
                tap_count: 0,
                system_status: 'TIDAK_HADIR',
                final_status: '-' as any,
                is_off_day: false,
                is_holiday: false,
                shift_id: defaultShift.id,
                shift_code: defaultShift.code,
                shift_name: defaultShift.name,
                shift_color: defaultShift.color,
                scheduled_start: defaultShift.start_time,
                scheduled_end: defaultShift.end_time,
                is_verified: false,
                is_custom_schedule: false,
                updated_at: new Date().toISOString(),
              };
              empDayMap[d.day] = rec;
            }
          }
        }

        // Tally statistics strictly based on actual scheduled work requirements
        if (isRecordedDay) {
          if (isWorkRequired) {
            totalRequiredWorkSessions++;

            if (rec?.final_status === 'HADIR') {
              totalHadir++;
            } else if (rec?.final_status === 'A') {
              totalUnverifiedRed++;
            } else if (rec && rec.final_status !== 'OFF' && rec.final_status !== 'LIBUR') {
              totalVerifiedAbsent++;
            }
          } else {
            // Off-duty or holiday or weekend
            if (rec?.final_status === 'HADIR') {
              totalHadir++;
              totalRequiredWorkSessions++;
            }
          }
        } else {
          // Future / unrecorded day: count if admin manually verified it
          if (
            rec &&
            rec.is_verified &&
            rec.final_status !== 'HADIR' &&
            rec.final_status !== 'A' &&
            rec.final_status !== 'OFF' &&
            rec.final_status !== 'LIBUR'
          ) {
            totalVerifiedAbsent++;
          }
        }
      }
    }

    const recordedWorkingDaysCount = days.filter(
      (d) => !d.isWeekend && recordedDays.includes(d.day)
    ).length;

    const effectiveWorkingDays =
      recordedWorkingDaysCount > 0 ? recordedWorkingDaysCount : standardWorkingDaysCount;

    const avgAttendanceRate =
      totalRequiredWorkSessions > 0
        ? Math.round((totalHadir / totalRequiredWorkSessions) * 1000) / 10
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
      shifts,
      defaultShift,
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
