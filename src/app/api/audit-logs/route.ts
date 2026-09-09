import { NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await db.getAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat log audit.' },
      { status: 500 }
    );
  }
}
