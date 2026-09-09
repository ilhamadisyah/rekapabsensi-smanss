import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { generateRekapExcel } from '@/lib/attendance/exporter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);

    const fromDay = parseInt(searchParams.get('fromDay') || '1', 10);
    const toDay = parseInt(searchParams.get('toDay') || '30', 10);
    const department = (searchParams.get('department') as 'ALL' | 'Guru' | 'TU') || 'ALL';
    const includeSignatures = searchParams.get('includeSignatures') !== 'false';

    const allEmployees = await db.getEmployees();
    const employees = allEmployees.filter((e) => e.is_active);
    const attendanceRecords = await db.getAttendanceForMonth(month, year);

    const excelBuffer = await generateRekapExcel({
      month,
      year,
      employees,
      attendanceRecords,
      fromDay,
      toDay,
      department,
      includeSignatures,
    });

    const monthPad = String(month).padStart(2, '0');
    const rangeSuffix = fromDay === 1 && toDay === 30 ? '' : `_Tgl${fromDay}-${toDay}`;
    const deptSuffix = department !== 'ALL' ? `_${department}` : '';
    const filename = `Rekap_Absensi_SMANSS_${monthPad}_${year}${deptSuffix}${rangeSuffix}.xlsx`;

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/attendance/export:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengekspor laporan rekapitulasi.' },
      { status: 500 }
    );
  }
}
