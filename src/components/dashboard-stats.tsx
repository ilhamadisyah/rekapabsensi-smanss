import React from 'react';
import { MonthlyAttendanceSummary, getMonthName } from '@/lib/types';
import { Users, CheckCircle2, AlertTriangle, CheckCheck, Clock, FileSpreadsheet } from 'lucide-react';

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
  userRole,
}) => {
  if (!summary) return null;

  const monthName = getMonthName(summary.periodMonth);

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Rekapitulasi Presensi Periode: {monthName} {summary.periodYear}
            </h2>
            {detectedPeriod && detectedPeriod.month === summary.periodMonth && (
              <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Periode Terdeteksi: {detectedPeriod.formattedRange} ({detectedPeriod.totalDays} Hari Transaksi)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Jam Operasional Resmi: <span className="font-semibold text-slate-700">07:30 s/d 16:00 WIB</span> | Hari Kerja Efektif: <span className="font-semibold text-slate-700">{summary.totalWorkingDays} Hari</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {userRole !== 'pimpinan' && (
            <button
              type="button"
              onClick={onOpenUpload}
              id="btn-upload-log-top"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 cursor-pointer border border-blue-500/20"
            >
              <Clock className="w-4 h-4" />
              <span>Unggah Log Mesin (.xls)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Pegawai */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pegawai Terdaftar</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.totalEmployees}</span>
            <span className="text-xs text-slate-400">Pegawai Aktif</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Termasuk Guru & Tenaga Kependidikan SMANSS
          </div>
        </div>

        {/* Tingkat Kehadiran */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Kehadiran</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{summary.avgAttendanceRate}%</span>
            <span className="text-xs text-emerald-700 font-medium">Hadir Tepat Waktu</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Berdasarkan jam masuk &lt;= 07:30 &amp; pulang &gt;= 16:00 WIB
          </div>
        </div>

        {/* Sel Perlu Verifikasi */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Menunggu Verifikasi</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{summary.totalUnverifiedRed}</span>
            <span className="text-xs text-rose-700 font-medium">Sel Merah (Alpha)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Klik sel merah di tabel untuk konfirmasi izin/sakit/DL
          </div>
        </div>

        {/* Progres Verifikasi */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Progres Verifikasi</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{summary.verificationProgress}%</span>
            <span className="text-xs text-slate-500">Selesai Diverifikasi</span>
          </div>
          {/* Progress Bar */}
          <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
