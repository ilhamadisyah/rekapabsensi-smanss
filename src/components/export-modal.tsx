'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  Building2,
  Download,
  Info,
  Check,
} from 'lucide-react';
import { getMonthName } from '@/lib/types';

export interface ExportConfig {
  fromDay: number;
  toDay: number;
  department: 'ALL' | 'Guru' | 'TU';
  includeSignatures: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: number;
  year: number;
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
  recordedDays?: number[];
  onConfirmExport: (config: ExportConfig) => Promise<void>;
  isExporting: boolean;
}

type RangeMode = 'log_available' | 'custom_range' | 'full_month';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  month,
  year,
  detectedPeriod,
  recordedDays = [],
  onConfirmExport,
  isExporting,
}) => {
  const logStart = useMemo(() => {
    if (detectedPeriod?.startDay) return detectedPeriod.startDay;
    if (recordedDays.length > 0) return Math.min(...recordedDays);
    return 1;
  }, [detectedPeriod, recordedDays]);

  const logEnd = useMemo(() => {
    if (detectedPeriod?.endDay) return detectedPeriod.endDay;
    if (recordedDays.length > 0) return Math.max(...recordedDays);
    return Math.min(3, 30);
  }, [detectedPeriod, recordedDays]);

  const [rangeMode, setRangeMode] = useState<RangeMode>('log_available');
  const [customFrom, setCustomFrom] = useState<number>(1);
  const [customTo, setCustomTo] = useState<number>(logEnd || 3);
  const [department, setDepartment] = useState<'ALL' | 'Guru' | 'TU'>('ALL');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomFrom(1);
      setCustomTo(logEnd || 3);
      setErrorMsg(null);
    }
  }, [isOpen, logEnd]);

  if (!isOpen) return null;

  let effectiveFrom = 1;
  let effectiveTo = 30;

  if (rangeMode === 'log_available') {
    effectiveFrom = logStart;
    effectiveTo = logEnd;
  } else if (rangeMode === 'custom_range') {
    effectiveFrom = customFrom;
    effectiveTo = customTo;
  } else {
    effectiveFrom = 1;
    effectiveTo = 30;
  }

  let workingDaysCount = 0;
  for (let d = effectiveFrom; d <= effectiveTo; d++) {
    const dt = new Date(year, month - 1, d);
    const dayOfWeek = dt.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysCount++;
    }
  }

  const monthName = getMonthName(month);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (rangeMode === 'custom_range' && customFrom > customTo) {
      setErrorMsg('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
      return;
    }

    setErrorMsg(null);
    await onConfirmExport({
      fromDay: effectiveFrom,
      toDay: effectiveTo,
      department,
      includeSignatures,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col animate-scale-in">
        {/* Header Clean */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Opsi Ekspor Rekapitulasi Presensi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Format Resmi Excel (.xlsx) • {monthName} {year}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Rentang Tanggal */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Pilih Rentang Tanggal:
            </label>

            <div className="space-y-2">
              {/* Opsi 1: Log Tersedia */}
              <label
                onClick={() => setRangeMode('log_available')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  rangeMode === 'log_available'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="rangeMode"
                    checked={rangeMode === 'log_available'}
                    onChange={() => setRangeMode('log_available')}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      1. Log Tersedia (Sesuai Log Mesin)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mengekspor hari yang telah memiliki catatan transaksi riil
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200 whitespace-nowrap">
                  Tgl {logStart} s/d {logEnd}
                </span>
              </label>

              {/* Opsi 2: Custom Rentang Tanggal */}
              <div
                onClick={() => setRangeMode('custom_range')}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  rangeMode === 'custom_range'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="rangeMode"
                      checked={rangeMode === 'custom_range'}
                      onChange={() => setRangeMode('custom_range')}
                      className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        2. Custom Rentang Tanggal
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Pilih bebas tanggal awal dan akhir rekapitulasi
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md border border-blue-200 whitespace-nowrap">
                    Bebas Pilih
                  </span>
                </div>

                {rangeMode === 'custom_range' && (
                  <div
                    className="pt-2 border-t border-blue-200/60 grid grid-cols-2 gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Dari Tanggal:
                      </span>
                      <select
                        value={customFrom}
                        onChange={(e) => setCustomFrom(parseInt(e.target.value, 10))}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Tanggal {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Sampai Tanggal:
                      </span>
                      <select
                        value={customTo}
                        onChange={(e) => setCustomTo(parseInt(e.target.value, 10))}
                        className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Tanggal {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Opsi 3: Seluruh Bulan */}
              <label
                onClick={() => setRangeMode('full_month')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  rangeMode === 'full_month'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="rangeMode"
                    checked={rangeMode === 'full_month'}
                    onChange={() => setRangeMode('full_month')}
                    className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      3. Seluruh Bulan (Tgl 1 s/d 30)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Format standar penuh 30 hari satu bulan kalender
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200 whitespace-nowrap">
                  30 Hari Penuh
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Target Divisi Pegawai */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-600" />
              Target Divisi Pegawai:
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'ALL', label: 'Semua Pegawai' },
                { id: 'Guru', label: 'Tenaga Pendidik' },
                { id: 'TU', label: 'Tata Usaha' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDepartment(d.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                    department === d.id
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Pengaturan Legalitas Tanda Tangan */}
          <div className="pt-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none group p-1.5 rounded-xl hover:bg-slate-100/70 transition-colors">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                  includeSignatures
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                {includeSignatures && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="sr-only"
              />
              <span className="font-medium text-xs text-slate-700 group-hover:text-slate-900 transition-colors">
                Sertakan kolom tanda tangan resmi Kepala Sekolah pada lembar Excel
              </span>
            </label>
          </div>
        </form>

        {/* Sticky Clean Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800">
              Tgl {effectiveFrom}–{effectiveTo} {monthName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              {workingDaysCount} Hari Kerja
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Memproses...' : 'Unduh Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
