import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const deleted = await db.deleteEmployeeSchedule(employee_id, date);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
