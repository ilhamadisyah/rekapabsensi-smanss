import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { evaluateAttendanceStatus, addMinutesToTime } from '@/lib/attendance/parser';
import { AttendanceCode, DailyAttendance } from '@/lib/types';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { sanitizeDailyAttendanceForDb } from '@/lib/storage/supabase-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
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

    // Existing attendance map: employee_id___date -> record
    const attendanceMap = new Map<string, DailyAttendance>();
    existingAttendance.forEach((rec) => {
      attendanceMap.set(`${rec.employee_id}___${rec.attendance_date}`, rec);
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
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const key = `${emp.machine_id}___${dateStr}`;

        const isRecordedDay = recordedDays.includes(day);
        const sched = scheduleMap.get(key);
        const hol = holidayMap.get(dateStr);
        const shift = sched ? shiftMap.get(sched.shift_id) : null;

        const isHoliday = Boolean(hol);
        const isExplicitOffShift = Boolean(sched && (shift?.is_off_day === true || shift?.code === 'OFF'));
        const hasAssignedDuty = Boolean(sched && !isExplicitOffShift);
        const isWeekendLibur = isWeekend && !hasAssignedDuty;

        const startTime = sched?.custom_start_time || shift?.start_time || defaultShift.start_time;
        const endTime = sched?.custom_end_time || shift?.end_time || defaultShift.end_time;
        const gracePeriod = shift?.grace_period_minutes ?? defaultShift.grace_period_minutes;
        const checkInWindowMinutes = shift?.check_in_window_minutes ?? defaultShift.check_in_window_minutes ?? 120;
        const checkOutWindowMinutes = shift?.check_out_window_minutes ?? defaultShift.check_out_window_minutes ?? 240;
        const isOvernight = Boolean(shift?.is_overnight ?? defaultShift.is_overnight ?? (startTime > endTime));

        const existing = attendanceMap.get(key);

        if (existing) {
          // Check if manually verified by admin (DL, S, I, C, IL, PM, AL, OTL, HIP, HIS, or human-verified)
          const isSystemPlaceholder =
            existing.upload_id === 'sync_system' ||
            existing.upload_id?.startsWith('virtual-') ||
            existing.notes === 'Alpha (Tidak Ada Rekaman Mesin)' ||
            existing.notes === 'Libur Rutin (Akhir Pekan)' ||
            existing.notes === 'Hari Libur Resmi' ||
            existing.notes === 'Libur Shift (Bebas Tugas)';

          const isManuallyVerified =
            !isSystemPlaceholder &&
            (
              (existing.is_verified === true && Boolean(existing.verified_by) && existing.verified_by !== 'system') ||
              existing.upload_id === 'manual_override' ||
              ['DL', 'S', 'I', 'C', 'IL', 'PM', 'AL', 'OTL', 'HIP', 'HIS'].includes(existing.final_status)
            );

          if (isManuallyVerified) {
            // Preserve manual verification exactly
            recordsToSync.push({
              ...existing,
              employee_name: existing.employee_name || emp.full_name,
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
          let isCrossDaySession = Boolean(existing.is_cross_day);

          if (isOvernight) {
            const earliestEveningIn = addMinutesToTime(startTime, -checkInWindowMinutes);
            const latestMorningOut = addMinutesToTime(endTime, checkOutWindowMinutes);

            if (effectiveFirstIn && effectiveFirstIn >= earliestEveningIn && (!effectiveLastOut || effectiveLastOut >= '15:00:00' || effectiveTapCount < 2)) {
              // Look up next day's record for morning checkout
              const dNext = new Date(dateStr + 'T00:00:00');
              dNext.setDate(dNext.getDate() + 1);
              const nextDateStr = `${dNext.getFullYear()}-${String(dNext.getMonth() + 1).padStart(2, '0')}-${String(dNext.getDate()).padStart(2, '0')}`;
              const nextKey = `${emp.machine_id}___${nextDateStr}`;
              const nextRec = attendanceMap.get(nextKey);
              if (nextRec && nextRec.first_in && nextRec.first_in >= endTime && nextRec.first_in <= latestMorningOut) {
                effectiveLastOut = nextRec.first_in;
                effectiveTapCount = Math.max(effectiveTapCount || 1, 2);
                isCrossDaySession = true;
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
            is_cross_day: isCrossDaySession,
            is_verified: false,
            updated_at: new Date().toISOString(),
          });
        } else {
          // No punch record exists for this employee & date
          if ((isHoliday || isWeekendLibur) && !hasAssignedDuty) {
            // Designated Holiday or Weekend -> LIBUR
            recordsToSync.push({
              id: `att-${emp.machine_id}-${dateStr}`,
              upload_id: 'sync_system',
              employee_id: emp.machine_id,
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
              id: `att-${emp.machine_id}-${dateStr}`,
              upload_id: 'sync_system',
              employee_id: emp.machine_id,
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
              id: `att-${emp.machine_id}-${dateStr}`,
              upload_id: 'sync_system',
              employee_id: emp.machine_id,
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
