import React, { useState } from 'react';
import { Employee } from '@/lib/types';
import { Search, Edit2, Check, X, Shield, Users, PlusCircle, Trash2, AlertTriangle, FileSpreadsheet, UserPlus } from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  onEmployeeUpdated: () => void;
  userRole: string;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  onEmployeeUpdated,
  userRole,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMachineId, setEditMachineId] = useState('');
  const [editRowIndex, setEditRowIndex] = useState<number>(0);
  const [editFullName, setEditFullName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editNik, setEditNik] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal Tambah Pegawai
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newMachineId, setNewMachineId] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newDepartment, setNewDepartment] = useState('Guru');
  const [newRowIndex, setNewRowIndex] = useState<number>(employees.length + 1);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.machine_id.toLowerCase().includes(search.toLowerCase()) ||
      (e.nik && e.nik.toLowerCase().includes(search.toLowerCase())) ||
      (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
  );

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
            excel_row_index: Number(editRowIndex),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: 'Berhasil memperbarui data pegawai!', type: 'success' });
        setEditingId(null);
        onEmployeeUpdated();
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
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: `Pegawai ${emp.full_name} berhasil dihapus.`, type: 'success' });
        onEmployeeUpdated();
      } else {
        setMsg({ text: data.error || 'Gagal menghapus pegawai', type: 'error' });
      }
    } catch (e: any) {
      setMsg({ text: e.message || 'Kesalahan jaringan', type: 'error' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleOpenAddModal = () => {
    setNewFullName('');
    setNewMachineId('');
    setNewNik('');
    setNewDepartment('Guru');
    setNewRowIndex(employees.length + 1);
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
          excel_row_index: Number(newRowIndex) || (employees.length + 1),
          is_active: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ text: `Berhasil mendaftarkan pegawai baru: ${newFullName}`, type: 'success' });
        setIsAddModalOpen(false);
        onEmployeeUpdated();
      } else {
        alert(data.error || 'Gagal menambahkan pegawai.');
      }
    } catch (err: any) {
      alert(err.message || 'Kesalahan jaringan');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col p-4 sm:p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Master Data Pegawai &amp; Pemetaan Mesin Biometrik
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total {employees.length} Pegawai terdaftar di database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, unit..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
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
      {employees.length === 0 ? (
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
                Unggah berkas log presensi mesin biometrik (.xls/.xlsx). Sistem akan secara otomatis mendeteksi dan mendaftarkan seluruh ID pegawai baru ke database.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[550px] border border-slate-200 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-100/90 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="p-3 font-bold text-slate-700 w-12 text-center">No</th>
                <th className="p-3 font-bold text-slate-700">Nama</th>
                <th className="p-3 font-bold text-slate-700 w-52">NIK</th>
                <th className="p-3 font-bold text-slate-700 w-44">Unit / Jabatan</th>
                <th className="p-3 font-bold text-slate-700 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 text-xs italic">
                    Tidak ditemukan pegawai dengan kata kunci &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filtered.map((emp, idx) => {
                  const isEditing = editingId === emp.id;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
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
                              title="Ubah Pegawai"
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
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs transition-colors flex items-center gap-1.5"
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
