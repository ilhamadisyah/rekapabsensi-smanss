import fs from 'fs';
import path from 'path';
import { Employee, UploadHistory, DailyAttendance, AuditLog, AttendanceCode, ShiftTemplate, EmployeeSchedule, Holiday } from '../types';
import { INITIAL_EMPLOYEES, getEmployeeNameByMachineId } from '../attendance/employee-mapping';
import { parseAttendanceFile } from '../attendance/parser';
import { isSupabaseConfigured } from '../supabase/server';
import { supabaseStore } from './supabase-store';

interface DbSchema {
  employees: Employee[];
  upload_history: UploadHistory[];
  daily_attendance: DailyAttendance[];
  audit_logs: AuditLog[];
  shift_templates: ShiftTemplate[];
  employee_schedules: EmployeeSchedule[];
  holidays: Holiday[];
}

export const DEFAULT_SHIFT_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'shift-normal',
    code: 'NORM',
    name: 'Jam Kerja Normal (Reguler)',
    start_time: '07:30:00',
    end_time: '16:00:00',
    grace_period_minutes: 0,
    is_overnight: false,
    is_off_day: false,
    color: '#2563eb', // Blue
    description: 'Jam operasional standar harian (07:30 - 16:00 WIB)',
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-pagi',
    code: 'PAGI',
    name: 'Shift Pagi (Piket/Asrama)',
    start_time: '06:00:00',
    end_time: '14:00:00',
    grace_period_minutes: 0,
    is_overnight: false,
    is_off_day: false,
    color: '#059669', // Emerald
    description: 'Shift pagi operasional & asrama (06:00 - 14:00 WIB)',
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-siang',
    code: 'SIANG',
    name: 'Shift Siang (Layanan)',
    start_time: '14:00:00',
    end_time: '22:00:00',
    grace_period_minutes: 0,
    is_overnight: false,
    is_off_day: false,
    color: '#d97706', // Amber
    description: 'Shift siang pelayanan (14:00 - 22:00 WIB)',
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-malam',
    code: 'MALAM',
    name: 'Shift Malam (Security/Asrama)',
    start_time: '20:00:00',
    end_time: '06:00:00',
    grace_period_minutes: 0,
    is_overnight: true,
    is_off_day: false,
    color: '#7c3aed', // Purple
    description: 'Shift malam penjagaan & pengawasan (20:00 - 06:00 WIB)',
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-off',
    code: 'OFF',
    name: 'Libur Shift (Bebas Tugas)',
    start_time: '00:00:00',
    end_time: '00:00:00',
    grace_period_minutes: 0,
    is_overnight: false,
    is_off_day: true,
    color: '#64748b', // Slate
    description: 'Hari libur/lepas piket bagi pegawai sistem shift (bebas tap/alpha)',
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DB_PATH = path.resolve(process.cwd(), 'data', 'attendance-db.json');

