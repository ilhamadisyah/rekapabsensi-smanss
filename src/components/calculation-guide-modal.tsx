'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Calculator,
  HelpCircle,
  FileSpreadsheet,
  Percent,
  Check,
  Info,
  Layers,
  ChevronRight,
  Printer,
  Calendar,
} from 'lucide-react';

interface CalculationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbeddedView?: boolean;
}

export const CalculationGuideModal: React.FC<CalculationGuideModalProps> = ({
  isOpen,
  onClose,
  isEmbeddedView = false,
}) => {
  const [activeTab, setActiveTab] = useState<'anatomy' | 'codes' | 'formulas' | 'simulator' | 'cases'>('anatomy');

  // State untuk Live Interactive Calculator
  const [calcWorkingDays, setCalcWorkingDays] = useState<number>(21);
  const [calcAlpha, setCalcAlpha] = useState<number>(1);
  const [calcHIP, setCalcHIP] = useState<number>(1);
  const [calcHIS, setCalcHIS] = useState<number>(0);
  const [calcI, setCalcI] = useState<number>(0);

  // Kalkulasi Live Simulasi
  const calcHK = Math.max(0, calcWorkingDays - calcI - calcAlpha);
  const calcX = Math.max(0, calcHK * 2 - calcHIP * 1 - calcHIS * 1 - calcI * 1 - calcAlpha * 3);
  const calcY = calcWorkingDays * 2;
  const calcPct = calcY > 0 ? Math.min(100, Math.max(0, Math.round((calcX / calcY) * 10000) / 100)) : 0;

  let calcScore1 = 5;
  if (calcX === 0 || calcPct <= 0) calcScore1 = 0;
  else if (calcPct >= 100) calcScore1 = 10;
  else if (calcPct >= 90) calcScore1 = 9;
  else if (calcPct >= 80) calcScore1 = 8;
  else if (calcPct >= 65) calcScore1 = 7;
  else if (calcPct >= 50) calcScore1 = 6;
  else calcScore1 = 5;

  const calcScore2 = Math.round(calcScore1 * 0.2 * 10) / 10;

  if (!isOpen && !isEmbeddedView) return null;

  const content = (
    <div className="flex flex-col h-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
      {/* Header Modal / View */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0 shadow-inner">
            <BookOpen className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                Panduan Perhitungan &amp; Arti Tabel Rekapitulasi
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                Standar Resmi SMANSS
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Penjelasan lengkap fungsi kolom, status kehadiran, rumus bobot nilai, dan rubrik kedisiplinan pegawai
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-semibold"
            title="Cetak panduan ini"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
          {!isEmbeddedView && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup panduan"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-6 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
        {[
          { id: 'anatomy', label: '1. Anatomi & Arti Kolom', icon: Layers },
          { id: 'codes', label: '2. Glosarium Status & Bobot', icon: CheckCircle2 },
          { id: 'formulas', label: '3. Rumus & Rubrik Nilai', icon: Percent },
          { id: 'simulator', label: '4. Kalkulator Simulasi Live', icon: Calculator },
          { id: 'cases', label: '5. Contoh Kasus Riil', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs sm:text-sm">
        {/* TAB 1: ANATOMI & ARTI KOLOM */}
        {activeTab === 'anatomy' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Struktur &amp; Pembagian Kolom Laporan Excel (Kolom A s/d AU)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Laporan rekapitulasi resmi SMAN Sumatera Selatan terbagi menjadi 4 zona utama yang saling terintegrasi:
              </p>
            </div>

            {/* Zona Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Zona 1: Identitas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">
                    A-B
                  </span>
                  <span>Zona 1: Identitas Pegawai</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>
                    <strong className="text-slate-900">Kolom A (NO):</strong> Nomor urut pegawai (1 s/d jumlah pegawai).
                  </li>
                  <li>
                    <strong className="text-slate-900">Kolom B (NAME):</strong> Nama lengkap pegawai beserta gelar dinas resmi. Diatur rata kiri dengan indentasi 1 spasi.
                  </li>
                </ul>
              </div>

              {/* Zona 2: Presensi Harian */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                    C-AF
                  </span>
                  <span>Zona 2: Presensi Harian (Tanggal 1 s/d 30)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>
                    <strong className="text-slate-900">Hari Kerja (Senin–Jumat):</strong> Menampilkan kode ketidakhadiran (jika izin/sakit/alpha) atau dibiarkan kosong bersih jika Hadir Tepat Waktu.
                  </li>
                  <li>
                    <strong className="text-slate-900">Akhir Pekan (Sabtu–Minggu):</strong> Diwarnai merah pekat (<code className="text-[11px] bg-red-100 text-red-700 px-1 py-0.5 rounded">#FFFF0000</code>) sebagai tanda libur otomatis tanpa potongan poin.
                  </li>
                  <li>
                    <strong className="text-slate-900">Hari Libur Sekolah / Nasional:</strong> Mengambil data libur resmi dari database (misal Maulid Nabi 16 Sep). Ditandai teks <code className="font-bold">LIBUR</code> dan latar merah.
                  </li>
                </ul>
              </div>

              {/* Zona 3: Rekapitulasi */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black">
                    AG-AP
                  </span>
                  <span>Zona 3: Ringkasan Hari Kerja &amp; Izin</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>
                    <strong className="text-slate-900">Kolom AG (HK):</strong> Hari Kerja riil yang dihadiri = Total Hari Kerja - Izin Sakit Tanpa Surat (I) - Alpha (A).
                  </li>
                  <li>
                    <strong className="text-slate-900">Kolom AH s/d AP:</strong> Akumulasi jumlah kejadian per kategori: <code className="font-mono text-slate-800">HIP</code>, <code className="font-mono text-slate-800">HIS</code>, <code className="font-mono text-slate-800">I</code>, <code className="font-mono text-slate-800">IL</code>, <code className="font-mono text-slate-800">P</code>, <code className="font-mono text-slate-800">OTL</code>, <code className="font-mono text-slate-800">AL</code>, <code className="font-mono text-slate-800">DL</code>, <code className="font-mono text-slate-800">A</code>.
                  </li>
                </ul>
              </div>

              {/* Zona 4: Penilaian Kedisiplinan */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                    AQ-AU
                  </span>
                  <span>Zona 4: Penilaian Skor Kedisiplinan</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li>
                    <strong className="text-slate-900">Kolom AQ (X):</strong> Total poin perolehan kehadiran riil pegawai setelah dikurangi sanksi poin.
                  </li>
                  <li>
                    <strong className="text-slate-900">Kolom AR (Y):</strong> Poin maksimal jika hadir penuh 100% (2 poin per hari kerja).
                  </li>
                  <li>
                    <strong className="text-slate-900">Kolom AS (%):</strong> Persentase kehadiran = (X / Y) × 100%.
                  </li>
                  <li>
                    <strong className="text-slate-900">Kolom AT (Score 1):</strong> Skala nilai 1 s/d 10 resmi SMANSS.
                  </li>
                  <li>
                    <strong className="text-slate-900">Kolom AU (Score 2 / Kedisiplinan):</strong> Bobot 20% dari Score 1 (skala 0.0 s/d 2.0).
                  </li>
                </ul>
              </div>
            </div>

            {/* Header Structure Explanation */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Format Khusus Baris Header Tabel (Baris 11 s/d 16):</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                Untuk menjamin tampilan laporan tetap rapi dan tidak terpotong garis horizontal, <strong>Baris 11 dan 12 digabungkan (merge)</strong> pada seluruh kolom hari (C s/d AF), kolom NO (A11:A15), kolom NAME (B11:B15), serta header REKAPITULASI (AG11:AP12) dan NILAI KEDISIPLINAN (AQ11:AU12). Seluruh garis kisi-kisi (border) menggunakan warna hitam standar yang jelas terbaca di semua versi Microsoft Excel.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: GLOSARIUM KODE STATUS & BOBOT */}
        {activeTab === 'codes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Daftar Kode Status Kehadiran, Jam Operasional, &amp; Bobot Penalti
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Aturan standar jam kerja operasional SMANSS adalah <strong>07:30 s/d 16:00 WIB</strong> (atau sesuai shift terjadwal) dengan minimal 2 kali tap (datang &amp; pulang).
              </p>
            </div>

            {/* Table of Status Codes */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Status Resmi</th>
                    <th className="p-3">Target Kolom</th>
                    <th className="p-3">Ketentuan Jam / Bukti</th>
                    <th className="p-3">Bobot Poin</th>
                    <th className="p-3">Pengaruh ke HK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                    <td className="p-3 font-bold text-emerald-700">HADIR</td>
                    <td className="p-3 font-semibold text-slate-900">Hadir Penuh (Tepat Waktu)</td>
                    <td className="p-3 font-mono text-slate-600">-</td>
                    <td className="p-3 text-slate-600">Masuk &le; 07:30 &amp; Pulang &ge; 16:00 (Tap &ge; 2)</td>
                    <td className="p-3 font-bold text-emerald-600">+2 Poin Penuh</td>
                    <td className="p-3 text-emerald-700 font-semibold">Dihitung Penuh (1 Hari)</td>
                  </tr>
                  <tr className="bg-rose-50/40 hover:bg-rose-50/70 transition-colors">
                    <td className="p-3 font-bold text-rose-700">A</td>
                    <td className="p-3 font-semibold text-slate-900">Without Info (Alpha)</td>
                    <td className="p-3 font-mono text-slate-600">AP</td>
                    <td className="p-3 text-slate-600">Tidak hadir tanpa keterangan / belum diverifikasi</td>
                    <td className="p-3 font-bold text-rose-600">-3 Poin (Denda Berat)</td>
                    <td className="p-3 text-rose-700 font-semibold">Mengurangi HK (-1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIP</td>
                    <td className="p-3 font-semibold text-slate-900">Hak Izin Pagi (Terlambat)</td>
                    <td className="p-3 font-mono text-slate-600">AH</td>
                    <td className="p-3 text-slate-600">Datang setelah 07:30 dengan surat izin resmi</td>
                    <td className="p-3 font-bold text-amber-600">-1 Poin (Pengurang Ringan)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIS</td>
                    <td className="p-3 font-semibold text-slate-900">Hak Izin Siang (Pulang Cepat)</td>
                    <td className="p-3 font-mono text-slate-600">AI</td>
                    <td className="p-3 text-slate-600">Pulang sebelum 16:00 dengan surat izin resmi</td>
                    <td className="p-3 font-bold text-amber-600">-1 Poin (Pengurang Ringan)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-amber-700">I</td>
                    <td className="p-3 font-semibold text-slate-900">Ill (No Letter / Tanpa Surat)</td>
                    <td className="p-3 font-mono text-slate-600">AJ</td>
                    <td className="p-3 text-slate-600">Sakit tetapi tidak melampirkan surat dokter</td>
                    <td className="p-3 font-bold text-amber-600">-1 Poin (Pengurang Ringan)</td>
                    <td className="p-3 text-rose-700 font-semibold">Mengurangi HK (-1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">IL</td>
                    <td className="p-3 font-semibold text-slate-900">Ill (With Letter / Surat Dokter)</td>
                    <td className="p-3 font-mono text-slate-600">AK</td>
                    <td className="p-3 text-slate-600">Melampirkan surat keterangan dokter resmi</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">PM / P</td>
                    <td className="p-3 font-semibold text-slate-900">Permission (Izin Resmi)</td>
                    <td className="p-3 font-mono text-slate-600">AL</td>
                    <td className="p-3 text-slate-600">Izin tertulis yang disetujui Kepala Sekolah/TU</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">OTL</td>
                    <td className="p-3 font-semibold text-slate-900">Other Leave (Cuti Lainnya)</td>
                    <td className="p-3 font-mono text-slate-600">AM</td>
                    <td className="p-3 text-slate-600">Cuti melahirkan, cuti alasan penting, dsb.</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">AL</td>
                    <td className="p-3 font-semibold text-slate-900">Annual Leave (Cuti Tahunan)</td>
                    <td className="p-3 font-mono text-slate-600">AN</td>
                    <td className="p-3 text-slate-600">Cuti tahunan yang telah diajukan &amp; disetujui</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-blue-700">DL</td>
                    <td className="p-3 font-semibold text-slate-900">Dinas Luar (Tugas Kedinasan)</td>
                    <td className="p-3 font-mono text-slate-600">AO</td>
                    <td className="p-3 text-slate-600">Disertai Surat Tugas (ST) resmi luar sekolah</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="bg-slate-50/80 hover:bg-slate-100 transition-colors">
                    <td className="p-3 font-bold text-slate-500">OFF / LIBUR</td>
                    <td className="p-3 font-semibold text-slate-700">Libur Shift / Libur Nasional</td>
                    <td className="p-3 font-mono text-slate-500">-</td>
                    <td className="p-3 text-slate-500">Jadwal bebas tugas atau tanggal merah kalender</td>
                    <td className="p-3 font-bold text-slate-500">Tidak dihitung hari kerja</td>
                    <td className="p-3 text-slate-500">Bukan pengurang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RUMUS & RUBRIK NILAI */}
        {activeTab === 'formulas' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-600" />
                Rumus Matematis &amp; Rubrik Penilaian Kedisiplinan
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Perhitungan nilai dieksekusi secara presisi di level sistem untuk menghasilkan skor murni tanpa formula Excel yang rentan korupsi.
              </p>
            </div>

            {/* Step-by-Step Formula Boxes */}
            <div className="space-y-4">
              {/* Formula 1: HK */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Langkah 1: Hari Kerja Efektif Yang Dihadiri (HK)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Kolom AG
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-blue-900 font-bold">
                  HK = Total_Hari_Kerja_Bulan - (Jumlah_I) - (Jumlah_A)
                </div>
                <p className="text-xs text-slate-600">
                  Artinya: Hari kerja hanya berkurang jika pegawai tidak hadir tanpa izin resmi (Alpha) atau sakit tanpa melampirkan surat dokter (I).
                </p>
              </div>

              {/* Formula 2: Nilai X */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Langkah 2: Skor Nilai Perolehan Riil (Nilai X)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Kolom AQ
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-blue-900 font-bold">
                  X = (HK &times; 2) - (HIP &times; 1) - (HIS &times; 1) - (I &times; 1) - (A &times; 3)
                </div>
                <p className="text-xs text-slate-600">
                  Tiap hari kerja bernilai 2 poin. Denda pemotongan poin: Hak Izin Pagi (-1), Hak Izin Siang (-1), Sakit tanpa surat (-1), dan Alpha (-3).
                </p>
              </div>

              {/* Formula 3: Nilai Y & Persentase */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Langkah 3: Poin Maksimal (Y) &amp; Persentase Kehadiran (%)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    Kolom AR &amp; AS
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-blue-900 font-bold">
                    Y = Total_Hari_Kerja_Bulan &times; 2
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-emerald-900 font-bold">
                    Persentase (%) = (X / Y) &times; 100%
                  </div>
                </div>
              </div>

              {/* Rubric Score 1 & Score 2 */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    Langkah 4: Konversi SCORE 1 (Skala 1 s/d 10) &amp; SCORE 2 / KEDISIPLINAN (Bobot 20%)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800">
                    Kolom AT &amp; AU
                  </span>
                </div>
                <p className="text-xs text-purple-950">
                  Persentase kehadiran dikonversi ke dalam skala nilai 1 s/d 10 (Score 1), lalu dikalikan bobot kedisiplinan 20% untuk memperoleh Score Kedisiplinan (skala 0.0 s/d 2.0):
                </p>

                {/* Conversion Matrix Table */}
                <div className="border border-purple-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-purple-100 text-purple-900 font-bold border-b border-purple-200">
                        <th className="p-2.5">Rentang Persentase</th>
                        <th className="p-2.5">Kualifikasi</th>
                        <th className="p-2.5 text-center">Score 1 (Skala 10)</th>
                        <th className="p-2.5 text-center">Score 2 / Kedisiplinan (Bobot 20%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      <tr className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-emerald-700">100.0%</td>
                        <td className="p-2.5 font-semibold text-slate-800">Sempurna / Sangat Baik</td>
                        <td className="p-2.5 text-center font-bold text-slate-900 bg-purple-50/30">10</td>
                        <td className="p-2.5 text-center font-black text-purple-700 bg-purple-50">2.0</td>
                      </tr>
                      <tr className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-slate-700">90.0% s/d 99.9%</td>
                        <td className="p-2.5 font-semibold text-slate-800">Sangat Baik</td>
                        <td className="p-2.5 text-center font-bold text-slate-900 bg-purple-50/30">9</td>
                        <td className="p-2.5 text-center font-black text-purple-700 bg-purple-50">1.8</td>
                      </tr>
                      <tr className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-slate-700">80.0% s/d 89.9%</td>
                        <td className="p-2.5 font-semibold text-slate-800">Baik</td>
                        <td className="p-2.5 text-center font-bold text-slate-900 bg-purple-50/30">8</td>
                        <td className="p-2.5 text-center font-black text-purple-700 bg-purple-50">1.6</td>
                      </tr>
                      <tr className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-slate-700">65.0% s/d 79.9%</td>
                        <td className="p-2.5 font-semibold text-slate-800">Cukup</td>
                        <td className="p-2.5 text-center font-bold text-slate-900 bg-purple-50/30">7</td>
                        <td className="p-2.5 text-center font-black text-purple-700 bg-purple-50">1.4</td>
                      </tr>
                      <tr className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-slate-700">50.0% s/d 64.9%</td>
                        <td className="p-2.5 font-semibold text-slate-800">Kurang</td>
                        <td className="p-2.5 text-center font-bold text-slate-900 bg-purple-50/30">6</td>
                        <td className="p-2.5 text-center font-black text-purple-700 bg-purple-50">1.2</td>
                      </tr>
                      <tr className="hover:bg-purple-50/50">
                        <td className="p-2.5 font-bold text-rose-700">&lt; 50.0%</td>
                        <td className="p-2.5 font-semibold text-slate-800">Sangat Kurang</td>
                        <td className="p-2.5 text-center font-bold text-slate-900 bg-purple-50/30">5</td>
                        <td className="p-2.5 text-center font-black text-purple-700 bg-purple-50">1.0</td>
                      </tr>
                      <tr className="hover:bg-purple-50/50 bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-400">0.0% / Tanpa Kehadiran</td>
                        <td className="p-2.5 font-semibold text-slate-500">Nirkehadiran</td>
                        <td className="p-2.5 text-center font-bold text-slate-500 bg-purple-50/30">0</td>
                        <td className="p-2.5 text-center font-black text-slate-500 bg-purple-50">0.0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KALKULATOR SIMULASI LIVE */}
        {activeTab === 'simulator' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                Kalkulator Simulasi Perhitungan Presensi Interaktif
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ubah parameter input di bawah ini untuk melihat bagaimana rumus SMANSS menghitung HK, Nilai X, Persentase, Score 1, dan Score 2 secara real-time:
              </p>
            </div>

            {/* Two Column Layout: Inputs (Left) & Live Results (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Form */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Parameter Input Pegawai
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Total Hari Kerja Efektif Bulan Ini
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={calcWorkingDays}
                      onChange={(e) => setCalcWorkingDays(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jumlah Hari Alpha / Tanpa Keterangan (A) &mdash; <span className="text-rose-600 font-bold">Denda -3 Poin</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={calcWorkingDays}
                      value={calcAlpha}
                      onChange={(e) => setCalcAlpha(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Hak Izin Pagi (HIP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcHIP}
                        onChange={(e) => setCalcHIP(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Hak Izin Siang (HIS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcHIS}
                        onChange={(e) => setCalcHIS(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sakit Tanpa Surat Dokter (I) &mdash; <span className="text-amber-600 font-bold">Denda -1 Poin</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcI}
                      onChange={(e) => setCalcI(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Live Output Cards */}
              <div className="p-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 space-y-4">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Hasil Perhitungan Otomatis</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    Live Result
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Hari Kerja (HK)</span>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{calcHK} <span className="text-xs font-normal text-slate-500">Hari</span></div>
                    <span className="text-[10px] text-slate-400">Total {calcWorkingDays} - {calcI} - {calcAlpha}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Skor Nilai X</span>
                    <div className="text-xl font-black text-blue-700 mt-0.5">{calcX} <span className="text-xs font-normal text-slate-500">Poin</span></div>
                    <span className="text-[10px] text-slate-400">({calcHK}&times;2) - denda</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Poin Maksimal (Y)</span>
                    <div className="text-xl font-black text-slate-700 mt-0.5">{calcY} <span className="text-xs font-normal text-slate-500">Poin</span></div>
                    <span className="text-[10px] text-slate-400">{calcWorkingDays} &times; 2</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Persentase (%)</span>
                    <div className="text-xl font-black text-emerald-600 mt-0.5">{calcPct.toFixed(1)}%</div>
                    <span className="text-[10px] text-slate-400">({calcX} / {calcY}) &times; 100</span>
                  </div>
                </div>

                {/* Grand Score Display */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                        SCORE 1 (Skala Nilai 1 s/d 10)
                      </span>
                      <div className="text-3xl font-black mt-0.5">{calcScore1}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        SCORE 2 (Bobot 20%)
                      </span>
                      <div className="text-3xl font-black mt-0.5 text-amber-200">{calcScore2.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/20 text-[11px] text-blue-100 flex items-center justify-between">
                    <span>Target Nilai SKP: <strong>Score Kedisiplinan = {calcScore2.toFixed(1)}</strong></span>
                    <span>Nilai tidak kelebihan digit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTOH KASUS RIIL */}
        {activeTab === 'cases' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Studi Kasus &amp; Contoh Perhitungan Riil Pegawai SMANSS
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Berikut adalah simulasi nyata pada bulan dengan <strong>21 Hari Kerja Efektif</strong> (seperti September 2026):
              </p>
            </div>

            <div className="space-y-4">
              {/* Kasus 1: Sempurna 100% */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs sm:text-sm">
                    Kasus 1: Pegawai Hadir Penuh 100% (Contoh: Eko Valery Freddie)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                    100.0%
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Total Hari Kerja: 21 hari. Hadir tepat waktu di seluruh hari kerja tanpa Alpha maupun izin terlambat.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 font-mono text-xs text-slate-800 space-y-1">
                  <div>&bull; HK = 21 - 0 = <strong>21 Hari</strong></div>
                  <div>&bull; Nilai X = (21 &times; 2) - 0 = <strong>42 Poin</strong></div>
                  <div>&bull; Nilai Y = 21 &times; 2 = <strong>42 Poin</strong></div>
                  <div>&bull; Persentase = (42 / 42) &times; 100% = <strong>100.0%</strong></div>
                  <div>&bull; <strong>SCORE 1 = 10</strong> | <strong>SCORE 2 / KEDISIPLINAN = 2.0</strong></div>
                </div>
              </div>

              {/* Kasus 2: Ada Izin Pagi & Siang */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-xs sm:text-sm">
                    Kasus 2: Pegawai dengan Hak Izin Pagi (HIP) &amp; Izin Siang (HIS)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    88.1%
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Total Hari Kerja: 21 hari. Masuk terlambat 2 kali (2 HIP) dan pulang cepat 1 kali (1 HIS). Tidak ada Alpha.
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-blue-200 font-mono text-xs text-slate-800 space-y-1">
                  <div>&bull; HK = 21 - 0 = <strong>21 Hari</strong> (tetap dihitung hadir penuh)</div>
                  <div>&bull; Nilai X = (21 &times; 2) - (2 HIP &times; 1) - (1 HIS &times; 1) = 42 - 3 = <strong>39 Poin</strong></div>
                  <div>&bull; Nilai Y = 21 &times; 2 = <strong>42 Poin</strong></div>
                  <div>&bull; Persentase = (39 / 42) &times; 100% = <strong>92.8%</strong></div>
                  <div>&bull; <strong>SCORE 1 = 9</strong> | <strong>SCORE 2 / KEDISIPLINAN = 1.8</strong></div>
                </div>
              </div>

              {/* Kasus 3: Ada 1 Hari Alpha */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs sm:text-sm">
                    Kasus 3: Pegawai dengan 1 Hari Alpha (Without Info)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-600 text-white">
                    88.1%
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Total Hari Kerja: 21 hari. Mengalami 1 hari Alpha (A = 1).
                </p>
                <div className="p-2.5 rounded-lg bg-white border border-amber-200 font-mono text-xs text-slate-800 space-y-1">
                  <div>&bull; HK = 21 - 1 = <strong>20 Hari</strong> (Hari kerja berkurang 1 hari)</div>
                  <div>&bull; Nilai X = (20 &times; 2) - (1 Alpha &times; 3) = 40 - 3 = <strong>37 Poin</strong></div>
                  <div>&bull; Nilai Y = 21 &times; 2 = <strong>42 Poin</strong></div>
                  <div>&bull; Persentase = (37 / 42) &times; 100% = <strong>88.1%</strong></div>
                  <div>&bull; <strong>SCORE 1 = 8</strong> | <strong>SCORE 2 / KEDISIPLINAN = 1.6</strong></div>
                </div>
              </div>

              {/* Kasus 4: Sakit Surat Dokter (IL) vs Tanpa Surat (I) */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-xs sm:text-sm">
                    Kasus 4: Perbedaan Sakit Surat Dokter (IL) vs Tanpa Surat (I)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-600 text-white">
                    Perbandingan
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Jika pegawai sakit 2 hari dengan surat dokter (<code className="font-bold text-blue-700">IL</code>), poin tidak dipotong (X = 42, Persentase = 100%, Score 1 = 10, Score 2 = 2.0). Namun jika sakit tanpa surat (<code className="font-bold text-amber-700">I</code>), maka HK berkurang 2 hari dan poin X dipotong 2 poin (X = 36, Persentase = 85.7%, Score 1 = 8, Score 2 = 1.6).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Modal */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500">
          AutoAbsen SMANSS &bull; Sistem Otomasi Rekapitulasi Presensi Terintegrasi
        </div>
        {!isEmbeddedView && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
          >
            Tutup Panduan
          </button>
        )}
      </div>
    </div>
  );

  if (isEmbeddedView) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl">{content}</div>
    </div>
  );
};
