import { NextRequest, NextResponse } from 'next/server';
import { detectPeriodFromFile } from '@/lib/attendance/parser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Berkas .xls atau .xlsx wajib diunggah.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = detectPeriodFromFile(buffer);

    if (!result.success || !result.period) {
      return NextResponse.json(
        { success: false, error: result.error || 'Gagal mendeteksi periode dari berkas.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      period: result.period,
      fileName: file.name,
      fileSizeBytes: file.size,
    });
  } catch (error: any) {
    console.error('Error in /api/attendance/detect-period:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memeriksa berkas.' },
      { status: 500 }
    );
  }
}
