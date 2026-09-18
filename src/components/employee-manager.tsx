import React, { useState, useMemo, useEffect } from 'react';
import { Employee, WorkUnit } from '@/lib/types';
import { WorkUnitManagerModal } from './work-unit-manager-modal';
import {
  Search,
  Edit2,
  Edit3,
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
  RefreshCw,
  Undo2,
  Building2,
} from 'lucide-react';

export interface EmployeeEditDraft {
  full_name: string;
  nik: string;
  machine_id?: string;
  department: string;
  work_unit?: string | null;
  excel_row_index: number;
}

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
  // Mode Edit Massal & Draft Staging (Sama seperti Matriks Roster/Presensi)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [stagedEdits, setStagedEdits] = useState<Record<string, EmployeeEditDraft>>({});
  const [isSavingBatch, setIsSavingBatch] = useState<boolean>(false);
  const [isSavingSingle, setIsSavingSingle] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [quickMovingId, setQuickMovingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const stagedCount = Object.keys(stagedEdits).length;

  // State Master Unit Kerja
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [isWorkUnitModalOpen, setIsWorkUnitModalOpen] = useState(false);
  const [filterWorkUnit, setFilterWorkUnit] = useState<string>('ALL');

  // Modal Tambah Pegawai
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newMachineId, setNewMachineId] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newDepartment, setNewDepartment] = useState('Guru');
  const [newWorkUnit, setNewWorkUnit] = useState<string>('');
  const [newRowIndex, setNewRowIndex] = useState<number>(employees.length + 1);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const loadWorkUnits = async () => {
    try {
      const res = await fetch('/api/work-units');
      const data = await res.json();
      if (res.ok && data.success) {
        setWorkUnits(data.workUnits || []);
      }
    } catch (err) {
      console.error('Failed to load work units:', err);
    }
  };

  useEffect(() => {
    loadWorkUnits();
  }, []);

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
    return sortedEmployees.filter((e) => {
      const matchesSearch =
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.machine_id.toLowerCase().includes(search.toLowerCase()) ||
        (e.nik && e.nik.toLowerCase().includes(search.toLowerCase())) ||
        (e.department && e.department.toLowerCase().includes(search.toLowerCase())) ||
        (e.work_unit && e.work_unit.toLowerCase().includes(search.toLowerCase()));

      const matchesWorkUnit =
        filterWorkUnit === 'ALL'
          ? true
          : filterWorkUnit === 'UNSET'
          ? !e.work_unit
          : e.work_unit === filterWorkUnit;

      return matchesSearch && matchesWorkUnit;
    });
  }, [sortedEmployees, search, filterWorkUnit]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedEmployees = filtered.slice(startIndex, endIndex);

  // Cek apakah suatu baris sedang dalam mode edit (Mode Edit aktif, baris diklik edit, atau memiliki draft)
  const isRowInEditMode = (empId: string) => {
    return isEditMode || editingRows.has(empId) || !!stagedEdits[empId];
  };

  // Toggle global edit mode
  const toggleEditMode = () => {
    if (isEditMode && stagedCount > 0) {
      if (!confirm(`Ada ${stagedCount} perubahan draft yang belum diunggah. Menutup Mode Edit tetap mempertahankan draft perubahan Anda.`)) {
        return;
      }
    }
    setIsEditMode((prev) => !prev);
  };

  // Peringatan sebelum tab ditutup/refresh jika ada draft yang belum disimpan
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stagedCount > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stagedCount]);

  // Handle input perubahan pada baris (disimpan di stagedEdits sebagai draft)
  const handleFieldChange = (
    emp: Employee,
    field: keyof EmployeeEditDraft,
    value: any
  ) => {
    setStagedEdits((prev) => {
      const existing = prev[emp.id] || {
        full_name: emp.full_name,
        nik: emp.nik || emp.id,
        machine_id: emp.machine_id,
        department: emp.department && emp.department.includes('Guru') ? 'Guru' : 'Staff',
        work_unit: emp.work_unit || null,
        excel_row_index: emp.excel_row_index,
      };

      const updated = {
        ...existing,
        [field]: value,
      };

      // Jika nilainya sama persis seperti aslinya, bersihkan draft
      const isSameAsOriginal =
        updated.full_name.trim() === emp.full_name.trim() &&
        updated.nik.trim() === (emp.nik || emp.id || '').trim() &&
        (updated.department.includes('Guru') ? 'Guru' : 'Staff') ===
          (emp.department && emp.department.includes('Guru') ? 'Guru' : 'Staff') &&
        (updated.work_unit || null) === (emp.work_unit || null) &&
        Number(updated.excel_row_index) === Number(emp.excel_row_index);

      if (isSameAsOriginal) {
        const next = { ...prev };
        delete next[emp.id];
        return next;
      }

      return {
        ...prev,
        [emp.id]: updated,
      };
    });
  };

  // Batalkan edit pada satu baris
  const handleCancelRowEdit = (empId: string) => {
    setStagedEdits((prev) => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });
    setEditingRows((prev) => {
      const next = new Set(prev);
      next.delete(empId);
      return next;
    });
  };

  // Batalkan seluruh edit draft
  const handleCancelAllEdits = () => {
    if (stagedCount > 0) {
      if (!confirm(`Batalkan semua ${stagedCount} perubahan data pegawai yang belum disimpan?`)) {
        return;
      }
    }
    setStagedEdits({});
    setEditingRows(new Set());
    setMsg(null);
  };

  // Simpan satu baris secara langsung
  const handleSaveSingleRow = async (emp: Employee) => {
    const draft = stagedEdits[emp.id];
    if (!draft) {
      setEditingRows((prev) => {
        const next = new Set(prev);
        next.delete(emp.id);
        return next;
      });
      return;
    }

    if (!draft.full_name.trim()) {
      alert('Nama lengkap pegawai wajib diisi.');
      return;
    }
    if (!draft.nik.trim()) {
      alert('NIK / NIP pegawai wajib diisi.');
      return;
    }

    setIsSavingSingle(emp.id);
    try {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          id: emp.id,
          updates: {
            full_name: draft.full_name.trim(),
            nik: draft.nik.trim(),
            machine_id: draft.machine_id?.trim() || draft.nik.trim(),
            department: draft.department.trim(),
            work_unit: draft.work_unit !== undefined ? (draft.work_unit ? draft.work_unit.trim() : null) : emp.work_unit,
            excel_row_index: Number(draft.excel_row_index) || 1,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: `Berhasil memperbarui data pegawai: ${draft.full_name}`, type: 'success' });
        setLocalEmployees((prev) =>
          prev.map((e) =>
            e.id === emp.id
              ? {
                  ...e,
                  full_name: draft.full_name.trim(),
                  nik: draft.nik.trim(),
                  machine_id: draft.machine_id?.trim() || draft.nik.trim(),
                  department: draft.department.trim(),
                  work_unit: draft.work_unit !== undefined ? (draft.work_unit ? draft.work_unit.trim() : null) : e.work_unit,
                  excel_row_index: Number(draft.excel_row_index) || 1,
                }
              : e
          )
        );
        handleCancelRowEdit(emp.id);
        await onEmployeeUpdated();
      } else {
        setMsg({ text: data.error || 'Gagal menyimpan perubahan.', type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: e.message || 'Kesalahan jaringan', type: 'error' });
    } finally {
      setIsSavingSingle(null);
    }
  };

  // Simpan seluruh draft perubahan sekaligus (Massal / Batch) ke database
  const handleSaveAllEdits = async () => {
    const entries = Object.entries(stagedEdits);
    if (entries.length === 0) return;

    for (const [, draft] of entries) {
      if (!draft.full_name.trim()) {
        alert('Nama lengkap pegawai tidak boleh kosong.');
        return;
      }
      if (!draft.nik.trim()) {
        alert('NIK / NIP pegawai tidak boleh kosong.');
        return;
      }
    }

    setIsSavingBatch(true);
    try {
      const updates = entries.map(([id, draft]) => ({
        id,
        updates: {
          full_name: draft.full_name.trim(),
          nik: draft.nik.trim(),
          machine_id: draft.machine_id?.trim() || draft.nik.trim(),
          department: draft.department.trim(),
          work_unit: draft.work_unit !== undefined ? (draft.work_unit ? draft.work_unit.trim() : null) : undefined,
          excel_row_index: Number(draft.excel_row_index) || 1,
        },
      }));

      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          action: 'bulk_update',
          updates,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({
          text: `Berhasil mengunggah dan menyimpan ${entries.length} data pegawai ke database!`,
          type: 'success',
        });

        // Update local state optimistically
        setLocalEmployees((prev) =>
          prev.map((e) => {
            const draft = stagedEdits[e.id];
            if (!draft) return e;
            return {
              ...e,
              full_name: draft.full_name.trim(),
              nik: draft.nik.trim(),
              machine_id: draft.machine_id?.trim() || draft.nik.trim(),
              department: draft.department.trim(),
              work_unit: draft.work_unit !== undefined ? (draft.work_unit ? draft.work_unit.trim() : null) : e.work_unit,
              excel_row_index: Number(draft.excel_row_index) || 1,
            };
          })
        );

        setStagedEdits({});
        setEditingRows(new Set());
        await onEmployeeUpdated();
      } else {
        setMsg({ text: data.error || 'Gagal menyimpan perubahan.', type: 'error' });
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Terjadi kesalahan jaringan.', type: 'error' });
    } finally {
      setIsSavingBatch(false);
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
        setStagedEdits((prev) => {
          const next = { ...prev };
          delete next[emp.id];
          return next;
        });
        setEditingRows((prev) => {
          const next = new Set(prev);
          next.delete(emp.id);
          return next;
        });
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
    setNewWorkUnit('');
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
          work_unit: newWorkUnit.trim() ? newWorkUnit.trim() : null,
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

          {/* Filter Unit Kerja */}
          <select
            value={filterWorkUnit}
            onChange={(e) => {
              setFilterWorkUnit(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-[180px] truncate"
            title="Filter daftar pegawai berdasarkan Unit Kerja"
          >
            <option value="ALL">Semua Unit Kerja ({localEmployees.length})</option>
            <option value="UNSET">Belum Diatur Unit</option>
            {workUnits.map((u) => {
              const count = localEmployees.filter((e) => e.work_unit === u.name).length;
              return (
                <option key={u.id} value={u.name}>
                  {u.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Tombol Kelola Unit Kerja */}
          <button
            type="button"
            onClick={() => setIsWorkUnitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            title="Kelola Master Data Unit Kerja (Tambah, Ubah Nama, Hapus Unit)"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Kelola Unit Kerja</span>
          </button>

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

          {localEmployees.length > 0 && (
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isEditMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700 ring-2 ring-amber-400/50'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
              title="Aktifkan Mode Edit untuk mengedit banyak data pegawai sekaligus di tabel"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditMode ? 'Mode Edit Aktif' : 'Mode Edit'}</span>
              {stagedCount > 0 && (
                <span className="bg-white text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ml-0.5 shadow-2xs">
                  {stagedCount}
                </span>
              )}
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

      {/* Mode Edit Informational Banner */}
      {isEditMode && (
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-50 border border-amber-300/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>
              <strong>Mode Edit Pegawai Aktif:</strong> Anda dapat mengubah data beberapa pegawai langsung pada tabel. Perubahan disimpan sementara sebagai <em>draft</em> dan baru diunggah ke database saat Anda menekan tombol <strong>Simpan</strong>.
            </span>
          </div>
          {stagedCount > 0 && (
            <span className="font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-lg border border-amber-400 text-[11px] shrink-0 flex items-center gap-1 shadow-2xs">
              ⚡ {stagedCount} pegawai diubah (draft)
            </span>
          )}
        </div>
      )}

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
                  <th className="p-3 font-bold text-slate-700 w-28">Jabatan</th>
                  <th className="p-3 font-bold text-slate-700 w-44">Unit Kerja</th>
                  <th className="p-3 font-bold text-slate-700 text-center w-28">Pindah Baris</th>
                  <th className="p-3 font-bold text-slate-700 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs italic">
                      Tidak ditemukan pegawai dengan kata kunci &quot;{search}&quot;.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const draft = stagedEdits[emp.id];
                    const isModified = !!draft;
                    const isEditing = isRowInEditMode(emp.id);
                    const isRowSaving = isSavingSingle === emp.id;

                    const displayRowIndex = draft !== undefined ? draft.excel_row_index : emp.excel_row_index;
                    const displayFullName = draft !== undefined ? draft.full_name : emp.full_name;
                    const displayNik = draft !== undefined ? draft.nik : (emp.nik || emp.id || '');
                    const displayDept = draft !== undefined ? draft.department : (emp.department || 'Guru');
                    const displayWorkUnit = draft !== undefined ? draft.work_unit : emp.work_unit;

                    const fullIndex = sortedEmployees.findIndex((e) => e.id === emp.id);
                    const isFirst = fullIndex === 0;
                    const isLast = fullIndex === sortedEmployees.length - 1;
                    const isMoving = quickMovingId === emp.id;

                    return (
                      <tr
                        key={emp.id}
                        className={`transition-colors ${
                          isModified
                            ? 'bg-amber-50/75 border-l-4 border-l-amber-500'
                            : isEditing
                            ? 'bg-slate-50/70'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Kolom No. Urut Laporan */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={displayRowIndex}
                              onChange={(e) => handleFieldChange(emp, 'excel_row_index', Number(e.target.value))}
                              title="Ubah nomor baris laporan"
                              className={`w-16 px-1.5 py-1 text-center text-xs font-bold font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                isModified
                                  ? 'border-amber-400 bg-white text-amber-900 font-extrabold shadow-2xs'
                                  : 'border-slate-300 bg-white text-slate-800'
                              }`}
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
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={displayFullName}
                                onChange={(e) => handleFieldChange(emp, 'full_name', e.target.value)}
                                placeholder="Nama lengkap pegawai"
                                className={`w-full px-2.5 py-1 text-xs font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                  isModified
                                    ? 'border-amber-400 bg-white text-amber-950 shadow-2xs'
                                    : 'border-slate-300 bg-white text-slate-900'
                                }`}
                              />
                              {isModified && (
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                                  <span>⚡ Perubahan belum disimpan</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="font-bold text-slate-900 text-[13px]">{emp.full_name}</div>
                          )}
                        </td>

                        {/* Kolom NIK */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={displayNik}
                              onChange={(e) => handleFieldChange(emp, 'nik', e.target.value)}
                              placeholder="NIK (Wajib)"
                              className={`w-full px-2.5 py-1 text-xs font-mono font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                isModified
                                  ? 'border-amber-400 bg-white text-amber-900 shadow-2xs'
                                  : 'border-slate-300 bg-white text-blue-700'
                              }`}
                            />
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[11px]">
                              {emp.nik || emp.id || '-'}
                            </span>
                          )}
                        </td>

                        {/* Kolom Jabatan */}
                        <td className="p-3 text-slate-600">
                          {isEditing ? (
                            <select
                              value={displayDept && displayDept.includes('Guru') ? 'Guru' : 'Staff'}
                              onChange={(e) => handleFieldChange(emp, 'department', e.target.value)}
                              className={`w-full px-2.5 py-1 text-xs border rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                isModified
                                  ? 'border-amber-400 bg-white text-slate-900 shadow-2xs'
                                  : 'border-slate-300 bg-white text-slate-800'
                              }`}
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

                        {/* Kolom Unit Kerja */}
                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={displayWorkUnit || ''}
                              onChange={(e) => handleFieldChange(emp, 'work_unit', e.target.value || null)}
                              className={`w-full px-2 py-1 text-xs border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                isModified
                                  ? 'border-amber-400 bg-white text-slate-900 shadow-2xs'
                                  : 'border-slate-300 bg-white text-slate-800'
                              }`}
                            >
                              <option value="">-- Tanpa Unit --</option>
                              {workUnits.map((u) => (
                                <option key={u.id} value={u.name}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          ) : emp.work_unit ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {emp.work_unit}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Belum diatur
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
                          <div className="flex items-center justify-center gap-1">
                            {isModified ? (
                              <>
                                <button
                                  onClick={() => handleSaveSingleRow(emp)}
                                  disabled={isRowSaving}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                                  title="Simpan baris ini sekarang"
                                >
                                  {isRowSaving ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleCancelRowEdit(emp.id)}
                                  disabled={isRowSaving}
                                  className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors cursor-pointer"
                                  title="Batalkan perubahan baris ini"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : isEditing && !isEditMode ? (
                              <button
                                onClick={() => handleCancelRowEdit(emp.id)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                                title="Tutup edit baris"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            ) : !isEditing ? (
                              <button
                                onClick={() => setEditingRows((prev) => new Set(prev).add(emp.id))}
                                className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Ubah data pegawai ini"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}

                            <button
                              onClick={() => handleDelete(emp)}
                              disabled={isDeleting === emp.id || isRowSaving}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                              title="Hapus Pegawai"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                  Jabatan (Klasifikasi) <span className="text-rose-500">*</span>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unit Kerja (Opsional)
                </label>
                <select
                  value={newWorkUnit}
                  onChange={(e) => setNewWorkUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold"
                >
                  <option value="">-- Tanpa Unit Kerja --</option>
                  {workUnits.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Dapat diatur sekarang atau dikelola di kemudian hari
                </p>
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
      {/* Floating Action Bar untuk Simpan Banyak / Massal ke Database */}
      {stagedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
              <strong className="text-amber-400 font-bold">{stagedCount}</strong> perubahan pegawai belum disimpan
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700 mx-1 shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCancelAllEdits}
              disabled={isSavingBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal Semua</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAllEdits}
              disabled={isSavingBatch}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-600/30 disabled:opacity-60 cursor-pointer"
            >
              {isSavingBatch ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan ke Database ({stagedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Kelola Unit Kerja */}
      <WorkUnitManagerModal
        isOpen={isWorkUnitModalOpen}
        onClose={() => setIsWorkUnitModalOpen(false)}
        onToast={(t) => setMsg({ text: t, type: 'success' })}
        employees={localEmployees}
        onWorkUnitsChanged={loadWorkUnits}
      />
    </div>
  );
};
