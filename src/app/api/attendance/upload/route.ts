import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { parseAttendanceFile } from '@/lib/attendance/parser';

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

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const parseResult = parseAttendanceFile(buffer, month, year, uploadId);

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
    const saveResult = await db.saveAttendanceBatch(uploadRecord, parseResult.records, true, parseResult.employeeNames);

    return NextResponse.json({
      success: true,
      upload_id: uploadId,
      total_records_processed: parseResult.records.length,
      preserved_verified_count: saveResult.preservedVerifiedCount,
      updated_count: saveResult.updatedCount,
      new_count: saveResult.newCount,
      detected_period: parseResult.detectedPeriod,
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
