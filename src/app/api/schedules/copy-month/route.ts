import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fromMonth = parseInt(body.fromMonth, 10);
    const fromYear = parseInt(body.fromYear, 10);
    const toMonth = parseInt(body.toMonth, 10);
    const toYear = parseInt(body.toYear, 10);

    if (!fromMonth || !fromYear || !toMonth || !toYear) {
      return NextResponse.json(
        { success: false, error: 'fromMonth, fromYear, toMonth, dan toYear wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await db.copySchedulesFromMonth(fromMonth, fromYear, toMonth, toYear);

    return NextResponse.json({
      success: true,
      fromMonth,
      fromYear,
      toMonth,
      toYear,
      copiedCount: result.copiedCount,
      message: `Berhasil menyalin ${result.copiedCount} penugasan jadwal dari ${fromMonth}/${fromYear} ke ${toMonth}/${toYear}.`,
    });
  } catch (error: any) {
    console.error('Error copying schedules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
