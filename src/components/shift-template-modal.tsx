'use client';

import React, { useState } from 'react';
import { ShiftTemplate } from '@/lib/types';
import { X, Plus, Edit2, Trash2, Clock, Check, AlertCircle, Sparkles, Shield } from 'lucide-react';

interface ShiftTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  onTemplatesUpdated: () => void;
}

const COLOR_PRESETS = [
  { label: 'Biru', hex: '#2563eb', bg: 'bg-blue-600' },
  { label: 'Hijau Emerald', hex: '#059669', bg: 'bg-emerald-600' },
  { label: 'Amber / Oranye', hex: '#d97706', bg: 'bg-amber-600' },
  { label: 'Ungu Violet', hex: '#7c3aed', bg: 'bg-purple-600' },
  { label: 'Rose / Merah', hex: '#e11d48', bg: 'bg-rose-600' },
  { label: 'Indigo', hex: '#4f46e5', bg: 'bg-indigo-600' },
  { label: 'Teal', hex: '#0d9488', bg: 'bg-teal-600' },
  { label: 'Slate / Abu', hex: '#64748b', bg: 'bg-slate-600' },
];

export const ShiftTemplateModal: React.FC<ShiftTemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  onTemplatesUpdated,
}) => {
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formStartTime, setFormStartTime] = useState('07:30');
  const [formEndTime, setFormEndTime] = useState('16:00');
  const [formGracePeriod, setFormGracePeriod] = useState<number>(0);
  const [formIsOvernight, setFormIsOvernight] = useState<boolean>(false);
  const [formIsOffDay, setFormIsOffDay] = useState<boolean>(false);
  const [formColor, setFormColor] = useState('#2563eb');
  const [formDescription, setFormDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const startCreate = () => {
    setEditingTemplate(null);
    setIsCreating(true);
    setFormName('');
    setFormCode('');
    setFormStartTime('07:30');
    setFormEndTime('16:00');
    setFormGracePeriod(0);
    setFormIsOvernight(false);
    setFormIsOffDay(false);
    setFormColor('#2563eb');
    setFormDescription('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const startEdit = (t: ShiftTemplate) => {
    setIsCreating(false);
    setEditingTemplate(t);
    setFormName(t.name);
    setFormCode(t.code);
    setFormStartTime(t.start_time.substring(0, 5));
    setFormEndTime(t.end_time.substring(0, 5));
    setFormGracePeriod(t.grace_period_minutes || 0);
    setFormIsOvernight(t.is_overnight);
    setFormIsOffDay(t.is_off_day);
    setFormColor(t.color || '#2563eb');
    setFormDescription(t.description || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setErrorMsg('Nama shift dan kode singkatan wajib diisi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const sTime = formStartTime.length === 5 ? `${formStartTime}:00` : formStartTime;
    const eTime = formEndTime.length === 5 ? `${formEndTime}:00` : formEndTime;

    try {
      const isEditing = Boolean(editingTemplate);
      const res = await fetch('/api/shifts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          start_time: formIsOffDay ? '00:00:00' : sTime,
          end_time: formIsOffDay ? '00:00:00' : eTime,
          grace_period_minutes: formGracePeriod,
          is_overnight: formIsOvernight,
          is_off_day: formIsOffDay,
          color: formColor,
          description: formDescription.trim(),
          is_default: editingTemplate?.is_default || false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan template shift.');
      }

      setSuccessMsg(`Template shift "${formName}" berhasil disimpan.`);
      cancelForm();
      onTemplatesUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus template shift "${name}"?`)) {
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus shift.');
      }
      setSuccessMsg(`Template shift "${name}" berhasil dihapus.`);
      onTemplatesUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus template shift.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Master Template Jam Kerja &amp; Shift
              </h3>
              <p className="text-xs text-slate-500">
                Atur standar jam kerja yang dapat di-assign per pegawai dan per tanggal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Add / Edit */}
          {(isCreating || editingTemplate) && (
            <form onSubmit={handleSave} className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-4 text-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {isCreating ? 'Tambah Template Shift Baru' : `Edit Shift: ${editingTemplate?.name}`}
                </span>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Shift <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Shift Pagi Asrama"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Kode Singkatan (Maks 5 Karakter) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    placeholder="e.g. PAGI"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-sans uppercase font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Time pickers */}
              {!formIsOffDay && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Jam Masuk (Batas Datang)
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Jam Pulang (Batas Pulang)
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Toleransi Terlambat (Menit)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={formGracePeriod}
                      onChange={(e) => setFormGracePeriod(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsOvernight}
                    disabled={formIsOffDay}
                    onChange={(e) => setFormIsOvernight(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    Shift Lintas Hari (Overnight / Malam)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsOffDay}
                    onChange={(e) => {
                      setFormIsOffDay(e.target.checked);
                      if (e.target.checked) {
                        setFormIsOvernight(false);
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    Hari Libur Shift (Bebas Tugas / OFF)
                  </span>
                </label>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Warna Badge:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setFormColor(p.hex)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer border ${
                        formColor.toLowerCase() === p.hex.toLowerCase()
                          ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 border-white shadow-xs'
                          : 'border-black/10 hover:scale-110'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    >
                      {formColor.toLowerCase() === p.hex.toLowerCase() && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Berlaku untuk tim keamanan asrama"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Template'}
                </button>
              </div>
            </form>
          )}

          {/* List of Shift Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Daftar Template Aktif ({templates.length})
              </span>
              {!isCreating && !editingTemplate && (
                <button
                  type="button"
                  onClick={startCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Shift Baru</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-1 rounded-md text-white font-sans font-bold text-xs tracking-wide shadow-2xs"
                      style={{ backgroundColor: t.color || '#2563eb' }}
                    >
                      {t.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{t.name}</span>
                        {t.is_default && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                            Default
                          </span>
                        )}
                        {t.is_off_day && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            Libur
                          </span>
                        )}
                        {t.is_overnight && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">
                            Overnight
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t.is_off_day
                          ? 'Bebas tugas / hari lepas dinas'
                          : `Jam Kerja: ${t.start_time.substring(0, 5)} s/d ${t.end_time.substring(0, 5)} WIB ${
                              t.grace_period_minutes > 0 ? `(Toleransi ${t.grace_period_minutes}m)` : ''
                            }`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!t.is_default && (
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id, t.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
