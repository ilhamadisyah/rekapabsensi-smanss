'use client';

import React, { useState, useMemo } from 'react';
import { Employee, ShiftTemplate, EmployeeSchedule, Holiday } from '@/lib/types';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Tag,
  Save,
  Coffee,
} from 'lucide-react';

interface EmployeeScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  shifts: ShiftTemplate[];
  schedules: EmployeeSchedule[];
  holidays: Holiday[];
  selectedMonth: number;
  selectedYear: number;
  onScheduleUpdated: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const EmployeeScheduleDrawer: React.FC<EmployeeScheduleDrawerProps> = ({
  isOpen,
  onClose,
  employee,
  shifts,
  schedules,
  holidays,
  selectedMonth,
  selectedYear,
  onScheduleUpdated,
  showToast,
}) => {
  // Editing state for a single day
  const [editingDay, setEditingDay] = useState<{
    day: number;
    dateStr: string;
    dayName: string;
    isWeekend: boolean;
    holiday?: Holiday;
    currentSchedule?: EmployeeSchedule;
  } | null>(null);

  // Edit form state
  const [mode, setMode] = useState<'template' | 'custom'>('template');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('shift-normal');
  const [customStart, setCustomStart] = useState('08:00');
  const [customEnd, setCustomEnd] = useState('16:00');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const defaultShift = useMemo(() => {
    return shifts.find((s) => s.is_default) || shifts[0];
  }, [shifts]);

  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftTemplate>();
    shifts.forEach((s) => map.set(s.id, s));
    return map;
  }, [shifts]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  // Map of schedules for this employee
  const employeeScheduleMap = useMemo(() => {
    const map = new Map<string, EmployeeSchedule>();
    if (!employee) return map;
    schedules
      .filter((s) => s.employee_id === employee.machine_id)
      .forEach((s) => map.set(s.date, s));
    return map;
  }, [schedules, employee]);

  // Compute all days in month
  const monthDays = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const list = [];
    const monthPad = String(selectedMonth).padStart(2, '0');

    for (let day = 1; day <= totalDays; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${selectedYear}-${monthPad}-${dayPad}`;
      const d = new Date(`${dateStr}T00:00:00`);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holiday = holidayMap.get(dateStr);
      const sched = employeeScheduleMap.get(dateStr);

      list.push({
        day,
        dateStr,
        dayOfWeek,
        dayName: DAY_NAMES_ID[dayOfWeek],
        isWeekend,
        holiday,
        sched,
      });
    }
    return list;
  }, [selectedMonth, selectedYear, holidayMap, employeeScheduleMap]);

  if (!isOpen || !employee) return null;

  const startEditDay = (item: any) => {
    setEditingDay({
      day: item.day,
      dateStr: item.dateStr,
      dayName: item.dayName,
      isWeekend: item.isWeekend,
      holiday: item.holiday,
      currentSchedule: item.sched,
    });

    if (item.sched?.custom_start_time || item.sched?.custom_end_time) {
      setMode('custom');
      setCustomStart(item.sched.custom_start_time?.substring(0, 5) || '08:00');
      setCustomEnd(item.sched.custom_end_time?.substring(0, 5) || '16:00');
      setSelectedShiftId(item.sched.shift_id || defaultShift?.id || 'shift-normal');
      setNotes(item.sched.notes || '');
    } else if (item.sched?.shift_id) {
      setMode('template');
      setSelectedShiftId(item.sched.shift_id);
      setNotes(item.sched.notes || '');
    } else {
      setMode('template');
      setSelectedShiftId(defaultShift?.id || 'shift-normal');
      setCustomStart('08:00');
      setCustomEnd('16:00');
      setNotes('');
    }
  };

  const handleSaveDaySchedule = async () => {
    if (!editingDay || !employee) return;
    setIsSaving(true);

    try {
      const payload: any = {
        employee_id: employee.machine_id,
        date: editingDay.dateStr,
        shift_id: selectedShiftId,
        notes: notes.trim(),
      };

      if (mode === 'custom') {
        payload.custom_start_time = customStart.length === 5 ? `${customStart}:00` : customStart;
        payload.custom_end_time = customEnd.length === 5 ? `${customEnd}:00` : customEnd;
      }

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan jadwal.');
      }

      showToast(`Jadwal tanggal ${editingDay.day} berhasil disimpan.`);
      setEditingDay(null);
      onScheduleUpdated();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan jadwal.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDay = async (dateStr: string, dayNum: number) => {
    try {
      const res = await fetch(
        `/api/schedules?employee_id=${employee.machine_id}&date=${dateStr}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Jadwal tgl ${dayNum} dikembalikan ke default.`);
        setEditingDay(null);
        onScheduleUpdated();
      } else {
        showToast(data.error || 'Gagal mereset jadwal.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-900/40 backdrop-blur-2xs animate-fade-in flex justify-end">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              {employee.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                {employee.full_name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-sans font-medium">{employee.nik || employee.machine_id}</span>
                <span>&bull;</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.2 rounded border border-blue-100">
                  {employee.department || 'Umum'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs">
              {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Table List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800">
              Jadwal Kerja Tanggal 1 s/d {monthDays.length}
            </span>
            <span className="text-[11px] text-slate-500">
              Klik pada baris mana saja untuk mengatur jam kerja hari tersebut
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            {monthDays.map((item) => {
              const assignedShift = item.sched ? shiftMap.get(item.sched.shift_id) : null;
              const hasCustomTime = Boolean(
                item.sched?.custom_start_time || item.sched?.custom_end_time
              );
              const isCustomSchedule = Boolean(item.sched);
              const effectiveShift =
                assignedShift || (item.isWeekend || item.holiday ? null : defaultShift);

              return (
                <div
                  key={item.day}
                  onClick={() => startEditDay(item)}
                  className={`p-3 flex items-center justify-between gap-3 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                    item.holiday
                      ? 'bg-rose-50/40'
                      : item.isWeekend
                      ? 'bg-rose-50/20'
                      : 'bg-white'
                  }`}
                >
                  {/* Left: Date & Day */}
                  <div className="flex items-center gap-3 w-36 shrink-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-sans font-bold text-xs ${
                        item.holiday
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.isWeekend
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}
                    >
                      {item.day}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 leading-tight">
                        {item.dayName}
                      </p>
                      {item.holiday ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700">
                          <Tag className="w-2.5 h-2.5" />
                          {item.holiday.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans font-medium">
                          {item.dateStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Shift / Work Hours Display */}
                  <div className="flex-1 flex items-center gap-2">
                    {effectiveShift ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-sans font-bold text-white shadow-2xs"
                          style={{ backgroundColor: effectiveShift.color || '#2563eb' }}
                        >
                          {effectiveShift.code}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {hasCustomTime ? (
                              <span className="text-blue-700">
                                Jam Kustom: {item.sched?.custom_start_time?.substring(0, 5)} -{' '}
                                {item.sched?.custom_end_time?.substring(0, 5)} WIB
                              </span>
                            ) : effectiveShift.is_off_day ? (
                              <span className="text-slate-500">Bebas Tugas (OFF)</span>
                            ) : (
                              <span>
                                {effectiveShift.name} ({effectiveShift.start_time.substring(0, 5)} -{' '}
                                {effectiveShift.end_time.substring(0, 5)} WIB)
                              </span>
                            )}
                          </p>
                          {item.sched?.notes && (
                            <p className="text-[10px] text-slate-500 italic">
                              Ket: {item.sched.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-700 text-xs font-medium">
                        <Coffee className="w-3.5 h-3.5 text-rose-500" />
                        <span>{item.holiday ? `Hari Libur: ${item.holiday.name}` : 'Libur Akhir Pekan'}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Badge Status & Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCustomSchedule && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                        Shift Khusus
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Popover when editing a day */}
        {editingDay && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4 animate-in zoom-in-95">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Atur Jam Kerja: Tanggal {editingDay.day}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingDay.dayName}, {editingDay.dateStr}
                    {editingDay.holiday && ` • ${editingDay.holiday.name}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab: Pilih Template vs Jam Kustom Bebas */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('template')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'template' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Pilih Template Shift
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Input Jam Kustom Bebas
                </button>
              </div>

              {/* Mode 1: Template Shift */}
              {mode === 'template' && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {shifts.map((s) => {
                    const isSelected = selectedShiftId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedShiftId(s.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="px-2 py-0.5 rounded-md text-[11px] font-sans font-bold text-white shadow-2xs"
                            style={{ backgroundColor: s.color || '#2563eb' }}
                          >
                            {s.code}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {s.is_off_day
                                ? 'Bebas Tugas (OFF)'
                                : `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)} WIB`}
                            </p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mode 2: Custom Hours */}
              {mode === 'custom' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Tentukan jam masuk dan jam pulang spesifik untuk tanggal ini (misal piket acara / lembur):
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jam Masuk (WIB)
                      </label>
                      <input
                        type="time"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jam Pulang (WIB)
                      </label>
                      <input
                        type="time"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-sans font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Piket asrama, jaga ujian dinas"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleResetDay(editingDay.dateStr, editingDay.day)}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ke Standar</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDay(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDaySchedule}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
