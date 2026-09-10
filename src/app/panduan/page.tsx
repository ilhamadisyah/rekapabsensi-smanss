'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CalculationGuideModal } from '@/components/calculation-guide-modal';
import {
  BookOpen,
  Share2,
  Check,
  LogIn,
  Printer,
  School,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export default function PanduanPublicPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrintPDF = () => {
    if (typeof window !== 'undefined') {
      const originalTitle = document.title;
      document.title = 'SOP_Pedoman_Rekapitulasi_Presensi_SMANSS_2026';
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col print:bg-white print:min-h-0 print:block">
      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  SMAN Sumatera Selatan
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Akses Terbuka
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Portal Informasi Perhitungan &amp; Pedoman Kedisiplinan Pegawai
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Cetak Pedoman Resmi sebagai Dokumen PDF (A4)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Cetak Dokumen PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              title="Salin tautan halaman ini untuk dibagikan ke rekan guru/pegawai"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tautan Disalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Bagikan Link</span>
                </>
              )}
            </button>

            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Notice Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white py-6 px-4 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-blue-100 text-[11px] font-semibold border border-white/20 mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Halaman Publik Tanpa Login</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight">
              Panduan Perhitungan &amp; Simulasi Nilai Kehadiran Pegawai
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-3xl leading-relaxed">
              Dapat diakses secara terbuka oleh seluruh guru, staf tata usaha, dan pimpinan untuk memahami aturan kolom laporan, arti keterangan absen, rumus nilai, serta melakukan simulasi nilai kedisiplinan (SKP) secara langsung.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Calculation Guide Component */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full print:p-0 print:max-w-none">
        <CalculationGuideModal
          isOpen={true}
          onClose={() => {}}
          isEmbeddedView={true}
        />
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-700">
            SMA Negeri Sumatera Selatan (SMANSS)
          </p>
          <p className="text-[11px] text-slate-400">
            Jl. Pangeran Ratu, 8 Ulu, Kecamatan Seberang Ulu I, Kota Palembang, Sumatera Selatan
          </p>
          <p className="text-[11px] text-slate-400 pt-2">
            AutoAbsen SMANSS &copy; 2026 &bull; Sistem Rekapitulasi Presensi &amp; Evaluasi Kedisiplinan Terintegrasi
          </p>
        </div>
      </footer>
    </div>
  );
}
