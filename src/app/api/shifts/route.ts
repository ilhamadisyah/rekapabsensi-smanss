import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: List all shift templates
export async function GET() {
  try {
    const shifts = await db.getShiftTemplates();
    return NextResponse.json({ success: true, shifts });
  } catch (error: any) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new shift template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: 'Nama dan kode shift wajib diisi.' },
        { status: 400 }
      );
    }

    const newShift = await db.saveShiftTemplate({
      name: body.name,
      code: body.code,
      start_time: body.start_time || '07:30:00',
      end_time: body.end_time || '16:00:00',
      grace_period_minutes: Number(body.grace_period_minutes || 0),
      check_in_window_minutes: typeof body.check_in_window_minutes === 'number' ? body.check_in_window_minutes : (body.is_overnight ? 120 : 120),
      check_out_window_minutes: typeof body.check_out_window_minutes === 'number' ? body.check_out_window_minutes : 240,
      is_overnight: Boolean(body.is_overnight),
      is_off_day: Boolean(body.is_off_day),
      color: body.color || '#2563eb',
      description: body.description || '',
      is_default: false,
    });

    return NextResponse.json({ success: true, shift: newShift });
  } catch (error: any) {
    console.error('Error creating shift template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing shift template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id || !body.name || !body.code) {
      return NextResponse.json(
        { success: false, error: 'ID, nama, dan kode shift wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await db.saveShiftTemplate({
      id: body.id,
      name: body.name,
      code: body.code,
      start_time: body.start_time,
      end_time: body.end_time,
      grace_period_minutes: Number(body.grace_period_minutes || 0),
      check_in_window_minutes: typeof body.check_in_window_minutes === 'number' ? body.check_in_window_minutes : 120,
      check_out_window_minutes: typeof body.check_out_window_minutes === 'number' ? body.check_out_window_minutes : 240,
      is_overnight: Boolean(body.is_overnight),
      is_off_day: Boolean(body.is_off_day),
      color: body.color,
      description: body.description,
      is_default: Boolean(body.is_default),
    });

    return NextResponse.json({ success: true, shift: updated });
  } catch (error: any) {
    console.error('Error updating shift template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a shift template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID shift wajib disertakan.' }, { status: 400 });
    }

    const result = await db.deleteShiftTemplate(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shift template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
