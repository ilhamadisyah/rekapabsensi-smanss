import { getSupabaseServerClient } from '../supabase/server';
import {
  Employee,
  UploadHistory,
  DailyAttendance,
  AuditLog,
  AttendanceCode,
  ShiftTemplate,
  EmployeeSchedule,
  Holiday,
} from '../types';
import { getEmployeeNameByMachineId } from '../attendance/employee-mapping';

export const supabaseStore = {
  async getEmployees(): Promise<Employee[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    const allEmployees: Employee[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('employees')
        .select('*')
        .order('excel_row_index', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[Supabase] Error getEmployees:', error);
        break;
      }

      if (data && data.length > 0) {
        allEmployees.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allEmployees;
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const client = getSupabaseServerClient();
    if (!client) return null;

    const { data, error } = await client
      .from('employees')
      .update(updates)
      .or(`id.eq.${id},machine_id.eq.${id}`)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error updateEmployee:', error);
      return null;
    }
    return data;
  },

  async getUploadHistory(): Promise<UploadHistory[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    const { data, error } = await client
      .from('upload_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getUploadHistory:', error);
      return [];
    }
    return data || [];
  },

  async getAttendanceForMonth(month: number, year: number): Promise<DailyAttendance[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    const monthPad = String(month).padStart(2, '0');
    const prefix = `${year}-${monthPad}`;

    const allRecords: DailyAttendance[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await client
        .from('daily_attendance')
        .select('*')
        .like('attendance_date', `${prefix}%`)
        .order('attendance_date', { ascending: true })
        .order('employee_id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[Supabase] Error getAttendanceForMonth:', error);
        break;
      }

      if (data && data.length > 0) {
        allRecords.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    return allRecords;
  },

  async saveAttendanceBatch(
    uploadRecord: UploadHistory,
    records: DailyAttendance[],
    _overwriteExisting: boolean = true,
    employeeNames?: Record<string, string>
  ): Promise<{
    savedCount: number;
    preservedVerifiedCount: number;
    updatedCount: number;
    newCount: number;
  }> {
    const client = getSupabaseServerClient();
    if (!client) {
      return { savedCount: 0, preservedVerifiedCount: 0, updatedCount: 0, newCount: 0 };
    }

    // 1. Record upload history
    await client.from('upload_history').upsert(uploadRecord);

    // 2. Ensure all employees exist in employees table
    const existingEmployees = await this.getEmployees();
    const existingEmpIds = new Set(existingEmployees.map((e) => e.machine_id));
    const newEmployeesToInsert: Employee[] = [];

    for (const rec of records) {
      if (!existingEmpIds.has(rec.employee_id)) {
        existingEmpIds.add(rec.employee_id);
        const resolvedName =
          employeeNames?.[rec.employee_id] ||
          rec.employee_name ||
          getEmployeeNameByMachineId(rec.employee_id) ||
          `Pegawai ${rec.employee_id}`;

        newEmployeesToInsert.push({
          id: `emp-auto-${rec.employee_id}`,
          machine_id: rec.employee_id,
          nik: '',
          full_name: resolvedName,
          department: 'Pegawai',
          excel_row_index: existingEmployees.length + newEmployeesToInsert.length + 1,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      }
    }

    if (newEmployeesToInsert.length > 0) {
      await client.from('employees').upsert(newEmployeesToInsert, { onConflict: 'machine_id' });
    }

    // 3. Fetch existing attendance for this month with deterministic order to preserve verified data
    const existingAttendance = await this.getAttendanceForMonth(
      uploadRecord.period_month,
      uploadRecord.period_year
    );
    const existingMap = new Map<string, DailyAttendance>();
    existingAttendance.forEach((rec) => {
      existingMap.set(`${rec.employee_id}___${rec.attendance_date}`, rec);
    });

    let preservedVerifiedCount = 0;
    let updatedCount = 0;
    let newCount = 0;
    const recordsToUpsert: DailyAttendance[] = [];

    for (const newRec of records) {
      const key = `${newRec.employee_id}___${newRec.attendance_date}`;
      const existingRec = existingMap.get(key);
      const resolvedName =
        newRec.employee_name ||
        employeeNames?.[newRec.employee_id] ||
        getEmployeeNameByMachineId(newRec.employee_id) ||
        `Pegawai ${newRec.employee_id}`;

      if (existingRec) {
        // Distinguish system placeholders from true manual human verifications:
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
            // Manual admin status overrides (DL, Sakit, Izin, Cuti, etc.)
            ['DL', 'S', 'I', 'C', 'IL', 'PM', 'AL', 'OTL', 'HIP', 'HIS'].includes(existingRec.final_status)
          );

        if (isHumanVerified) {
          recordsToUpsert.push({
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
          });
          preservedVerifiedCount++;
        } else {
          // Real biometric punches take precedence over system placeholders!
          recordsToUpsert.push({
            ...newRec,
            employee_name: resolvedName,
            id: existingRec.id || newRec.id,
          });
          updatedCount++;
        }
      } else {
        recordsToUpsert.push({
          ...newRec,
          employee_name: resolvedName,
        });
        newCount++;
      }
    }

    // Upsert batch in safe chunks of 200 to avoid request size limits
    const chunkSize = 200;
    for (let i = 0; i < recordsToUpsert.length; i += chunkSize) {
      const chunk = recordsToUpsert.slice(i, i + chunkSize);
      const { error } = await client
        .from('daily_attendance')
        .upsert(chunk, { onConflict: 'employee_id,attendance_date' });
      if (error) {
        console.error(`[Supabase] Error saving daily_attendance batch chunk ${i}-${i + chunk.length}:`, error);
      }
    }

    return {
      savedCount: records.length,
      preservedVerifiedCount,
      updatedCount,
      newCount,
    };
  },

  async updateAttendanceCell(params: {
    employee_id: string;
    date: string;
    final_status: AttendanceCode;
    notes?: string;
    changed_by: string;
  }): Promise<{ success: boolean; record: DailyAttendance; audit: AuditLog }> {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new Error('Supabase client is not configured.');
    }

    const { employee_id, date, final_status, notes, changed_by } = params;

    // 1. Get existing attendance record if any
    const { data: existingData } = await client
      .from('daily_attendance')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('attendance_date', date)
      .maybeSingle();

    const previousStatus: AttendanceCode = (existingData?.final_status as AttendanceCode) || 'A';

    // 2. Resolve employee name
    const { data: empData } = await client
      .from('employees')
      .select('full_name')
      .eq('machine_id', employee_id)
      .maybeSingle();

    const empName = empData?.full_name || getEmployeeNameByMachineId(employee_id) || `Pegawai ${employee_id}`;

    const recordId = existingData?.id || `att-${employee_id}-${date}`;
    const recordToSave: DailyAttendance = {
      id: recordId,
      upload_id: existingData?.upload_id || 'manual_override',
      employee_id,
      employee_name: empName,
      attendance_date: date,
      first_in: existingData?.first_in || null,
      last_out: existingData?.last_out || null,
      tap_count: existingData?.tap_count || 0,
      system_status: existingData?.system_status || 'TIDAK_HADIR',
      final_status,
      notes: notes !== undefined ? notes : existingData?.notes,
      is_verified: true,
      verified_by: changed_by,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await client
      .from('daily_attendance')
      .upsert(recordToSave, { onConflict: 'employee_id,attendance_date' });

    if (upsertErr) {
      console.error('[Supabase] Error updateAttendanceCell:', upsertErr);
      throw new Error(upsertErr.message);
    }

    const audit: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      attendance_id: recordId,
      employee_id,
      employee_name: empName,
      attendance_date: date,
      previous_status: previousStatus,
      new_status: final_status,
      reason: notes || 'Pembaruan verifikasi oleh admin',
      changed_by,
      changed_at: new Date().toISOString(),
    };

    let { error: auditErr } = await client.from('audit_logs').insert(audit);
    if (auditErr && (auditErr.message.includes('column') || auditErr.message.includes('schema cache'))) {
      const { employee_name, ...cleanAudit } = audit;
      await client.from('audit_logs').insert(cleanAudit);
    }

    return { success: true, record: recordToSave, audit };
  },

  async bulkUpdateAttendance(params: {
    employee_ids: string[];
    dates: string[];
    final_status: AttendanceCode;
    notes?: string;
    changed_by: string;
  }): Promise<{ updatedCount: number }> {
    let count = 0;
    for (const empId of params.employee_ids) {
      for (const d of params.dates) {
        await this.updateAttendanceCell({
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

  async getAuditLogs(): Promise<AuditLog[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(300);

    if (error) {
      console.error('[Supabase] Error getAuditLogs:', error);
      return [];
    }

    const employees = await this.getEmployees();
    const empMap = new Map(employees.map((e) => [e.machine_id, e.full_name]));

    return (data || []).map((log) => ({
      ...log,
      employee_name: log.employee_name || empMap.get(log.employee_id) || getEmployeeNameByMachineId(log.employee_id),
    }));
  },

  // --- SHIFTS ---
  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    const { data, error } = await client
      .from('shift_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase] Error getShiftTemplates:', error);
      return [];
    }
    return data || [];
  },

  async saveShiftTemplate(template: Partial<ShiftTemplate> & { name: string; code: string }): Promise<ShiftTemplate> {
    const client = getSupabaseServerClient();
    if (!client) throw new Error('Supabase client is not configured.');

    const now = new Date().toISOString();
    const id = template.id || `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

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
      created_at: now,
      updated_at: now,
    };

    const { error } = await client.from('shift_templates').upsert(fullTemplate, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error saveShiftTemplate:', error);
      throw new Error(error.message);
    }
    return fullTemplate;
  },

  async deleteShiftTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseServerClient();
    if (!client) return { success: false, error: 'Supabase client is not configured.' };

    const { data: shift } = await client
      .from('shift_templates')
      .select('is_default')
      .eq('id', id)
      .maybeSingle();

    if (!shift) return { success: false, error: 'Template shift tidak ditemukan' };
    if (shift.is_default) return { success: false, error: 'Template default tidak dapat dihapus' };

    const { data: schedules } = await client
      .from('employee_schedules')
      .select('id')
      .eq('shift_id', id)
      .limit(1);

    if (schedules && schedules.length > 0) {
      return { success: false, error: 'Shift ini sedang digunakan dalam jadwal pegawai aktif' };
    }

    const { error } = await client.from('shift_templates').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // --- SCHEDULES ---
  async getEmployeeSchedules(month?: number, year?: number): Promise<EmployeeSchedule[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    const monthPad = month ? String(month).padStart(2, '0') : null;
    const prefix = month && year ? `${year}-${monthPad}` : null;

    const allRecords: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = client.from('employee_schedules').select('*');
      if (prefix) {
        query = query.like('date', `${prefix}%`);
      }
      const { data, error } = await query
        .order('date', { ascending: true })
        .order('employee_id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.error('[Supabase] Error getEmployeeSchedules:', error);
        break;
      }

      if (data && data.length > 0) {
        allRecords.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          from += pageSize;
        }
      } else {
        hasMore = false;
      }
    }

    const shifts = await this.getShiftTemplates();
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const employees = await this.getEmployees();
    const empMap = new Map(employees.map((e) => [e.machine_id, e.full_name]));

    return allRecords.map((s) => {
      const shift = shiftMap.get(s.shift_id);
      return {
        ...s,
        employee_name: s.employee_name || empMap.get(s.employee_id) || getEmployeeNameByMachineId(s.employee_id),
        shift_code: s.shift_code || shift?.code || 'NORM',
        shift_name: s.shift_name || shift?.name || 'Jam Kerja Normal',
      };
    });
  },

  async getScheduleForEmployeeDate(employee_id: string, date: string): Promise<EmployeeSchedule | null> {
    const client = getSupabaseServerClient();
    if (!client) return null;

    const { data, error } = await client
      .from('employee_schedules')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('date', date)
      .maybeSingle();

    if (error || !data) return null;

    const shifts = await this.getShiftTemplates();
    const shift = shifts.find((s) => s.id === data.shift_id);
    const emp = (await this.getEmployees()).find((e) => e.machine_id === employee_id);

    return {
      ...data,
      employee_name: data.employee_name || emp?.full_name || getEmployeeNameByMachineId(employee_id),
      shift_code: data.shift_code || shift?.code || 'NORM',
      shift_name: data.shift_name || shift?.name || 'Jam Kerja Normal',
    };
  },

  async saveEmployeeSchedule(
    schedule: Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string }
  ): Promise<EmployeeSchedule> {
    const client = getSupabaseServerClient();
    if (!client) throw new Error('Supabase client is not configured.');

    const now = new Date().toISOString();
    const id = schedule.id || `sched-${schedule.employee_id}-${schedule.date}`;

    // Resolve shift details
    const { data: shift } = await client
      .from('shift_templates')
      .select('*')
      .eq('id', schedule.shift_id)
      .maybeSingle();

    const { data: emp } = await client
      .from('employees')
      .select('*')
      .eq('machine_id', schedule.employee_id)
      .maybeSingle();

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
      created_at: now,
      updated_at: now,
    };

    let { error } = await client
      .from('employee_schedules')
      .upsert(fullSchedule, { onConflict: 'employee_id,date' });

    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
      const { employee_name, shift_code, shift_name, ...cleanSchedule } = fullSchedule;
      const retry = await client
        .from('employee_schedules')
        .upsert(cleanSchedule, { onConflict: 'employee_id,date' });
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Error saveEmployeeSchedule:', error);
      throw new Error(error.message);
    }
    return fullSchedule;
  },

  async saveBulkEmployeeSchedules(
    schedules: (Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string })[]
  ): Promise<{ saved: number }> {
    const client = getSupabaseServerClient();
    if (!client) throw new Error('Supabase client is not configured.');

    const shifts = await this.getShiftTemplates();
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));

    const employees = await this.getEmployees();
    const empMap = new Map(employees.map((e) => [e.machine_id, e.full_name]));

    const now = new Date().toISOString();
    const payload: EmployeeSchedule[] = schedules.map((sched) => {
      const shift = shiftMap.get(sched.shift_id);
      return {
        id: sched.id || `sched-${sched.employee_id}-${sched.date}`,
        employee_id: sched.employee_id,
        employee_name: sched.employee_name || empMap.get(sched.employee_id) || getEmployeeNameByMachineId(sched.employee_id),
        date: sched.date,
        shift_id: sched.shift_id,
        shift_code: shift?.code || sched.shift_code || 'NORM',
        shift_name: shift?.name || sched.shift_name || 'Jam Kerja Normal',
        custom_start_time: sched.custom_start_time,
        custom_end_time: sched.custom_end_time,
        notes: sched.notes || '',
        created_at: now,
        updated_at: now,
      };
    });

    const chunkSize = 200;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      let { error } = await client
        .from('employee_schedules')
        .upsert(chunk, { onConflict: 'employee_id,date' });

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        const cleanChunk = chunk.map(({ employee_name, shift_code, shift_name, ...rest }) => rest);
        const retry = await client
          .from('employee_schedules')
          .upsert(cleanChunk, { onConflict: 'employee_id,date' });
        error = retry.error;
      }

      if (error) {
        console.error('[Supabase] Error saveBulkEmployeeSchedules chunk:', error);
        throw new Error(error.message);
      }
    }

    return { saved: payload.length };
  },

  async deleteEmployeeSchedule(employee_id: string, date: string): Promise<boolean> {
    const client = getSupabaseServerClient();
    if (!client) return false;

    const { error } = await client
      .from('employee_schedules')
      .delete()
      .eq('employee_id', employee_id)
      .eq('date', date);

    return !error;
  },

  // --- HOLIDAYS ---
  async getHolidays(month?: number, year?: number): Promise<Holiday[]> {
    const client = getSupabaseServerClient();
    if (!client) return [];

    let query = client.from('holidays').select('*').order('date', { ascending: true });
    if (month && year) {
      const monthPad = String(month).padStart(2, '0');
      query = query.like('date', `${year}-${monthPad}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] Error getHolidays:', error);
      return [];
    }
    return data || [];
  },

  async saveHoliday(holiday: Partial<Holiday> & { date: string; name: string }): Promise<Holiday> {
    const client = getSupabaseServerClient();
    if (!client) throw new Error('Supabase client is not configured.');

    const now = new Date().toISOString();
    const fullHoliday: Holiday = {
      id: holiday.id || `hol-${holiday.date}`,
      date: holiday.date,
      name: holiday.name.trim(),
      category: holiday.category || 'school',
      notes: holiday.notes?.trim() || '',
      created_at: now,
      updated_at: now,
    };

    const { error } = await client.from('holidays').upsert(fullHoliday, { onConflict: 'date' });
    if (error) {
      console.error('[Supabase] Error saveHoliday:', error);
      throw new Error(error.message);
    }
    return fullHoliday;
  },

  async deleteHoliday(id: string): Promise<boolean> {
    const client = getSupabaseServerClient();
    if (!client) return false;

    const { error } = await client.from('holidays').delete().or(`id.eq.${id},date.eq.${id}`);
    return !error;
  },

  async copySchedulesFromMonth(
    fromMonth: number,
    fromYear: number,
    toMonth: number,
    toYear: number
  ): Promise<{ copiedCount: number }> {
    const fromSchedules = await this.getEmployeeSchedules(fromMonth, fromYear);
    if (fromSchedules.length === 0) return { copiedCount: 0 };

    const toTotalDays = new Date(toYear, toMonth, 0).getDate();
    const toMonthPad = String(toMonth).padStart(2, '0');

    const toInsert: (Partial<EmployeeSchedule> & { employee_id: string; date: string; shift_id: string })[] = [];

    for (const sched of fromSchedules) {
      const dayPart = parseInt(sched.date.split('-')[2], 10);
      if (dayPart > toTotalDays) continue;

      const targetDate = `${toYear}-${toMonthPad}-${String(dayPart).padStart(2, '0')}`;
      toInsert.push({
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
    }

    const res = await this.saveBulkEmployeeSchedules(toInsert);
    return { copiedCount: res.saved };
  },
};
