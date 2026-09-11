'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ShiftTemplate, Employee, Holiday } from '@/lib/types';
import { X, Calendar, Users, Check, AlertCircle, Sparkles, Filter, Search, CheckSquare, Square } from 'lucide-react';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftTemplate[];
  employees: Employee[];
  holidays?: Holiday[];
  currentMonth: number;
  currentYear: number;
  onSaved: () => void;
}

export const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({
  isOpen,
  onClose,
  shifts,
  employees,
  holidays = [],
  currentMonth,
  currentYear,
  onSaved,
}) => {
  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    shifts[0]?.id || 'shift-normal'
  );

  const totalDaysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  const [startDay, setStartDay] = useState<number>(1);
  const [endDay, setEndDay] = useState<number>(30);
  const [skipWeekends, setSkipWeekends] = useState<boolean>(true);
  const [skipHolidays, setSkipHolidays] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Reset/sync on modal open
  useEffect(() => {
    if (isOpen) {
      setStartDay(1);
      setEndDay(totalDaysInMonth);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, totalDaysInMonth]);

  // Search & selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (emp.full_name || '').toLowerCase().includes(q);
        const matchNik = (emp.nik || '').toLowerCase().includes(q);
        const matchId = (emp.machine_id || '').toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchId) return false;
      }
      return true;
    });
  }, [employees, searchQuery]);

  // Hitung jumlah hari aktif dan rincian hari yang dilewati
  const { activeDaysCount, skippedWeekendsCount, skippedHolidaysCount } = useMemo(() => {
    let active = 0;
    let weekends = 0;
    let holidaysCount = 0;
    const monthPad = String(currentMonth).padStart(2, '0');

    for (let day = startDay; day <= endDay; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthPad}-${dayPad}`;
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some((h) => h.date === dateStr || h.date.startsWith(dateStr));

      if (isWeekend) weekends++;
      if (isHoliday) holidaysCount++;

      if (skipWeekends && isWeekend) continue;
      if (skipHolidays && isHoliday) continue;
      active++;
    }
    return { activeDaysCount: active, skippedWeekendsCount: weekends, skippedHolidaysCount: holidaysCount };
  }, [currentYear, currentMonth, startDay, endDay, skipWeekends, skipHolidays, holidays]);

  if (!isOpen) return null;

  const toggleSelectEmp = (machineId: string) => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      if (next.has(machineId)) next.delete(machineId);
      else next.add(machineId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((e) => next.add(e.machine_id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedEmpIds((prev) => {
      const next = new Set(prev);
      filteredEmployees.forEach((e) => next.delete(e.machine_id));
      return next;
    });
  };

  const selectedShift = shifts.find((s) => s.id === selectedShiftId) || shifts[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpIds.size === 0) {
      setErrorMsg('Pilih minimal satu pegawai untuk ditugaskan jadwal.');
      return;
    }
    if (startDay > endDay) {
      setErrorMsg('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Generate schedule entries
    const monthPad = String(currentMonth).padStart(2, '0');
    const schedulesToSave: Array<{
      employee_id: string;
      date: string;
      shift_id: string;
      notes?: string;
    }> = [];

    const empIdArray = Array.from(selectedEmpIds);

    for (let day = startDay; day <= endDay; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthPad}-${dayPad}`;
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some((h) => h.date === dateStr || h.date.startsWith(dateStr));

      if (skipWeekends && isWeekend) {
        continue; // skip Saturday & Sunday
      }

      if (skipHolidays && isHoliday) {
        continue; // skip designated holidays
      }

      for (const empId of empIdArray) {
        schedulesToSave.push({
          employee_id: empId,
          date: dateStr,
          shift_id: selectedShiftId,
          notes: notes.trim() || undefined,
        });
      }
    }

    if (schedulesToSave.length === 0) {
      setErrorMsg('Tidak ada hari kerja aktif dalam rentang tanggal yang dipilih (semua hari dilewati karena filter akhir pekan / libur).');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: schedulesToSave }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan penugasan jadwal.');
      }

      // Otomatis sinkronisasi/evaluasi presensi kehadiran
      try {
        await fetch('/api/schedules/reevaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ month: currentMonth, year: currentYear }),
        });
      } catch (syncErr) {
        console.warn('Auto reevaluate attendance warning:', syncErr);
      }

      setSuccessMsg(
        `Berhasil menugaskan jadwal "${selectedShift?.name}" untuk ${empIdArray.length} pegawai (${schedulesToSave.length} entri jadwal).`
      );
      onSaved();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Penugasan Jadwal Kerja Massal (Bulk Assign)
              </h3>
              <p className="text-xs text-slate-500">
                Terapkan template shift ke beberapa pegawai sekaligus untuk rentang tanggal tertentu
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
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

          {/* Shift Selection & Date Range in 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            {/* Shift Template Selector */}
            <div className="space-y-2 flex flex-col h-full">
              <label className="block text-xs font-bold text-slate-800">
                1. Pilih Template Shift
              </label>
              <div className="space-y-2 flex-1 overflow-y-auto pr-1 max-h-[380px]">
                {shifts.map((s) => {
                  const isSelected = s.id === selectedShiftId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShiftId(s.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] text-white font-sans font-bold shadow-2xs"
                          style={{ backgroundColor: s.color || '#2563eb' }}
                        >
                          {s.code}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{s.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {s.is_off_day
                              ? 'Bebas Tugas (OFF)'
                              : `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)} WIB`}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                2. Rentang Tanggal (Bulan Ini)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-600 font-medium mb-1">
                    Dari Tanggal:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={totalDaysInMonth}
                    value={startDay}
                    onChange={(e) => setStartDay(Math.max(1, Math.min(totalDaysInMonth, Number(e.target.value) || 1)))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-600 font-medium mb-1">
                    Sampai Tanggal (Maks {totalDaysInMonth}):
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={totalDaysInMonth}
                    value={endDay}
                    onChange={(e) => setEndDay(Math.max(1, Math.min(totalDaysInMonth, Number(e.target.value) || 1)))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Custom Checkbox Group (Bebas dari bug double-outline native browser) */}
              <div className="pt-1 space-y-2">
                {/* 1. Checkbox: Lewati Hari Sabtu & Minggu */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none group p-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                      skipWeekends
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}
                  >
                    {skipWeekends && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="flex-1 leading-snug">
                    <span className="text-[11px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Lewati Hari Sabtu &amp; Minggu
                    </span>
                    <span className="block text-[10px] mt-0.5">
                      {skipWeekends ? (
                        <span className="inline-flex items-center gap-1 font-medium text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded">
                          ✓ {skippedWeekendsCount} hari akhir pekan dilewati (tidak ditugaskan)
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          Hari Sabtu &amp; Minggu akan tetap ditugaskan shift kerja
                        </span>
                      )}
                    </span>
                  </div>
                </label>

                {/* 2. Checkbox: Lewati Hari Libur Tambahan */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none group p-2 rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-200 transition-all">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                      skipHolidays
                        ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}
                  >
                    {skipHolidays && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={skipHolidays}
                    onChange={(e) => setSkipHolidays(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="flex-1 leading-snug">
                    <span className="text-[11px] font-semibold text-slate-800 group-hover:text-rose-700 transition-colors">
                      Lewati Hari Libur Tambahan (Jangan tugaskan pada tanggal libur)
                    </span>
                    <span className="block text-[10px] mt-0.5">
                      {skipHolidays ? (
                        <span className="inline-flex items-center gap-1 font-medium text-rose-600 bg-rose-50/80 px-1.5 py-0.5 rounded">
                          ✓ {skippedHolidaysCount} hari libur terdaftar dilewati
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          {holidays.length > 0
                            ? `Ada ${holidays.length} hari libur terdaftar (tetap ditugaskan jika tidak dicentang)`
                            : 'Belum ada hari libur khusus terdaftar di bulan ini'}
                        </span>
                      )}
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Rotasi Regu A, Jadwal Reguler"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                3. Pilih Pegawai Target ({selectedEmpIds.size} dipilih dari {employees.length})
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Pilih Semua Filtered ({filteredEmployees.length})
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllFiltered}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Hapus Pilihan
                </button>
              </div>
            </div>

            {/* Search Box (Bersih & Lebar Penuh) */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama pegawai, NIK, atau ID mesin..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Employee List checkboxes */}
            <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Tidak ada pegawai yang cocok dengan filter.
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isChecked = selectedEmpIds.has(emp.machine_id);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleSelectEmp(emp.machine_id)}
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 flex items-center justify-center text-blue-600">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{emp.full_name}</span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            NIK: {emp.nik} | ID: {emp.machine_id}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded">
                        {emp.department || 'Umum'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500">
              <span>Total penugasan: </span>
              <strong className="text-slate-800">
                {selectedEmpIds.size} pegawai &times; {activeDaysCount} hari ({selectedEmpIds.size * activeDaysCount} entri)
              </strong>
              {activeDaysCount === 0 && selectedEmpIds.size > 0 && (
                <span className="block text-[10px] text-rose-600 font-medium">
                  Semua hari dalam rentang dilewati karena filter akhir pekan/libur.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || selectedEmpIds.size === 0 || activeDaysCount === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Menugaskan...' : 'Terapkan Jadwal'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
