import * as XLSX from 'xlsx';
import { DailyAttendance, AttendanceCode } from '../types';
import { getEmployeeNameByMachineId } from './employee-mapping';

export interface DetectedPeriod {
  year: number;
  month: number;
  monthName: string;
  startDay: number;
  endDay: number;
  totalDays: number;
  startDate: string;
  endDate: string;
  formattedRange: string;
  totalRawPunches: number;
  uniqueEmployees: number;
}

export interface RawPunchRecord {
  machineId: string;
  name: string;
  timestamp: Date;
  dateStr: string;
  timeStr: string;
}

export interface ParseResult {
  success: boolean;
  error?: string;
  records: DailyAttendance[];
  totalRawRows: number;
  uniqueEmployees: number;
  totalPresent: number;
  totalUnverifiedRed: number;
  detectedDates: string[];
  detectedPeriod?: DetectedPeriod;
  employeeNames?: Record<string, string>;
}

const MONTH_NAMES_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Automatically inspects a raw attendance file (.xls / .xlsx)
 * and detects the date range (start date to end date) and month/year.
 */
export function detectPeriodFromFile(fileBuffer: Buffer): { success: boolean; period?: DetectedPeriod; error?: string } {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, error: 'Berkas tidak memiliki sheet yang valid.' };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawRows.length === 0) {
      return { success: false, error: 'Berkas kosong.' };
    }

    // Locate header row containing 'No. ID', 'Nama', 'Waktu', 'Status'
    let timeColIdx = -1;
    let idColIdx = -1;
    let headerRowIdx = -1;

    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;
      const rowStr = row.map((cell) => String(cell || '').trim().toLowerCase());
      const tIdx = rowStr.findIndex((c) => c === 'waktu' || c === 'time' || c === 'jam');
      const iIdx = rowStr.findIndex((c) => c === 'no. id' || c === 'id' || c === 'no.id');
      if (tIdx !== -1) {
        timeColIdx = tIdx;
        idColIdx = iIdx;
        headerRowIdx = i;
        break;
      }
    }

    if (timeColIdx === -1) {
      return { success: false, error: 'Kolom Waktu transaksi tidak ditemukan dalam berkas.' };
    }

    const parsedDates: { year: number; month: number; day: number; empId?: string }[] = [];
    const empSet = new Set<string>();

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;
      const rawTime = row[timeColIdx];
      const rawId = idColIdx !== -1 ? String(row[idColIdx] || '').trim().replace(/\.0$/, '') : '';

      if (!rawTime || String(rawTime).toLowerCase().includes('waktu')) continue;
      if (rawId) empSet.add(rawId);

      let d: Date | null = null;
      if (typeof rawTime === 'number') {
        d = excelSerialToDate(rawTime);
      } else if (typeof rawTime === 'string') {
        const timeClean = rawTime.trim();
        const parsedMs = Date.parse(timeClean);
        if (!isNaN(parsedMs)) {
          d = new Date(parsedMs);
        } else {
          const match = timeClean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
          if (match) {
            d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
          }
        }
      }

      if (d && !isNaN(d.getTime())) {
        parsedDates.push({
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          day: d.getDate(),
          empId: rawId,
        });
      }
    }

    if (parsedDates.length === 0) {
      return { success: false, error: 'Tidak ditemukan rekaman tanggal valid di dalam berkas.' };
    }

    // Determine year, month, and day ranges
    const yearCounts: Record<number, number> = {};
    const monthCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};

    parsedDates.forEach((p) => {
      yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
      monthCounts[p.month] = (monthCounts[p.month] || 0) + 1;
      dayCounts[p.day] = (dayCounts[p.day] || 0) + 1;
    });

    const detectedYear = Number(
      Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0][0]
    );

    const uniqueMonths = Object.keys(monthCounts).map(Number);
    const uniqueDays = Object.keys(dayCounts).map(Number);

    let targetMonth: number;
    let actualDays: number[] = [];

    // Check if day is constant (e.g. all 9s) and months vary (1, 2, 3) -> Indonesian DD/MM swapped format!
    if (uniqueDays.length === 1 && uniqueMonths.length > 1) {
      targetMonth = uniqueDays[0];
      actualDays = uniqueMonths.sort((a, b) => a - b);
    } else if (uniqueMonths.length === 1 && uniqueDays.length > 1) {
      targetMonth = uniqueMonths[0];
      actualDays = uniqueDays.sort((a, b) => a - b);
    } else {
      // General case: choose most frequent month
      targetMonth = Number(
        Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0][0]
      );
      actualDays = Array.from(
        new Set(parsedDates.filter((d) => d.month === targetMonth).map((d) => d.day))
      ).sort((a, b) => a - b);
    }

    const startDay = actualDays[0] || 1;
    const endDay = actualDays[actualDays.length - 1] || 1;
    const mName = MONTH_NAMES_ID[targetMonth] || `Bulan ${targetMonth}`;

    const startDate = `${detectedYear}-${String(targetMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${detectedYear}-${String(targetMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const formattedRange = `${startDay} ${mName} ${detectedYear} s/d ${endDay} ${mName} ${detectedYear}`;

    return {
      success: true,
      period: {
        year: detectedYear,
        month: targetMonth,
        monthName: mName,
        startDay,
        endDay,
        totalDays: actualDays.length,
        startDate,
        endDate,
        formattedRange,
        totalRawPunches: parsedDates.length,
        uniqueEmployees: empSet.size,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mendeteksi periode berkas' };
  }
}

/**
 * Converts Excel serial number to JS Date in exact local time
 * Excel base: Dec 30 1899 (due to Excel leap year bug)
 */
export function excelSerialToDate(serial: number): Date {
  const wholeDays = Math.floor(serial);
  const frac = serial - wholeDays;
  const totalSeconds = Math.round(frac * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const date = new Date(1899, 11, 30);
  date.setDate(date.getDate() + wholeDays);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

/**
 * Format Date to YYYY-MM-DD in UTC/local consistent manner
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format Date to HH:mm:ss
 */
export function formatTime(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export interface ScheduleEvaluationContext {
  startTime?: string;
  endTime?: string;
  gracePeriodMinutes?: number;
  isOvernight?: boolean;
  isOffDay?: boolean;
  isHoliday?: boolean;
  holidayName?: string;
  hasAssignedDuty?: boolean;
}

/**
 * Evaluates attendance condition according to PRD FR-04 & dynamic shift schedule:
 * Hadir iff N >= 2 AND Tin <= startTime (+grace) AND Tout >= endTime
 */
export function evaluateAttendanceStatus(
  firstIn: string | null,
  lastOut: string | null,
  tapCount: number,
  isWeekend: boolean,
  scheduleContext?: ScheduleEvaluationContext
): { systemStatus: 'HADIR' | 'TIDAK_HADIR'; finalStatus: AttendanceCode } {
  // 1. If date is a designated Blackout Holiday (Hari Libur Tambahan / Nasional / Sekolah)
  if (scheduleContext?.isHoliday) {
    // Case A: Employee came to work on the holiday (has biometric taps) -> Recognized as HADIR
    if (firstIn && (lastOut || tapCount >= 1)) {
      return { systemStatus: 'HADIR', finalStatus: 'HADIR' };
    }
    // Case B: Employee was specifically assigned a duty shift on the holiday, but failed to tap -> Alpa
    if (scheduleContext.hasAssignedDuty && (!firstIn || !lastOut || tapCount < 2)) {
      return { systemStatus: 'TIDAK_HADIR', finalStatus: 'A' };
    }
    // Case C: Regular employee without duty shift on holiday -> Exempt from Alpha penalty & status is LIBUR
    return { systemStatus: 'HADIR', finalStatus: 'LIBUR' };
  }

  // 2. If schedule explicitly designates this as an OFF day (libur shift)
  if (scheduleContext?.isOffDay) {
    if (firstIn && (lastOut || tapCount >= 1)) {
      return { systemStatus: 'HADIR', finalStatus: 'HADIR' };
    }
    return { systemStatus: 'HADIR', finalStatus: 'OFF' };
  }

  // 3. Regular weekend with no assigned active work shift
  if (isWeekend && !scheduleContext?.hasAssignedDuty) {
    if (firstIn && (lastOut || tapCount >= 1)) {
      return { systemStatus: 'HADIR', finalStatus: 'HADIR' };
    }
    return { systemStatus: 'HADIR', finalStatus: 'LIBUR' };
  }

  // 4. Standard workday: requires valid check-in, check-out, and at least 2 taps
  if (!firstIn || !lastOut || tapCount < 2) {
    return { systemStatus: 'TIDAK_HADIR', finalStatus: 'A' };
  }

  let checkInLimit = scheduleContext?.startTime || '07:30:00';
  let checkOutLimit = scheduleContext?.endTime || '16:00:00';

  // Apply grace period if configured
  if (scheduleContext?.gracePeriodMinutes && scheduleContext.gracePeriodMinutes > 0) {
    const parts = checkInLimit.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    const totalMinutes = h * 60 + m + scheduleContext.gracePeriodMinutes;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    checkInLimit = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  if (checkInLimit.length === 5) checkInLimit += ':00';
  if (checkOutLimit.length === 5) checkOutLimit += ':00';

  let isCheckInValid = firstIn <= checkInLimit;
  let isCheckOutValid = lastOut >= checkOutLimit;

  // Handle overnight shift support (e.g. 20:00 - 06:00)
  if (scheduleContext?.isOvernight) {
    isCheckInValid = firstIn <= checkInLimit || firstIn >= '18:00:00';
    isCheckOutValid = lastOut >= checkOutLimit || lastOut >= '22:00:00';
  }

  if (isCheckInValid && isCheckOutValid) {
    return { systemStatus: 'HADIR', finalStatus: 'HADIR' };
  }

  return { systemStatus: 'TIDAK_HADIR', finalStatus: 'A' };
}

/**
 * Parses attendance file buffer (.xls or .xlsx) with automatic or specified period
 */
export function parseAttendanceFile(
  fileBuffer: Buffer,
  targetMonth?: number,
  targetYear?: number,
  uploadId: string = 'upload-' + Date.now()
): ParseResult {
  try {
    let activeMonth = targetMonth;
    let activeYear = targetYear;
    let detectedPeriod: DetectedPeriod | undefined;

    // Run automatic period inspection
    const periodCheck = detectPeriodFromFile(fileBuffer);
    if (periodCheck.success && periodCheck.period) {
      detectedPeriod = periodCheck.period;
      // Otomatis mendeteksi bulan dan tahun dari data transaksi mesin
      activeMonth = periodCheck.period.month;
      activeYear = periodCheck.period.year;
    }

    if (!activeMonth || !activeYear) {
      return {
        success: false,
        error: 'Tidak dapat mendeteksi periode bulan dan tahun dari berkas.',
        records: [],
        totalRawRows: 0,
        uniqueEmployees: 0,
        totalPresent: 0,
        totalUnverifiedRed: 0,
        detectedDates: [],
      };
    }
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        error: 'Berkas tidak memiliki sheet yang valid.',
        records: [],
        totalRawRows: 0,
        uniqueEmployees: 0,
        totalPresent: 0,
        totalUnverifiedRed: 0,
        detectedDates: [],
      };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawRows.length === 0) {
      return {
        success: false,
        error: 'Berkas kosong.',
        records: [],
        totalRawRows: 0,
        uniqueEmployees: 0,
        totalPresent: 0,
        totalUnverifiedRed: 0,
        detectedDates: [],
      };
    }

    // Locate header row containing 'No. ID', 'Nama', 'Waktu', 'Status'
    let headerRowIdx = -1;
    let colIdIdx = -1;
    let colNameIdx = -1;
    let colTimeIdx = -1;
    let colStatusIdx = -1;

    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;

      const rowStr = row.map((cell) => String(cell || '').trim().toLowerCase());
      const idIdx = rowStr.findIndex((c) => c === 'no. id' || c === 'id' || c === 'no.id');
      const nameIdx = rowStr.findIndex((c) => c === 'nama' || c === 'name');
      const timeIdx = rowStr.findIndex((c) => c === 'waktu' || c === 'time' || c === 'jam');
      const statusIdx = rowStr.findIndex((c) => c === 'status');

      if (idIdx !== -1 && nameIdx !== -1 && timeIdx !== -1) {
        headerRowIdx = i;
        colIdIdx = idIdx;
        colNameIdx = nameIdx;
        colTimeIdx = timeIdx;
        colStatusIdx = statusIdx;
        break;
      }
    }

    if (headerRowIdx === -1) {
      return {
        success: false,
        error: 'Header berkas tidak valid. Berkas wajib memuat kolom: No. ID, Nama, Waktu, Status.',
        records: [],
        totalRawRows: 0,
        uniqueEmployees: 0,
        totalPresent: 0,
        totalUnverifiedRed: 0,
        detectedDates: [],
      };
    }

    // Extract valid punches
    const rawPunches: RawPunchRecord[] = [];
    let validRowCount = 0;

    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      const rawId = row[colIdIdx];
      const rawName = row[colNameIdx];
      const rawTime = row[colTimeIdx];

      // Ignore header repetitions or empty rows
      if (!rawId || !rawTime || String(rawId).toLowerCase().includes('no. id') || String(rawTime).toLowerCase().includes('waktu')) {
        continue;
      }

      const machineId = String(rawId).trim().replace(/\.0$/, '');
      const name = String(rawName || '').trim();

      let timestamp: Date | null = null;

      if (typeof rawTime === 'number') {
        timestamp = excelSerialToDate(rawTime);
      } else if (typeof rawTime === 'string') {
        const timeClean = rawTime.trim();
        // Try parsing string datetime
        const parsedMs = Date.parse(timeClean);
        if (!isNaN(parsedMs)) {
          timestamp = new Date(parsedMs);
        } else {
          // Check DD/MM/YYYY HH:mm:ss format
          const match = timeClean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
          if (match) {
            const [, d, m, y, h, min, s] = match;
            timestamp = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s || 0));
          }
        }
      }

      if (!timestamp || isNaN(timestamp.getTime())) {
        continue;
      }

      // Handle common Excel DD/MM vs MM/DD swap anomaly:
      // If the parsed date's day matches activeMonth, but its month does not, swap them!
      if (timestamp.getDate() === activeMonth && timestamp.getMonth() + 1 !== activeMonth) {
        const oldDay = timestamp.getDate();
        const oldMonth = timestamp.getMonth() + 1;
        timestamp = new Date(
          activeYear,
          oldDay - 1, // Month index 0-11
          oldMonth,   // Day of month
          timestamp.getHours(),
          timestamp.getMinutes(),
          timestamp.getSeconds()
        );
      }

      // Check if matches target year and month
      if (timestamp.getFullYear() !== activeYear || timestamp.getMonth() + 1 !== activeMonth) {
        continue;
      }

      validRowCount++;
      rawPunches.push({
        machineId,
        name,
        timestamp,
        dateStr: formatDate(timestamp),
        timeStr: formatTime(timestamp),
      });
    }

    // Group punches by (machineId, dateStr)
    const grouped = new Map<string, RawPunchRecord[]>();
    const detectedDatesSet = new Set<string>();
    const uniqueEmployeesSet = new Set<string>();

    for (const punch of rawPunches) {
      const key = `${punch.machineId}__${punch.dateStr}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(punch);
      detectedDatesSet.add(punch.dateStr);
      uniqueEmployeesSet.add(punch.machineId);
    }

    const records: DailyAttendance[] = [];
    const employeeNames: Record<string, string> = {};
    let totalPresent = 0;
    let totalUnverifiedRed = 0;

    for (const [key, punches] of grouped.entries()) {
      const [machineId, dateStr] = key.split('__');

      // Sort punches chronologically
      punches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const firstIn = punches[0].timeStr;
      const lastOut = punches[punches.length - 1].timeStr;
      const tapCount = punches.length;
      const rawName = punches[0]?.name || '';
      const realName = getEmployeeNameByMachineId(machineId, rawName);
      employeeNames[machineId] = realName;

      // Check weekend
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const { systemStatus, finalStatus } = evaluateAttendanceStatus(firstIn, lastOut, tapCount, isWeekend);

      if (finalStatus === 'HADIR') {
        totalPresent++;
      } else if (!isWeekend && finalStatus === 'A') {
        totalUnverifiedRed++;
      }

      records.push({
        id: `att-${machineId}-${dateStr}`,
        upload_id: uploadId,
        employee_id: machineId,
        employee_name: realName,
        attendance_date: dateStr,
        first_in: firstIn,
        last_out: lastOut,
        tap_count: tapCount,
        system_status: systemStatus,
        final_status: finalStatus,
        is_verified: finalStatus === 'HADIR',
        updated_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      records,
      totalRawRows: validRowCount,
      uniqueEmployees: uniqueEmployeesSet.size,
      totalPresent,
      totalUnverifiedRed,
      detectedDates: Array.from(detectedDatesSet).sort(),
      detectedPeriod,
      employeeNames,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Gagal memproses berkas: ${err.message || 'Kesalahan parsing'}`,
      records: [],
      totalRawRows: 0,
      uniqueEmployees: 0,
      totalPresent: 0,
      totalUnverifiedRed: 0,
      detectedDates: [],
    };
  }
}
