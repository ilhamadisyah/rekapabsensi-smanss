import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Validasi otorisasi RBAC jadwal berdasarkan unit kerja pegawai yang diperbolehkan bagi admin
 */
async function checkSchedulePermission(
  request: NextRequest,
  targetEmployeeIds: string[]
): Promise<{ allowed: boolean; errorResponse?: NextResponse }> {
  const user = await getSessionUser(request);
  // Jika tidak ada user sesi, izinkan jika sistem internal/fallback atau belum login
  if (!user) {
    return { allowed: true };
  }

  // Superadmin atau admin dengan akses 'ALL' memiliki hak penuh tanpa batasan unit kerja
  if (user.role === 'superadmin' || user.workUnitAccess?.includes('ALL')) {
    return { allowed: true };
  }

  const allowedUnits = user.workUnitAccess || [];
  if (allowedUnits.length === 0) {
    return {
      allowed: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak: Akun Anda belum memiliki izin unit kerja untuk mengelola jadwal.',
        },
        { status: 403 }
      ),
    };
  }

  // Ambil data pegawai untuk verifikasi unit kerja
  const allEmployees = await db.getEmployees();
  const empMap = new Map<string, any>();
  for (const emp of allEmployees) {
    if (emp.id) empMap.set(emp.id, emp);
    if (emp.nik) empMap.set(emp.nik, emp);
    if (emp.machine_id) empMap.set(emp.machine_id, emp);
  }

  const unauthorizedEmps: string[] = [];
  for (const empId of targetEmployeeIds) {
    const emp = empMap.get(empId);
    if (!emp) continue;
    const empUnit = (emp.work_unit || '').trim();
    if (!empUnit || !allowedUnits.includes(empUnit)) {
      unauthorizedEmps.push(`${emp.full_name} (${empUnit || 'Belum diatur unit kerja'})`);
    }
  }

  if (unauthorizedEmps.length > 0) {
    return {
      allowed: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: `Akses ditolak: Anda hanya berhak mengatur jadwal pegawai pada unit: [${allowedUnits.join(', ')}]. Pegawai berikut di luar wewenang Anda: ${unauthorizedEmps.slice(0, 3).join(', ')}${unauthorizedEmps.length > 3 ? ` dan ${unauthorizedEmps.length - 3} lainnya` : ''}.`,
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}

// GET: Get schedules for a specific month and year
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const schedules = await db.getEmployeeSchedules(month, year);
    const shifts = await db.getShiftTemplates();
    const allEmployees = await db.getEmployees();
    const employees = allEmployees.filter((e) => e.is_active);
    const holidays = await db.getHolidays(month, year);

    return NextResponse.json({
      success: true,
      month,
      year,
      schedules,
      shifts,
      employees,
      holidays,
    });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save single or bulk schedules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if bulk assignment
    if (Array.isArray(body.schedules)) {
      const empIds = body.schedules.map((s: any) => s.employee_id).filter(Boolean);
      const permCheck = await checkSchedulePermission(request, empIds);
      if (!permCheck.allowed && permCheck.errorResponse) {
        return permCheck.errorResponse;
      }

      const result = await db.saveBulkEmployeeSchedules(body.schedules);
      return NextResponse.json({ success: true, savedCount: result.saved });
    }

    // Single assignment
    if (!body.employee_id || !body.date || !body.shift_id) {
      return NextResponse.json(
        { success: false, error: 'employee_id, date, dan shift_id wajib diisi.' },
        { status: 400 }
      );
    }

    const permCheck = await checkSchedulePermission(request, [body.employee_id]);
    if (!permCheck.allowed && permCheck.errorResponse) {
      return permCheck.errorResponse;
    }

    const saved = await db.saveEmployeeSchedule({
      employee_id: body.employee_id,
      date: body.date,
      shift_id: body.shift_id,
      custom_start_time: body.custom_start_time,
      custom_end_time: body.custom_end_time,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, schedule: saved });
  } catch (error: any) {
    console.error('Error saving schedule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a custom schedule for an employee and date
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get('employee_id');
    const date = searchParams.get('date');

    if (!employee_id || !date) {
      return NextResponse.json(
        { success: false, error: 'employee_id dan date wajib disertakan.' },
        { status: 400 }
      );
    }

    const permCheck = await checkSchedulePermission(request, [employee_id]);
    if (!permCheck.allowed && permCheck.errorResponse) {
      return permCheck.errorResponse;
    }

    const deleted = await db.deleteEmployeeSchedule(employee_id, date);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
