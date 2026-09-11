'use client';

import React, { useState } from 'react';
import { Holiday } from '@/lib/types';
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Tag,
  CalendarCheck2,
} from 'lucide-react';

interface HolidayManagerTabProps {
  holidays: Holiday[];
  selectedMonth: number;
  selectedYear: number;
  onHolidayUpdated: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const CATEGORY_MAP: Record<string, { label: string; badgeClass: string }> = {
  national: { label: 'Libur Nasional', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  collective_leave: { label: 'Cuti Bersama', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  school: { label: 'Khusus Sekolah', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const HolidayManagerTab: React.FC<HolidayManagerTabProps> = ({
  holidays,
  selectedMonth,
  selectedYear,
  onHolidayUpdated,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [dateStr, setDateStr] = useState(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  );
  const [startDateStr, setStartDateStr] = useState(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  );
  const [endDateStr, setEndDateStr] = useState(
    `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
  );
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'national' | 'school' | 'collective_leave'>('school');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Hitung jumlah hari dalam rentang
  const rangeDayCount = (() => {
    if (!isRangeMode || !startDateStr || !endDateStr) return 1;
    try {
      const s = new Date(startDateStr + 'T00:00:00').getTime();
      const e = new Date(endDateStr + 'T00:00:00').getTime();
      if (e < s) return 0;
      return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 1;
    }
  })();

  const openAddModal = () => {
    const defaultDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    setIsRangeMode(false);
    setDateStr(defaultDate);
    setStartDateStr(defaultDate);
    setEndDateStr(defaultDate);
    setName('');
    setCategory('school');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama hari libur wajib diisi.');
      return;
    }

    if (isRangeMode) {
      if (!startDateStr || !endDateStr) {
        setFormError('Tanggal mulai dan tanggal selesai wajib diisi.');
        return;
      }
      if (startDateStr > endDateStr) {
        setFormError('Tanggal selesai tidak boleh mendahului tanggal mulai.');
        return;
      }
    } else {
      if (!dateStr) {
        setFormError('Tanggal libur wajib diisi.');
        return;
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = isRangeMode
        ? {
            startDate: startDateStr,
            endDate: endDateStr,
            name: name.trim(),
            category,
            notes: notes.trim(),
          }
        : {
            date: dateStr,
            name: name.trim(),
            category,
            notes: notes.trim(),
          };

      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan hari libur.');
      }

      const totalCount = data.count || (isRangeMode ? rangeDayCount : 1);
      const msg = isRangeMode
        ? `Hari libur "${name.trim()}" (${totalCount} hari) berhasil ditambahkan!`
        : `Hari libur "${name.trim()}" berhasil ditambahkan!`;

      showToast(msg, 'success');
      setIsModalOpen(false);
      onHolidayUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string, holidayName: string) => {
    if (!confirm(`Hapus hari libur "${holidayName}"?`)) return;

    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Hari libur "${holidayName}" berhasil dihapus.`);
        onHolidayUpdated();
      } else {
        showToast(data.error || 'Gagal menghapus hari libur.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-rose-600" />
            Manajemen Blackout Hari Libur &amp; Libur Tambahan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur hari libur nasional, cuti bersama, atau hari libur khusus sekolah untuk bulan yang dipilih.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Hari Libur</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-xs text-rose-950 flex items-start gap-3">
        <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-rose-900">Ketentuan Penting Presensi di Hari Libur:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800">
            <li>
              <strong>Bebas Alpa:</strong> Pegawai reguler yang tidak ditugaskan shift di hari libur otomatis <strong>bebas dari sanksi Alpa (A)</strong> jika tidak hadir.
            </li>
            <li>
              <strong>Tetap Bisa Diisi:</strong> Sel jadwal di hari libur <strong>TIDAK dikunci</strong>. Admin tetap dapat menugaskan pegawai piket, satpam, atau petugas asrama.
            </li>
            <li>
              <strong>Presensi Sah:</strong> Pegawai yang ditugaskan shift atau yang tetap datang dan tap fingerprint di hari libur <strong>tetap diakui sah statusnya sebagai HADIR</strong>.
            </li>
          </ul>
        </div>
      </div>

      {/* Table of Holidays */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Daftar Hari Libur Bulan Ini ({holidays.length} hari terdaftar)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[140px]">Tanggal &amp; Hari</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Hari Libur</th>
                <th className="py-3 px-4 min-w-[140px]">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-500">Belum ada hari libur tambahan di bulan ini.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol &ldquo;Tambah Hari Libur&rdquo; di atas untuk mendaftarkan libur nasional atau khusus sekolah.
                    </p>
                  </td>
                </tr>
              ) : (
                holidays.map((h, idx) => {
                  const d = new Date(`${h.date}T00:00:00`);
                  const dayName = DAY_NAMES_ID[d.getDay()];
                  const catInfo = CATEGORY_MAP[h.category] || CATEGORY_MAP.school;

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-sans">{h.date}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">{dayName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 text-xs">{h.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.badgeClass}`}
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{h.notes || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id, h.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Hari Libur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Hari Libur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-rose-600" />
                Tambah Hari Libur Tambahan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Libur ini akan otomatis ditandai pada tabel roster dan matriks kehadiran.
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveHoliday} className="space-y-3.5">
              {/* Mode Selection: 1 Hari Saja vs Rentang Tanggal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipe Jadwal Libur
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsRangeMode(false)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isRangeMode
                        ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>1 Hari Saja</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRangeMode(true);
                      if (!endDateStr || endDateStr < startDateStr) {
                        setEndDateStr(startDateStr || dateStr);
                      }
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isRangeMode
                        ? 'bg-white text-rose-600 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>Rentang (Multi Hari)</span>
                  </button>
                </div>
              </div>

              {!isRangeMode ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Libur <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => {
                      setDateStr(e.target.value);
                      setStartDateStr(e.target.value);
                      setEndDateStr(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Mulai <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => {
                          setStartDateStr(e.target.value);
                          if (endDateStr && e.target.value > endDateStr) {
                            setEndDateStr(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tanggal Selesai <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={endDateStr}
                        min={startDateStr}
                        onChange={(e) => setEndDateStr(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                        required
                      />
                    </div>
                  </div>

                  {rangeDayCount > 0 ? (
                    <div className="p-2 bg-rose-50 border border-rose-200/70 rounded-xl flex items-center justify-between text-xs text-rose-900">
                      <span className="font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                        Total durasi hari libur:
                      </span>
                      <span className="font-extrabold px-2 py-0.5 bg-rose-200/80 rounded-md text-rose-950 font-sans">
                        {rangeDayCount} Hari
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-rose-600 font-semibold">
                      * Tanggal selesai tidak boleh sebelum tanggal mulai.
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Hari Libur / Keterangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Maulid Nabi Muhammad SAW, Libur Semester Ganjil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Libur</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="school">Khusus Sekolah (Kegiatan / Libur Akademik)</option>
                  <option value="national">Libur Nasional (Pemerintah)</option>
                  <option value="collective_leave">Cuti Bersama Resmi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Bagi petugas piket asrama tetap bertugas sesuai shift."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Hari Libur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
