'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  CheckCircle2,
  Percent,
  Calculator,
  FileSpreadsheet,
  Layers,
  Printer,
  Info,
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

  // Render Inner Content Tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'anatomy':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Laporan rekapitulasi resmi SMAN Sumatera Selatan terbagi menjadi 4 zona utama yang saling terintegrasi (Kolom A s/d AU):
              </p>
              <div className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                Standar Kolom Resmi Excel SMANSS
              </div>
            </div>

            {/* Unified Clean Table: Struktur & Pembagian Kolom */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-44">Zona / Bagian</th>
                    <th className="p-3 font-bold text-slate-700 w-28">Kolom Excel</th>
                    <th className="p-3 font-bold text-slate-700 w-36">Nama Header</th>
                    <th className="p-3 font-bold text-slate-700">Fungsi, Maksud &amp; Definisi Kolom</th>
                    <th className="p-3 font-bold text-slate-700 w-72">Aturan Pengisian &amp; Standar Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Zona 1: Identitas */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={2} className="p-3 font-bold text-blue-700 align-top bg-blue-50/20 border-r border-slate-100">
                      Zona 1: Identitas Pegawai
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom A</td>
                    <td className="p-3 font-bold text-slate-900">NO</td>
                    <td className="p-3 text-slate-600">Nomor urut daftar pegawai resmi (1 s/d total pegawai aktif).</td>
                    <td className="p-3 text-slate-500">Rata tengah, angka bulat urut tanpa spasi tambahan.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom B</td>
                    <td className="p-3 font-bold text-slate-900">NAME</td>
                    <td className="p-3 text-slate-600">Nama lengkap pegawai beserta gelar dinas resmi yang sah.</td>
                    <td className="p-3 text-slate-500">Rata kiri, indentasi 1 spasi, huruf kapital gelar dinas.</td>
                  </tr>

                  {/* Zona 2: Presensi Harian */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={3} className="p-3 font-bold text-emerald-700 align-top bg-emerald-50/20 border-r border-slate-100">
                      Zona 2: Presensi Harian (Tgl 1 s/d 31)
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom C s/d AF</td>
                    <td className="p-3 font-bold text-slate-900">Hari Kerja Normal</td>
                    <td className="p-3 text-slate-600">
                      Pencatatan presensi harian pegawai (Senin–Jumat). Baris 11 &amp; 12 digabungkan (merge) rapi tanpa garis terpotong.
                    </td>
                    <td className="p-3 text-slate-500">
                      Kosong bersih jika Hadir Tepat Waktu; Berisi kode status jika Izin/Sakit/Alpha.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom C s/d AF</td>
                    <td className="p-3 font-bold text-slate-900">Akhir Pekan (Sabtu/Minggu)</td>
                    <td className="p-3 text-slate-600">Hari libur akhir pekan otomatis kalender.</td>
                    <td className="p-3 text-slate-500">
                      Diwarnai merah pekat (<code className="font-mono text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded">#FFFF0000</code>) tanpa potongan poin.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom C s/d AF</td>
                    <td className="p-3 font-bold text-slate-900">Libur Resmi Sekolah / Nasional</td>
                    <td className="p-3 text-slate-600">Hari libur resmi yang ditetapkan sekolah/pemerintah (tersinkron database).</td>
                    <td className="p-3 text-slate-500">
                      Ditandai teks <strong>LIBUR</strong> berlatar merah (<code className="font-mono text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded">#FFFF0000</code>).
                    </td>
                  </tr>

                  {/* Zona 3: Ringkasan Hari Kerja & Izin */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={10} className="p-3 font-bold text-amber-700 align-top bg-amber-50/20 border-r border-slate-100">
                      Zona 3: Ringkasan Hari Kerja &amp; Izin
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AG</td>
                    <td className="p-3 font-bold text-slate-900">HK (Hari Kerja)</td>
                    <td className="p-3 text-slate-600">Total hari kerja efektif yang benar-benar dihadiri pegawai riil.</td>
                    <td className="p-3 text-slate-500">
                      <code className="font-mono font-bold text-slate-800">HK = Total Hari Kerja - I - A</code>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AH</td>
                    <td className="p-3 font-bold text-slate-900">HIP</td>
                    <td className="p-3 text-slate-600">Hak Izin Pagi: Jumlah kejadian hadir terlambat (&gt; 07:30) dengan surat izin.</td>
                    <td className="p-3 text-slate-500">Denda -1 Poin pada Skor X. Hari kerja (HK) tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AI</td>
                    <td className="p-3 font-bold text-slate-900">HIS</td>
                    <td className="p-3 text-slate-600">Hak Izin Siang: Jumlah kejadian pulang cepat (&lt; 16:00) dengan surat izin.</td>
                    <td className="p-3 text-slate-500">Denda -1 Poin pada Skor X. Hari kerja (HK) tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AJ</td>
                    <td className="p-3 font-bold text-slate-900">I (Ill / Sakit)</td>
                    <td className="p-3 text-slate-600">Sakit tanpa melampirkan surat dokter yang sah.</td>
                    <td className="p-3 text-slate-500">Denda -1 Poin pada Skor X DAN mengurangi HK (-1 Hari).</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AK</td>
                    <td className="p-3 font-bold text-slate-900">IL</td>
                    <td className="p-3 text-slate-600">Sakit dengan melampirkan surat keterangan dokter resmi.</td>
                    <td className="p-3 text-slate-500">Bebas denda (0 denda), HK tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AL</td>
                    <td className="p-3 font-bold text-slate-900">PM / P</td>
                    <td className="p-3 text-slate-600">Permission: Izin keperluan resmi yang disetujui Kepala Sekolah.</td>
                    <td className="p-3 text-slate-500">Bebas denda (0 denda), HK tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AM</td>
                    <td className="p-3 font-bold text-slate-900">OTL</td>
                    <td className="p-3 text-slate-600">Other Leave: Cuti lainnya (cuti melahirkan, cuti alasan penting, dsb).</td>
                    <td className="p-3 text-slate-500">Bebas denda (0 denda), HK tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AN</td>
                    <td className="p-3 font-bold text-slate-900">AL</td>
                    <td className="p-3 text-slate-600">Annual Leave: Cuti tahunan resmi pegawai yang telah disetujui.</td>
                    <td className="p-3 text-slate-500">Bebas denda (0 denda), HK tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AO</td>
                    <td className="p-3 font-bold text-slate-900">DL</td>
                    <td className="p-3 text-slate-600">Dinas Luar: Tugas kedinasan di luar sekolah berlandaskan Surat Tugas (ST).</td>
                    <td className="p-3 text-slate-500">Bebas denda (0 denda), HK tidak berkurang.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AP</td>
                    <td className="p-3 font-bold text-slate-900">A (Alpha)</td>
                    <td className="p-3 text-slate-600">Without Info: Tidak hadir tanpa keterangan / belum melampirkan bukti.</td>
                    <td className="p-3 text-slate-500">Denda berat -3 Poin pada Skor X DAN mengurangi HK (-1 Hari).</td>
                  </tr>

                  {/* Zona 4: Penilaian Kedisiplinan */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={5} className="p-3 font-bold text-purple-700 align-top bg-purple-50/20 border-r border-slate-100">
                      Zona 4: Penilaian Kedisiplinan
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AQ</td>
                    <td className="p-3 font-bold text-slate-900">Nilai X</td>
                    <td className="p-3 text-slate-600">Total skor poin kehadiran riil pegawai setelah dikurangi seluruh denda.</td>
                    <td className="p-3 text-slate-500">
                      <code className="font-mono font-bold text-slate-800">X = (HK × 2) - denda (HIP+HIS+I+A×3)</code>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AR</td>
                    <td className="p-3 font-bold text-slate-900">Nilai Y</td>
                    <td className="p-3 text-slate-600">Poin maksimal jika pegawai hadir penuh 100% tanpa pelanggaran.</td>
                    <td className="p-3 text-slate-500">
                      <code className="font-mono font-bold text-slate-800">Y = Total Hari Kerja Efektif × 2 Poin</code>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AS</td>
                    <td className="p-3 font-bold text-slate-900">Persentase (%)</td>
                    <td className="p-3 text-slate-600">Rasio perolehan poin riil terhadap poin maksimal.</td>
                    <td className="p-3 text-slate-500">
                      <code className="font-mono font-bold text-slate-800">% = (X / Y) × 100%</code>, dibulatkan 1 desimal.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AT</td>
                    <td className="p-3 font-bold text-slate-900">Score 1</td>
                    <td className="p-3 text-slate-600">Skor nilai skala 1 s/d 10 resmi SMANSS berdasarkan rubrik persentase.</td>
                    <td className="p-3 text-slate-500">
                      Nilai bilangan bulat standar: 10, 9, 8, 7, 6, 5, atau 0.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-800">Kolom AU</td>
                    <td className="p-3 font-bold text-slate-900">Score 2 (Kedisiplinan)</td>
                    <td className="p-3 text-slate-600">Nilai akhir indikator kedisiplinan kerja untuk pengisian SKP (bobot 20%).</td>
                    <td className="p-3 text-slate-500">
                      Skala 0.0 s/d 2.0: 2.0, 1.8, 1.6, 1.4, 1.2, 1.0, atau 0.0.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note Strip */}
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Standar Format Baris Header Excel (Baris 11 s/d 16):</strong> Baris 11 dan 12 digabungkan (merge) pada seluruh kolom tanggal (C s/d AF), kolom NO (A11:A15), kolom NAME (B11:B15), serta header REKAPITULASI (AG11:AP12) dan NILAI KEDISIPLINAN (AQ11:AU12). Seluruh garis kisi-kisi (border) menggunakan warna hitam standar sehingga rapi di semua versi Microsoft Excel.
              </div>
            </div>
          </div>
        );

      case 'codes':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Aturan standar jam kerja operasional SMANSS adalah <strong>07:30 s/d 16:00 WIB</strong> (atau sesuai shift terjadwal) dengan minimal 2 kali tap (datang &amp; pulang):
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                Daftar Lengkap Kode Status Kehadiran
              </div>
            </div>

            {/* Table of Status Codes */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-24">Kode</th>
                    <th className="p-3 font-bold text-slate-700 w-56">Nama Status Resmi</th>
                    <th className="p-3 font-bold text-slate-700 w-28 text-center">Target Kolom</th>
                    <th className="p-3 font-bold text-slate-700">Ketentuan Jam / Bukti</th>
                    <th className="p-3 font-bold text-slate-700 w-44">Bobot Denda / Poin</th>
                    <th className="p-3 font-bold text-slate-700 w-44">Pengaruh ke Hari Kerja (HK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-emerald-700">HADIR</td>
                    <td className="p-3 font-semibold text-slate-900">Hadir Penuh (Tepat Waktu)</td>
                    <td className="p-3 font-mono text-center text-slate-400">-</td>
                    <td className="p-3 text-slate-600">Masuk &le; 07:30 &amp; Pulang &ge; 16:00 (Tap &ge; 2)</td>
                    <td className="p-3 font-bold text-emerald-600">+2 Poin Penuh</td>
                    <td className="p-3 text-emerald-700 font-semibold">Dihitung Penuh (1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-rose-700">A</td>
                    <td className="p-3 font-semibold text-slate-900">Without Info (Alpha)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AP</td>
                    <td className="p-3 text-slate-600">Tidak hadir tanpa keterangan / belum melampirkan bukti</td>
                    <td className="p-3 font-bold text-rose-600">-3 Poin (Denda Berat)</td>
                    <td className="p-3 text-rose-700 font-semibold">Mengurangi HK (-1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIP</td>
                    <td className="p-3 font-semibold text-slate-900">Hak Izin Pagi (Terlambat)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AH</td>
                    <td className="p-3 text-slate-600">Datang setelah 07:30 dengan surat izin resmi</td>
                    <td className="p-3 font-bold text-amber-600">-1 Poin (Pengurang Ringan)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIS</td>
                    <td className="p-3 font-semibold text-slate-900">Hak Izin Siang (Pulang Cepat)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AI</td>
                    <td className="p-3 text-slate-600">Pulang sebelum 16:00 dengan surat izin resmi</td>
                    <td className="p-3 font-bold text-amber-600">-1 Poin (Pengurang Ringan)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">I</td>
                    <td className="p-3 font-semibold text-slate-900">Ill (No Letter / Tanpa Surat)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AJ</td>
                    <td className="p-3 text-slate-600">Sakit tetapi tidak melampirkan surat dokter resmi</td>
                    <td className="p-3 font-bold text-amber-600">-1 Poin (Pengurang Ringan)</td>
                    <td className="p-3 text-rose-700 font-semibold">Mengurangi HK (-1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">IL</td>
                    <td className="p-3 font-semibold text-slate-900">Ill (With Letter / Surat Dokter)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AK</td>
                    <td className="p-3 text-slate-600">Melampirkan surat keterangan dokter resmi</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">PM / P</td>
                    <td className="p-3 font-semibold text-slate-900">Permission (Izin Resmi)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AL</td>
                    <td className="p-3 text-slate-600">Izin tertulis yang disetujui Kepala Sekolah/TU</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">OTL</td>
                    <td className="p-3 font-semibold text-slate-900">Other Leave (Cuti Lainnya)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AM</td>
                    <td className="p-3 text-slate-600">Cuti melahirkan, cuti alasan penting, dsb.</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">AL</td>
                    <td className="p-3 font-semibold text-slate-900">Annual Leave (Cuti Tahunan)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AN</td>
                    <td className="p-3 text-slate-600">Cuti tahunan yang telah diajukan &amp; disetujui</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">DL</td>
                    <td className="p-3 font-semibold text-slate-900">Dinas Luar (Tugas Kedinasan)</td>
                    <td className="p-3 font-mono text-center font-bold text-slate-700">AO</td>
                    <td className="p-3 text-slate-600">Disertai Surat Tugas (ST) resmi luar sekolah</td>
                    <td className="p-3 font-bold text-blue-600">Bebas Pengurang (0)</td>
                    <td className="p-3 text-slate-600">Tetap terhitung HK</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-500">OFF / LIBUR</td>
                    <td className="p-3 font-semibold text-slate-700">Libur Shift / Libur Nasional</td>
                    <td className="p-3 font-mono text-center text-slate-400">-</td>
                    <td className="p-3 text-slate-500">Jadwal bebas tugas atau tanggal merah kalender</td>
                    <td className="p-3 font-bold text-slate-500">Tidak dihitung hari kerja</td>
                    <td className="p-3 text-slate-500">Bukan pengurang</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'formulas':
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-500">
                Tahapan perhitungan matematis presensi pegawai dieksekusi secara otomatis dan akurat melalui 4 langkah terstruktur:
              </p>
            </div>

            {/* Bagian 1: Tabel 4 Langkah Rumus Matematis */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-28">Tahapan</th>
                    <th className="p-3 font-bold text-slate-700 w-44">Indikator &amp; Kolom Excel</th>
                    <th className="p-3 font-bold text-slate-700 w-80">Rumus Matematis</th>
                    <th className="p-3 font-bold text-slate-700">Penjelasan Logika Perhitungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 1</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Hari Kerja Efektif (HK)<br />
                      <span className="font-mono text-slate-400 text-[11px]">Kolom AG</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700 bg-slate-50/50">
                      HK = Hari_Kerja_Bulan - I - A
                    </td>
                    <td className="p-3 text-slate-600">
                      Hari kerja pegawai hanya berkurang jika tidak hadir tanpa izin resmi (Alpha) atau sakit tanpa surat dokter (I).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 2</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Nilai Perolehan Riil (Nilai X)<br />
                      <span className="font-mono text-slate-400 text-[11px]">Kolom AQ</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700 bg-slate-50/50">
                      X = (HK &times; 2) - (HIP &times; 1) - (HIS &times; 1) - (I &times; 1) - (A &times; 3)
                    </td>
                    <td className="p-3 text-slate-600">
                      Tiap hari kerja bernilai 2 poin. Denda poin: HIP (-1), HIS (-1), Sakit tanpa surat (-1), dan Alpha (-3).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 3</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Poin Maksimal &amp; Persentase<br />
                      <span className="font-mono text-slate-400 text-[11px]">Kolom AR &amp; AS</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700 bg-slate-50/50">
                      Y = Hari_Kerja_Bulan &times; 2<br />
                      % = (X / Y) &times; 100%
                    </td>
                    <td className="p-3 text-slate-600">
                      Rasio perolehan poin riil (X) terhadap poin maksimal sempurna (Y), dibulatkan dengan presisi 1 angka desimal.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 4</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Score 1 &amp; Score 2 (Kedisiplinan)<br />
                      <span className="font-mono text-slate-400 text-[11px]">Kolom AT &amp; AU</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700 bg-slate-50/50">
                      Score 1 = Konversi Skala 1 s/d 10<br />
                      Score 2 = Score 1 &times; 20% (Skala 0.0 s/d 2.0)
                    </td>
                    <td className="p-3 text-slate-600">
                      Score 1 berskala 1–10 standar resmi SMANSS. Score 2 dihitung dengan bobot 20% (maksimal 2.0) untuk pengisian SKP pegawai.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bagian 2: Tabel Rubrik Konversi Nilai Resmi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Rubrik Resmi Konversi Persentase ke Score 1 &amp; Score 2 (Bobot 20%)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Standar Sasaran Kinerja Pegawai (SKP) SMANSS
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 w-44">Rentang Persentase</th>
                      <th className="p-3 font-bold text-slate-700">Kualifikasi Disiplin</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-36">Score 1 (Skala 1 s/d 10)</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-48">Score 2 / Kedisiplinan (Bobot 20%)</th>
                      <th className="p-3 font-bold text-slate-700">Keterangan Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-emerald-700">100.0%</td>
                      <td className="p-3 font-semibold text-slate-800">Sempurna / Sangat Baik</td>
                      <td className="p-3 text-center font-black text-slate-900">10</td>
                      <td className="p-3 text-center font-black text-blue-700">2.0</td>
                      <td className="p-3 text-slate-500">Hadir penuh tepat waktu sepanjang bulan</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">90.0% s/d 99.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Sangat Baik</td>
                      <td className="p-3 text-center font-black text-slate-900">9</td>
                      <td className="p-3 text-center font-black text-blue-700">1.8</td>
                      <td className="p-3 text-slate-500">Toleransi maksimal 1-2 izin dinas ringan</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">80.0% s/d 89.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Baik</td>
                      <td className="p-3 text-center font-black text-slate-900">8</td>
                      <td className="p-3 text-center font-black text-blue-700">1.6</td>
                      <td className="p-3 text-slate-500">Kinerja kehadiran memenuhi standar</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">65.0% s/d 79.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Cukup</td>
                      <td className="p-3 text-center font-black text-slate-900">7</td>
                      <td className="p-3 text-center font-black text-blue-700">1.4</td>
                      <td className="p-3 text-slate-500">Perlu ditingkatkan ketepatan waktu datang/pulang</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">50.0% s/d 64.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Kurang</td>
                      <td className="p-3 text-center font-black text-slate-900">6</td>
                      <td className="p-3 text-center font-black text-blue-700">1.2</td>
                      <td className="p-3 text-slate-500">Memerlukan pembinaan dari atasan langsung</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-rose-700">&lt; 50.0%</td>
                      <td className="p-3 font-semibold text-slate-800">Sangat Kurang</td>
                      <td className="p-3 text-center font-black text-slate-900">5</td>
                      <td className="p-3 text-center font-black text-rose-700">1.0</td>
                      <td className="p-3 text-slate-500">Sanksi disiplin pegawai</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-400">0.0% / Tanpa Kehadiran</td>
                      <td className="p-3 font-semibold text-slate-500">Nirkehadiran</td>
                      <td className="p-3 text-center font-black text-slate-500">0</td>
                      <td className="p-3 text-center font-black text-slate-500">0.0</td>
                      <td className="p-3 text-slate-400">Tidak ada bukti kehadiran sama sekali</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'simulator':
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">
              Gunakan simulasi interaktif di bawah ini untuk menguji bagaimana parameter input menghasilkan nilai HK, Nilai X, Persentase, Score 1, dan Score 2 secara real-time:
            </p>

            {/* Clean 2-Section Layout: Inputs Form & Results Table */}
            <div className="space-y-4">
              {/* Bagian 1: Parameter Input Form (Clean table/grid style) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Parameter Input Pegawai
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-white text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Total Hari Kerja (Bulan)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={calcWorkingDays}
                      onChange={(e) => setCalcWorkingDays(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Hari efektif kalender</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hari Alpha (A)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={calcWorkingDays}
                      value={calcAlpha}
                      onChange={(e) => setCalcAlpha(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-rose-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-rose-500 mt-0.5 block">Denda -3 poin &amp; -1 HK</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hak Izin Pagi (HIP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcHIP}
                      onChange={(e) => setCalcHIP(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Denda -1 poin</span>
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
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Denda -1 poin</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sakit Tanpa Surat (I)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcI}
                      onChange={(e) => setCalcI(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Denda -1 poin &amp; -1 HK</span>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Tabel Hasil Simulasi Live (Clean table) */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 w-36">Parameter Output</th>
                      <th className="p-3 font-bold text-slate-700 w-28 text-center">Kolom</th>
                      <th className="p-3 font-bold text-slate-700">Rumus Kalkulasi</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-36">Hasil Perhitungan</th>
                      <th className="p-3 font-bold text-slate-700 w-48">Status / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Hari Kerja (HK)</td>
                      <td className="p-3 font-mono text-center font-bold text-slate-700">AG</td>
                      <td className="p-3 font-mono text-slate-600">{calcWorkingDays} - {calcI} (I) - {calcAlpha} (A)</td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm">{calcHK} Hari</td>
                      <td className="p-3 text-slate-500">Hari hadir fisik efektif</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Skor Nilai X</td>
                      <td className="p-3 font-mono text-center font-bold text-slate-700">AQ</td>
                      <td className="p-3 font-mono text-slate-600">({calcHK}&times;2) - ({calcHIP}&times;1) - ({calcHIS}&times;1) - ({calcI}&times;1) - ({calcAlpha}&times;3)</td>
                      <td className="p-3 text-center font-black text-blue-700 text-sm">{calcX} Poin</td>
                      <td className="p-3 text-slate-500">Poin bersih perolehan</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Poin Maksimal (Y)</td>
                      <td className="p-3 font-mono text-center font-bold text-slate-700">AR</td>
                      <td className="p-3 font-mono text-slate-600">{calcWorkingDays} &times; 2</td>
                      <td className="p-3 text-center font-black text-slate-700 text-sm">{calcY} Poin</td>
                      <td className="p-3 text-slate-500">Poin maksimal 100%</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Persentase (%)</td>
                      <td className="p-3 font-mono text-center font-bold text-slate-700">AS</td>
                      <td className="p-3 font-mono text-slate-600">({calcX} / {calcY}) &times; 100%</td>
                      <td className="p-3 text-center font-black text-emerald-700 text-sm">{calcPct.toFixed(1)}%</td>
                      <td className="p-3 text-slate-500">Persentase kehadiran riil</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors bg-blue-50/20">
                      <td className="p-3 font-bold text-slate-900">Score 1</td>
                      <td className="p-3 font-mono text-center font-bold text-slate-700">AT</td>
                      <td className="p-3 text-slate-600">Konversi rubrik persentase SMANSS (skala 1–10)</td>
                      <td className="p-3 text-center font-black text-slate-900 text-base">{calcScore1}</td>
                      <td className="p-3 font-semibold text-blue-800">Skala Nilai 1 s/d 10</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors bg-blue-50/30">
                      <td className="p-3 font-bold text-blue-900">Score 2 / Kedisiplinan</td>
                      <td className="p-3 font-mono text-center font-bold text-blue-900">AU</td>
                      <td className="p-3 text-slate-600">Score 1 &times; 20% (Bobot kedisiplinan SKP)</td>
                      <td className="p-3 text-center font-black text-blue-700 text-lg">{calcScore2.toFixed(1)}</td>
                      <td className="p-3 font-bold text-blue-900">Nilai Target SKP (Maksimal 2.0)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'cases':
        return (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Berikut adalah tabel studi kasus riil pada bulan dengan <strong>21 Hari Kerja Efektif</strong> (seperti September 2026):
            </p>

            {/* Clean Unified Table: Studi Kasus Riil */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-48">Studi Kasus Pegawai</th>
                    <th className="p-3 font-bold text-slate-700">Kondisi Presensi &amp; Rekap Izin</th>
                    <th className="p-3 font-bold text-slate-700 w-64">Rincian Perhitungan HK &amp; Poin X</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-28">Persentase</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-24">Score 1</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-28">Score 2</th>
                    <th className="p-3 font-bold text-slate-700 w-36">Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 1: Hadir Penuh 100%<br />
                      <span className="text-[11px] font-normal text-slate-500">Contoh: Eko Valery Freddie</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Hadir tepat waktu setiap hari kerja tanpa Alpha maupun izin terlambat (HIP=0, HIS=0, A=0, I=0).
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      HK = 21 - 0 = <strong>21 Hari</strong><br />
                      X = (21 &times; 2) - 0 = <strong>42 Poin</strong><br />
                      Y = 21 &times; 2 = <strong>42 Poin</strong>
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700">100.0%</td>
                    <td className="p-3 text-center font-black text-slate-900">10</td>
                    <td className="p-3 text-center font-black text-blue-700">2.0</td>
                    <td className="p-3 font-semibold text-emerald-700">Sangat Baik / Maksimal</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 2: Terlambat &amp; Pulang Cepat<br />
                      <span className="text-[11px] font-normal text-slate-500">Ada Izin Resmi Pagi &amp; Siang</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Masuk terlambat 2 kali (2 HIP) dan pulang cepat 1 kali (1 HIS). Semua berizin resmi. Tidak ada Alpha.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      HK = 21 - 0 = <strong>21 Hari</strong> (tetap hadir)<br />
                      X = 42 - (2&times;1) - (1&times;1) = <strong>39 Poin</strong><br />
                      Y = 42 Poin
                    </td>
                    <td className="p-3 text-center font-black text-slate-800">92.8%</td>
                    <td className="p-3 text-center font-black text-slate-900">9</td>
                    <td className="p-3 text-center font-black text-blue-700">1.8</td>
                    <td className="p-3 font-semibold text-slate-700">Sangat Baik</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 3: 1 Hari Alpha<br />
                      <span className="text-[11px] font-normal text-slate-500">Without Info (A = 1)</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Tidak hadir 1 hari kerja tanpa keterangan (A = 1). Tanpa surat izin/dokter.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      HK = 21 - 1 = <strong>20 Hari</strong> (-1 Hari)<br />
                      X = (20 &times; 2) - (1 &times; 3) = <strong>37 Poin</strong><br />
                      Y = 42 Poin
                    </td>
                    <td className="p-3 text-center font-black text-amber-700">88.1%</td>
                    <td className="p-3 text-center font-black text-slate-900">8</td>
                    <td className="p-3 text-center font-black text-blue-700">1.6</td>
                    <td className="p-3 font-semibold text-amber-700">Baik (Kena Denda 3 Poin)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 4: Sakit Surat Dokter (IL) vs Tanpa Surat (I)<br />
                      <span className="text-[11px] font-normal text-slate-500">Perbandingan Bukti Sah</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Jika sakit 2 hari dengan surat dokter (<strong className="text-blue-700">IL</strong>): bebas denda, HK tetap 21 hari, persentase 100%. Namun jika tanpa surat dokter (<strong className="text-amber-700">I</strong>): HK menjadi 19 hari dan poin X dipotong 2 poin.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      <strong>IL:</strong> HK = 21, X = 42 (% = 100.0%)<br />
                      <strong>I:</strong> HK = 19, X = 36 (% = 85.7%)
                    </td>
                    <td className="p-3 text-center font-black text-slate-800">
                      100% vs 85.7%
                    </td>
                    <td className="p-3 text-center font-black text-slate-900">
                      10 vs 8
                    </td>
                    <td className="p-3 text-center font-black text-blue-700">
                      2.0 vs 1.6
                    </td>
                    <td className="p-3 font-semibold text-purple-700">Pentingnya Surat Dokter</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // IF EMBEDDED VIEW (TAB DASHBOARD):
  // Renders exactly like EmployeeManager and AuditTrailView (White background, standard header, border-b subtabs, no cards!)
  if (isEmbeddedView) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col p-6 space-y-6">
        {/* Header Section (Matching EmployeeManager & AuditTrailView) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Panduan Perhitungan &amp; Arti Tabel Rekapitulasi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Penjelasan lengkap fungsi kolom Excel, glosarium status kehadiran, rumus matematis, dan rubrik penilaian kedisiplinan pegawai resmi SMAN Sumatera Selatan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Panduan</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Navigation (Standard Border-b-2 matching Main Dashboard Header) */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
          {[
            { id: 'anatomy', label: '1. Struktur & Arti Kolom (A s/d AU)', icon: Layers },
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
                className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div>{renderTabContent()}</div>
      </div>
    );
  }

  // IF MODAL POPUP VIEW:
  // Renders inside a clean standard modal dialog (matching BulkUpdateModal)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Panduan Perhitungan &amp; Arti Tabel Rekapitulasi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standar Operasional Prosedur (SOP) &amp; Rubrik Penilaian SMAN Sumatera Selatan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Cetak Panduan"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Modal */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto shrink-0 pb-px">
          {[
            { id: 'anatomy', label: '1. Struktur Kolom', icon: Layers },
            { id: 'codes', label: '2. Glosarium Status', icon: CheckCircle2 },
            { id: 'formulas', label: '3. Rumus & Rubrik', icon: Percent },
            { id: 'simulator', label: '4. Kalkulator Live', icon: Calculator },
            { id: 'cases', label: '5. Kasus Riil', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800 text-xs">
          {renderTabContent()}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">AutoAbsen SMANSS &copy; 2026</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
