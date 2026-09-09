'use client';

import React, { useState, useMemo } from 'react';
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
  const [startDay, setStartDay] = useState<number>(1);
  const [endDay, setEndDay] = useState<number>(30);
  const [skipWeekends, setSkipWeekends] = useState<boolean>(true);
  const [skipHolidays, setSkipHolidays] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

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

  // Hitung jumlah hari aktif yang benar-benar ditugaskan (melewati Sabtu & Minggu jika dicentang)
  const activeDaysCount = useMemo(() => {
    let count = 0;
    const monthPad = String(currentMonth).padStart(2, '0');
    for (let day = startDay; day <= endDay; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthPad}-${dayPad}`;
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some((h) => h.date === dateStr);

      if (skipWeekends && isWeekend) continue;
      if (skipHolidays && isHoliday) continue;
      count++;
    }
    return count;
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
      const isHoliday = holidays.some((h) => h.date === dateStr);

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
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                1. Pilih Template Shift
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {shifts.map((s) => {
                  const isSelected = s.id === selectedShiftId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShiftId(s.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] text-white font-sans font-bold shadow-2xs"
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
                    max={31}
                    value={startDay}
                    onChange={(e) => setStartDay(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-600 font-medium mb-1">
                    Sampai Tanggal:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={endDay}
                    onChange={(e) => setEndDay(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-1 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    Lewati Hari Sabtu &amp; Minggu
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipHolidays}
                    onChange={(e) => setSkipHolidays(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-700">
                    Lewati Hari Libur Tambahan (Jangan tugaskan pada tanggal libur)
                  </span>
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
            <span className="text-[11px] text-slate-500">
              Total penugasan:{' '}
              <strong className="text-slate-800">
                {selectedEmpIds.size} pegawai &times; {activeDaysCount} hari ({selectedEmpIds.size * activeDaysCount} entri)
              </strong>
            </span>

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
                disabled={isLoading || selectedEmpIds.size === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
