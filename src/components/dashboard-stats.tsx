import React from 'react';
import { MonthlyAttendanceSummary, getMonthName } from '@/lib/types';
import { Users, CheckCircle2, AlertTriangle, CheckCheck, Clock } from 'lucide-react';

interface DashboardStatsProps {
  summary: MonthlyAttendanceSummary | null;
  detectedPeriod?: {
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
    startDay: number;
    endDay: number;
    totalDays: number;
    formattedRange: string;
  } | null;
  onlyNeedsVerification?: boolean;
  onToggleVerificationFilter?: (val: boolean) => void;
  onOpenUpload: () => void;
  onOpenGuide?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  userRole: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  summary,
  detectedPeriod,
  onlyNeedsVerification,
  onToggleVerificationFilter,
  onOpenUpload,
  onOpenGuide,
  userRole,
}) => {
  if (!summary) return null;

  const monthName = getMonthName(summary.periodMonth);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Rekapitulasi Presensi Periode: {monthName} {summary.periodYear}
            </h2>
            {detectedPeriod && detectedPeriod.month === summary.periodMonth && (
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-300 text-[10px] sm:text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{detectedPeriod.formattedRange} ({detectedPeriod.totalDays} Hari)</span>
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-snug">
            Jam Operasional: <span className="font-semibold text-slate-700">Tersinkron Shift</span> | Efektif: <span className="font-semibold text-slate-700">{summary.totalWorkingDays} Hari</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              id="btn-upload-log-top"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 cursor-pointer border border-blue-500/20"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>Unggah Log Mesin (.xls)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards (2x2 on mobile, 4 columns on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Pegawai */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight">Total Pegawai</span>
            <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">{summary.totalEmployees}</span>
            <span className="text-[10px] sm:text-xs text-slate-400">Orang</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 leading-tight">
            Guru & Pegawai SMANSS
          </div>
        </div>

        {/* Tingkat Kehadiran */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight">Rata Kehadiran</span>
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600">{summary.avgAttendanceRate}%</span>
            <span className="text-[10px] sm:text-xs text-emerald-700 font-medium hidden sm:inline">Tepat Waktu</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 leading-tight">
            Sesuai jadwal shift harian
          </div>
        </div>

        {/* Sel Perlu Verifikasi */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight">Perlu Verifikasi</span>
            <div className="p-1.5 sm:p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-rose-600">{summary.totalUnverifiedRed}</span>
            <span className="text-[10px] sm:text-xs text-rose-700 font-medium">Alpha</span>
          </div>
          <div className="mt-1 sm:mt-2 text-[10px] sm:text-[11px] text-slate-500 leading-tight">
            Tap sel merah untuk atur izin/DL
          </div>
        </div>

        {/* Progres Verifikasi */}
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 leading-tight">Progres Selesai</span>
            <div className="p-1.5 sm:p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-amber-600">{summary.verificationProgress}%</span>
            <span className="text-[10px] sm:text-xs text-slate-500">Diverifikasi</span>
          </div>
          {/* Progress Bar */}
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.verificationProgress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
