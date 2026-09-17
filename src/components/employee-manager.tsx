import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '@/lib/types';
import {
  Search,
  Edit2,
  Check,
  X,
  Shield,
  Users,
  PlusCircle,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  ListOrdered,
  Sparkles,
  RotateCcw,
  Save,
} from 'lucide-react';

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

interface EmployeeManagerProps {
  employees: Employee[];
  onEmployeeUpdated: () => void | Promise<void>;
  userRole: string;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  onEmployeeUpdated,
  userRole,
}) => {
  const [localEmployees, setLocalEmployees] = useState<Employee[]>(employees);

  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMachineId, setEditMachineId] = useState('');
  const [editRowIndex, setEditRowIndex] = useState<number>(0);
  const [editFullName, setEditFullName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editNik, setEditNik] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [quickMovingId, setQuickMovingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal Tambah Pegawai
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newMachineId, setNewMachineId] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newDepartment, setNewDepartment] = useState('Guru');
  const [newRowIndex, setNewRowIndex] = useState<number>(employees.length + 1);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Modal Atur Urutan Laporan Presensi
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderList, setReorderList] = useState<Employee[]>([]);
  const [reorderSearch, setReorderSearch] = useState('');
  const [isSavingReorder, setIsSavingReorder] = useState(false);
  const [reorderDirty, setReorderDirty] = useState(false);

  // Selalu urutkan daftar pegawai berdasarkan excel_row_index (urutan laporan resmi)
  const sortedEmployees = useMemo(() => {
    return [...localEmployees].sort(
      (a, b) => (a.excel_row_index || 999) - (b.excel_row_index || 999)
    );
  }, [localEmployees]);

  const filtered = useMemo(() => {
    return sortedEmployees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.machine_id.toLowerCase().includes(search.toLowerCase()) ||
        (e.nik && e.nik.toLowerCase().includes(search.toLowerCase())) ||
        (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [sortedEmployees, search]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedEmployees = filtered.slice(startIndex, endIndex);

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditMachineId(emp.machine_id);
    setEditRowIndex(emp.excel_row_index);
    setEditFullName(emp.full_name);
    setEditDepartment(emp.department && emp.department.includes('Guru') ? 'Guru' : 'Staff');
    setEditNik(emp.nik || '');
    setMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMsg(null);
  };

  const saveEdit = async (empId: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: empId,
          updates: {
            full_name: editFullName.trim(),
            machine_id: editMachineId.trim(),
            department: editDepartment.trim(),
            nik: editNik.trim(),
            excel_row_index: Number(editRowIndex) || 1,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: 'Berhasil memperbarui data pegawai!', type: 'success' });
        setEditingId(null);
        if (data.employee) {
          setLocalEmployees((prev) =>
            prev.map((e) => (e.id === empId ? { ...e, ...data.employee } : e))
          );
        }
        await onEmployeeUpdated();
      } else {
        setMsg({ text: data.error || 'Gagal menyimpan perubahan', type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: e.message || 'Kesalahan jaringan', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus data pegawai: ${emp.full_name} (ID Mesin: ${emp.machine_id})?`
    );
    if (!confirmDelete) return;

    setIsDeleting(emp.id);
    try {
      const res = await fetch(`/api/employees?id=${encodeURIComponent(emp.id)}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: `Pegawai ${emp.full_name} berhasil dihapus.`, type: 'success' });
        // Hapus langsung dari tampilan secara instan
        setLocalEmployees((prev) =>
          prev.filter(
            (e) =>
              e.id !== emp.id &&
              (!emp.nik || e.nik !== emp.nik) &&
              (!emp.machine_id || e.machine_id !== emp.machine_id)
          )
        );
        await onEmployeeUpdated();
      } else {
        setMsg({ text: data.error || 'Gagal menghapus pegawai', type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: e.message || 'Kesalahan jaringan', type: 'error' });
    } finally {
      setIsDeleting(null);
    }
  };

  // Tombol Pindah Naik / Turun Cepat di tabel utama
  const handleQuickMove = async (empId: string, direction: 'up' | 'down') => {
    const list = [...sortedEmployees];
    const currentIndex = list.findIndex((e) => e.id === empId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    setQuickMovingId(empId);

    // Swap elemen
    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    // Normalisasi urutan 1..N
    const orders = list.map((e, idx) => ({
      id: e.id,
      excel_row_index: idx + 1,
    }));

    setLocalEmployees(
      list.map((e, idx) => ({
        ...e,
        excel_row_index: idx + 1,
      }))
    );

    try {
      const res = await fetch('/api/employees/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await onEmployeeUpdated();
      } else {
        alert(data.error || 'Gagal memindahkan urutan pegawai.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setQuickMovingId(null);
    }
  };

  const handleOpenAddModal = () => {
    setNewFullName('');
    setNewMachineId('');
    setNewNik('');
    setNewDepartment('Guru');
    setNewRowIndex(localEmployees.length + 1);
    setMsg(null);
    setIsAddModalOpen(true);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNik.trim()) {
      alert('NIK (Nomor Induk Karyawan/Pegawai) wajib diisi sebagai identitas utama.');
      return;
    }
    if (!newFullName.trim()) {
      alert('Nama lengkap wajib diisi.');
      return;
    }

    const cleanMachineId = newMachineId.trim() || newNik.trim();

    setIsSubmittingNew(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newFullName.trim(),
          machine_id: cleanMachineId,
          nik: newNik.trim(),
          department: newDepartment.trim(),
          excel_row_index: Number(newRowIndex) || (localEmployees.length + 1),
          is_active: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: `Berhasil mendaftarkan pegawai baru: ${newFullName}`, type: 'success' });
        setIsAddModalOpen(false);
        if (data.employee) {
          setLocalEmployees((prev) => [...prev, data.employee]);
        }
        await onEmployeeUpdated();
      } else {
        alert(data.error || 'Gagal menambahkan pegawai.');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan jaringan');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // --- Fitur Modal Atur Urutan Laporan Presensi ---
  const handleOpenReorderModal = () => {
    const list = [...localEmployees].sort(
      (a, b) => (a.excel_row_index || 999) - (b.excel_row_index || 999)
    );
    setReorderList(list);
    setReorderSearch('');
    setReorderDirty(false);
    setIsReorderModalOpen(true);
  };

  const handleMoveReorderItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= reorderList.length) return;
    const updated = [...reorderList];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setReorderList(updated);
    setReorderDirty(true);
  };

  const handlePresetAZ = () => {
    const sorted = [...reorderList].sort((a, b) =>
      a.full_name.localeCompare(b.full_name, 'id', { sensitivity: 'base' })
    );
    setReorderList(sorted);
    setReorderDirty(true);
  };

  const handlePresetDepartment = () => {
    const gurus = reorderList
      .filter((e) => e.department && e.department.includes('Guru'))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'id', { sensitivity: 'base' }));
    const staffs = reorderList
      .filter((e) => !e.department || !e.department.includes('Guru'))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'id', { sensitivity: 'base' }));
    setReorderList([...gurus, ...staffs]);
    setReorderDirty(true);
  };

  const handlePresetNik = () => {
    const sorted = [...reorderList].sort((a, b) =>
      (a.nik || a.id || '').localeCompare(b.nik || b.id || '', 'id', { numeric: true })
    );
    setReorderList(sorted);
    setReorderDirty(true);
  };

  const handleResetToCurrent = () => {
    const list = [...localEmployees].sort(
      (a, b) => (a.excel_row_index || 999) - (b.excel_row_index || 999)
    );
    setReorderList(list);
    setReorderDirty(false);
  };

  const handleSaveReorder = async () => {
    setIsSavingReorder(true);
    try {
      const orders = reorderList.map((emp, index) => ({
        id: emp.id,
        excel_row_index: index + 1,
      }));

      const res = await fetch('/api/employees/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({
          text: `Urutan kustom untuk ${orders.length} pegawai berhasil disimpan! Laporan presensi akan mengikuti urutan ini.`,
          type: 'success',
        });
        setLocalEmployees(reorderList.map((e, idx) => ({ ...e, excel_row_index: idx + 1 })));
        setIsReorderModalOpen(false);
        setReorderDirty(false);
        await onEmployeeUpdated();
      } else {
        alert(data.error || 'Gagal menyimpan urutan pegawai.');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan jaringan saat menyimpan urutan.');
    } finally {
      setIsSavingReorder(false);
    }
  };

  const filteredReorderList = useMemo(() => {
    if (!reorderSearch.trim()) return reorderList;
    return reorderList.filter(
      (e) =>
        e.full_name.toLowerCase().includes(reorderSearch.toLowerCase()) ||
        (e.nik && e.nik.toLowerCase().includes(reorderSearch.toLowerCase())) ||
        (e.department && e.department.toLowerCase().includes(reorderSearch.toLowerCase()))
    );
  }, [reorderList, reorderSearch]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col p-4 sm:p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Master Data Pegawai &amp; Urutan Laporan Presensi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total <span className="font-semibold text-slate-700">{localEmployees.length}</span> Pegawai terdaftar. Urutan di bawah ini menentukan posisi baris nama pada Laporan Presensi Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-44 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, NIK, unit..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {localEmployees.length > 1 && (
            <button
              onClick={handleOpenReorderModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Atur susunan dan urutan nomor baris pegawai untuk laporan presensi"
            >
              <ListOrdered className="w-4 h-4 text-indigo-600" />
              <span>Atur Urutan Laporan</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Empty State vs Table */}
      {localEmployees.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-800">Belum Ada Data Pegawai</h4>
            <p className="text-xs text-slate-500">
              Database saat ini bersih dan siap untuk diisi dengan data pegawai yang sebenarnya.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto text-left pt-2">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-blue-700">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Cara 1: Input Manual
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tambahkan pegawai satu per satu melalui formulir input dengan ID Mesin biometrik yang sesuai.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="w-full py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
              >
                + Tambah Pegawai Baru
              </button>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-700">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Cara 2: Unggah Berkas Presensi
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Unggah berkas log presensi mesin biometrik (.csv). Sistem akan secara otomatis mendeteksi dan mendaftarkan seluruh ID pegawai baru ke database.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
          <div className="overflow-x-auto max-h-[550px]">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-100/90 sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th
                    className="p-3 font-bold text-slate-700 w-24 text-center"
                    title="Nomor urut baris resmi pada Laporan Rekap Presensi Excel"
                  >
                    <span className="flex items-center justify-center gap-1">
                      <span>No. Lap</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </span>
                  </th>
                  <th className="p-3 font-bold text-slate-700">Nama Pegawai</th>
                  <th className="p-3 font-bold text-slate-700 w-44">NIK / NIP</th>
                  <th className="p-3 font-bold text-slate-700 w-36">Unit / Jabatan</th>
                  <th className="p-3 font-bold text-slate-700 text-center w-28">Pindah Baris</th>
                  <th className="p-3 font-bold text-slate-700 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 text-xs italic">
                      Tidak ditemukan pegawai dengan kata kunci &quot;{search}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const isEditing = editingId === emp.id;
                    const fullIndex = sortedEmployees.findIndex((e) => e.id === emp.id);
                    const isFirst = fullIndex === 0;
                    const isLast = fullIndex === sortedEmployees.length - 1;
                    const isMoving = quickMovingId === emp.id;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Kolom No. Urut Laporan */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={editRowIndex}
                              onChange={(e) => setEditRowIndex(Number(e.target.value))}
                              title="Ubah nomor baris laporan"
                              className="w-16 px-1.5 py-1 text-center text-xs font-bold font-mono border border-blue-400 rounded-lg text-blue-700 bg-white"
                            />
                          ) : (
                            <span
                              className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-mono font-bold text-xs"
                              title={`Urutan baris ke-${emp.excel_row_index} pada Laporan Presensi Excel`}
                            >
                              #{emp.excel_row_index}
                            </span>
                          )}
                        </td>

                        {/* Kolom Nama */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFullName}
                              onChange={(e) => setEditFullName(e.target.value)}
                              placeholder="Nama lengkap pegawai"
                              className="w-full px-2.5 py-1 text-xs font-bold border border-blue-400 rounded-lg text-slate-900 bg-white"
                            />
                          ) : (
                            <div className="font-bold text-slate-900 text-[13px]">{emp.full_name}</div>
                          )}
                        </td>

                        {/* Kolom NIK */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editNik}
                              onChange={(e) => setEditNik(e.target.value)}
                              placeholder="NIK (Wajib)"
                              className="w-full px-2.5 py-1 text-xs font-mono font-bold border border-blue-400 rounded-lg text-blue-700 bg-white"
                            />
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[11px]">
                              {emp.nik || emp.id || '-'}
                            </span>
                          )}
                        </td>

                        {/* Kolom Unit / Jabatan */}
                        <td className="p-3 text-slate-600">
                          {isEditing ? (
                            <select
                              value={editDepartment === 'Guru' || editDepartment.includes('Guru') ? 'Guru' : 'Staff'}
                              onChange={(e) => setEditDepartment(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-blue-400 rounded-lg font-semibold bg-white"
                            >
                              <option value="Guru">Guru</option>
                              <option value="Staff">Staff</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                                emp.department && emp.department.includes('Guru')
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {emp.department && emp.department.includes('Guru') ? 'Guru' : 'Staff'}
                            </span>
                          )}
                        </td>

                        {/* Kolom Pindah Urutan Cepat (Naik / Turun) */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleQuickMove(emp.id, 'up')}
                              disabled={isFirst || isMoving}
                              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Pindahkan naik 1 posisi"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleQuickMove(emp.id, 'down')}
                              disabled={isLast || isMoving}
                              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Pindahkan turun 1 posisi"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Kolom Aksi */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => saveEdit(emp.id)}
                                disabled={isSaving}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                title="Simpan Perubahan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => startEdit(emp)}
                                className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Ubah Pegawai &amp; No. Baris"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(emp)}
                                disabled={isDeleting === emp.id}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Pegawai"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Menampilkan <span className="font-bold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span>–<span className="font-bold text-slate-800">{endIndex}</span> dari <span className="font-bold text-slate-800">{totalItems}</span> pegawai
                  {search && localEmployees.length !== totalItems && (
                    <span className="text-slate-400 text-[11px] ml-1">
                      (difilter dari {localEmployees.length} total)
                    </span>
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Rows per page selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Tampilkan:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value={10}>10 / hal</option>
                    <option value={25}>25 / hal</option>
                    <option value={50}>50 / hal</option>
                    <option value={100}>100 / hal</option>
                  </select>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={validCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {getPageNumbers(validCurrentPage, totalPages).map((p, pIdx) =>
                    p === '...' ? (
                      <span key={`dots-${pIdx}`} className="px-1.5 py-1 text-slate-400 select-none">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setCurrentPage(Number(p))}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-colors shadow-2xs ${
                          validCurrentPage === p
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validCurrentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={validCurrentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors shadow-2xs"
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ATUR URUTAN PEGAWAI UNTUK LAPORAN PRESENSI         */}
      {/* ======================================================== */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-3 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Atur Urutan Pegawai untuk Laporan Presensi
                    {reorderDirty && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300">
                        Belum Disimpan
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Urutan ini menentukan posisi baris (No. 1, 2, 3...) pada berkas Excel rekap presensi dan tampilan matriks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Sorting Presets Toolbar */}
            <div className="p-3 sm:p-4 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Preset Cepat:
                </span>
                <button
                  type="button"
                  onClick={handlePresetAZ}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  title="Urutkan seluruh pegawai berdasarkan Abjad Nama (A-Z)"
                >
                  🔤 Urutkan A-Z (Nama)
                </button>
                <button
                  type="button"
                  onClick={handlePresetDepartment}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  title="Kelompokkan: Semua Guru di urutan awal (A-Z), lalu seluruh Staff (A-Z)"
                >
                  🏫 Guru Dulu, Lalu Staff
                </button>
                <button
                  type="button"
                  onClick={handlePresetNik}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                  title="Urutkan berdasarkan Nomor Induk Karyawan/Pegawai"
                >
                  🔢 Urutkan NIK
                </button>
                <button
                  type="button"
                  onClick={handleResetToCurrent}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
                  title="Kembalikan urutan seperti sebelum diedit"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Search Filter in Modal */}
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={reorderSearch}
                  onChange={(e) => setReorderSearch(e.target.value)}
                  placeholder="Cari pegawai di daftar..."
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* List of Employees for Reordering */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 max-h-[480px]">
              {filteredReorderList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Tidak ada pegawai yang sesuai dengan pencarian &quot;{reorderSearch}&quot;.
                </div>
              ) : (
                filteredReorderList.map((emp) => {
                  const trueIndex = reorderList.findIndex((e) => e.id === emp.id);
                  const isFirst = trueIndex === 0;
                  const isLast = trueIndex === reorderList.length - 1;

                  return (
                    <div
                      key={emp.id}
                      className={`flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${
                        reorderDirty
                          ? 'bg-indigo-50/30 border-indigo-200/70 hover:bg-indigo-50/60'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Sequence Badge */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs shadow-2xs shrink-0">
                          #{trueIndex + 1}
                        </div>

                        {/* Employee Details */}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {emp.full_name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-mono">{emp.nik || emp.id}</span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                emp.department && emp.department.includes('Guru')
                                  ? 'text-indigo-700 bg-indigo-50'
                                  : 'text-emerald-700 bg-emerald-50'
                              }`}
                            >
                              {emp.department && emp.department.includes('Guru') ? 'Guru' : 'Staff'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Movement Control Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveReorderItem(trueIndex, 0)}
                          disabled={isFirst}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Pindah ke Paling Atas"
                        >
                          <ChevronsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveReorderItem(trueIndex, trueIndex - 1)}
                          disabled={isFirst}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Pindah Naik (1 posisi)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveReorderItem(trueIndex, trueIndex + 1)}
                          disabled={isLast}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Pindah Turun (1 posisi)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveReorderItem(trueIndex, reorderList.length - 1)}
                          disabled={isLast}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          title="Pindah ke Paling Bawah"
                        >
                          <ChevronsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                Total <span className="font-bold text-slate-800">{reorderList.length}</span> pegawai dalam susunan.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReorderModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveReorder}
                  disabled={isSavingReorder}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingReorder ? 'Menyimpan...' : 'Simpan Urutan Laporan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Pegawai Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Pegawai Baru</h3>
                  <p className="text-[11px] text-slate-500">Daftarkan pegawai ke master sistem presensi</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NIK / NIP Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNik}
                  onChange={(e) => setNewNik(e.target.value)}
                  placeholder="Contoh: 198501012010011001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Identitas utama pegawai dalam sistem presensi</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Contoh: Drs. Ahmad Dahlan, M.Pd."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID Mesin Biometrik
                  </label>
                  <input
                    type="text"
                    value={newMachineId}
                    onChange={(e) => setNewMachineId(e.target.value)}
                    placeholder="Contoh: 15 (opsional)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Jika kosong, otomatis disamakan dengan NIK</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Baris Excel Rekap
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={newRowIndex}
                    onChange={(e) => setNewRowIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unit Kerja / Jabatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold"
                >
                  <option value="Guru">Guru</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingNew ? 'Menyimpan...' : 'Daftarkan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
