'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ShiftTemplate, Employee, EmployeeSchedule, Holiday } from '@/lib/types';
import { BulkScheduleModal } from '@/components/bulk-schedule-modal';
import { ShiftManagerTab } from '@/components/shift-manager-tab';
import { HolidayManagerTab } from '@/components/holiday-manager-tab';
import { EmployeeScheduleDrawer } from '@/components/employee-schedule-drawer';
import {
  Calendar,
  Clock,
  Search,
  Users,
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  CalendarCheck2,
  CalendarDays,
  FileSpreadsheet,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

interface ScheduleManagerViewProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange?: (month: number, year: number) => void;
  onScheduleUpdated?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const ScheduleManagerView: React.FC<ScheduleManagerViewProps> = ({
  selectedMonth: initialMonth,
  selectedYear: initialYear,
  onMonthChange,
  onScheduleUpdated,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'employees' | 'shifts' | 'holidays'>('matrix');

  const [currMonth, setCurrMonth] = useState<number>(initialMonth || 9);
  const [currYear, setCurrYear] = useState<number>(initialYear || 2026);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState<boolean>(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  // Sync if props change
  useEffect(() => {
    if (initialMonth) setCurrMonth(initialMonth);
    if (initialYear) setCurrYear(initialYear);
  }, [initialMonth, initialYear]);

  // Click outside to close month dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Search & Department Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Modals & Drawer States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [drawerEmployee, setDrawerEmployee] = useState<Employee | null>(null);

  // Quick Cell Popover State (Matrix view)
  const [activeCell, setActiveCell] = useState<{
    employee: Employee;
    day: number;
    dateStr: string;
    isWeekend: boolean;
    holiday?: Holiday;
    currentSchedule?: EmployeeSchedule;
  } | null>(null);

  // Quick Popover Form Mode (Template vs Custom Hours)
  const [popoverMode, setPopoverMode] = useState<'template' | 'custom'>('template');
  const [popoverCustomStart, setPopoverCustomStart] = useState('08:00');
  const [popoverCustomEnd, setPopoverCustomEnd] = useState('16:00');
  const [popoverNotes, setPopoverNotes] = useState('');

  // Load Schedule, Shifts, Holidays & Employees data
  const loadScheduleData = useCallback(async (overrideMonth?: number, overrideYear?: number) => {
    setIsLoading(true);
    const m = overrideMonth !== undefined ? overrideMonth : currMonth;
    const y = overrideYear !== undefined ? overrideYear : currYear;
    try {
      const res = await fetch(`/api/schedules?month=${m}&year=${y}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
        setShifts(data.shifts || []);
        setSchedules(data.schedules || []);
        setHolidays(data.holidays || []);
      } else {
        showToast(data.error || 'Gagal memuat data jadwal.', 'error');
      }
    } catch (err: any) {
      console.error('Error loading schedules:', err);
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currMonth, currYear, showToast]);

  const handleMonthSelect = (mNum: number, yNum: number) => {
    setCurrMonth(mNum);
    setCurrYear(yNum);
    setIsMonthDropdownOpen(false);
    onMonthChange?.(mNum, yNum);
    loadScheduleData(mNum, yNum);
  };

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Map of shifts by ID
  const shiftMap = useMemo(() => {
    const map = new Map<string, ShiftTemplate>();
    shifts.forEach((s) => map.set(s.id, s));
    return map;
  }, [shifts]);

  // Map of holidays by dateStr
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  // Schedule lookup map: key = `${employee_id}_${dateStr}`
  const scheduleLookup = useMemo(() => {
    const map = new Map<string, EmployeeSchedule>();
    schedules.forEach((s) => {
      map.set(`${s.employee_id}_${s.date}`, s);
    });
    return map;
  }, [schedules]);

  // Default shift template (Normal)
  const defaultShift = useMemo(() => {
    return shifts.find((s) => s.is_default) || shifts[0] || {
      id: 'shift-normal',
      code: 'NORM',
      name: 'Jam Kerja Normal',
      start_time: '07:30:00',
      end_time: '16:00:00',
      color: '#2563eb',
      is_default: true,
      is_overnight: false,
      is_off_day: false,
      grace_period_minutes: 0,
      created_at: '',
      updated_at: '',
    };
  }, [shifts]);

  // Month days array
  const monthDays = useMemo(() => {
    const totalDays = new Date(currYear, currMonth, 0).getDate();
    const result = [];
    const monthPad = String(currMonth).padStart(2, '0');

    for (let day = 1; day <= totalDays; day++) {
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${currYear}-${monthPad}-${dayPad}`;
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holiday = holidayMap.get(dateStr);

      result.push({
        day,
        dateStr,
        dayOfWeek,
        dayName: DAY_NAMES_ID[dayOfWeek],
        isWeekend,
        holiday,
      });
    }
    return result;
  }, [currMonth, currYear, holidayMap]);

  // Unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept === 'Guru' && !emp.department.includes('Guru')) return false;
      if (selectedDept === 'TU' && !emp.department.includes('TU')) return false;
      if (
        selectedDept !== 'ALL' &&
        selectedDept !== 'Guru' &&
        selectedDept !== 'TU' &&
        emp.department !== selectedDept
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.full_name.toLowerCase().includes(q);
        const matchNik = (emp.nik || '').toLowerCase().includes(q);
        const matchId = emp.machine_id.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchId) return false;
      }
      return true;
    });
  }, [employees, selectedDept, searchQuery]);

  // Count employees with custom shift schedules
  const employeesWithCustomSchedules = useMemo(() => {
    const empSet = new Set<string>();
    schedules.forEach((s) => empSet.add(s.employee_id));
    return empSet.size;
  }, [schedules]);

  // Open Quick Popover
  const handleCellClick = (emp: Employee, d: any, customSchedule?: EmployeeSchedule) => {
    setActiveCell({
      employee: emp,
      day: d.day,
      dateStr: d.dateStr,
      isWeekend: d.isWeekend,
      holiday: d.holiday,
      currentSchedule: customSchedule,
    });

    if (customSchedule?.custom_start_time || customSchedule?.custom_end_time) {
      setPopoverMode('custom');
      setPopoverCustomStart(customSchedule.custom_start_time?.substring(0, 5) || '08:00');
      setPopoverCustomEnd(customSchedule.custom_end_time?.substring(0, 5) || '16:00');
      setPopoverNotes(customSchedule.notes || '');
    } else {
      setPopoverMode('template');
      setPopoverCustomStart('08:00');
      setPopoverCustomEnd('16:00');
      setPopoverNotes(customSchedule?.notes || '');
    }
  };

  // Quick Assign Shift (Template or Custom)
  const handleQuickAssign = async (shiftId: string | null) => {
    if (!activeCell) return;
    const { employee, dateStr } = activeCell;

    if (shiftId === null) {
      setActiveCell(null);
      try {
        const res = await fetch(
          `/api/schedules?employee_id=${employee.machine_id}&date=${dateStr}`,
          { method: 'DELETE' }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Jadwal ${employee.full_name} (${dateStr}) dikembalikan ke default.`);
          loadScheduleData();
          onScheduleUpdated?.();
        }
      } catch (err) {
        showToast('Gagal mereset jadwal.', 'error');
      }
      return;
    }

    try {
      const payload: any = {
        employee_id: employee.machine_id,
        date: dateStr,
        shift_id: shiftId,
        notes: popoverNotes.trim() || undefined,
      };

      if (popoverMode === 'custom') {
        payload.custom_start_time =
          popoverCustomStart.length === 5 ? `${popoverCustomStart}:00` : popoverCustomStart;
        payload.custom_end_time =
          popoverCustomEnd.length === 5 ? `${popoverCustomEnd}:00` : popoverCustomEnd;
      }

      setActiveCell(null);
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Jadwal ${employee.full_name} tanggal ${activeCell.day} berhasil disimpan.`);
        loadScheduleData();
        onScheduleUpdated?.();
      } else {
        showToast(data.error || 'Gagal menyimpan jadwal.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  // Re-evaluate Attendance Records
  const handleReevaluate = async () => {
    setIsReevaluating(true);
    try {
      const res = await fetch('/api/schedules/reevaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: currMonth, year: currYear }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `Sukses! ${data.updatedCount} data kehadiran disesuaikan dengan aturan shift & hari libur.`,
          'success'
        );
        onScheduleUpdated?.();
      } else {
        showToast(data.error || 'Gagal mere-evaluasi presensi.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsReevaluating(false);
    }
  };

  // Export Roster Excel
  const handleExportRoster = async () => {
    setIsExporting(true);
    try {
      showToast('Menghasilkan berkas Excel Roster...');
      const params = new URLSearchParams({
        month: String(currMonth),
        year: String(currYear),
        department: selectedDept,
      });
      const res = await fetch(`/api/schedules/export?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengekspor roster.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const monthPad = String(currMonth).padStart(2, '0');
      const deptSuffix = selectedDept !== 'ALL' ? `_${selectedDept}` : '';
      a.download = `Roster_Jadwal_SMANSS_${monthPad}_${currYear}${deptSuffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Roster jadwal Excel berhasil diunduh!');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunduh Excel.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Schedules from Previous Month
  const handleCopyFromPrevMonth = async () => {
    let fromMonth = currMonth - 1;
    let fromYear = currYear;
    if (fromMonth < 1) {
      fromMonth = 12;
      fromYear = currYear - 1;
    }

    setIsCopying(true);
    try {
      const res = await fetch('/api/schedules/copy-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromMonth,
          fromYear,
          toMonth: currMonth,
          toYear: currYear,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Jadwal berhasil disalin.', 'success');
        setIsCopyModalOpen(false);
        loadScheduleData();
        onScheduleUpdated?.();
      } else {
        showToast(data.error || 'Gagal menyalin jadwal.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal menghubungi server.', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Title & Period Info */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Jadwal &amp; Shift Kerja Pegawai: {MONTH_NAMES[currMonth - 1]} {currYear}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan roster harian, penugasan shift kerja, dan blackout hari libur terintegrasi.
          </p>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Total Pegawai Aktif</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              {employees.length} <span className="text-xs font-normal text-slate-400">orang</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Master Template Shift</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              {shifts.length} <span className="text-xs font-normal text-slate-400">template</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Blackout Hari Libur</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              {holidays.length} <span className="text-xs font-normal text-slate-400">hari libur</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Pegawai Shift Khusus</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              {employeesWithCustomSchedules}{' '}
              <span className="text-xs font-normal text-slate-400">orang diatur</span>
            </p>
          </div>
        </div>
      </div>

      {/* BARIS 1: Sub-Tabs Menu Navigasi (Lega Penuh & Tanpa Terpotong) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 bg-slate-100/90 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>Matriks Roster Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('employees')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'employees'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Atur Jadwal Pegawai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('shifts')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'shifts'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Master Shift ({shifts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('holidays')}
            className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSubTab === 'holidays'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 shrink-0" />
            <span>Hari Libur ({holidays.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Matriks Roster Harian */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Toolbar Aksi Cepat & Periode (Di Atas Tabel Matriks Roster Harian) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Di sebelah kiri pojok: Dropdown Select Periode */}
            <div className="relative z-20" ref={monthDropdownRef}>
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                title="Tampilkan dan pilih periode bulan"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  Periode: {MONTH_NAMES[currMonth - 1]} {currYear}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isMonthDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Month Selector Dropdown Popover */}
              {isMonthDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Pilih Periode Bulan</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newY = currYear - 1;
                          setCurrYear(newY);
                          onMonthChange?.(currMonth, newY);
                          loadScheduleData(currMonth, newY);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                        title="Tahun Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-blue-600 font-bold px-1">{currYear}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newY = currYear + 1;
                          setCurrYear(newY);
                          onMonthChange?.(currMonth, newY);
                          loadScheduleData(currMonth, newY);
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                        title="Tahun Berikutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((mName, idx) => {
                      const mNum = idx + 1;
                      const isCurrent = currMonth === mNum;
                      return (
                        <button
                          key={mNum}
                          type="button"
                          onClick={() => handleMonthSelect(mNum, currYear)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Di sebelah kanan: Penugasan Massal, Salin, Ekspor, Re-Evaluasi */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Penugasan Massal</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCopyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Salin penugasan jadwal dari bulan lalu"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Bulan Lalu</span>
              </button>

              <button
                type="button"
                onClick={handleExportRoster}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                title="Unduh berkas Excel roster bulanan"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
              </button>

              <button
                type="button"
                onClick={handleReevaluate}
                disabled={isReevaluating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                title="Sinkronisasi status presensi dengan aturan shift & hari libur"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />
                <span>{isReevaluating ? 'Sinkronisasi...' : 'Re-Evaluasi Presensi'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {/* Table Control Bar */}
            <div className="relative z-30 border-b border-slate-200/80 bg-slate-50/60">
              <div className="p-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                  {/* Department Filter Pills (Identik Beranda) */}
                  <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold shrink-0">
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: 'Guru', label: 'Guru' },
                      { id: 'TU', label: 'Tata Usaha' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDept(d.id)}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          selectedDept === d.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Box (Identik Beranda) */}
                  <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama pegawai, NIK, ID mesin..."
                      className="w-full pl-9 pr-7 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                        title="Hapus pencarian"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Right side: Employee Counter (Identik Beranda) */}
                <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  Menampilkan <span className="font-bold text-slate-900">{filteredEmployees.length}</span> dari {employees.length} pegawai
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[640px] relative">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 z-30 shadow-xs">
                  <tr className="border-b border-slate-200">
                    <th className="sticky left-0 z-40 bg-slate-50 px-3 py-3 font-bold text-slate-700 w-10 text-center border-r border-slate-200">
                      #
                    </th>
                    <th className="sticky left-10 z-40 bg-slate-50 px-3 py-3 font-bold text-slate-700 min-w-[220px] max-w-[260px] border-r border-slate-200">
                      Identitas Pegawai
                    </th>
                    {monthDays.map((d) => (
                      <th
                        key={d.day}
                        className={`px-1.5 py-2 text-center border-r border-slate-200 min-w-[56px] ${
                          d.holiday
                            ? 'bg-rose-100/70 text-rose-900'
                            : d.isWeekend
                            ? 'bg-slate-100 text-slate-600'
                            : 'text-slate-700'
                        }`}
                        title={d.holiday ? `Hari Libur: ${d.holiday.name}` : undefined}
                      >
                        <div className="font-extrabold text-[12px]">{d.day}</div>
                        <div
                          className={`text-[9px] font-bold uppercase ${
                            d.holiday ? 'text-rose-700' : d.isWeekend ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {d.dayName}
                        </div>
                        {d.holiday && (
                          <div className="text-[8px] font-extrabold text-rose-700 truncate max-w-[50px] mx-auto">
                            LIBUR
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={monthDays.length + 2} className="p-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Memuat matriks roster jadwal...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={monthDays.length + 2} className="p-12 text-center text-slate-400">
                        Tidak ada data pegawai yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp, empIdx) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 px-2 py-2 text-center text-[11px] font-sans font-semibold text-slate-400 border-r border-slate-200">
                          {empIdx + 1}
                        </td>

                        <td className="sticky left-10 z-20 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate leading-tight">
                                {emp.full_name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-sans font-medium text-slate-500">
                                  {emp.nik || emp.machine_id}
                                </span>
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded">
                                  {emp.department || 'Umum'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {monthDays.map((d) => {
                          const schedKey = `${emp.machine_id}_${d.dateStr}`;
                          const customSchedule = scheduleLookup.get(schedKey);
                          const assignedShift = customSchedule
                            ? shiftMap.get(customSchedule.shift_id)
                            : null;
                          const isCustom = Boolean(assignedShift);
                          const hasCustomHours = Boolean(
                            customSchedule?.custom_start_time || customSchedule?.custom_end_time
                          );
                          const displayShift =
                            assignedShift || (d.isWeekend || d.holiday ? null : defaultShift);

                          return (
                            <td
                              key={d.day}
                              onClick={() => handleCellClick(emp, d, customSchedule)}
                              className={`p-1 text-center border-r border-slate-100 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 hover:z-10 ${
                                d.holiday
                                  ? 'bg-rose-50/50'
                                  : d.isWeekend
                                  ? 'bg-slate-50/50'
                                  : 'bg-white'
                              }`}
                              title={`Ubah shift ${emp.full_name} (Tgl ${d.day})`}
                            >
                              {displayShift ? (
                                <div
                                  className={`py-1 px-1 rounded-md text-[11px] font-sans font-bold tracking-normal text-white uppercase text-center transition-transform ${
                                    isCustom ? 'ring-2 ring-black/20 shadow-xs' : 'hover:opacity-90'
                                  }`}
                                  style={{ backgroundColor: displayShift.color || '#2563eb' }}
                                >
                                  {hasCustomHours ? 'CUST' : displayShift.code}
                                </div>
                              ) : (
                                <div
                                  className={`py-1 px-1 rounded-md text-[10px] font-sans font-bold tracking-normal uppercase text-center ${
                                    d.holiday
                                      ? 'text-rose-700 bg-rose-100/90 border border-rose-200/80 font-extrabold'
                                      : 'text-slate-400 bg-slate-100'
                                  }`}
                                >
                                  {d.holiday ? 'LIB' : 'OFF'}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-1.5">
                Keterangan Kode Shift (Legend)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {shifts.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-sans font-bold text-white shadow-2xs"
                      style={{ backgroundColor: s.color || '#2563eb' }}
                    >
                      {s.code}
                    </span>
                    <span className="font-semibold text-[11px]">{s.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({s.is_off_day ? 'OFF' : `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`})
                    </span>
                  </div>
                ))}

                <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white font-sans font-bold text-[10px] rounded-md">
                    LIB
                  </span>
                  <span className="font-semibold text-[11px]">Hari Libur Tambahan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Atur Jadwal Pegawai */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Daftar Pegawai &amp; Jadwal Kerja Individu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik &ldquo;Atur Jam Kerja&rdquo; pada pegawai untuk membuka panel kalender 31 hari khusus pegawai tersebut.
              </p>
            </div>

            <div className="relative min-w-[220px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pegawai..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[220px]">Nama Lengkap Pegawai</th>
                    <th className="py-3 px-4 w-32 text-center">NIK / ID Mesin</th>
                    <th className="py-3 px-4 w-36 text-center">Unit / Bagian</th>
                    <th className="py-3 px-4 w-36 text-center">Status Shift Bulan Ini</th>
                    <th className="py-3 px-4 text-center w-32">Aksi Pengaturan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp, idx) => {
                    const empSchedules = schedules.filter((s) => s.employee_id === emp.machine_id);
                    const hasCustom = empSchedules.length > 0;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-center font-sans font-semibold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs">{emp.full_name}</p>
                              <span className="text-[10px] text-slate-400">
                                {emp.department || 'Tenaga Pendidik / Kependidikan'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans font-medium text-slate-600 text-xs text-center">
                          {emp.nik || emp.machine_id}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-[10px] rounded-lg text-center leading-tight">
                            {emp.department || 'Umum'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasCustom ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px]">
                              <Sparkles className="w-2.5 h-2.5" />
                              {empSchedules.length} Hari Shift Khusus
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-bold text-[10px]">
                              Reguler Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setDrawerEmployee(emp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200/80 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Atur Jam Kerja</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Master Template Shift */}
      {activeSubTab === 'shifts' && (
        <ShiftManagerTab
          templates={shifts}
          onTemplatesUpdated={loadScheduleData}
          showToast={showToast}
        />
      )}

      {/* SUB-TAB 4: Blackout Hari Libur */}
      {activeSubTab === 'holidays' && (
        <HolidayManagerTab
          holidays={holidays}
          selectedMonth={currMonth}
          selectedYear={currYear}
          onHolidayUpdated={loadScheduleData}
          showToast={showToast}
        />
      )}

      {/* Quick Popover Modal (Cell Click) */}
      {activeCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in"
          onClick={() => setActiveCell(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-4 space-y-3 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 pb-2">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">
                Ubah Shift: {activeCell.employee.full_name}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tanggal: {activeCell.dateStr} (Hari ke-{activeCell.day})
                {activeCell.holiday && (
                  <span className="ml-1 text-rose-600 font-bold">• Libur: {activeCell.holiday.name}</span>
                )}
              </p>
            </div>

            {/* Mode Switcher: Template vs Custom Hours */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPopoverMode('template')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  popoverMode === 'template' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Template Shift
              </button>
              <button
                type="button"
                onClick={() => setPopoverMode('custom')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  popoverMode === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                }`}
              >
                Jam Kustom Bebas
              </button>
            </div>

            {/* Mode 1: Choose Shift Template */}
            {popoverMode === 'template' && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {shifts.map((s) => {
                  const isCurrent = activeCell.currentSchedule?.shift_id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleQuickAssign(s.id)}
                      className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
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
                          <p className="text-xs font-bold text-slate-900 leading-tight">{s.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {s.is_off_day
                              ? 'Bebas Tugas (OFF)'
                              : `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)} WIB`}
                          </p>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mode 2: Custom Hours Input */}
            {popoverMode === 'custom' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Jam Masuk (WIB)
                    </label>
                    <input
                      type="time"
                      value={popoverCustomStart}
                      onChange={(e) => setPopoverCustomStart(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-sans font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">
                      Jam Pulang (WIB)
                    </label>
                    <input
                      type="time"
                      value={popoverCustomEnd}
                      onChange={(e) => setPopoverCustomEnd(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-sans font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Piket acara, lembur"
                    value={popoverNotes}
                    onChange={(e) => setPopoverNotes(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAssign(defaultShift?.id || 'shift-normal')}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Terapkan Jam Kustom
                </button>
              </div>
            )}

            {/* Popover Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleQuickAssign(null)}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Standar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCell(null)}
                className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Salin Jadwal Bulan Lalu */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Salin Jadwal dari Bulan Lalu
                </h3>
                <p className="text-xs text-slate-500">
                  Duplikasi seluruh alokasi shift pegawai dari bulan sebelumnya.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan menduplikasi seluruh data jadwal kerja pegawai dari{' '}
              <strong>
                {currMonth === 1 ? 'Desember' : MONTH_NAMES[currMonth - 2]}{' '}
                {currMonth === 1 ? currYear - 1 : currYear}
              </strong>{' '}
              ke bulan aktif saat ini (
              <strong>
                {MONTH_NAMES[currMonth - 1]} {currYear}
              </strong>
              ). Tanggal yang melebihi jumlah hari bulan target otomatis disesuaikan.
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleCopyFromPrevMonth}
                disabled={isCopying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isCopying ? 'Menyalin...' : 'Ya, Salin Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Detail Jadwal Pegawai */}
      <EmployeeScheduleDrawer
        isOpen={Boolean(drawerEmployee)}
        onClose={() => setDrawerEmployee(null)}
        employee={drawerEmployee}
        shifts={shifts}
        schedules={schedules}
        holidays={holidays}
        selectedMonth={currMonth}
        selectedYear={currYear}
        onScheduleUpdated={() => {
          loadScheduleData();
          onScheduleUpdated?.();
        }}
        showToast={showToast}
      />

      {/* Modal: Bulk Schedule Modal */}
      <BulkScheduleModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        shifts={shifts}
        employees={employees}
        holidays={holidays}
        currentMonth={currMonth}
        currentYear={currYear}
        onSaved={() => {
          loadScheduleData();
          onScheduleUpdated?.();
        }}
      />
    </div>
  );
};
