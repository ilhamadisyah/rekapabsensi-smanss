import { NextRequest, NextResponse } from 'next/server';
import { POST as syncDatabasePOST } from '@/app/api/attendance/sync-database/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  return syncDatabasePOST(request);
}

