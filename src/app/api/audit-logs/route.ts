import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';
import { requireSuperAdmin } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if (auth.error) {
    return auth.error;
  }

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
