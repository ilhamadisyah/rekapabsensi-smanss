import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);

  if (!session) {
    return NextResponse.json({
      success: false,
      user: null,
    });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.userId,
      username: session.username,
      email: session.email,
      full_name: session.fullName,
      role: session.role,
    },
  });
}
