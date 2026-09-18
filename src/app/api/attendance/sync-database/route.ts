import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { evaluateAttendanceStatus, addMinutesToTime } from '@/lib/attendance/parser';
import { AttendanceCode, DailyAttendance } from '@/lib/types';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { sanitizeDailyAttendanceForDb } from '@/lib/storage/supabase-store';
import { requireSuperAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const month = parseInt(body.month || '9', 10);
    const year = parseInt(body.year || '2026', 10);

    // 1. Fetch all reference data
    const allEmployees = await db.getEmployees();
    const employees = allEmployees.filter((e) => e.is_active);
    const shifts = await db.getShiftTemplates();
    const defaultShift =
      shifts.find((s) => s.is_default) ||
      shifts.find((s) => s.code === 'NORM') ||
      shifts[0] || {
        id: 'shift-normal',
        code: 'NORM',
        name: 'Jam Kerja Normal',
        start_time: '08:00',
        end_time: '14:30',
        grace_period_minutes: 0,
        check_in_window_minutes: 120,
        check_out_window_minutes: 240,
        is_overnight: false,
        is_off_day: false,
      };
    const schedules = await db.getEmployeeSchedules(month, year);
    const holidays = await db.getHolidays(month, year);
    const existingAttendance = await db.getAttendanceForMonth(month, year);

    // 2. Maps for fast lookup
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const holidayMap = new Map(holidays.map((h) => [h.date, h]));
    const scheduleMap = new Map(schedules.map((s) => [`${s.employee_id}___${s.date}`, s]));

    // Existing attendance map: keyed by all possible identifiers of an employee
    const attendanceMap = new Map<string, DailyAttendance>();
    existingAttendance.forEach((rec) => {
      attendanceMap.set(`${rec.employee_id}___${rec.attendance_date}`, rec);
      const emp = employees.find((e) => e.id === rec.employee_id || e.nik === rec.employee_id || e.machine_id === rec.employee_id);
      if (emp) {
        if (emp.nik) attendanceMap.set(`${emp.nik}___${rec.attendance_date}`, rec);
        if (emp.machine_id) attendanceMap.set(`${emp.machine_id}___${rec.attendance_date}`, rec);
        if (emp.id) attendanceMap.set(`${emp.id}___${rec.attendance_date}`, rec);
      }
    });

    // Determine days that have biometric logs
    const datesWithLogs = new Set(
      existingAttendance
        .filter((r) => (r.tap_count && r.tap_count > 0) || r.first_in !== null)
        .map((r) => r.attendance_date)
    );
    const recordedDays = Array.from(
      new Set(Array.from(datesWithLogs).map((d) => parseInt(d.split('-')[2], 10)))
    );

    const daysInMonth = 30;
    const recordsToSync: DailyAttendance[] = [];

    let countHadir = 0;
    let countLibur = 0;
    let countOff = 0;
    let countAlpha = 0;
    let countVerified = 0;

    for (const emp of employees) {
      const primaryEmpId = emp.nik || emp.id || emp.machine_id;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const isRecordedDay = recordedDays.includes(day);
        const sched =
          (emp.nik ? scheduleMap.get(`${emp.nik}___${dateStr}`) : undefined) ||
          scheduleMap.get(`${emp.machine_id}___${dateStr}`) ||
          (emp.id ? scheduleMap.get(`${emp.id}___${dateStr}`) : undefined);
        const hol = holidayMap.get(dateStr);
        const shift = sched ? shiftMap.get(sched.shift_id) : null;

        const isHoliday = Boolean(hol);
        const isExplicitOffShift = Boolean(sched && (shift?.is_off_day === true || shift?.code === 'OFF'));
        const hasAssignedDuty = Boolean(sched && !isExplicitOffShift);
        const isWeekendLibur = isWeekend && !hasAssignedDuty;

        const startTime = sched?.custom_start_time || shift?.start_time || defaultShift.start_time;
        const endTime = sched?.custom_end_time || shift?.end_time || defaultShift.end_time;
        const gracePeriod = shift?.grace_period_minutes ?? defaultShift.grace_period_minutes;
        const isOvernight = Boolean(shift?.is_overnight ?? defaultShift.is_overnight ?? (startTime > endTime));
        const checkInWindowMinutes = shift?.check_in_window_minutes ?? (isOvernight ? 300 : 120);
        const checkOutWindowMinutes = shift?.check_out_window_minutes ?? 240;

        const existing =
          (emp.nik ? attendanceMap.get(`${emp.nik}___${dateStr}`) : undefined) ||
          attendanceMap.get(`${emp.machine_id}___${dateStr}`) ||
          (emp.id ? attendanceMap.get(`${emp.id}___${dateStr}`) : undefined);

        if (existing) {
          // Check if manually verified by admin (DL, S, I, C, IL, PM, AL, OTL, HIP, HIS, or human-verified)
          const isManuallyVerified = Boolean(
            existing.is_verified === true ||
            existing.upload_id === 'manual_override' ||
            (Boolean(existing.verified_by) && existing.verified_by !== 'system') ||
            ['DL', 'S', 'I', 'C', 'IL', 'PM', 'AL', 'OTL', 'HIP', 'HIS'].includes(existing.final_status)
          );

          if (isManuallyVerified) {
            // Preserve manual verification exactly, ensuring it is permanently marked as manual_override
            recordsToSync.push({
              ...existing,
              employee_name: existing.employee_name || emp.full_name,
              upload_id: 'manual_override',
              is_verified: true,
              updated_at: existing.updated_at || new Date().toISOString(),
            });
            countVerified++;
            continue;
          }

          // Check Cross-Day Punch Pairing for overnight shifts:
          let effectiveFirstIn = existing.first_in;
          let effectiveLastOut = existing.last_out;
          let effectiveTapCount = existing.tap_count;
          let isCrossDaySession = Boolean(existing.is_cross_day) || Boolean(isOvernight && effectiveFirstIn && effectiveLastOut && (effectiveFirstIn as string) > (effectiveLastOut as string));
          let sessionNotes = existing.notes;

          if (isOvernight) {
            const earliestEveningIn = addMinutesToTime(startTime, -checkInWindowMinutes);

            // Special repair case: if first_in occurred before this shift's check-in window opened (< earliestEveningIn)
            // and last_out is a valid check-in within this shift's check-in window (>= earliestEveningIn):
            if (
              effectiveFirstIn &&
              effectiveLastOut &&
              effectiveFirstIn < earliestEveningIn &&
              effectiveLastOut >= earliestEveningIn
            ) {
              const prevCarry = effectiveFirstIn;
              effectiveFirstIn = effectiveLastOut;
              effectiveLastOut = null;
              effectiveTapCount = 1;
              sessionNotes = (sessionNotes ? `${sessionNotes}; ` : '') + `Tap keluar limpahan shift akhir bulan sebelumnya (${prevCarry.substring(0, 5)})`;
            }

            // Look up next day's record for morning checkout
            const dNext = new Date(dateStr + 'T00:00:00');
            dNext.setDate(dNext.getDate() + 1);
            const nextDateStr = `${dNext.getFullYear()}-${String(dNext.getMonth() + 1).padStart(2, '0')}-${String(dNext.getDate()).padStart(2, '0')}`;
            const nextRec =
              (emp.nik ? attendanceMap.get(`${emp.nik}___${nextDateStr}`) : undefined) ||
              (emp.machine_id ? attendanceMap.get(`${emp.machine_id}___${nextDateStr}`) : undefined) ||
              (emp.id ? attendanceMap.get(`${emp.id}___${nextDateStr}`) : undefined);

            const needsNextDayCheckout = !effectiveLastOut || effectiveLastOut >= earliestEveningIn || effectiveTapCount < 2;
            const alreadyMatchedNextDay = Boolean(effectiveLastOut && nextRec && nextRec.first_in && nextRec.first_in === effectiveLastOut);

            if (effectiveFirstIn && effectiveFirstIn >= earliestEveningIn && (needsNextDayCheckout || alreadyMatchedNextDay)) {
              // Check schedule of next day to determine natural boundary:
              const nextSched =
                (emp.nik ? scheduleMap.get(`${emp.nik}___${nextDateStr}`) : undefined) ||
                scheduleMap.get(`${emp.machine_id}___${nextDateStr}`) ||
                (emp.id ? scheduleMap.get(`${emp.id}___${nextDateStr}`) : undefined);
              const nextShift = nextSched ? shiftMap.get(nextSched.shift_id) : null;
              const nextShiftStart = nextSched?.custom_start_time || nextShift?.start_time;

              // Dynamic checkout cutoff for overnight shift based on shift settings:
              // Closes dynamically at endTime + checkOutWindowMinutes
              let nextDayCheckoutCutoff = addMinutesToTime(endTime, checkOutWindowMinutes);

              // If next day has an active work shift, checkout must not clash with next shift's check-in opening:
              const nextIsActiveWorkShift = Boolean(nextSched && nextShiftStart && !nextShift?.is_off_day && nextShift?.code !== 'OFF' && nextShiftStart !== '00:00:00');
              if (nextIsActiveWorkShift && nextShiftStart) {
                const nextInWin = typeof nextShift?.check_in_window_minutes === 'number' && nextShift.check_in_window_minutes > 0
                  ? nextShift.check_in_window_minutes
                  : 120;
                const nextShiftCheckInOpens = addMinutesToTime(nextShiftStart, -nextInWin);
                if (nextDayCheckoutCutoff > nextShiftCheckInOpens && nextShiftCheckInOpens > endTime) {
                  nextDayCheckoutCutoff = nextShiftCheckInOpens;
                }
              }

              if (nextRec && nextRec.first_in && (alreadyMatchedNextDay || nextRec.first_in <= nextDayCheckoutCutoff)) {
                const dStart = new Date(`${dateStr}T${effectiveFirstIn}`);
                const dEnd = new Date(`${nextDateStr}T${nextRec.first_in}`);
                const diffHours = (dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60);

                if (alreadyMatchedNextDay || (diffHours >= 3 && diffHours <= 23)) {
                  effectiveLastOut = nextRec.first_in;
                  effectiveTapCount = Math.max(effectiveTapCount || 1, 2);
                  isCrossDaySession = true;

                  // Consume morning checkout punch from next day's record
                  if (nextRec.last_out) {
                    nextRec.first_in = nextRec.last_out;
                    nextRec.last_out = null;
                    nextRec.tap_count = Math.max(1, (nextRec.tap_count || 2) - 1);
                  } else {
                    nextRec.first_in = null;
                    nextRec.last_out = null;
                    nextRec.tap_count = 0;
                  }
                  nextRec.is_cross_day = false;
                } else if (diffHours > 23) {
                  sessionNotes = 'Rentang tap melebihi batas maksimal 23 jam';
                }
              }
            }
          }

          // Existing record from biometric punch: re-evaluate against assigned shift / holiday / weekend
          const scheduleContext = {
            startTime,
            endTime,
            gracePeriodMinutes: gracePeriod,
            checkInWindowMinutes,
            checkOutWindowMinutes,
            isOvernight,
            isOffDay: isExplicitOffShift,
            isHoliday,
            holidayName: hol?.name,
            hasAssignedDuty,
            isCrossDaySession,
          };

          const evaluated = evaluateAttendanceStatus(
            effectiveFirstIn,
            effectiveLastOut,
            effectiveTapCount,
            isWeekend,
            scheduleContext
          );

          const finalStatus = evaluated.finalStatus;
          const systemStatus = evaluated.systemStatus;

          if (finalStatus === 'HADIR') countHadir++;
          else if (finalStatus === 'LIBUR') countLibur++;
          else if (finalStatus === 'OFF') countOff++;
          else countAlpha++;

          recordsToSync.push({
            ...existing,
            employee_name: existing.employee_name || emp.full_name,
            first_in: effectiveFirstIn,
            last_out: effectiveLastOut,
            tap_count: effectiveTapCount,
            system_status: systemStatus,
            final_status: finalStatus,
            notes: sessionNotes || existing.notes,
            is_cross_day: isCrossDaySession,
            is_verified: false,
            updated_at: new Date().toISOString(),
          });
        } else {
          // No punch record exists for this employee & date
          if ((isHoliday || isWeekendLibur) && !hasAssignedDuty) {
            // Designated Holiday or Weekend -> LIBUR
            recordsToSync.push({
              id: `att-${primaryEmpId}-${dateStr}`,
              upload_id: 'sync_system',
              employee_id: primaryEmpId,
              employee_name: emp.full_name,
              attendance_date: dateStr,
              first_in: null,
              last_out: null,
              tap_count: 0,
              system_status: 'HADIR',
              final_status: 'LIBUR',
              notes: isHoliday ? (hol?.name || 'Hari Libur Resmi') : 'Libur Rutin (Akhir Pekan)',
              is_verified: false,
              updated_at: new Date().toISOString(),
            });
            countLibur++;
          } else if (isExplicitOffShift) {
            // Scheduled OFF shift -> OFF
            recordsToSync.push({
              id: `att-${primaryEmpId}-${dateStr}`,
              upload_id: 'sync_system',
              employee_id: primaryEmpId,
              employee_name: emp.full_name,
              attendance_date: dateStr,
              first_in: null,
              last_out: null,
              tap_count: 0,
              system_status: 'HADIR',
              final_status: 'OFF',
              notes: shift?.name || 'Libur Shift (Bebas Tugas)',
              is_verified: false,
              updated_at: new Date().toISOString(),
            });
            countOff++;
          } else if (isRecordedDay) {
            // Work required on recorded machine log date, but employee was absent -> Alpha (A)
            recordsToSync.push({
              id: `att-${primaryEmpId}-${dateStr}`,
              upload_id: 'sync_system',
              employee_id: primaryEmpId,
              employee_name: emp.full_name,
              attendance_date: dateStr,
              first_in: null,
              last_out: null,
              tap_count: 0,
              system_status: 'TIDAK_HADIR',
              final_status: 'A',
              notes: 'Alpha (Tidak Ada Rekaman Mesin)',
              is_verified: false,
              updated_at: new Date().toISOString(),
            });
            countAlpha++;
          }
        }
      }
    }

    // 3. Batch upsert into database (Supabase or Local JSON)
    const client = isSupabaseConfigured ? getSupabaseServerClient() : null;

    if (client) {
      // Upsert into Supabase in safe chunks of 200
      const chunkSize = 200;
      for (let i = 0; i < recordsToSync.length; i += chunkSize) {
        const chunk = recordsToSync.slice(i, i + chunkSize).map(sanitizeDailyAttendanceForDb);
        const { error: upsertErr } = await client
          .from('daily_attendance')
          .upsert(chunk, { onConflict: 'employee_id,attendance_date' });

        if (upsertErr) {
          console.error('[Supabase] Error syncing daily_attendance batch chunk:', upsertErr);
          throw new Error(`Gagal menyimpan ke database Supabase: ${upsertErr.message}`);
        }
      }
    } else {
      // Local database store
      const uploadRecord = {
        id: `sync-${month}-${year}`,
        file_name: 'Sinkronisasi Sistem & Database',
        period_month: month,
        period_year: year,
        total_raw_rows: recordsToSync.length,
        uploaded_by: 'system_sync',
        created_at: new Date().toISOString(),
      };
      await db.saveAttendanceBatch(uploadRecord, recordsToSync, true);
    }

    return NextResponse.json({
      success: true,
      month,
      year,
      totalSynced: recordsToSync.length,
      summary: {
        totalEmployees: employees.length,
        totalRecords: recordsToSync.length,
        hadir: countHadir,
        libur: countLibur,
        off: countOff,
        alpha: countAlpha,
        verified: countVerified,
      },
      message: `Sinkronisasi database berhasil! ${recordsToSync.length} data presensi (termasuk status Sabtu/Minggu, hari libur, dan jadwal shift) telah tersimpan dan sinkron di database.`,
    });
  } catch (error: any) {
    console.error('Error in /api/attendance/sync-database:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat sinkronisasi database.' },
      { status: 500 }
    );
  }
}
