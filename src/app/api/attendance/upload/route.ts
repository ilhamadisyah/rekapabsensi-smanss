import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { parseAttendanceFile, ParseAttendanceOptions } from '@/lib/attendance/parser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const monthStr = formData.get('month') as string | null;
    const yearStr = formData.get('year') as string | null;
    const overwriteStr = formData.get('overwrite') as string | null;
    const uploadedBy = (formData.get('uploaded_by') as string) || 'admin_tu';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Berkas .xls atau .xlsx wajib diunggah.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let month = parseInt(monthStr || '', 10);
    let year = parseInt(yearStr || '', 10);

    // Optional: Pre-load shift schedules & master employees to enhance NIK mapping & pairing
    let scheduleMap: ParseAttendanceOptions['scheduleMap'];
    let existingEmployees: any[] = [];
    try {
      const [schedules, shifts, emps] = await Promise.all([
        db.getEmployeeSchedules(month || undefined, year || undefined),
        db.getShiftTemplates(),
        db.getEmployees(),
      ]);
      existingEmployees = emps || [];
      const shiftMap = new Map(shifts.map((s) => [s.id, s]));
      const empMapById = new Map(existingEmployees.map((e) => [e.id, e]));
      scheduleMap = new Map();
      for (const sc of schedules) {
        const sh = shiftMap.get(sc.shift_id);
        const schedItem = {
          isOvernight: Boolean(sh?.is_overnight),
          startTime: sc.custom_start_time || sh?.start_time,
          endTime: sc.custom_end_time || sh?.end_time,
          isOffDay: Boolean(sh?.is_off_day),
          gracePeriodMinutes: sh?.grace_period_minutes,
          checkInWindowMinutes: sh?.check_in_window_minutes,
          checkOutWindowMinutes: sh?.check_out_window_minutes,
        };
        scheduleMap.set(`${sc.employee_id}___${sc.date}`, schedItem);
        const matchedEmp = empMapById.get(sc.employee_id);
        if (matchedEmp) {
          if (matchedEmp.nik) scheduleMap.set(`${matchedEmp.nik}___${sc.date}`, schedItem);
          if (matchedEmp.machine_id) scheduleMap.set(`${matchedEmp.machine_id}___${sc.date}`, schedItem);
        }
      }
    } catch {
      // Ignore if schedules cannot be pre-loaded
    }

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const parseResult = parseAttendanceFile(buffer, month, year, uploadId, {
      scheduleMap,
      enableCrossDayPairing: true,
      masterEmployees: existingEmployees,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error },
        { status: 422 }
      );
    }

    // Auto-detected period from biometric file timestamps
    if (parseResult.detectedPeriod) {
      month = parseResult.detectedPeriod.month;
      year = parseResult.detectedPeriod.year;
    }

    const uploadRecord = {
      id: uploadId,
      file_name: file.name,
      period_month: month,
      period_year: year,
      total_raw_rows: parseResult.totalRawRows,
      uploaded_by: uploadedBy,
      created_at: new Date().toISOString(),
    };

    // Save batch with smart merge: preserves already verified data (data lama) if duplicates exist
    const saveResult = await db.saveAttendanceBatch(
      uploadRecord,
      parseResult.records,
      true,
      parseResult.employeeNames,
      parseResult.employeeMeta
    );

    return NextResponse.json({
      success: true,
      upload_id: uploadId,
      total_records_processed: parseResult.records.length,
      preserved_verified_count: saveResult.preservedVerifiedCount,
      updated_count: saveResult.updatedCount,
      new_count: saveResult.newCount,
      detected_period: parseResult.detectedPeriod,
      has_missing_nik: Boolean(parseResult.hasMissingNik),
      missing_nik_count: parseResult.missingNikCount || 0,
      missing_nik_records: parseResult.missingNikRecords || [],
      summary: {
        total_employees: parseResult.uniqueEmployees,
        total_present: parseResult.totalPresent,
        total_unverified_red: parseResult.totalUnverifiedRed,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/attendance/upload:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat memproses unggahan.' },
      { status: 500 }
    );
  }
}
