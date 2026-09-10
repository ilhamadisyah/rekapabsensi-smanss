import React, { useState } from 'react';
import { Employee } from '@/lib/types';
import { Search, Edit2, Check, X, Shield, Users, RefreshCw } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.machine_id.toLowerCase().includes(search.toLowerCase()) ||
      e.nik.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditMachineId(emp.machine_id);
    setEditRowIndex(emp.excel_row_index);
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
            machine_id: editMachineId.trim(),
            excel_row_index: Number(editRowIndex),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg('Berhasil memperbarui pemetaan pegawai!');
        setEditingId(null);
        onEmployeeUpdated();
      } else {
        setMsg(data.error || 'Gagal menyimpan perubahan');
      }
    } catch (e: any) {
      setMsg(e.message || 'Kesalahan jaringan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Master Data Pegawai &amp; Pemetaan Mesin Biometrik
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Total {employees.length} Pegawai terdaftar dan terpetakan ke mesin biometrik presensi.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pegawai..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-medium">
          {msg}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
            <tr>
              <th className="p-3 font-bold text-slate-700 w-12 text-center">No</th>
              <th className="p-3 font-bold text-slate-700">Nama Pegawai &amp; NIK</th>
              <th className="p-3 font-bold text-slate-700">Unit / Jabatan</th>
              <th className="p-3 font-bold text-slate-700 text-center w-36">ID Mesin Biometrik</th>
              <th className="p-3 font-bold text-slate-700 text-center w-32">Baris Excel Template</th>
              <th className="p-3 font-bold text-slate-700 text-center w-24">Status</th>
              <th className="p-3 font-bold text-slate-700 text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((emp, idx) => {
              const isEditing = editingId === emp.id;

              return (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{emp.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-sans font-medium mt-0.5">NIK: {emp.nik}</div>
                  </td>
                  <td className="p-3 text-slate-600">{emp.department}</td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editMachineId}
                        onChange={(e) => setEditMachineId(e.target.value)}
                        className="w-24 px-2 py-1 text-center font-sans font-bold text-xs border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-sans font-bold text-xs">
                        {emp.machine_id}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min={17}
                        max={250}
                        value={editRowIndex}
                        onChange={(e) => setEditRowIndex(Number(e.target.value))}
                        className="w-20 px-2 py-1 text-center font-sans font-bold text-xs border border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <span className="font-sans text-slate-600 font-semibold">
                        Baris {emp.excel_row_index}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      Aktif
                    </span>
                  </td>
                  <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => saveEdit(emp.id)}
                            disabled={isSaving}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                            title="Simpan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(emp)}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                          title="Ubah Pemetaan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
