import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Employee, 
  AttendanceMatrixDay, 
  DailyAttendance, 
  ATTENDANCE_STATUS_MAP, 
  AttendanceCode,
  MONTH_NAMES_ID,
  getMonthName 
} from '@/lib/types';
import { 
  Search, 
  Filter, 
  Check, 
  Clock, 
  Info, 
  ShieldAlert, 
  Sparkles,
  AlertTriangle,
  Users,
  CheckCheck,
  FileText,
  Briefcase,
  HeartPulse,
  ChevronDown,
  X,
  ArrowUpDown,
  Layers,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export type AttendanceFilterType = 
  | 'ALL'
  | 'NEEDS_VERIFICATION'   // Perlu Verifikasi (Ada Alpha di hari kerja tercatat)
  | 'PERFECT'              // 100% Hadir Lengkap (0 Alpha, 0 Izin)
  | 'HAS_PERMISSION'       // Ada Izin / Sakit / Cuti / Dinas
  | 'HAS_LATE_EARLY'       // Ada Terlambat (HIP) / Pulang Cepat (HIS)
  | 'HAS_DUTY'             // Ada Dinas Luar (DL)
  | 'HAS_SICK';            // Ada Sakit (I / IL)

export type SortOption = 
  | 'DEFAULT'     // Urutan Asli Excel (Baris 17 - 111)
  | 'NAME_ASC'    // Nama Pegawai (A - Z)
  | 'ALPHA_DESC'  // Alpha Terbanyak (Butuh Perhatian)
  | 'HADIR_DESC'; // Hadir Terbanyak

const FILTER_OPTIONS: {
  id: AttendanceFilterType;
  label: string;
  shortLabel: string;
  description: string;
  icon: any;
  colorClass: string;
}[] = [
  {
    id: 'ALL',
    label: 'Semua Pegawai',
    shortLabel: 'Semua Pegawai',
    description: 'Tampilkan seluruh pegawai tanpa filter khusus',
    icon: Users,
    colorClass: 'text-slate-600',
  },
  {
    id: 'NEEDS_VERIFICATION',
    label: 'Perlu Verifikasi (Alpha)',
    shortLabel: 'Perlu Verifikasi',
    description: 'Pegawai dengan status Alpha yang butuh keterangan',
    icon: AlertTriangle,
    colorClass: 'text-amber-600',
  },
  {
    id: 'PERFECT',
    label: 'Hadir Lengkap',
    shortLabel: 'Hadir Lengkap',
    description: 'Pegawai yang hadir penuh di seluruh hari kerja',
    icon: CheckCheck,
    colorClass: 'text-emerald-600',
  },
  {
    id: 'HAS_PERMISSION',
    label: 'Izin / Sakit / Dinas',
    shortLabel: 'Izin/Sakit/Dinas',
    description: 'Pegawai dengan dispensasi atau izin resmi',
    icon: FileText,
    colorClass: 'text-indigo-600',
  },
  {
    id: 'HAS_LATE_EARLY',
    label: 'Terlambat / Pulang Cepat',
    shortLabel: 'Telat/Pulang Awal',
    description: 'Pegawai dengan Hak Izin Pagi atau Siang (HIP/HIS)',
    icon: Clock,
    colorClass: 'text-orange-600',
  },
  {
    id: 'HAS_DUTY',
    label: 'Dinas Luar (DL)',
    shortLabel: 'Dinas Luar',
    description: 'Pegawai dengan surat tugas kedinasan',
    icon: Briefcase,
    colorClass: 'text-sky-600',
  },
  {
    id: 'HAS_SICK',
    label: 'Izin Sakit (I / IL)',
    shortLabel: 'Izin Sakit',
    description: 'Pegawai dengan surat atau keterangan sakit',
    icon: HeartPulse,
    colorClass: 'text-teal-600',
  },
];

interface AttendanceGridProps {
  employees: Employee[];
  days: AttendanceMatrixDay[];
  attendanceMap: Record<string, Record<number, DailyAttendance>>;
  onCellClick: (employee: Employee, day: AttendanceMatrixDay, attendance: DailyAttendance | null) => void;
  userRole: string;
  onlyNeedsVerification?: boolean;
  recordedDays?: number[];
  onOpenBulk?: () => void;
  selectedMonth?: number;
  selectedYear?: number;
  onMonthChange?: (month: number, year: number) => void;
  detectedPeriod?: {
    month?: number;
    year?: number;
    startDate?: string;
    endDate?: string;
    formattedRange?: string;
    totalDays?: number;
    monthName?: string;
  } | null;
  onOpenExport?: () => void;
  isExporting?: boolean;
}

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  employees,
  days,
  attendanceMap,
  onCellClick,
  userRole,
  onlyNeedsVerification = false,
  recordedDays = [],
  onOpenBulk,
  selectedMonth = 9,
  selectedYear = 2026,
  onMonthChange,
  detectedPeriod,
  onOpenExport,
  isExporting = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<'ALL' | 'Guru' | 'TU'>('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilterType>(
    onlyNeedsVerification ? 'NEEDS_VERIFICATION' : 'ALL'
  );
  const [sortOption, setSortOption] = useState<SortOption>('DEFAULT');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef<HTMLDivElement>(null);

  const [hoveredCell, setHoveredCell] = useState<{
    empId: string;
    day: number;
    x: number;
    y: number;
  } | null>(null);

  // Sync prop if parent changes
  useEffect(() => {
    if (onlyNeedsVerification) {
      setAttendanceFilter('NEEDS_VERIFICATION');
    }
  }, [onlyNeedsVerification]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to calculate statistics for any employee
  const getEmployeeStats = (emp: Employee) => {
    const empAttendance = attendanceMap[emp.machine_id] || {};
    let hadirCount = 0;
    let alphaCount = 0;
    let permissionCount = 0;
    let lateCount = 0; // HIP
    let earlyCount = 0; // HIS
    let dutyCount = 0; // DL
    let sickCount = 0; // I or IL

    days.forEach((d) => {
      const rec = empAttendance[d.day];
      const isRecorded = recordedDays.length > 0 ? recordedDays.includes(d.day) : true;
      const isWeekend = d.isWeekend;
      const hasDuty = Boolean(rec?.shift_id || rec?.scheduled_start || rec?.is_custom_schedule);
      const isOff = rec?.is_off_day || rec?.final_status === 'OFF';
      const isHol = rec?.is_holiday || Boolean(d.holiday) || rec?.final_status === 'LIBUR';

      // Non-working day: weekend without duty, scheduled OFF day, or holiday without duty
      if ((isWeekend && !hasDuty && !rec?.first_in) || isOff || (isHol && !hasDuty && !rec?.first_in)) {
        return;
      }

      if (isRecorded) {
        if (!rec || rec.final_status === 'A') {
          alphaCount++;
        } else if (rec.final_status === 'HADIR') {
          hadirCount++;
        } else if (rec.final_status !== 'OFF' && rec.final_status !== 'LIBUR') {
          permissionCount++;
          if (rec.final_status === 'HIP') lateCount++;
          if (rec.final_status === 'HIS') earlyCount++;
          if (rec.final_status === 'DL') dutyCount++;
          if (rec.final_status === 'I' || rec.final_status === 'IL') sickCount++;
        }
      } else {
        if (rec && rec.is_verified) {
          if (rec.final_status === 'HADIR') {
            hadirCount++;
          } else if (rec.final_status !== 'A' && rec.final_status !== 'OFF' && rec.final_status !== 'LIBUR') {
            permissionCount++;
            if (rec.final_status === 'HIP') lateCount++;
            if (rec.final_status === 'HIS') earlyCount++;
            if (rec.final_status === 'DL') dutyCount++;
            if (rec.final_status === 'I' || rec.final_status === 'IL') sickCount++;
          }
        }
      }
    });

    return {
      hadirCount,
      alphaCount,
      permissionCount,
      lateCount,
      earlyCount,
      dutyCount,
      sickCount,
    };
  };

  // Filter & Sort employees
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const result = employees.filter((emp) => {
      // 1. Search Query
      const matchSearch =
        !q ||
        emp.full_name.toLowerCase().includes(q) ||
        emp.machine_id.toLowerCase().includes(q) ||
        emp.nik.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // 2. Department Filter
      if (selectedDepartment === 'Guru' && !emp.department.includes('Guru')) return false;
      if (selectedDepartment === 'TU' && !emp.department.includes('TU')) return false;

      // 3. Attendance Filter
      if (attendanceFilter === 'ALL') return true;

      const stats = getEmployeeStats(emp);

      switch (attendanceFilter) {
        case 'NEEDS_VERIFICATION':
          return stats.alphaCount > 0;
        case 'PERFECT':
          return stats.alphaCount === 0 && stats.hadirCount > 0 && stats.permissionCount === 0;
        case 'HAS_PERMISSION':
          return stats.permissionCount > 0;
        case 'HAS_LATE_EARLY':
          return stats.lateCount > 0 || stats.earlyCount > 0;
        case 'HAS_DUTY':
          return stats.dutyCount > 0;
        case 'HAS_SICK':
          return stats.sickCount > 0;
        default:
          return true;
      }
    });

    // 4. Sorting
    if (sortOption === 'NAME_ASC') {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortOption === 'ALPHA_DESC') {
      result.sort((a, b) => {
        const statsA = getEmployeeStats(a);
        const statsB = getEmployeeStats(b);
        return statsB.alphaCount - statsA.alphaCount || a.excel_row_index - b.excel_row_index;
      });
    } else if (sortOption === 'HADIR_DESC') {
      result.sort((a, b) => {
        const statsA = getEmployeeStats(a);
        const statsB = getEmployeeStats(b);
        return statsB.hadirCount - statsA.hadirCount || a.excel_row_index - b.excel_row_index;
      });
    } else {
      // Default: Original Excel Row Index
      result.sort((a, b) => a.excel_row_index - b.excel_row_index);
    }

    return result;
  }, [employees, searchQuery, selectedDepartment, attendanceFilter, sortOption, attendanceMap, days, recordedDays]);

  const activeFilterOption = FILTER_OPTIONS.find((f) => f.id === attendanceFilter) || FILTER_OPTIONS[0];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Table Control Bar: 2 Clean Rows */}
      <div className="relative z-30 border-b border-slate-200/80 bg-slate-50/60 divide-y divide-slate-200/60">
        {/* ROW 1: Department Pills + Period Selector Button (Left) & Bulk Action + Counter (Right) */}
        <div className="p-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'Guru', label: 'Guru' },
                { id: 'TU', label: 'Tata Usaha' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDepartment(d.id as any)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedDepartment === d.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Periode Bulan Dropdown Button */}
            <div className="relative" ref={monthDropdownRef}>
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
                title="Tampilkan dan pilih periode bulan"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Periode: {getMonthName(selectedMonth || 9)} {selectedYear || 2026}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Month Selector Dropdown Popover */}
              {isMonthDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Pilih Periode Bulan</span>
                    <span className="text-blue-600 font-bold">{selectedYear || 2026}</span>
                  </div>

                  {detectedPeriod && detectedPeriod.month === (selectedMonth || 9) && (
                    <div className="mb-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Data Transaksi: {detectedPeriod.formattedRange}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES_ID.slice(1).map((mName, idx) => {
                      const mNum = idx + 1;
                      const isCurrent = (selectedMonth || 9) === mNum;
                      return (
                        <button
                          key={mNum}
                          type="button"
                          onClick={() => {
                            onMonthChange?.(mNum, selectedYear || 2026);
                            setIsMonthDropdownOpen(false);
                          }}
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
          </div>

          {/* Right side: Bulk Action & Counter Info */}
          <div className="flex items-center gap-2.5">
            {onOpenBulk && userRole !== 'pimpinan' && (
              <button
                type="button"
                onClick={onOpenBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                title="Verifikasi status presensi secara massal untuk beberapa pegawai atau divisi"
              >
                <Layers className="w-3.5 h-3.5 text-white" />
                <span>Verifikasi Massal</span>
              </button>
            )}
            <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Menampilkan <span className="font-bold text-slate-900">{filteredEmployees.length}</span> dari {employees.length} pegawai
            </div>
          </div>
        </div>

        {/* ROW 2: Search Box + Filter Status Dropdown + Sort Selector + Reset */}
        <div className="p-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
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
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Status Button with Dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-2xs ${
                attendanceFilter !== 'ALL'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className={`w-3.5 h-3.5 ${attendanceFilter !== 'ALL' ? 'text-white' : 'text-slate-500'}`} />
              <span>
                {attendanceFilter === 'ALL'
                  ? 'Filter Presensi'
                  : `Filter: ${activeFilterOption.shortLabel}`}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isFilterDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Pilih Filter</span>
                  {attendanceFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttendanceFilter('ALL');
                        setIsFilterDropdownOpen(false);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="py-1">
                  {FILTER_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = attendanceFilter === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setAttendanceFilter(opt.id);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between gap-2.5 text-xs ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : opt.colorClass}`} />
                          <span className="truncate">{opt.label}</span>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 shrink-0 text-blue-600 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="pl-2.5 pr-7 py-1.5 text-xs bg-white rounded-xl border border-slate-300 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all appearance-none cursor-pointer shadow-2xs"
              title="Urutkan susunan baris pegawai"
            >
              <option value="DEFAULT">⇅ Urutan Excel</option>
              <option value="NAME_ASC">⇅ Nama: A s/d Z</option>
              <option value="ALPHA_DESC">⇅ Alpha Terbanyak</option>
              <option value="HADIR_DESC">⇅ Hadir Terbanyak</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Reset button if any filter is active */}
          {(attendanceFilter !== 'ALL' || selectedDepartment !== 'ALL' || searchQuery || sortOption !== 'DEFAULT') && (
            <button
              onClick={() => {
                setAttendanceFilter('ALL');
                setSelectedDepartment('ALL');
                setSearchQuery('');
                setSortOption('DEFAULT');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
              title="Reset semua filter dan pencarian"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Matrix Table with sticky headers & sticky columns */}
      <div className="overflow-x-auto overflow-y-auto max-h-[680px] relative z-10 border-b border-slate-200">
        <table className="w-full border-separate border-spacing-0 text-left text-xs">
          <colgroup>
            <col className="w-[56px] min-w-[56px] max-w-[56px]" />
            <col className="w-[220px] min-w-[220px] max-w-[220px]" />
            <col className="w-[110px] min-w-[110px] max-w-[110px]" />
            {days.map((d) => (
              <col key={`col-${d.day}`} className="w-[42px] min-w-[42px] max-w-[42px]" />
            ))}
          </colgroup>
          <thead>
            {/* ROW 1: Day Names (MON / TUE / WED / THU / FRI / SAT / SUN) */}
            <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 header-row-1">
              <th className="sticky-col-1 bg-slate-100 px-1 h-8 border-b border-r border-slate-200 text-center text-slate-500 font-bold box-border">
                #
              </th>
              <th className="sticky-col-2 bg-slate-100 px-3 h-8 border-b border-r border-slate-200 font-bold text-slate-700 box-border">
                Identitas Pegawai
              </th>
              <th className="sticky-col-3 bg-slate-100 px-2 h-8 border-b border-r border-slate-300 text-center font-bold text-xs text-slate-700 box-border">
                Ringkasan
              </th>
              {days.map((d) => (
                <th
                  key={`day-name-${d.day}`}
                  className={`w-[42px] min-w-[42px] max-w-[42px] h-8 p-0 text-center border-b border-r border-slate-200 text-[10px] box-border ${
                    d.isWeekend ? 'bg-rose-50/90 text-rose-700 font-black' : 'bg-slate-100 text-slate-600 font-bold'
                  }`}
                  title={d.isWeekend ? `Akhir Pekan (${d.dayName})` : d.dayName}
                >
                  <div className="w-full h-8 flex items-center justify-center font-bold tracking-tight">
                    {d.dayName}
                  </div>
                </th>
              ))}
            </tr>

            {/* ROW 2: Day Numbers (1 s/d 30) & Skor */}
            <tr className="bg-slate-200/95 text-[11px] font-extrabold text-slate-800 header-row-2">
              <th className="sticky-col-1 bg-slate-200 px-1 h-8 border-b-2 border-r border-slate-300 text-center text-slate-700 font-bold box-border">
                No.
              </th>
              <th className="sticky-col-2 bg-slate-200 px-3 h-8 border-b-2 border-r border-slate-300 font-bold text-slate-800 box-border">
                Daftar Pegawai
              </th>
              <th className="sticky-col-3 bg-slate-200 px-2 h-8 border-b-2 border-r border-slate-300 text-center text-xs font-black tracking-wide box-border" title="Ringkasan: Hadir (H) / Alpha (A) / Izin, Sakit, DL (I)">
                <span className="text-emerald-700">H</span>
                <span className="text-slate-400 font-normal mx-0.5">/</span>
                <span className="text-rose-600">A</span>
                <span className="text-slate-400 font-normal mx-0.5">/</span>
                <span className="text-amber-600">I</span>
              </th>
              {days.map((d) => (
                <th
                  key={`day-num-${d.day}`}
                  className={`w-[42px] min-w-[42px] max-w-[42px] h-8 p-0 text-center border-b-2 border-r border-slate-300 text-xs font-black box-border ${
                    d.isWeekend ? 'bg-rose-100/90 text-rose-800' : 'bg-slate-200 text-slate-900'
                  }`}
                >
                  <div className="w-full h-8 flex items-center justify-center font-black">
                    {d.day}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={days.length + 3}
                  className="py-12 text-center text-slate-400 text-xs italic"
                >
                  Tidak ada data pegawai yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, empIdx) => {
                const empAttendance = attendanceMap[emp.machine_id] || {};
                // Calculate summary counts for this row
                let hadirCount = 0;
                let alphaCount = 0;
                let verifiedCount = 0;

                days.forEach((d) => {
                  if (d.isWeekend) return;
                  const isRecorded = recordedDays.length > 0 ? recordedDays.includes(d.day) : true;
                  const rec = empAttendance[d.day];

                  if (isRecorded) {
                    if (!rec || rec.final_status === 'A') {
                      alphaCount++;
                    } else if (rec.final_status === 'HADIR') {
                      hadirCount++;
                    } else {
                      verifiedCount++;
                    }
                  } else {
                    // Unrecorded day outside machine log: only count if admin verified it
                    if (rec && rec.is_verified) {
                      if (rec.final_status === 'HADIR') {
                        hadirCount++;
                      } else if (rec.final_status !== 'A') {
                        verifiedCount++;
                      }
                    }
                  }
                });

                return (
                  <tr
                    key={emp.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Sticky Col 1: Number */}
                    <td className="sticky-col-1 bg-white group-hover:bg-slate-50 px-1 py-2 text-center border-r border-b border-slate-200 text-xs font-semibold text-slate-700 box-border">
                      {empIdx + 1}
                    </td>

                    {/* Sticky Col 2: Employee Name & Machine ID */}
                    <td className="sticky-col-2 bg-white group-hover:bg-slate-50 px-3 py-2 border-r border-b border-slate-200 box-border">
                      <div className="font-semibold text-slate-900 truncate" title={emp.full_name}>
                        {emp.full_name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-sans font-bold text-[10px]">
                          ID: {emp.machine_id}
                        </span>
                        <span className="truncate">{emp.department}</span>
                      </div>
                    </td>

                    {/* Sticky Col 3: Row Quick Stats */}
                    <td className="sticky-col-3 bg-white group-hover:bg-slate-50 px-2 py-2 border-r border-b border-slate-300 text-center box-border">
                      <div className="flex items-center justify-center gap-1 text-[13px] font-bold tracking-tight tabular-nums">
                        <span className="text-emerald-700 min-w-[16px] text-center" title="Hadir (H)">{hadirCount}</span>
                        <span className="text-slate-300 font-normal text-[11px] select-none">/</span>
                        <span className="text-rose-600 min-w-[16px] text-center" title="Alpha (A)">{alphaCount}</span>
                        <span className="text-slate-300 font-normal text-[11px] select-none">/</span>
                        <span className="text-amber-600 min-w-[16px] text-center" title="Izin / Sakit / Dinas (I)">{verifiedCount}</span>
                      </div>
                    </td>

                    {/* Day Cells 1..30 */}
                    {days.map((d) => {
                      const rec = empAttendance[d.day];
                      const isWeekend = d.isWeekend;
                      const hasAssignedDuty = Boolean(rec?.shift_id || rec?.scheduled_start || rec?.is_custom_schedule);
                      const isRecorded = recordedDays.length > 0 ? recordedDays.includes(d.day) : true;
                      const isManuallyVerified = rec && rec.is_verified;

                      // 1. Weekend WITHOUT assigned shift duty, no punches, and not manually verified
                      if (isWeekend && !hasAssignedDuty && !rec?.first_in && !isManuallyVerified) {
                        return (
                          <td
                            key={`cell-${emp.id}-${d.day}`}
                            className="w-[42px] min-w-[42px] max-w-[42px] p-0 text-center border-r border-slate-200 bg-weekend-pattern opacity-60 cursor-not-allowed select-none box-border"
                            title={`Akhir Pekan (${d.dayName}) - Libur Rutin`}
                          >
                            <span className="text-[9px] text-slate-400 select-none">•</span>
                          </td>
                        );
                      }

                      // 2. Explicit OFF day (Libur Shift / Bebas Tugas)
                      if (rec?.final_status === 'OFF' || rec?.is_off_day) {
                        return (
                          <td
                            key={`cell-${emp.id}-${d.day}`}
                            onClick={() => {
                              if (userRole === 'pimpinan') return;
                              onCellClick(emp, d, rec || null);
                            }}
                            className="w-[42px] min-w-[42px] max-w-[42px] h-9 p-0 text-center border-r border-b border-slate-200 bg-slate-100/90 hover:bg-slate-200 transition-all font-semibold select-none cursor-pointer box-border"
                            title={`${emp.full_name} | Tgl ${d.day}: Libur Shift / Bebas Tugas (Klik untuk ganti shift/izin)`}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300 shadow-2xs">
                                OFF
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // 3. Holiday (Hari Libur Tambahan / Nasional) without active work duty
                      if (
                        (rec?.final_status === 'LIBUR' || (d.holiday && !hasAssignedDuty)) &&
                        !rec?.first_in &&
                        !isManuallyVerified
                      ) {
                        return (
                          <td
                            key={`cell-${emp.id}-${d.day}`}
                            onClick={() => {
                              if (userRole === 'pimpinan') return;
                              onCellClick(emp, d, rec || null);
                            }}
                            className="w-[42px] min-w-[42px] max-w-[42px] h-9 p-0 text-center border-r border-b border-slate-200 bg-rose-50/70 hover:bg-rose-100 transition-all font-semibold select-none cursor-pointer box-border"
                            title={`${emp.full_name} | Tgl ${d.day}: ${d.holiday?.name || rec?.shift_name || 'Hari Libur'} (Bebas Tugas)`}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs">
                                LIBUR
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // 4. Unrecorded empty cell (future dates / logs not uploaded yet)
                      const isUnrecordedEmpty = !isRecorded && !isManuallyVerified;
                      if (isUnrecordedEmpty) {
                        return (
                          <td
                            key={`cell-${emp.id}-${d.day}`}
                            onClick={() => {
                              if (userRole === 'pimpinan') return;
                              onCellClick(emp, d, rec || null);
                            }}
                            className="w-[42px] min-w-[42px] max-w-[42px] h-9 p-0 text-center border-r border-b border-slate-200 bg-slate-100/70 hover:bg-slate-200/70 transition-all font-medium select-none cursor-pointer box-border relative group/cell"
                            title={`${emp.full_name} | Tgl ${d.day}: Belum Terekap ${rec?.shift_name ? `(Jadwal: ${rec.shift_name})` : ''}`}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <span className="text-[11px] font-semibold text-slate-300 select-none">
                                -
                              </span>
                              {rec?.is_custom_schedule && rec?.shift_code && rec.shift_code !== 'NORM' && (
                                <span
                                  className="absolute bottom-0.5 right-0.5 text-[8px] font-extrabold px-0.5 rounded leading-none text-white opacity-90 shadow-2xs"
                                  style={{ backgroundColor: rec.shift_color || '#3b82f6' }}
                                >
                                  {rec?.shift_code?.substring(0, 3)}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // 5. Active recorded / evaluated cell
                      const finalStatus: AttendanceCode = rec ? rec.final_status : 'A';
                      const statusInfo = ATTENDANCE_STATUS_MAP[finalStatus];
                      const isHadir = finalStatus === 'HADIR';
                      const isAlpha = finalStatus === 'A';
                      const isCustomShift = rec?.is_custom_schedule && rec?.shift_code && rec.shift_code !== 'NORM';

                      return (
                        <td
                          key={`cell-${emp.id}-${d.day}`}
                          onClick={() => {
                            if (userRole === 'pimpinan') return;
                            onCellClick(emp, d, rec || null);
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredCell({
                              empId: emp.id,
                              day: d.day,
                              x: rect.left,
                              y: rect.bottom + window.scrollY,
                            });
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-[42px] min-w-[42px] max-w-[42px] h-9 p-0 text-center border-r border-b border-slate-200 transition-all font-bold select-none cursor-pointer box-border relative ${
                            isHadir
                              ? 'bg-[#C6EFCE] text-[#006100] hover:brightness-95'
                              : isAlpha
                              ? 'bg-[#FFC7CE] text-[#9C0006] hover:brightness-95 animate-pulse-subtle'
                              : 'bg-[#FFEB9C] text-[#9C6500] hover:brightness-95'
                          }`}
                          title={`${emp.full_name} | Tgl ${d.day}: ${statusInfo?.label || finalStatus}${rec?.shift_name ? ` (${rec.shift_name})` : ''}`}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            {isHadir ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <span className="text-xs leading-none tracking-tight font-black">
                                {finalStatus}
                              </span>
                            )}
                            {Boolean(isCustomShift && rec?.shift_code) && (
                              <span
                                className="absolute bottom-0.5 right-0.5 text-[7px] font-black px-0.5 rounded leading-none text-white shadow-2xs"
                                style={{ backgroundColor: rec?.shift_color || '#3b82f6' }}
                                title={rec?.shift_name}
                              >
                                {rec?.shift_code?.substring(0, 3)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer & Legend Bar */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-700">Legenda Status:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-[#C6EFCE] border border-[#93D097] text-[#006100] text-center font-bold text-[10px] leading-4">
              ✓
            </span>
            <span className="text-slate-600">Hadir (Sesuai Jam Shift / Operasional)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-[#FFC7CE] border border-[#F59DA7] text-[#9C0006] text-center font-bold text-[10px] leading-4">
              A
            </span>
            <span className="text-slate-600 font-semibold text-rose-700">Alpha / Tanpa Info (-3 Poin)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block px-1.5 h-4 rounded bg-slate-100 border border-slate-300 text-slate-600 text-center font-bold text-[9px] leading-4">
              OFF
            </span>
            <span className="text-slate-600">Libur Shift (Bebas Tugas)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block px-1.5 h-4 rounded bg-rose-50 border border-rose-200 text-rose-700 text-center font-bold text-[9px] leading-4">
              LIBUR
            </span>
            <span className="text-slate-600">Hari Libur Tambahan</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-4 rounded bg-[#FFEB9C] border border-[#ECC767] text-[#9C6500] text-center font-bold text-[9px] leading-4">
              HIP
            </span>
            <span className="text-slate-600">Hak Izin Pagi (-1 Poin)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-4 rounded bg-[#FFEB9C] border border-[#ECC767] text-[#9C6500] text-center font-bold text-[9px] leading-4">
              HIS
            </span>
            <span className="text-slate-600">Hak Izin Siang (-1 Poin)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-4 rounded bg-[#FFEB9C] border border-[#ECC767] text-[#9C6500] text-center font-bold text-[10px] leading-4">
              DL
            </span>
            <span className="text-slate-600">Dinas Luar (Resmi)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-slate-100 border border-slate-300 text-slate-400 text-center font-bold text-[10px] leading-4">
              -
            </span>
            <span className="text-slate-500">Belum Terekap (Log Belum Ada)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-slate-200 border border-slate-300"></span>
            <span className="text-slate-400">Sabtu / Minggu (Libur Rutin)</span>
          </div>
        </div>

        <div className="text-slate-500 text-[11px] flex items-center gap-1 italic">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          Klik pada sel presensi untuk memverifikasi atau mengubah status kehadiran.
        </div>
      </div>
    </div>

    {/* Tombol Ekspor Resmi di Paling Bawah di Luar Tabel */}
    {onOpenExport && (
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onOpenExport}
          disabled={isExporting}
          id="btn-export-rekap-bottom"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 active:scale-[0.98] shadow-md hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group border border-emerald-500/30"
        >
          <FileSpreadsheet className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          <span>{isExporting ? 'Memproses Berkas...' : 'Unduh Rekap Resmi (.xlsx)'}</span>
        </button>
      </div>
    )}
  </div>
  );
};
