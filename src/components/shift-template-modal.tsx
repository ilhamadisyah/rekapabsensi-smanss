'use client';

import React, { useState } from 'react';
import { ShiftTemplate } from '@/lib/types';
import { X, Plus, Edit2, Trash2, Clock, Check, AlertCircle, Sparkles, Shield, Sun, Moon, Coffee } from 'lucide-react';

function formatTimeOffset(baseTime: string, offsetMinutes: number, isNextDay?: boolean): string {
  if (!baseTime) return '--:--';
  const [hStr, mStr] = baseTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h)) return '--:--';

  let totalMinutes = h * 60 + m + offsetMinutes;
  let dayOffset = 0;
  while (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    dayOffset -= 1;
  }
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayOffset += 1;
  }

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  const timeStr = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')} WIB`;

  if (isNextDay || dayOffset > 0) {
    return `${timeStr} (+1 hari)`;
  }
  if (dayOffset < 0) {
    return `${timeStr} (-1 hari)`;
  }
  return timeStr;
}

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
  const [formCheckInWindow, setFormCheckInWindow] = useState<number>(120);
  const [formCheckOutWindow, setFormCheckOutWindow] = useState<number>(240);
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
    setFormCheckInWindow(120);
    setFormCheckOutWindow(240);
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
    setFormCheckInWindow(typeof t.check_in_window_minutes === 'number' ? t.check_in_window_minutes : 120);
    setFormCheckOutWindow(typeof t.check_out_window_minutes === 'number' ? t.check_out_window_minutes : 240);
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
          check_in_window_minutes: formCheckInWindow,
          check_out_window_minutes: formCheckOutWindow,
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

              {/* Tipe Shift Kerja: 3-Segmented Pill Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Tipe Shift Kerja
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFormIsOffDay(false);
                      setFormIsOvernight(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!formIsOffDay && !formIsOvernight
                      ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Reguler (Harian)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormIsOffDay(false);
                      setFormIsOvernight(true);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!formIsOffDay && formIsOvernight
                      ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Shift Malam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormIsOffDay(true);
                      setFormIsOvernight(false);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${formIsOffDay
                      ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                  >
                    <Coffee className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">Bebas Tugas</span>
                  </button>
                </div>
              </div>

              {/* Time pickers & Time Windows */}
              {!formIsOffDay ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Jam Masuk (WIB) <span className="text-rose-500">*</span>
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
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Jam Pulang (WIB) <span className="text-rose-500">*</span></span>
                        {formIsOvernight && (
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                            Besok
                          </span>
                        )}
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
                        Toleransi Telat
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={formGracePeriod}
                          onChange={(e) => setFormGracePeriod(Number(e.target.value))}
                          className="w-full pl-3 pr-12 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1.5 text-[10.5px] text-slate-400 font-medium">
                          menit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Time Windows Settings */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                          <Shield className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">
                          Batas Waktu Presensi
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">Batas Maksimal Absen Masuk</span>
                          <span className="text-blue-600 font-bold text-[10px]">
                            {(formCheckInWindow / 60).toFixed(1)} jam sebelum
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={15}
                            max={360}
                            step={15}
                            value={formCheckInWindow}
                            onChange={(e) => setFormCheckInWindow(Number(e.target.value))}
                            className="w-full pl-2.5 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                          />
                          <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-medium">menit</span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">
                            Absen dimulai: <strong className="text-slate-800 font-bold">{formatTimeOffset(formStartTime, -formCheckInWindow)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">Batas Maksimal Absen Pulang</span>
                          <span className="text-blue-600 font-bold text-[10px]">
                            {(formCheckOutWindow / 60).toFixed(1)} jam setelah
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min={30}
                            max={480}
                            step={15}
                            value={formCheckOutWindow}
                            onChange={(e) => setFormCheckOutWindow(Number(e.target.value))}
                            className="w-full pl-2.5 pr-12 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                          />
                          <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-medium">menit</span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate">
                            Absen diterima hingga: <strong className="text-slate-800 font-bold">{formatTimeOffset(formEndTime, formCheckOutWindow, formIsOvernight)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                    <Coffee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800">Shift Bebas Tugas / Libur (OFF)</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Pegawai dengan shift ini tidak dikenakan kewajiban presensi dan bebas dari alpa serta keterlambatan.
                    </p>
                  </div>
                </div>
              )}

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
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer border ${formColor.toLowerCase() === p.hex.toLowerCase()
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
                          : `Jam Kerja: ${t.start_time.substring(0, 5)} s/d ${t.end_time.substring(0, 5)} WIB ${t.grace_period_minutes > 0 ? `(Toleransi ${t.grace_period_minutes}m)` : ''
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
