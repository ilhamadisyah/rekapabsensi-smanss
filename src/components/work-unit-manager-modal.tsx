'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Users,
  Check,
  Building2,
} from 'lucide-react';
import { WorkUnit, Employee } from '@/lib/types';

interface WorkUnitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  employees?: Employee[];
  onWorkUnitsChanged?: () => void;
}

export const WorkUnitManagerModal: React.FC<WorkUnitManagerModalProps> = ({
  isOpen,
  onClose,
  onToast,
  employees = [],
  onWorkUnitsChanged,
}) => {
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Tambah
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // State Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWorkUnits();
    }
  }, [isOpen]);

  const loadWorkUnits = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/work-units');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar unit kerja');
      }
      setWorkUnits(data.workUnits || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) {
      setErrorMsg('Nama unit kerja wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/work-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          description: newDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan unit kerja.');
      }

      onToast(`Unit kerja "${cleanName}" berhasil ditambahkan!`);
      setNewName('');
      setNewDesc('');
      setIsAddingOpen(false);
      await loadWorkUnits();
      onWorkUnitsChanged?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan unit kerja');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (unit: WorkUnit) => {
    setEditingId(unit.id);
    setEditName(unit.name);
    setEditDesc(unit.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const handleUpdate = async (id: string) => {
    const cleanName = editName.trim();
    if (!cleanName) {
      alert('Nama unit kerja tidak boleh kosong.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/work-units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: cleanName,
          description: editDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui unit kerja');
      }

      onToast(`Unit kerja "${cleanName}" berhasil diperbarui!`);
      cancelEdit();
      await loadWorkUnits();
      onWorkUnitsChanged?.();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui unit kerja');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (unit: WorkUnit) => {
    const assignedCount = employees.filter((e) => e.work_unit === unit.name).length;
    let warningMsg = `Hapus unit kerja "${unit.name}"?`;
    if (assignedCount > 0) {
      warningMsg += `\n\nPERINGATAN: Ada ${assignedCount} pegawai yang saat ini terdaftar di unit kerja ini. Menghapus unit kerja ini tidak menghapus pegawai, tetapi status unit kerja mereka perlu diperbarui.`;
    }

    if (!confirm(warningMsg)) return;

    setDeletingId(unit.id);
    try {
      const res = await fetch(`/api/work-units?id=${encodeURIComponent(unit.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus unit kerja');
      }

      onToast(`Unit kerja "${unit.name}" berhasil dihapus.`);
      await loadWorkUnits();
      onWorkUnitsChanged?.();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus unit kerja');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Master Data Unit Kerja
              </h2>
              <p className="text-xs text-slate-300">
                Atur pengelompokan unit kerja sekolah untuk klasifikasi pegawai &amp; hak akses jadwal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Total Unit Kerja:{' '}
              <span className="font-bold text-slate-900">{workUnits.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingOpen(!isAddingOpen)}
              className={`px-3 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAddingOpen
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isAddingOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAddingOpen ? 'Batal' : '+ Tambah Unit Kerja'}</span>
            </button>
          </div>

          {/* Form Tambah Unit Kerja Baru */}
          {isAddingOpen && (
            <form
              onSubmit={handleCreate}
              className="bg-blue-50/60 rounded-2xl p-4 sm:p-5 border border-blue-100 space-y-3 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 border-b border-blue-100 pb-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Tambah Unit Kerja Baru</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nama Unit Kerja *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Security / Satpam, Tata Usaha, Asrama"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Deskripsi / Tugas (Opsional)
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Contoh: Pengamanan lingkungan sekolah 24 jam"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Unit Kerja'}
                </button>
              </div>
            </form>
          )}

          {/* List Unit Kerja Cards */}
          <div className="space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Memuat data unit kerja...
              </div>
            ) : workUnits.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                Belum ada unit kerja yang didaftarkan.
              </div>
            ) : (
              workUnits.map((unit) => {
                const assignedCount = employees.filter((e) => e.work_unit === unit.name).length;
                const isEditing = editingId === unit.id;

                if (isEditing) {
                  return (
                    <div
                      key={unit.id}
                      className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2.5 animate-in fade-in"
                    >
                      <div className="text-[11px] font-bold text-amber-900 uppercase">
                        Edit Unit Kerja
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nama Unit Kerja"
                          className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Deskripsi"
                          className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleUpdate(unit.id)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isUpdating ? 'Menyimpan...' : 'Simpan'}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={unit.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {unit.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Users className="w-3 h-3 text-slate-500" />
                          {assignedCount} Pegawai
                        </span>
                      </div>
                      {unit.description ? (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {unit.description}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">
                          Tanpa deskripsi
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(unit)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Unit Kerja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === unit.id}
                        onClick={() => handleDelete(unit)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        title="Hapus Unit Kerja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Unit kerja ini akan muncul sebagai pilihan saat mengatur profil pegawai dan hak akses admin.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
