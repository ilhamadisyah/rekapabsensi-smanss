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

// POST: Create or update holiday (supports single date or date range)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nama hari libur (name) wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Handle date range (startDate & endDate)
    if (body.startDate && body.endDate) {
      if (body.startDate > body.endDate) {
        return NextResponse.json(
          { success: false, error: 'Tanggal mulai tidak boleh melebihi tanggal selesai.' },
          { status: 400 }
        );
      }

      const dates: string[] = [];
      const cur = new Date(body.startDate + 'T00:00:00');
      const end = new Date(body.endDate + 'T00:00:00');

      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }

      const savedList = [];
      for (const dStr of dates) {
        const saved = await db.saveHoliday({
          date: dStr,
          name,
          category: body.category || 'school',
          notes: body.notes?.trim() || '',
        });
        savedList.push(saved);
      }

      return NextResponse.json({
        success: true,
        count: savedList.length,
        holidays: savedList,
      });
    }

    // 2. Handle array of dates
    if (Array.isArray(body.dates) && body.dates.length > 0) {
      const savedList = [];
      for (const dStr of body.dates) {
        const saved = await db.saveHoliday({
          date: dStr,
          name,
          category: body.category || 'school',
          notes: body.notes?.trim() || '',
        });
        savedList.push(saved);
      }

      return NextResponse.json({
        success: true,
        count: savedList.length,
        holidays: savedList,
      });
    }

    // 3. Single date
    if (!body.date) {
      return NextResponse.json(
        { success: false, error: 'Tanggal libur wajib diisi.' },
        { status: 400 }
      );
    }

    const saved = await db.saveHoliday({
      id: body.id,
      date: body.date,
      name,
      category: body.category || 'school',
      notes: body.notes?.trim() || '',
    });

    return NextResponse.json({ success: true, count: 1, holiday: saved });
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
