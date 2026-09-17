import {
  AttendanceMatrixDay,
  MonthlyAttendanceSummary,
  Employee,
  DailyAttendance,
  ShiftTemplate,
  EmployeeSchedule,
  Holiday,
} from '../types';
import { getEmployeeNameByMachineId } from './employee-mapping';
import { evaluateAttendanceStatus, addMinutesToTime } from './parser';

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export interface MatrixEvaluatorParams {
  month: number;
  year: number;
  employees: Employee[];
  attendanceRecords: DailyAttendance[];
  shifts: ShiftTemplate[];
  schedules: EmployeeSchedule[];
  holidays: Holiday[];
}

export interface MatrixEvaluatorResult {
  days: AttendanceMatrixDay[];
  standardWorkingDaysCount: number;
  datesWithLogs: string[];
  recordedDays: number[];
  attendanceMap: Record<string, Record<number, DailyAttendance>>;
  summary: MonthlyAttendanceSummary;
  detectedPeriod: {
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
    startDay: number;
    endDay: number;
    totalDays: number;
    formattedRange: string;
  } | null;
  employees: Employee[];
  defaultShift: ShiftTemplate;
}

/**
 * Single source of truth for attendance evaluation.
 * Evaluates shifts, overnight cross-day pairing, holidays, weekends, and respects manual overrides.
 * Shared across /api/attendance/data and /api/attendance/export.
 */