function ensureDbFile(): DbSchema {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData: DbSchema = {
      employees: INITIAL_EMPLOYEES,
      upload_history: [],
      daily_attendance: [],
      audit_logs: [],
      shift_templates: [...DEFAULT_SHIFT_TEMPLATES],
      employee_schedules: [],
      holidays: [],
    };

    // Auto-seed with ABSENSI 1111.xls if available
    const samplePath = path.resolve(process.cwd(), 'ABSENSI 1111.xls');
    if (fs.existsSync(samplePath)) {
      try {
        const fileBuffer = fs.readFileSync(samplePath);
        const uploadId = 'seed-upload-09-2026';
        const parseResult = parseAttendanceFile(fileBuffer, 9, 2026, uploadId);

        if (parseResult.success && parseResult.records.length > 0) {
          initialData.upload_history.push({
            id: uploadId,
            file_name: 'ABSENSI 1111.xls',
            period_month: 9,
            period_year: 2026,
            total_raw_rows: parseResult.totalRawRows,
            uploaded_by: 'system_seed',
            created_at: new Date().toISOString(),
          });
          initialData.daily_attendance = parseResult.records;
        }
      } catch (e) {
        console.error('Failed to auto-seed ABSENSI 1111.xls:', e);
      }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed: DbSchema = JSON.parse(content);
    let dirty = false;

    if (!parsed.shift_templates || parsed.shift_templates.length === 0) {
      parsed.shift_templates = [...DEFAULT_SHIFT_TEMPLATES];
      dirty = true;
    }
    if (!parsed.employee_schedules) {
      parsed.employee_schedules = [];
      dirty = true;
    }
    if (!parsed.holidays) {
      parsed.holidays = [];
      dirty = true;
    }

    if (dirty) {
      writeDb(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error reading DB_PATH, fallback to empty structure:', err);
    return {
      employees: INITIAL_EMPLOYEES,
      upload_history: [],
      daily_attendance: [],
      audit_logs: [],
      shift_templates: [...DEFAULT_SHIFT_TEMPLATES],
      employee_schedules: [],
      holidays: [],
    };
  }
}

function writeDb(data: DbSchema) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${DB_PATH}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

const localDb = {
  getEmployees(): Employee[] {
    const data = ensureDbFile();
    return data.employees;
  },

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const data = ensureDbFile();
    const idx = data.employees.findIndex((e) => e.id === id || e.machine_id === id);
    if (idx === -1) return null;

    data.employees[idx] = { ...data.employees[idx], ...updates };
    writeDb(data);
    return data.employees[idx];
  },

  getUploadHistory(): UploadHistory[] {
    const data = ensureDbFile();
    return data.upload_history.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  getAttendanceForMonth(month: number, year: number): DailyAttendance[] {
    const data = ensureDbFile();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return data.daily_attendance.filter((att) => att.attendance_date.startsWith(prefix));
  },

  saveAttendanceBatch(
    uploadRecord: UploadHistory,
    records: DailyAttendance[],
    _overwriteExisting: boolean = true,
    employeeNames?: Record<string, string>
  ): {
    savedCount: number;
    preservedVerifiedCount: number;
    updatedCount: number;
    newCount: number;
  } {
    const data = ensureDbFile();

    // 1. Update or record in upload history
    const existingUploadIdx = data.upload_history.findIndex(
      (u) => u.period_month === uploadRecord.period_month && u.period_year === uploadRecord.period_year
    );

    if (existingUploadIdx !== -1) {
      data.upload_history[existingUploadIdx] = uploadRecord;
    } else {
      data.upload_history.push(uploadRecord);
    }

    // 2. Ensure all employees from attendance records exist in data.employees with their real names
    const existingEmpIds = new Set(data.employees.map((e) => e.machine_id));
    for (const rec of records) {
      if (!existingEmpIds.has(rec.employee_id)) {
        existingEmpIds.add(rec.employee_id);
        const resolvedName =
          employeeNames?.[rec.employee_id] ||
          rec.employee_name ||
          getEmployeeNameByMachineId(rec.employee_id) ||
          `Pegawai ${rec.employee_id}`;
        data.employees.push({
          id: `emp-auto-${rec.employee_id}`,
          machine_id: rec.employee_id,
          nik: '',
          full_name: resolvedName,
          department: 'Pegawai',
          excel_row_index: data.employees.length + 1,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    // 3. Map existing daily_attendance by employee_id + attendance_date for quick lookup
    const existingMap = new Map<string, number>();
    data.daily_attendance.forEach((rec, idx) => {
      existingMap.set(`${rec.employee_id}___${rec.attendance_date}`, idx);
    });

    let preservedVerifiedCount = 0;
    let updatedCount = 0;
    let newCount = 0;

    for (const newRec of records) {
      const key = `${newRec.employee_id}___${newRec.attendance_date}`;
      const existingIdx = existingMap.get(key);

      const resolvedName =
        newRec.employee_name ||
        employeeNames?.[newRec.employee_id] ||
        getEmployeeNameByMachineId(newRec.employee_id) ||
        `Pegawai ${newRec.employee_id}`;

      if (existingIdx !== undefined) {
        // Record already exists for this employee and date
        const existingRec = data.daily_attendance[existingIdx];
        const isSystemPlaceholder =
          existingRec.upload_id === 'sync_system' ||
          existingRec.upload_id?.startsWith('virtual-') ||
          existingRec.notes === 'Alpha (Tidak Ada Rekaman Mesin)' ||
          existingRec.notes === 'Libur Rutin (Akhir Pekan)' ||
          existingRec.notes === 'Hari Libur Resmi' ||
          existingRec.notes === 'Libur Shift (Bebas Tugas)';

        const isHumanVerified =
          !isSystemPlaceholder &&
          (
            existingRec.is_verified === true ||
            (Boolean(existingRec.verified_by) && existingRec.verified_by !== 'system') ||
            existingRec.upload_id === 'manual_override' ||
            ['DL', 'S', 'I', 'C', 'IL', 'PM', 'AL', 'OTL', 'HIP', 'HIS'].includes(existingRec.final_status)
          );

        if (isHumanVerified) {
          // RULE: USE DATA YANG SUDAH DIVERIFIKASI (DATA LAMA)
          // Keep the verified final status, verified_by, notes, and verification flag!
          data.daily_attendance[existingIdx] = {
            ...existingRec,
            employee_name: existingRec.employee_name || resolvedName,
            first_in: existingRec.first_in || newRec.first_in,
            last_out: existingRec.last_out || newRec.last_out,
            tap_count: Math.max(existingRec.tap_count || 0, newRec.tap_count || 0),
            system_status: newRec.system_status || existingRec.system_status,
            final_status: existingRec.final_status,
            is_verified: true,
            verified_by: existingRec.verified_by,
            notes: existingRec.notes,
            updated_at: existingRec.updated_at,
          };
          preservedVerifiedCount++;
        } else {
          // Not verified by human (or was system placeholder) -> real biometric record takes precedence!
          data.daily_attendance[existingIdx] = {
            ...newRec,
            employee_name: resolvedName,
            id: existingRec.id || newRec.id,
          };
          updatedCount++;
        }
      } else {
        // Brand new record
        data.daily_attendance.push({
          ...newRec,
          employee_name: resolvedName,
        });
        existingMap.set(key, data.daily_attendance.length - 1);
        newCount++;
      }
    }

    writeDb(data);

    return {
      savedCount: records.length,
      preservedVerifiedCount,
      updatedCount,
      newCount,
    };
  },

  updateAttendanceCell(params: {
    employee_id: string;
    date: string; // YYYY-MM-DD
    final_status: AttendanceCode;
    notes?: string;
    changed_by: string;
  }): { success: boolean; record: DailyAttendance; audit: AuditLog } {
    const data = ensureDbFile();
    const { employee_id, date, final_status, notes, changed_by } = params;

    let recIdx = data.daily_attendance.findIndex(
      (a) => a.employee_id === employee_id && a.attendance_date === date
    );

    let previousStatus: AttendanceCode = 'A';
    let record: DailyAttendance;

    const emp = data.employees.find((e) => e.machine_id === employee_id);
    const empName = emp?.full_name || getEmployeeNameByMachineId(employee_id) || `Pegawai ${employee_id}`;

    if (recIdx !== -1) {
      previousStatus = data.daily_attendance[recIdx].final_status;
      data.daily_attendance[recIdx] = {
        ...data.daily_attendance[recIdx],
        employee_name: empName,
        final_status,
        notes: notes || data.daily_attendance[recIdx].notes,
        is_verified: true,
        verified_by: changed_by,
        updated_at: new Date().toISOString(),
      };
      record = data.daily_attendance[recIdx];
    } else {
      // If cell didn't have log before, create absent record with override
      record = {
        id: `att-${employee_id}-${date}`,
        upload_id: 'manual_override',
        employee_id,
        employee_name: empName,
        attendance_date: date,
        first_in: null,
        last_out: null,
        tap_count: 0,
        system_status: 'TIDAK_HADIR',
        final_status,
        notes,
        is_verified: true,
        verified_by: changed_by,
        updated_at: new Date().toISOString(),
      };
      data.daily_attendance.push(record);
    }

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attendance_id: record.id,
      employee_id,
      employee_name: empName,
      attendance_date: date,
      previous_status: previousStatus,
      new_status: final_status,
      reason: notes || 'Pembaruan verifikasi oleh admin',
      changed_by,
      changed_at: new Date().toISOString(),
    };

    data.audit_logs.push(audit);
    writeDb(data);

    return { success: true, record, audit };
  },

  bulkUpdateAttendance(params: {
    employee_ids: string[];
    dates: string[];
    final_status: AttendanceCode;
    notes?: string;
    changed_by: string;
  }): { updatedCount: number } {
    let count = 0;
    for (const empId of params.employee_ids) {
      for (const d of params.dates) {
        this.updateAttendanceCell({
          employee_id: empId,
          date: d,
          final_status: params.final_status,
          notes: params.notes,
          changed_by: params.changed_by,
        });
        count++;
      }
    }
    return { updatedCount: count };
  },

  getAuditLogs(): AuditLog[] {
    const data = ensureDbFile();
    return data.audit_logs.sort(
      (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
    );
  },

  // --- SHIFT TEMPLATES CRUD ---
  getShiftTemplates(): ShiftTemplate[] {
    const data = ensureDbFile();
    return data.shift_templates || [];
  },

  saveShiftTemplate(template: Partial<ShiftTemplate> & { name: string; code: string }): ShiftTemplate {
    const data = ensureDbFile();
    if (!data.shift_templates) data.shift_templates = [];

    const now = new Date().toISOString();
    const id = template.id || `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const existingIdx = data.shift_templates.findIndex((s) => s.id === id);

    const fullTemplate: ShiftTemplate = {
      id,
      code: (template.code || 'SHIFT').toUpperCase().trim(),
      name: template.name.trim(),
      start_time: template.start_time || '07:30:00',
      end_time: template.end_time || '16:00:00',
      grace_period_minutes: Number(template.grace_period_minutes || 0),
      is_overnight: Boolean(template.is_overnight),
      is_off_day: Boolean(template.is_off_day),
      color: template.color || '#2563eb',
      description: template.description || '',
      is_default: Boolean(template.is_default),
      created_at: existingIdx >= 0 ? data.shift_templates[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      data.shift_templates[existingIdx] = fullTemplate;
    } else {
      data.shift_templates.push(fullTemplate);
    }

    writeDb(data);
    return fullTemplate;
  },

  deleteShiftTemplate(id: string): { success: boolean; error?: string } {
    const data = ensureDbFile();
    if (!data.shift_templates) return { success: false, error: 'Shift template tidak ditemukan' };

    const target = data.shift_templates.find((s) => s.id === id);
    if (!target) {
      return { success: false, error: 'Template shift tidak ditemukan' };
    }

    if (target.is_default) {
      return { success: false, error: 'Template default tidak dapat dihapus' };
    }

    // Check if shift is actively used in schedules
    const usedInSchedules = data.employee_schedules?.some((s) => s.shift_id === id);
    if (usedInSchedules) {
      return { success: false, error: 'Shift ini sedang digunakan dalam jadwal pegawai aktif' };
    }

    data.shift_templates = data.shift_templates.filter((s) => s.id !== id);
    writeDb(data);
    return { success: true };
  },

  // --- EMPLOYEE SCHEDULES CRUD ---
  getEmployeeSchedules(month?: number, year?: number): EmployeeSchedule[] {
    const data = ensureDbFile();
    const schedules = data.employee_schedules || [];

    if (!month || !year) {
      return schedules;
    }

    const monthPad = String(month).padStart(2, '0');
    const prefix = `${year}-${monthPad}`;
    return schedules.filter((s) => s.date.startsWith(prefix));
  },

  getScheduleForEmployeeDate(employee_id: string, date: string): EmployeeSchedule | null {
    const data = ensureDbFile();
    const schedules = data.employee_schedules || [];
    return schedules.find((s) => s.employee_id === employee_id && s.date === date) || null;
  },

  saveEmployeeSchedule(schedule: Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string }): EmployeeSchedule {
    const data = ensureDbFile();
    if (!data.employee_schedules) data.employee_schedules = [];

    const now = new Date().toISOString();
    const id = schedule.id || `sched-${schedule.employee_id}-${schedule.date}`;
    const existingIdx = data.employee_schedules.findIndex(
      (s) => s.employee_id === schedule.employee_id && s.date === schedule.date
    );

    // Resolve shift details
    const shift = data.shift_templates?.find((st) => st.id === schedule.shift_id);
    const emp = data.employees?.find((e) => e.machine_id === schedule.employee_id);

    const fullSchedule: EmployeeSchedule = {
      id,
      employee_id: schedule.employee_id,
      employee_name: schedule.employee_name || emp?.full_name || getEmployeeNameByMachineId(schedule.employee_id),
      date: schedule.date,
      shift_id: schedule.shift_id,
      shift_code: shift?.code || schedule.shift_code || 'NORM',
      shift_name: shift?.name || schedule.shift_name || 'Jam Kerja Normal',
      custom_start_time: schedule.custom_start_time,
      custom_end_time: schedule.custom_end_time,
      notes: schedule.notes || '',
      created_at: existingIdx >= 0 ? data.employee_schedules[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      data.employee_schedules[existingIdx] = fullSchedule;
    } else {
      data.employee_schedules.push(fullSchedule);
    }

    writeDb(data);
    return fullSchedule;
  },

  saveBulkEmployeeSchedules(schedules: (Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string })[]): { saved: number } {
    const data = ensureDbFile();
    if (!data.employee_schedules) data.employee_schedules = [];

    const now = new Date().toISOString();
    let count = 0;

    for (const sched of schedules) {
      const existingIdx = data.employee_schedules.findIndex(
        (s) => s.employee_id === sched.employee_id && s.date === sched.date
      );

      const shift = data.shift_templates?.find((st) => st.id === sched.shift_id);
      const emp = data.employees?.find((e) => e.machine_id === sched.employee_id);

      const fullSchedule: EmployeeSchedule = {
        id: sched.id || `sched-${sched.employee_id}-${sched.date}`,
        employee_id: sched.employee_id,
        employee_name: sched.employee_name || emp?.full_name || getEmployeeNameByMachineId(sched.employee_id),
        date: sched.date,
        shift_id: sched.shift_id,
        shift_code: shift?.code || sched.shift_code || 'NORM',
        shift_name: shift?.name || sched.shift_name || 'Jam Kerja Normal',
        custom_start_time: sched.custom_start_time,
        custom_end_time: sched.custom_end_time,
        notes: sched.notes || '',
        created_at: existingIdx >= 0 ? data.employee_schedules[existingIdx].created_at : now,
        updated_at: now,
      };

      if (existingIdx >= 0) {
        data.employee_schedules[existingIdx] = fullSchedule;
      } else {
        data.employee_schedules.push(fullSchedule);
      }
      count++;
    }

    writeDb(data);
    return { saved: count };
  },

  deleteEmployeeSchedule(employee_id: string, date: string): boolean {
    const data = ensureDbFile();
    if (!data.employee_schedules) return false;

    const initialLen = data.employee_schedules.length;
    data.employee_schedules = data.employee_schedules.filter(
      (s) => !(s.employee_id === employee_id && s.date === date)
    );

    if (data.employee_schedules.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // --- HOLIDAYS CRUD ---
  getHolidays(month?: number, year?: number): Holiday[] {
    const data = ensureDbFile();
    const holidays = data.holidays || [];
    if (!month || !year) {
      return holidays.sort((a, b) => a.date.localeCompare(b.date));
    }
    const monthPad = String(month).padStart(2, '0');
    const prefix = `${year}-${monthPad}`;
    return holidays
      .filter((h) => h.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  saveHoliday(holiday: Partial<Holiday> & { date: string; name: string }): Holiday {
    const data = ensureDbFile();
    if (!data.holidays) data.holidays = [];

    const now = new Date().toISOString();
    const id = holiday.id || `hol-${holiday.date}`;
    const existingIdx = data.holidays.findIndex((h) => h.id === id || h.date === holiday.date);

    const fullHoliday: Holiday = {
      id,
      date: holiday.date,
      name: holiday.name.trim(),
      category: holiday.category || 'school',
      notes: holiday.notes?.trim() || '',
      created_at: existingIdx >= 0 ? data.holidays[existingIdx].created_at : now,
      updated_at: now,
    };

    if (existingIdx >= 0) {
      data.holidays[existingIdx] = fullHoliday;
    } else {
      data.holidays.push(fullHoliday);
    }

    writeDb(data);
    return fullHoliday;
  },

  deleteHoliday(id: string): boolean {
    const data = ensureDbFile();
    if (!data.holidays) return false;
    const initialLen = data.holidays.length;
    data.holidays = data.holidays.filter((h) => h.id !== id && h.date !== id);
    if (data.holidays.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // --- COPY SCHEDULES ACROSS MONTHS ---
  copySchedulesFromMonth(
    fromMonth: number,
    fromYear: number,
    toMonth: number,
    toYear: number
  ): { copiedCount: number } {
    const data = ensureDbFile();
    if (!data.employee_schedules) data.employee_schedules = [];

    const fromSchedules = this.getEmployeeSchedules(fromMonth, fromYear);
    if (fromSchedules.length === 0) {
      return { copiedCount: 0 };
    }

    const toTotalDays = new Date(toYear, toMonth, 0).getDate();
    const toMonthPad = String(toMonth).padStart(2, '0');
    let count = 0;

    for (const sched of fromSchedules) {
      const dayPart = parseInt(sched.date.split('-')[2], 10);
      if (dayPart > toTotalDays) continue; // Skip days outside target month

      const targetDate = `${toYear}-${toMonthPad}-${String(dayPart).padStart(2, '0')}`;
      this.saveEmployeeSchedule({
        employee_id: sched.employee_id,
        employee_name: sched.employee_name,
        date: targetDate,
        shift_id: sched.shift_id,
        shift_code: sched.shift_code,
        shift_name: sched.shift_name,
        custom_start_time: sched.custom_start_time,
        custom_end_time: sched.custom_end_time,
        notes: sched.notes,
      });
      count++;
    }

    return { copiedCount: count };
  },
};

export const db = {
  async getEmployees(): Promise<Employee[]> {
    if (isSupabaseConfigured) return supabaseStore.getEmployees();
    return localDb.getEmployees();
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    if (isSupabaseConfigured) return supabaseStore.updateEmployee(id, updates);
    return localDb.updateEmployee(id, updates);
  },

  async getUploadHistory(): Promise<UploadHistory[]> {
    if (isSupabaseConfigured) return supabaseStore.getUploadHistory();
    return localDb.getUploadHistory();
  },

  async getAttendanceForMonth(month: number, year: number): Promise<DailyAttendance[]> {
    if (isSupabaseConfigured) return supabaseStore.getAttendanceForMonth(month, year);
    return localDb.getAttendanceForMonth(month, year);
  },

  async saveAttendanceBatch(
    uploadRecord: UploadHistory,
    records: DailyAttendance[],
    overwriteExisting: boolean = true,
    employeeNames?: Record<string, string>
  ) {
    if (isSupabaseConfigured) {
      return supabaseStore.saveAttendanceBatch(uploadRecord, records, overwriteExisting, employeeNames);
    }
    return localDb.saveAttendanceBatch(uploadRecord, records, overwriteExisting, employeeNames);
  },

  async updateAttendanceCell(params: {
    employee_id: string;
    date: string;
    final_status: AttendanceCode;
    notes?: string;
    changed_by: string;
  }) {
    if (isSupabaseConfigured) return supabaseStore.updateAttendanceCell(params);
    return localDb.updateAttendanceCell(params);
  },

  async bulkUpdateAttendance(params: {
    employee_ids: string[];
    dates: string[];
    final_status: AttendanceCode;
    notes?: string;
    changed_by: string;
  }) {
    if (isSupabaseConfigured) return supabaseStore.bulkUpdateAttendance(params);
    return localDb.bulkUpdateAttendance(params);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured) return supabaseStore.getAuditLogs();
    return localDb.getAuditLogs();
  },

  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    if (isSupabaseConfigured) return supabaseStore.getShiftTemplates();
    return localDb.getShiftTemplates();
  },

  async saveShiftTemplate(template: Partial<ShiftTemplate> & { name: string; code: string }): Promise<ShiftTemplate> {
    if (isSupabaseConfigured) return supabaseStore.saveShiftTemplate(template);
    return localDb.saveShiftTemplate(template);
  },

  async deleteShiftTemplate(id: string) {
    if (isSupabaseConfigured) return supabaseStore.deleteShiftTemplate(id);
    return localDb.deleteShiftTemplate(id);
  },

  async getEmployeeSchedules(month?: number, year?: number): Promise<EmployeeSchedule[]> {
    if (isSupabaseConfigured) return supabaseStore.getEmployeeSchedules(month, year);
    return localDb.getEmployeeSchedules(month, year);
  },

  async getScheduleForEmployeeDate(employee_id: string, date: string): Promise<EmployeeSchedule | null> {
    if (isSupabaseConfigured) return supabaseStore.getScheduleForEmployeeDate(employee_id, date);
    return localDb.getScheduleForEmployeeDate(employee_id, date);
  },

  async saveEmployeeSchedule(
    schedule: Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string }
  ): Promise<EmployeeSchedule> {
    if (isSupabaseConfigured) return supabaseStore.saveEmployeeSchedule(schedule);
    return localDb.saveEmployeeSchedule(schedule);
  },

  async saveBulkEmployeeSchedules(
    schedules: (Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string })[]
  ) {
    if (isSupabaseConfigured) return supabaseStore.saveBulkEmployeeSchedules(schedules);
    return localDb.saveBulkEmployeeSchedules(schedules);
  },

  async deleteEmployeeSchedule(employee_id: string, date: string): Promise<boolean> {
    if (isSupabaseConfigured) return supabaseStore.deleteEmployeeSchedule(employee_id, date);
    return localDb.deleteEmployeeSchedule(employee_id, date);
  },

  async getHolidays(month?: number, year?: number): Promise<Holiday[]> {
    if (isSupabaseConfigured) return supabaseStore.getHolidays(month, year);
    return localDb.getHolidays(month, year);
  },

  async saveHoliday(holiday: Partial<Holiday> & { date: string; name: string }): Promise<Holiday> {
    if (isSupabaseConfigured) return supabaseStore.saveHoliday(holiday);
    return localDb.saveHoliday(holiday);
  },

  async deleteHoliday(id: string): Promise<boolean> {
    if (isSupabaseConfigured) return supabaseStore.deleteHoliday(id);
    return localDb.deleteHoliday(id);
  },

  async copySchedulesFromMonth(
    fromMonth: number,
    fromYear: number,
    toMonth: number,
    toYear: number
  ) {
    if (isSupabaseConfigured) {
      return supabaseStore.copySchedulesFromMonth(fromMonth, fromYear, toMonth, toYear);
    }
    return localDb.copySchedulesFromMonth(fromMonth, fromYear, toMonth, toYear);
  },
};
