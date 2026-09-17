import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const employees = await db.getEmployees();
    return NextResponse.json(
      { success: true, employees },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat master pegawai.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, machine_id, department, nik, excel_row_index, is_active } = body;

    if (!full_name || !String(full_name).trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama lengkap pegawai wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanNik = nik ? String(nik).trim() : '';
    if (!cleanNik) {
      return NextResponse.json(
        { success: false, error: 'NIK (Nomor Induk Karyawan/Pegawai) wajib diisi sebagai identitas utama.' },
        { status: 400 }
      );
    }

    const cleanMachineId = machine_id && String(machine_id).trim() ? String(machine_id).trim() : cleanNik;
    const allEmployees = await db.getEmployees();

    const duplicateNik = allEmployees.find((e) => e.nik === cleanNik || e.id === cleanNik);
    if (duplicateNik) {
      return NextResponse.json(
        { success: false, error: `NIK ${cleanNik} sudah terdaftar atas nama ${duplicateNik.full_name}.` },
        { status: 400 }
      );
    }

    const duplicateMachine = allEmployees.find((e) => e.machine_id === cleanMachineId);
    if (duplicateMachine) {
      return NextResponse.json(
        { success: false, error: `ID Mesin ${cleanMachineId} sudah digunakan oleh ${duplicateMachine.full_name}.` },
        { status: 400 }
      );
    }

    const nextRow = Number(excel_row_index) || (allEmployees.length + 1);

    const newEmployee = await db.createEmployee({
      id: cleanNik,
      machine_id: cleanMachineId,
      full_name: String(full_name).trim(),
      department: department ? String(department).trim() : 'Guru',
      nik: cleanNik,
      excel_row_index: nextRow,
      is_active: is_active !== false,
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menambahkan pegawai baru.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, action, orders } = body;

    if (action === 'reorder' && Array.isArray(orders)) {
      await db.reorderEmployees(orders);
      return NextResponse.json({ success: true, message: 'Urutan pegawai berhasil diperbarui.' });
    }

    if (action === 'bulk_update' && Array.isArray(body.updates)) {
      const updatedList = [];
      for (const item of body.updates) {
        if (item.id && item.updates) {
          const updated = await db.updateEmployee(item.id, item.updates);
          if (updated) {
            updatedList.push(updated);
          }
        }
      }
      return NextResponse.json(
        {
          success: true,
          message: `${updatedList.length} data pegawai berhasil diperbarui.`,
          updatedCount: updatedList.length,
          employees: updatedList,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'ID dan data update wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await db.updateEmployee(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Pegawai tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pegawai.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (action === 'clear_all') {
      const result = await db.clearAllEmployeesAndAttendance();
      return NextResponse.json({
        success: true,
        message: 'Seluruh data pegawai dan riwayat presensi berhasil dikosongkan.',
        ...result,
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID pegawai yang akan dihapus wajib disertakan.' },
        { status: 400 }
      );
    }

    const deleted = await db.deleteEmployee(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Pegawai tidak ditemukan atau gagal dihapus.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Pegawai berhasil dihapus.' },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus pegawai.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