export function evaluateMonthlyAttendanceMatrix(params: MatrixEvaluatorParams): MatrixEvaluatorResult {
  const { month, year, attendanceRecords, shifts, schedules, holidays } = params;

  // Clone active employees
  const employees = [...params.employees.filter((e) => e.is_active !== false)];

  // Build lookup maps for shifts, schedules, and holidays
  const shiftMap = new Map(shifts.map((s) => [s.id, s]));
  const defaultShift: ShiftTemplate =
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

  // Fast employee lookup by any identifier
  const employeeByIdentifier = new Map<string, Employee>();
  for (const emp of employees) {
    if (emp.nik) employeeByIdentifier.set(emp.nik, emp);
    if (emp.machine_id) employeeByIdentifier.set(emp.machine_id, emp);
    if (emp.id) employeeByIdentifier.set(emp.id, emp);
  }

  // Build fast lookup map: employeeId (nik, machine_id, id) -> day -> DailyAttendance
  // Note: All identifiers of the same employee share the EXACT same dayRecord object reference!
  const attendanceMap: Record<string, Record<number, DailyAttendance>> = {};
  for (const emp of employees) {
    const dayRecord: Record<number, DailyAttendance> = {};
    if (emp.nik) attendanceMap[emp.nik] = dayRecord;
    if (emp.machine_id) attendanceMap[emp.machine_id] = dayRecord;
    if (emp.id) attendanceMap[emp.id] = dayRecord;
  }

  // Populate existing records with tap priority protection & manual override honor
  for (const rec of attendanceRecords) {
    const day = parseInt(rec.attendance_date.split('-')[2], 10);
    const matchedEmp = employeeByIdentifier.get(rec.employee_id);

    let dayRecord = attendanceMap[rec.employee_id];
    if (!dayRecord && matchedEmp) {
      dayRecord =
        (matchedEmp.nik ? attendanceMap[matchedEmp.nik] : undefined) ||
        (matchedEmp.machine_id ? attendanceMap[matchedEmp.machine_id] : undefined) ||
        (matchedEmp.id ? attendanceMap[matchedEmp.id] : undefined) ||
        {};
    }
    if (!dayRecord) {
      dayRecord = {};
      attendanceMap[rec.employee_id] = dayRecord;
    }

    const current = dayRecord[day];
    if (current) {
      const currentHasTap = (current.tap_count || 0) > 0 || current.first_in !== null;
      const incomingHasTap = (rec.tap_count || 0) > 0 || rec.first_in !== null;
      const currentIsVerified = Boolean(current.is_verified && current.verified_by && current.verified_by !== 'system');
      const incomingIsVerified = Boolean(rec.is_verified && rec.verified_by && rec.verified_by !== 'system');

      if (incomingIsVerified && !currentIsVerified) {
        // Incoming manual edit takes absolute priority over unverified log!
        dayRecord[day] = { ...rec };
      } else if (currentIsVerified && !incomingIsVerified) {
        // Keep existing manual verification
      } else if (incomingIsVerified && currentIsVerified) {
        // Both are verified: newer update wins
        const curDate = new Date(current.updated_at || 0).getTime();
        const inDate = new Date(rec.updated_at || 0).getTime();
        if (inDate >= curDate) {
          dayRecord[day] = { ...rec };
        }
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
      (emp.nik ? attendanceMap[emp.nik] : undefined) ||
      (emp.machine_id ? attendanceMap[emp.machine_id] : undefined) ||
      (emp.id ? attendanceMap[emp.id] : undefined) ||
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
          let isCrossDaySession = Boolean(rec.is_cross_day) || Boolean(isOvernight && rec.first_in && rec.last_out && (rec.first_in as string) > (rec.last_out as string));
          // Dynamic Cross-Day Punch Pairing for overnight shifts:
          // An overnight shift MUST pair with the next calendar day (beda hari)!
          if (isOvernight) {
            const earliestEveningIn = addMinutesToTime(startTime, -checkInWindowMinutes);

            // Special repair case: if first_in is morning (< 13:00) and last_out is evening (>= earliestEveningIn),
            // this record previously swallowed previous period's checkout into first_in, and the true shift check-in into last_out!
            if (
              rec.first_in &&
              rec.last_out &&
              rec.first_in < '13:00:00' &&
              rec.last_out >= earliestEveningIn
            ) {
              const prevCarry = rec.first_in;
              rec.first_in = rec.last_out;
              rec.last_out = null;
              rec.tap_count = 1;
              rec.notes = (rec.notes ? `${rec.notes}; ` : '') + `Tap keluar limpahan shift akhir bulan sebelumnya (${prevCarry.substring(0, 5)})`;
            }

            const nextDayRec = empDayMap[d.day + 1];
            const nextDateObj = new Date(year, month - 1, d.day + 1);
            const nextDateStr = `${nextDateObj.getFullYear()}-${String(nextDateObj.getMonth() + 1).padStart(2, '0')}-${String(nextDateObj.getDate()).padStart(2, '0')}`;

            const needsNextDayCheckout = !rec.last_out || rec.last_out >= earliestEveningIn || rec.tap_count < 2;
            const alreadyMatchedNextDay = Boolean(rec.last_out && nextDayRec && nextDayRec.first_in && nextDayRec.first_in === rec.last_out);

            // Only pair if starting punch is legitimately in the check-in window (>= earliestEveningIn)
            if (rec.first_in && rec.first_in >= earliestEveningIn && (needsNextDayCheckout || alreadyMatchedNextDay)) {
              // Check schedule of next day to determine natural boundary:
              const nextSched =
                (emp.nik ? scheduleMap.get(`${emp.nik}___${nextDateStr}`) : undefined) ||
                scheduleMap.get(`${emp.machine_id}___${nextDateStr}`) ||
                (emp.id ? scheduleMap.get(`${emp.id}___${nextDateStr}`) : undefined);
              const nextShift = nextSched ? shiftMap.get(nextSched.shift_id) : null;
              const nextShiftStart = nextSched?.custom_start_time || nextShift?.start_time;

              let nextDayCheckoutCutoff = '13:00:00';
              if (nextSched && nextShiftStart && !nextShift?.is_off_day && nextShift?.code !== 'OFF') {
                if (nextShift?.is_overnight || nextShiftStart >= '14:00:00') {
                  const buffer = addMinutesToTime(nextShiftStart, -120);
                  nextDayCheckoutCutoff = buffer > '13:00:00' ? buffer : '13:00:00';
                } else if (nextShiftStart < '12:00:00' && nextShiftStart > '05:00:00') {
                  nextDayCheckoutCutoff = nextShiftStart;
                }
              }

              if (nextDayRec && nextDayRec.first_in && (alreadyMatchedNextDay || nextDayRec.first_in <= nextDayCheckoutCutoff)) {
                const dStart = new Date(`${d.dateStr}T${rec.first_in}`);
                const dEnd = new Date(`${nextDateStr}T${nextDayRec.first_in}`);
                const diffHours = (dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60);

                if (alreadyMatchedNextDay || (diffHours >= 3 && diffHours <= 23)) {
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

  return {
    days,
    standardWorkingDaysCount,
    datesWithLogs,
    recordedDays,
    attendanceMap,
    summary,
    detectedPeriod,
    employees,
    defaultShift,
  };
}
