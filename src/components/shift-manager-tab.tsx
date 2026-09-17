'use client';

import React, { useState } from 'react';
import { ShiftTemplate } from '@/lib/types';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Moon,
  Coffee,
  Check,
  Sun,
  RotateCcw,
} from 'lucide-react';

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

  const totalDays = (isNextDay ? 1 : 0) + dayOffset;
  if (totalDays > 0) {
    return `${timeStr} (+${totalDays} hari)`;
  }
  if (totalDays < 0) {
    return `${timeStr} (${totalDays} hari)`;
  }
  return timeStr;
}

function getMinutesFromMidnight(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

function getMinutesToEndOfDay(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const total = (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  const diff = 1439 - total;
  return diff >= 0 ? diff : 0;
}

interface ShiftManagerTabProps {
  templates: ShiftTemplate[];
  onTemplatesUpdated: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const COLOR_PRESETS = [
  { label: 'Biru (Normal)', hex: '#2563eb' },
  { label: 'Hijau Emerald (Pagi)', hex: '#059669' },
  { label: 'Amber / Oranye (Siang)', hex: '#d97706' },
  { label: 'Ungu Violet (Malam)', hex: '#7c3aed' },
  { label: 'Rose / Merah (Piket)', hex: '#e11d48' },
  { label: 'Teal (Khusus)', hex: '#0d9488' },
  { label: 'Slate / Abu (Libur/OFF)', hex: '#64748b' },
];

export const ShiftManagerTab: React.FC<ShiftManagerTabProps> = ({
  templates,
  onTemplatesUpdated,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('16:00');
  const [gracePeriod, setGracePeriod] = useState<number>(0);
  const [checkInWindow, setCheckInWindow] = useState<number>(120);
  const [checkOutWindow, setCheckOutWindow] = useState<number>(240);
  const [isOvernight, setIsOvernight] = useState(false);
  const [isOffDay, setIsOffDay] = useState(false);
  const [color, setColor] = useState('#2563eb');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [shiftType, setShiftType] = useState<'regular' | 'shift' | 'off'>('regular');

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setShiftType('shift');
    setName('');
    setCode('');
    setStartTime('07:00');
    setEndTime('15:00');
    setGracePeriod(0);
    setCheckInWindow(120);
    setCheckOutWindow(240);
    setIsOvernight(false);
    setIsOffDay(false);
    setColor('#2563eb');
    setDescription('');
    setIsDefault(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: ShiftTemplate) => {
    setEditingTemplate(t);
    setShiftType(t.is_off_day ? 'off' : t.is_default ? 'regular' : 'shift');
    setName(t.name);
    setCode(t.code);
    setStartTime(t.start_time.substring(0, 5));
    setEndTime(t.end_time.substring(0, 5));
    setGracePeriod(t.grace_period_minutes || 0);
    setCheckInWindow(typeof t.check_in_window_minutes === 'number' ? t.check_in_window_minutes : 120);
    setCheckOutWindow(typeof t.check_out_window_minutes === 'number' ? t.check_out_window_minutes : 240);
    setIsOvernight(t.is_overnight);
    setIsOffDay(t.is_off_day);
    setColor(t.color || '#2563eb');
    setDescription(t.description || '');
    setIsDefault(Boolean(t.is_default));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Calculate duration in hours & minutes
  const calculateDuration = (start: string, end: string, overnight: boolean, off: boolean) => {
    if (off) return 'Bebas Tugas (0 Jam)';
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let startMin = (h1 || 0) * 60 + (m1 || 0);
    let endMin = (h2 || 0) * 60 + (m2 || 0);
    if (overnight || endMin < startMin) {
      endMin += 24 * 60;
    }
    const diff = endMin - startMin;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours} Jam ${minutes > 0 ? `${minutes} Mnt` : ''}`;
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val && endTime && val > endTime) {
      setIsOvernight(true);
    }
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    if (val && startTime && startTime > val) {
      setIsOvernight(true);
    }
  };

  const handleSelectType = (type: 'regular' | 'shift' | 'off') => {
    setShiftType(type);
    if (type === 'regular') {
      setIsOffDay(false);
      setIsOvernight(false);
      setIsDefault(true);
      if (startTime >= '18:00' || endTime <= '08:00') {
        setStartTime('07:30');
        setEndTime('16:00');
      }
    } else if (type === 'shift') {
      setIsOffDay(false);
      setIsDefault(false);
      if (!startTime || !endTime || startTime === '00:00') {
        setStartTime('07:00');
        setEndTime('15:00');
      }
    } else {
      setIsOffDay(true);
      setIsOvernight(false);
      setIsDefault(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError('Nama shift dan kode singkatan wajib diisi.');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    const sTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const eTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    try {
      const isEditing = Boolean(editingTemplate);
      const res = await fetch('/api/shifts', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          start_time: isOffDay ? '00:00:00' : sTime,
          end_time: isOffDay ? '00:00:00' : eTime,
          grace_period_minutes: Number(gracePeriod) || 0,
          check_in_window_minutes: typeof checkInWindow === 'number' && !isNaN(checkInWindow) ? checkInWindow : 120,
          check_out_window_minutes: typeof checkOutWindow === 'number' && !isNaN(checkOutWindow) ? checkOutWindow : 240,
          is_overnight: isOvernight,
          is_off_day: isOffDay,
          color,
          description: description.trim(),
          is_default: isDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan template shift.');
      }

      showToast(`Template shift "${name}" berhasil disimpan!`, 'success');
      setIsModalOpen(false);
      onTemplatesUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan shift.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, shiftName: string) => {
    if (!confirm(`Hapus template shift "${shiftName}"?`)) return;

    try {
      const res = await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Template shift "${shiftName}" berhasil dihapus.`);
        onTemplatesUpdated();
      } else {
        showToast(data.error || 'Gagal menghapus shift.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Master Template Jam Kerja &amp; Shift
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola standar jam kerja operasional sekolah, shift pagi/siang/malam, dan aturan toleransi keterlambatan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Template Shift</span>
        </button>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Daftar Template Aktif ({templates.length} shift terkonfigurasi)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">Kode Badge</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Shift &amp; Deskripsi</th>
                <th className="py-3 px-4 min-w-[150px]">Jam Kerja (WIB)</th>
                <th className="py-3 px-4 w-32">Durasi Kerja</th>
                <th className="py-3 px-4 w-32">Toleransi Terlambat</th>
                <th className="py-3 px-4 w-28 text-center">Tipe / Sifat</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>

                  {/* Badge & Color */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-sans font-bold text-white shadow-2xs"
                        style={{ backgroundColor: t.color || '#2563eb' }}
                      >
                        {t.code}
                      </span>
                      {t.is_default && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold text-[9px] rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Name & Desc */}
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900 text-xs">{t.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{t.description || '-'}</div>
                  </td>

                  {/* Hours */}
                  <td className="py-3.5 px-4">
                    {t.is_off_day ? (
                      <span className="text-slate-500 font-semibold text-[11px] flex items-center gap-1">
                        <Coffee className="w-3.5 h-3.5 text-slate-400" />
                        Bebas Tugas (OFF)
                      </span>
                    ) : (
                      <div className="font-sans font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          {t.start_time.substring(0, 5)} - {t.end_time.substring(0, 5)} WIB
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3.5 px-4 font-semibold text-slate-700 text-[11px]">
                    {calculateDuration(t.start_time, t.end_time, t.is_overnight, t.is_off_day)}
                  </td>

                  {/* Grace Period */}
                  <td className="py-3.5 px-4">
                    {t.grace_period_minutes > 0 ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-sans font-bold text-[10px] rounded">
                        +{t.grace_period_minutes} menit
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">0 menit (Tepat)</span>
                    )}
                  </td>

                  {/* Type/Properties */}
                  <td className="py-3.5 px-4 text-center">
                    {t.is_overnight ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded-full">
                        <Moon className="w-2.5 h-2.5" />
                        Lintas Hari
                      </span>
                    ) : t.is_off_day ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded-full">
                        Libur
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                        Reguler
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Template Shift"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!t.is_default && (
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Template Shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD Shift */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{editingTemplate ? 'Edit Template Shift' : 'Tambah Template Shift Baru'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasikan jam kerja standar dan proteksi batas presensi.
                </p>
              </div>

              {/* Live Badge Preview */}
              <div
                className="px-3 py-1.5 rounded-xl text-xs font-sans font-bold text-white shadow-xs transition-colors shrink-0"
                style={{ backgroundColor: color }}
              >
                {code || 'KODE'}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form id="shift-form" onSubmit={handleSave} noValidate className="space-y-4">
                {/* Nama & Kode Singkatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Shift <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Shift Pagi (Piket/Asrama)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Singkatan (Maks 5 Karakter) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="PAGI, NORM, MALAM"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase tracking-wider text-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Tipe Shift Kerja: 3-Segmented Pill Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipe Shift Kerja
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSelectType('regular')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        shiftType === 'regular' && !isOffDay
                          ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">Reguler (Harian)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectType('shift')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        shiftType === 'shift' && !isOffDay
                          ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">Shift</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectType('off')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isOffDay || shiftType === 'off'
                          ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Bebas Tugas</span>
                    </button>
                  </div>
                </div>

                {/* Working Hours or Off-day Info */}
                {!isOffDay ? (
                  <>
                    {/* Jam Masuk, Jam Pulang, Toleransi Telat (3 Kolom Seimbang) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jam Masuk (WIB) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Jam Pulang (WIB) <span className="text-rose-500">*</span></span>
                          {isOvernight && (
                            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                              Besok (+1)
                            </span>
                          )}
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => handleEndTimeChange(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Toleransi Telat
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={60}
                            step="any"
                            value={gracePeriod}
                            onChange={(e) => setGracePeriod(Number(e.target.value))}
                            className="w-full pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-2 text-[11px] text-slate-400 font-medium">
                            menit
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan Durasi & Toleransi Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100/70 border border-slate-200/80 rounded-xl text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          Total Durasi: <strong className="text-slate-800 font-bold">{calculateDuration(startTime, endTime, isOvernight, isOffDay)}</strong>
                        </span>
                      </div>
                      {gracePeriod > 0 && (
                        <div className="flex items-center gap-1 text-amber-700 font-medium">
                          <span>Toleransi masuk hingga: <strong>{formatTimeOffset(startTime, gracePeriod)}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* KARTU 1: PENGATURAN SHIFT LINTAS HARI (OVERNIGHT) */}
                    <div className={`p-3.5 rounded-2xl border transition-all ${
                      isOvernight
                        ? 'bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-indigo-50/30 border-indigo-200 shadow-2xs'
                        : 'bg-slate-50/80 border-slate-200/90 hover:bg-slate-50'
                    }`}>
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={isOvernight}
                            onChange={(e) => setIsOvernight(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300 cursor-pointer accent-indigo-600"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                isOvernight ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200/70 text-slate-500'
                              }`}>
                                <Moon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-bold text-slate-900">
                                Shift Lintas Hari (Overnight / Pulang Keesokan Harinya)
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isOvernight
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : 'bg-slate-200/70 text-slate-600 border-slate-300'
                            }`}>
                              {isOvernight ? 'Lintas Hari (+1 Aktif)' : 'Hari yang Sama'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                            Aktifkan jika jam kerja melewati pukul 00:00 tengah malam. Jam pulang akan dihitung pada hari kalender berikutnya (+1). Sistem presensi akan otomatis melakukan pencocokan <em>Cross-Day Punch Pairing</em>.
                          </p>
                          {startTime > endTime && (
                            <div className="mt-2.5 text-[10.5px] text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg border border-indigo-200/80 font-medium flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>Jam pulang ({endTime}) lebih kecil dari jam masuk ({startTime}). Otomatis diakui sebagai shift lintas hari (+1 hari).</span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* KARTU 2: BATAS MAKSIMAL ABSENSI */}
                    <div className="bg-gradient-to-br from-slate-50/90 to-blue-50/40 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          Batas Maksimal Absensi
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 -mt-1 leading-relaxed">
                        Mencegah salah deteksi presensi agar tap mesin di luar rentang jam operasional (misalnya tap siang hari saat pegawai bertugas shift malam) tidak disalahartikan sebagai absensi sah.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        {/* Jendela Buka Tap Masuk */}
                        <div className="flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                              <span className="font-bold text-xs text-slate-800 truncate">
                                Batas Absen Masuk
                              </span>
                            </div>
                            <span className="shrink-0 text-[10.5px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70 font-mono whitespace-nowrap">
                              {(checkInWindow / 60).toFixed(1)} jam sebelum
                            </span>
                          </div>

                          {/* Input Durasi */}
                          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-2xs transition-all overflow-hidden">
                            <input
                              type="number"
                              min={0}
                              max={1440}
                              step="any"
                              value={checkInWindow}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCheckInWindow(val === '' ? 0 : Number(val));
                              }}
                              className="w-full px-3 py-2 bg-transparent text-sm font-bold font-mono text-slate-900 focus:outline-none"
                            />
                            <span className="pr-3.5 text-xs font-semibold text-slate-400 select-none">
                              menit
                            </span>
                          </div>

                          {/* Quick Presets for Check-In (Symmetrical & Clean) */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCheckInWindow(60)}
                              className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                                checkInWindow === 60
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              60m <span className="text-[10px] opacity-75">(1 jam)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckInWindow(120)}
                              className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                                checkInWindow === 120
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              120m <span className="text-[10px] opacity-75">(2 jam)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckInWindow(getMinutesFromMidnight(startTime))}
                              className={`col-span-2 px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                                checkInWindow === getMinutesFromMidnight(startTime)
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title="Buka tap sejak batas pergantian hari (00:00 WIB)"
                            >
                              Awal Hari 00:00 <span className="text-[10px] opacity-75">({getMinutesFromMidnight(startTime)}m)</span>
                            </button>
                          </div>

                          {/* Info Pill Jam Buka (Tanpa Terpotong) */}
                          <div className="flex items-center justify-between gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="text-[11px] font-medium whitespace-nowrap">Dibuka mulai:</span>
                            </div>
                            <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-100 shadow-2xs whitespace-nowrap">
                              {formatTimeOffset(startTime, -checkInWindow)}
                            </span>
                          </div>
                        </div>

                        {/* Batas Akhir Tap Pulang */}
                        <div className="flex flex-col justify-between bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                              <span className="font-bold text-xs text-slate-800 truncate">
                                Batas Absen Pulang
                              </span>
                            </div>
                            <span className="shrink-0 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70 font-mono whitespace-nowrap">
                              {(checkOutWindow / 60).toFixed(1)} jam setelah
                            </span>
                          </div>

                          {/* Input Durasi */}
                          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/70 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-2xs transition-all overflow-hidden">
                            <input
                              type="number"
                              min={0}
                              max={1440}
                              step="any"
                              value={checkOutWindow}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCheckOutWindow(val === '' ? 0 : Number(val));
                              }}
                              className="w-full px-3 py-2 bg-transparent text-sm font-bold font-mono text-slate-900 focus:outline-none"
                            />
                            <span className="pr-3.5 text-xs font-semibold text-slate-400 select-none">
                              menit
                            </span>
                          </div>

                          {/* Quick Presets for Check-Out (Symmetrical & Clean) */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCheckOutWindow(120)}
                              className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                                checkOutWindow === 120
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              120m <span className="text-[10px] opacity-75">(2 jam)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckOutWindow(240)}
                              className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                                checkOutWindow === 240
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              240m <span className="text-[10px] opacity-75">(4 jam)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCheckOutWindow(getMinutesToEndOfDay(endTime))}
                              className={`col-span-2 px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-all text-center border cursor-pointer ${
                                checkOutWindow === getMinutesToEndOfDay(endTime)
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title="Perpanjang batas tap pulang hingga batas ganti hari (23:59 WIB)"
                            >
                              Sampai 23:59 <span className="text-[10px] opacity-75">({getMinutesToEndOfDay(endTime)}m)</span>
                            </button>
                          </div>

                          {/* Info Pill Jam Tutup (Tanpa Terpotong) */}
                          <div className="flex items-center justify-between gap-1.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 min-w-0 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-[11px] font-medium whitespace-nowrap">Ditutup pukul:</span>
                            </div>
                            <span className="font-mono font-bold text-xs text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-100 shadow-2xs whitespace-nowrap">
                              {formatTimeOffset(endTime, checkOutWindow, isOvernight)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Shift Bebas Tugas / Libur (OFF)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Pegawai dengan shift ini tidak dikenakan kewajiban presensi datang maupun pulang, serta otomatis dibebaskan dari alpa dan keterlambatan.
                      </p>
                    </div>
                  </div>
                )}

                {/* KARTU 3: JADIKAN SHIFT STANDAR (DEFAULT) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsDefault(checked);
                        if (checked) {
                          setShiftType('regular');
                        } else if (shiftType === 'regular') {
                          setShiftType('shift');
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Jadikan Shift Standar (Default Sekolah)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Otomatis diterapkan untuk seluruh pegawai pada hari kerja jika tidak memiliki penugasan shift khusus.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Color Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Warna Label Badge
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setColor(p.hex)}
                        className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
                          color === p.hex
                            ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 border-white shadow-xs'
                            : 'border-black/10 hover:scale-105'
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.label}
                      >
                        {color === p.hex && <Check className="w-4 h-4 text-white stroke-[2.5]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Catatan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Keterangan peruntukan shift ini..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="shift-form"
                disabled={isLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
