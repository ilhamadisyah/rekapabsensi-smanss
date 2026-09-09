import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Retrieve holidays for a specific month or year
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;

    const holidays = await db.getHolidays(month, year);
    return NextResponse.json({
      success: true,
      month,
      year,
      holidays,
    });
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create or update holiday
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.date || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Tanggal (date) dan nama hari libur (name) wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = await db.saveHoliday({
      id: body.id,
      date: body.date,
      name: body.name,
      category: body.category || 'school',
      notes: body.notes,
    });

    return NextResponse.json({ success: true, holiday: saved });
  } catch (error: any) {
    console.error('Error saving holiday:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete holiday
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID hari libur wajib disertakan.' },
        { status: 400 }
      );
    }

    const deleted = await db.deleteHoliday(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
