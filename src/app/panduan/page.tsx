'use client';

import React from 'react';
import { CalculationGuideModal } from '@/components/calculation-guide-modal';

export default function PanduanPublicPage() {
  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col print:bg-white print:min-h-0 print:block">
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
