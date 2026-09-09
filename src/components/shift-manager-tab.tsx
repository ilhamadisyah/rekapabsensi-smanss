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
} from 'lucide-react';

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

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setName('');
    setCode('');
    setStartTime('07:30');
    setEndTime('16:00');
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
          check_in_window_minutes: Number(checkInWindow) || 120,
          check_out_window_minutes: Number(checkOutWindow) || 240,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingTemplate ? 'Edit Template Shift' : 'Tambah Template Shift Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konfigurasikan jam kerja standar dan toleransi kehadiran.
                </p>
              </div>

              {/* Live Badge Preview */}
              <div
                className="px-3 py-1.5 rounded-xl text-xs font-sans font-bold text-white shadow-xs"
                style={{ backgroundColor: color }}
              >
                {code || 'CODE'}
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Shift <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Shift Pagi Operasional"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Singkatan (Maks 5 Huruf) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="PAGI, NORM, MALAM"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    required
                  />
                </div>
              </div>

              {/* Libur Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isOffDay}
                  onChange={(e) => setIsOffDay(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Hari Libur Shift (Bebas Tugas / OFF)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pegawai dengan shift ini tidak dikenakan kewajiban presensi / bebas alpa.
                  </span>
                </div>
              </label>

              {!isOffDay && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jam Masuk (WIB)
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jam Pulang (WIB)
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Toleransi Terlambat (Menit)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={gracePeriod}
                        onChange={(e) => setGracePeriod(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOvernight}
                          onChange={(e) => setIsOvernight(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Shift Lintas Hari (Overnight / Malam)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Configurable Time Windows */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Jendela Waktu Presensi (Proteksi & Keamanan)</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                        Anti-Absen Diluar Jam
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Jendela Buka Tap Masuk</span>
                          <span className="text-[10px] text-blue-600 font-bold">{(checkInWindow / 60).toFixed(1)} jam sebelum</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={15}
                            max={360}
                            step={15}
                            value={checkInWindow}
                            onChange={(e) => setCheckInWindow(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1.5 text-[11px] text-slate-400">menit</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Tap masuk paling awal diakui {checkInWindow} mnt sebelum jam masuk.</p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                          <span>Batas Akhir Tap Pulang</span>
                          <span className="text-[10px] text-blue-600 font-bold">{(checkOutWindow / 60).toFixed(1)} jam setelah</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={30}
                            max={480}
                            step={15}
                            value={checkOutWindow}
                            onChange={(e) => setCheckOutWindow(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-3 top-1.5 text-[11px] text-slate-400">menit</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Tap pulang paling lambat diakui {checkOutWindow} mnt setelah jam pulang.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

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
                      className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                        color === p.hex ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : ''
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    >
                      {color === p.hex && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Catatan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan peruntukan shift ini..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
