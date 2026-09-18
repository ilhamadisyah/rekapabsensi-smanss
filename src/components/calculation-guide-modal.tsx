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
  Share2,
  Check,
  Award,
  AlertTriangle,
  Clock,
  FileText,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Info,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Calendar,
  UserCheck,
  AlertCircle,
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
  const [linkCopied, setLinkCopied] = useState(false);

  // State untuk Simulasi Hitung Nilai
  const [calcWorkingDays, setCalcWorkingDays] = useState<number>(21);
  const [calcAlpha, setCalcAlpha] = useState<number>(1);
  const [calcLE, setCalcLE] = useState<number>(1);
  const [calcHIP, setCalcHIP] = useState<number>(1);
  const [calcHIS, setCalcHIS] = useState<number>(0);
  const [calcI, setCalcI] = useState<number>(0);
  const [calcIL, setCalcIL] = useState<number>(0);
  const [calcDL, setCalcDL] = useState<number>(0);

  // Perhitungan Hasil Simulasi:
  // HK: Hanya berkurang oleh Sakit Tanpa Surat (I) dan Alpa (A). LE, HIP, HIS, IL, DL tetap dihitung hadir bekerja.
  const calcHK = Math.max(0, calcWorkingDays - calcI - calcAlpha);
  // Poin dasar dari hari kerja yang dihadiri (setiap hari bernilai 2 poin)
  const calcBasePoints = calcHK * 2;
  // Rincian denda poin:
  const calcDeductionLE = calcLE * 1;
  const calcDeductionI = calcI * 1;
  const calcDeductionAlpha = calcAlpha * 3;
  const calcTotalDeduction = calcDeductionLE + calcDeductionI + calcDeductionAlpha;
  // Nilai X: Base Points dikurangi Total Denda (minimal 0). HIP, HIS, IL, DL bebas denda (0 poin pengurang).
  const calcX = Math.max(0, calcBasePoints - calcTotalDeduction);
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

  // Render Konten Pilihan Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'anatomy':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Laporan rekapitulasi kehadiran resmi SMAN Sumatera Selatan terbagi menjadi 4 bagian utama yang tersusun rapi dari Kolom A sampai AV:
              </p>
            </div>

            {/* Tabel Lengkap Susunan Kolom (Bahasa Awam, Tanpa Istilah Teknis) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-40">Bagian Laporan</th>
                    <th className="p-3 font-bold text-slate-700 w-28">Nama Kolom</th>
                    <th className="p-3 font-bold text-slate-700 w-36">Judul Header</th>
                    <th className="p-3 font-bold text-slate-700">Kegunaan &amp; Arti Kolom</th>
                    <th className="p-3 font-bold text-slate-700 w-72">Cara Pengisian &amp; Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Bagian 1: Identitas Pegawai */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={2} className="p-3 font-bold text-blue-700 align-top bg-blue-50/20 border-r border-slate-100">
                      Bagian 1: Identitas Pegawai
                    </td>
                    <td className="p-3 font-bold text-slate-800">Kolom A</td>
                    <td className="p-3 font-bold text-slate-900">NO</td>
                    <td className="p-3 text-slate-600">Nomor urut pegawai (dimulai dari nomor 1 sampai pegawai terakhir).</td>
                    <td className="p-3 text-slate-500">Tertulis rapi di posisi tengah.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom B</td>
                    <td className="p-3 font-bold text-slate-900">NAME</td>
                    <td className="p-3 text-slate-600">Nama lengkap pegawai beserta gelar dinas resmi.</td>
                    <td className="p-3 text-slate-500">Ditulis rata kiri dengan ejaan nama dan gelar yang benar.</td>
                  </tr>

                  {/* Bagian 2: Catatan Kehadiran Harian */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={3} className="p-3 font-bold text-emerald-700 align-top bg-emerald-50/20 border-r border-slate-100">
                      Bagian 2: Kehadiran Harian (Tgl 1 s/d 31)
                    </td>
                    <td className="p-3 font-bold text-slate-800">Kolom C s/d AF</td>
                    <td className="p-3 font-bold text-slate-900">Hari Kerja Biasa</td>
                    <td className="p-3 text-slate-600">
                      Catatan absen harian pegawai pada hari kerja (Senin sampai Jumat).
                    </td>
                    <td className="p-3 text-slate-500">
                      <strong>Jika hadir tepat waktu:</strong> Dibiarkan kosong bersih agar mudah dibaca.<br />
                      <strong>Jika berhalangan:</strong> Berisi kode huruf (misal izin, sakit, alpa).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom C s/d AF</td>
                    <td className="p-3 font-bold text-slate-900">Hari Sabtu &amp; Minggu</td>
                    <td className="p-3 text-slate-600">Hari libur akhir pekan rutin.</td>
                    <td className="p-3 text-slate-500">
                      Diberi tanda warna merah sebagai hari libur akhir pekan, dan tidak memotong nilai kehadiran.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom C s/d AF</td>
                    <td className="p-3 font-bold text-slate-900">Hari Libur Nasional / Sekolah</td>
                    <td className="p-3 text-slate-600">Hari libur resmi yang ditetapkan pemerintah atau sekolah.</td>
                    <td className="p-3 text-slate-500">
                      Tertulis kata <strong>LIBUR</strong> dengan latar warna merah, dan tidak memotong nilai kehadiran.
                    </td>
                  </tr>

                  {/* Bagian 3: Ringkasan Hari Kerja & Izin */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={11} className="p-3 font-bold text-amber-700 align-top bg-amber-50/20 border-r border-slate-100">
                      Bagian 3: Ringkasan Jumlah Hari &amp; Izin
                    </td>
                    <td className="p-3 font-bold text-slate-800">Kolom AG</td>
                    <td className="p-3 font-bold text-slate-900">HK (Hari Kerja)</td>
                    <td className="p-3 text-slate-600">Jumlah hari kerja nyata yang benar-benar dihadiri pegawai.</td>
                    <td className="p-3 text-slate-500">
                      Hanya berkurang jika pegawai Sakit Tanpa Surat (I) atau Alpa (A).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AH</td>
                    <td className="p-3 font-bold text-slate-900">HIP</td>
                    <td className="p-3 text-slate-600">Hak Izin Pagi: Jumlah pemanfaatan hak izin datang pada pagi hari dengan surat izin resmi.</td>
                    <td className="p-3 text-emerald-600 font-semibold">Bebas denda (0 poin). Hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AI</td>
                    <td className="p-3 font-bold text-slate-900">HIS</td>
                    <td className="p-3 text-slate-600">Hak Izin Siang: Jumlah pemanfaatan hak izin pulang pada siang hari dengan surat izin resmi.</td>
                    <td className="p-3 text-emerald-600 font-semibold">Bebas denda (0 poin). Hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AJ</td>
                    <td className="p-3 font-bold text-slate-900">LE (Late / Early)</td>
                    <td className="p-3 text-slate-600">Late Arrival or Early Departure: Terlambat datang atau pulang lebih awal (salah satunya saja atau keduanya).</td>
                    <td className="p-3 text-amber-700 font-semibold">Denda 1 poin (-1 poin pada Nilai X). Hari kerja (HK) tetap dihitung hadir karena pegawai masuk bekerja.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AK</td>
                    <td className="p-3 font-bold text-slate-900">I (Sakit Tanpa Surat)</td>
                    <td className="p-3 text-slate-600">Sakit tetapi tidak melampirkan surat keterangan dokter.</td>
                    <td className="p-3 text-slate-500">Dipotong 1 poin dan mengurangi jumlah hari kerja (HK) sebanyak 1 hari.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AL</td>
                    <td className="p-3 font-bold text-slate-900">IL (Sakit Surat Dokter)</td>
                    <td className="p-3 text-slate-600">Sakit dengan melampirkan surat dokter yang sah.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AM</td>
                    <td className="p-3 font-bold text-slate-900">PM / P (Izin Resmi)</td>
                    <td className="p-3 text-slate-600">Izin keperluan tertulis yang disetujui Kepala Sekolah.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AN</td>
                    <td className="p-3 font-bold text-slate-900">OTL (Cuti Lainnya)</td>
                    <td className="p-3 text-slate-600">Cuti resmi seperti cuti melahirkan, cuti alasan penting keluarga, dll.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AO</td>
                    <td className="p-3 font-bold text-slate-900">AL (Cuti Tahunan)</td>
                    <td className="p-3 text-slate-600">Hak cuti tahunan resmi pegawai yang telah disetujui.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AP</td>
                    <td className="p-3 font-bold text-slate-900">DL (Dinas Luar)</td>
                    <td className="p-3 text-slate-600">Menjalankan tugas kedinasan di luar sekolah disertai Surat Tugas (ST).</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AQ</td>
                    <td className="p-3 font-bold text-slate-900">A (Alpa / Tanpa Keterangan)</td>
                    <td className="p-3 text-slate-600">Tidak masuk bekerja tanpa pemberitahuan atau tanpa izin resmi.</td>
                    <td className="p-3 text-slate-500">Pengurangan berat: dipotong 3 poin dan mengurangi hari kerja (HK) 1 hari.</td>
                  </tr>

                  {/* Bagian 4: Penilaian Kedisiplinan */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={5} className="p-3 font-bold text-purple-700 align-top bg-purple-50/20 border-r border-slate-100">
                      Bagian 4: Penilaian Nilai &amp; Kedisiplinan
                    </td>
                    <td className="p-3 font-bold text-slate-800">Kolom AR</td>
                    <td className="p-3 font-bold text-slate-900">Nilai X</td>
                    <td className="p-3 text-slate-600">Total poin nilai kehadiran bersih yang berhasil dikumpulkan pegawai.</td>
                    <td className="p-3 text-slate-500">
                      Hari kerja dihadiri dikali 2 poin, lalu dikurangi potongan izin atau alpa.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AS</td>
                    <td className="p-3 font-bold text-slate-900">Nilai Y</td>
                    <td className="p-3 text-slate-600">Nilai maksimal jika pegawai hadir lengkap 100% tanpa ada potongan.</td>
                    <td className="p-3 text-slate-500">
                      Total seluruh hari kerja dalam sebulan dikali 2 poin.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AT</td>
                    <td className="p-3 font-bold text-slate-900">Persentase (%)</td>
                    <td className="p-3 text-slate-600">Tingkat kehadiran pegawai dalam bentuk persen (%).</td>
                    <td className="p-3 text-slate-500">
                      Nilai yang didapat (X) dibagi nilai maksimal (Y) dikali 100%.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AU</td>
                    <td className="p-3 font-bold text-slate-900">Score 1 (Nilai Kehadiran)</td>
                    <td className="p-3 text-slate-600">Nilai prestasi kehadiran pegawai dalam skala angka 1 sampai 10.</td>
                    <td className="p-3 text-slate-500">
                      Berupa angka bulat resmi: 10, 9, 8, 7, 6, atau 5.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AV</td>
                    <td className="p-3 font-bold text-slate-900">Score 2 (Kedisiplinan SKP)</td>
                    <td className="p-3 text-slate-600">Nilai kedisiplinan berbobot 20% untuk dimasukkan ke laporan Sasaran Kinerja Pegawai (SKP).</td>
                    <td className="p-3 text-slate-500">
                      Skala angka 0 sampai 2 (misalnya 2.0, 1.8, 1.6, 1.4, 1.2, atau 1.0).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'codes':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Pegawai wajib melakukan absen datang saat masuk dan absen pulang saat selesai bertugas sesuai dengan jam kerja yang ditentukan (baik jam kerja reguler maupun jadwal tugas piket/shift):
              </p>
              <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                Daftar Arti Keterangan Absen
              </div>
            </div>

            {/* Tabel Arti Keterangan Absen (Bahasa Awam) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-24">Kode</th>
                    <th className="p-3 font-bold text-slate-700 w-52">Arti Keterangan</th>
                    <th className="p-3 font-bold text-slate-700 w-28 text-center">Letak Kolom</th>
                    <th className="p-3 font-bold text-slate-700">Ketentuan Waktu Datang &amp; Pulang / Syarat Bukti</th>
                    <th className="p-3 font-bold text-slate-700 w-44">Pengurangan Nilai</th>
                    <th className="p-3 font-bold text-slate-700 w-44">Pengaruh ke Hari Kerja (HK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-emerald-700">HADIR</td>
                    <td className="p-3 font-semibold text-slate-900">Hadir Lengkap Tepat Waktu</td>
                    <td className="p-3 text-center text-slate-400">-</td>
                    <td className="p-3 text-slate-600">Masuk dan pulang sesuai dengan jam kerja yang ditentukan (absen datang dan pulang lengkap)</td>
                    <td className="p-3 font-bold text-emerald-600">Dapat 2 Poin Penuh</td>
                    <td className="p-3 text-emerald-700 font-semibold">Dihitung Hadir Penuh (1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-rose-700">A</td>
                    <td className="p-3 font-semibold text-slate-900">Alpa / Tanpa Keterangan</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AQ</td>
                    <td className="p-3 text-slate-600">Tidak masuk bekerja tanpa menyerahkan surat izin atau pemberitahuan</td>
                    <td className="p-3 font-bold text-rose-600">Dipotong 3 Poin (Sanksi Berat)</td>
                    <td className="p-3 text-rose-700 font-semibold">Hari Kerja Berkurang 1 Hari</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIP</td>
                    <td className="p-3 font-semibold text-slate-900">Hak Izin Pagi</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AH</td>
                    <td className="p-3 text-slate-600">Pemanfaatan hak izin datang pada pagi hari dengan membawa surat izin resmi</td>
                    <td className="p-3 font-bold text-emerald-600">Tidak Dipotong (0 Poin / Bebas Denda)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIS</td>
                    <td className="p-3 font-semibold text-slate-900">Hak Izin Siang</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AI</td>
                    <td className="p-3 text-slate-600">Pemanfaatan hak izin pulang pada siang hari dengan membawa surat izin resmi</td>
                    <td className="p-3 font-bold text-emerald-600">Tidak Dipotong (0 Poin / Bebas Denda)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">LE</td>
                    <td className="p-3 font-semibold text-slate-900">Terlambat / Pulang Awal (Late / Early)</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AJ</td>
                    <td className="p-3 text-slate-600">Terlambat masuk atau pulang mendahului jam kerja tanpa surat izin</td>
                    <td className="p-3 font-bold text-amber-600">Dipotong 1 Poin (-1 Poin Nilai X)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">I</td>
                    <td className="p-3 font-semibold text-slate-900">Sakit Tanpa Surat Dokter</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AK</td>
                    <td className="p-3 text-slate-600">Tidak masuk karena sakit tetapi tidak melampirkan surat dokter</td>
                    <td className="p-3 font-bold text-amber-600">Dipotong 1 Poin</td>
                    <td className="p-3 text-rose-700 font-semibold">Hari Kerja Berkurang 1 Hari</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">IL</td>
                    <td className="p-3 font-semibold text-slate-900">Sakit Dengan Surat Dokter</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AL</td>
                    <td className="p-3 text-slate-600">Melampirkan surat keterangan sakit resmi dari dokter/klinik</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">PM / P</td>
                    <td className="p-3 font-semibold text-slate-900">Izin Keperluan Resmi</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AM</td>
                    <td className="p-3 text-slate-600">Ada surat permohonan izin tertulis yang disetujui Kepala Sekolah</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">OTL</td>
                    <td className="p-3 font-semibold text-slate-900">Cuti Khusus / Alasan Penting</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AN</td>
                    <td className="p-3 text-slate-600">Cuti melahirkan, cuti alasan penting keluarga, atau cuti besar</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">AL</td>
                    <td className="p-3 font-semibold text-slate-900">Cuti Tahunan</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AO</td>
                    <td className="p-3 text-slate-600">Hak cuti tahunan pegawai yang telah diajukan dan disetujui</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">DL</td>
                    <td className="p-3 font-semibold text-slate-900">Dinas Luar Sekolah</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AP</td>
                    <td className="p-3 text-slate-600">Bertugas kedinasan di luar sekolah dengan membawa Surat Tugas (ST) resmi</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-500">OFF / LIBUR</td>
                    <td className="p-3 font-semibold text-slate-700">Hari Libur / Lepas Tugas</td>
                    <td className="p-3 text-center text-slate-400">-</td>
                    <td className="p-3 text-slate-500">Hari libur tanggal merah kalender atau jadwal lepas piket tugas</td>
                    <td className="p-3 font-bold text-slate-500">Bukan Hari Kerja</td>
                    <td className="p-3 text-slate-500">Tidak mempengaruhi nilai sama sekali</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Kotak Informasi Khusus: Ketentuan Lengkap LE vs HIP vs HIS */}
            <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border border-amber-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs shadow-xs">
                  LE
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Pedoman Khusus Keterlambatan &amp; Pulang Cepat: Aturan LE vs HIP vs HIS
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Penjelasan mendalam mengenai aturan denda, syarat bebas denda, dan pengaruhnya terhadap Hari Kerja (HK)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-white/90 border border-amber-200/60 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800">LE (Late / Earlier)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">Denda -1 Poin</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Terpicu jika tap masuk telat <strong>ATAU</strong> tap pulang lebih cepat tanpa surat izin. Cukup salah satu kondisi terjadi, pegawai dikenakan potongan <strong>-1 poin</strong> pada Nilai X. Hari Kerja (HK) <strong>tetap dihitung hadir penuh</strong> karena pegawai masuk bekerja.
                  </p>
                </div>

                <div className="bg-white/90 border border-emerald-200/60 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800">HIP (Hak Izin Pagi)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Bebas Denda (0 Poin)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Digunakan jika pegawai terlambat datang pada pagi hari namun <strong>melampirkan surat permohonan izin resmi</strong> yang disetujui pimpinan. Denda dihapus (0 poin) dan hari kerja tetap hadir penuh.
                  </p>
                </div>

                <div className="bg-white/90 border border-emerald-200/60 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800">HIS (Hak Izin Siang)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Bebas Denda (0 Poin)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Digunakan jika pegawai pulang mendahului jam operasional namun <strong>melampirkan surat izin dinas/keperluan resmi</strong> yang disetujui Kepala Sekolah. Bebas denda (0 poin) dan hari kerja tetap hadir penuh.
                  </p>
                </div>
              </div>

              <div className="bg-amber-100/50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 flex items-start gap-2.5">
                <span className="font-bold text-base leading-none text-amber-700 mt-0.5">&bull;</span>
                <div className="leading-relaxed">
                  <strong>Letak Kolom di Laporan Excel:</strong> Seluruh kejadian status <strong>LE</strong> otomatis terangkum pada <strong>Kolom AJ</strong> berjudul <code>LATE / EARLIER</code> dengan warna latar kuning khas SMANSS. Sedangkan di kolom absen harian (C s/d AF), tanggal terkait akan bertuliskan kode <code>LE</code>.
                </div>
              </div>
            </div>
          </div>
        );

      case 'formulas':
        return (
          <div className="space-y-6">
            {/* Pengantar Konsep Dasar Penilaian */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-blue-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-xs shrink-0 mt-0.5">
                  <Calculator className="w-4 h-4 text-white" />
                </span>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Prinsip Dasar &amp; Logika Perhitungan Nilai Presensi SMAN Sumatera Selatan
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Sistem Rekapitulasi Presensi SMANSS dirancang berdasarkan prinsip <strong>keadilan, transparansi, dan pembobotan proporsional</strong>:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <div className="bg-white/80 border border-blue-100 rounded-lg p-2.5">
                      <span className="font-bold text-blue-900 block">Bobot Harian 2 Poin</span>
                      <span className="text-[11px] text-slate-600">Setiap hari kerja dihadiri menghasilkan 2 poin dasar (1 poin tap masuk + 1 poin tap pulang).</span>
                    </div>
                    <div className="bg-white/80 border border-emerald-100 rounded-lg p-2.5">
                      <span className="font-bold text-emerald-900 block">Fasilitas Izin Bebas Denda</span>
                      <span className="text-[11px] text-slate-600">Izin resmi (HIP, HIS, IL, DL, PM, AL, OTL) bernilai penuh dan bebas dari sanksi denda (0 denda).</span>
                    </div>
                    <div className="bg-white/80 border border-rose-100 rounded-lg p-2.5">
                      <span className="font-bold text-rose-900 block">Denda Proporsional</span>
                      <span className="text-[11px] text-slate-600">Pelanggaran waktu (LE) denda -1 poin; Sakit tanpa surat (I) denda -1 poin; Alpa (A) sanksi tegas denda -3 poin.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 KARTU RUMUS MATEMATIS RESMI (GRID) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>6 Rumus Matematis Resmi Penilaian Kehadiran</span>
                </h4>
                <span className="text-[11px] text-slate-500">Standar Baku Laporan Rekapitulasi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Rumus 1: HK */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">1. Hari Kerja Nyata (HK)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Kolom AG</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] font-bold text-blue-700 text-center">
                    HK = Total Hari Kerja - (I + A)
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Jumlah hari kerja pegawai nyata hadir bertugas. Hanya berkurang jika pegawai Sakit Tanpa Surat (<strong>I</strong>) atau Alpa (<strong>A</strong>). Status LE, HIP, HIS, IL, DL, dan cuti <strong>TIDAK</strong> mengurangi HK.
                  </p>
                </div>

                {/* Rumus 2: Nilai X */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">2. Nilai Bersih (Nilai X)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Kolom AR</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] font-bold text-purple-700 text-center">
                    X = (HK &times; 2) - (LE&times;1) - (I&times;1) - (A&times;3)
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Poin kehadiran bersih yang dikumpulkan. Setiap hari kerja dihadiri berbobot 2 poin, dikurangi denda keterlambatan/pulang awal (<strong>LE: -1</strong>), denda sakit tanpa surat (<strong>I: -1</strong>), dan denda alpa (<strong>A: -3</strong>).
                  </p>
                </div>

                {/* Rumus 3: Nilai Y */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">3. Nilai Maksimal (Nilai Y)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">Kolom AS</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] font-bold text-slate-700 text-center">
                    Y = Total Hari Kerja Sebulan &times; 2
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Tolok ukur nilai target tertinggi bila pegawai hadir lengkap 100% tepat waktu sepanjang bulan. Pada bulan dengan 21 hari kerja, nilai maksimalnya adalah <strong>42 poin</strong>.
                  </p>
                </div>

                {/* Rumus 4: Persentase % */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">4. Persentase Kehadiran (%)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Kolom AT</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] font-bold text-emerald-700 text-center">
                    % = (Nilai X &divide; Nilai Y) &times; 100%
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Tingkat pencapaian kehadiran riil pegawai terhadap nilai maksimal. Dibulatkan secara matematis ke 1 atau 2 tempat desimal untuk penentuan konversi nilai prestasi kedisiplinan.
                  </p>
                </div>

                {/* Rumus 5: Score 1 */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">5. Score 1 (Nilai Kehadiran)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Kolom AU</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] font-bold text-amber-700 text-center">
                    Score 1 &isin; &#123; 10, 9, 8, 7, 6, 5, 0 &#125;
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Nilai prestasi kehadiran dalam skala angka bulat resmi (1 sampai 10) berdasarkan pedoman interval persentase kehadiran sekolah (100% = 10, 90-99.9% = 9, 80-89.9% = 8, dst).
                  </p>
                </div>

                {/* Rumus 6: Score 2 (SKP) */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">6. Score 2 (Kedisiplinan SKP)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">Kolom AV</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80 font-mono text-[11px] font-bold text-rose-700 text-center">
                    Score 2 = Score 1 &times; 20% = Score 1 &divide; 5
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Nilai kedisiplinan berbobot 20% dengan skala angka 0.0 sampai 2.0 (contoh: 2.0, 1.8, 1.6, 1.4, 1.2, 1.0) untuk dimasukkan ke laporan Sasaran Kinerja Pegawai (SKP) resmi dinas.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 1: Tabel 4 Langkah Cara Menghitung (Bahasa Awam) */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Alur Tahapan Perhitungan Kehadiran (Langkah 1 s/d 4)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 w-28">Langkah</th>
                      <th className="p-3 font-bold text-slate-700 w-48">Yang Dihitung &amp; Kolom</th>
                      <th className="p-3 font-bold text-slate-700 w-80">Cara Menghitung</th>
                      <th className="p-3 font-bold text-slate-700">Penjelasan Singkat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Langkah 1</td>
                      <td className="p-3 font-semibold text-slate-800">
                        Hari Kerja Nyata (HK)<br />
                        <span className="text-blue-700 font-bold text-[11px]">Kolom AG</span>
                      </td>
                      <td className="p-3 font-semibold text-blue-700 bg-slate-50/50">
                        Hari Kerja Bulan Ini dikurangi Sakit Tanpa Surat (I) dikurangi Alpa (A)
                      </td>
                      <td className="p-3 text-slate-600">
                        Hari kerja pegawai hanya berkurang jika tidak masuk tanpa keterangan (Alpa) atau sakit tanpa surat dokter. Izin dinas, cuti, dan terlambat (LE) tidak mengurangi HK.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Langkah 2</td>
                      <td className="p-3 font-semibold text-slate-800">
                        Nilai Bersih Yang Didapat (Nilai X)<br />
                        <span className="text-purple-700 font-bold text-[11px]">Kolom AR</span>
                      </td>
                      <td className="p-3 font-semibold text-purple-700 bg-slate-50/50">
                        (Hari Kerja Nyata &times; 2 poin) dikurangi denda terlambat/pulang cepat (LE), sakit tanpa surat (I), dan alpa (A)
                      </td>
                      <td className="p-3 text-slate-600">
                        Setiap hari kerja bernilai 2 poin. Terlambat datang atau pulang mendahului jam kerja tanpa izin (LE) dipotong 1 poin, sakit tanpa surat (I) dipotong 1 poin, dan alpa dipotong 3 poin. Izin Pagi (HIP) dan Izin Siang (HIS) bebas denda (0 poin).
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Langkah 3</td>
                      <td className="p-3 font-semibold text-slate-800">
                        Nilai Maksimal &amp; Persentase (%)<br />
                        <span className="text-emerald-700 font-bold text-[11px]">Kolom AS &amp; AT</span>
                      </td>
                      <td className="p-3 font-semibold text-emerald-700 bg-slate-50/50">
                        Nilai Maksimal = Hari Kerja Bulan Ini &times; 2 poin<br />
                        Persentase = (Nilai Bersih &divide; Nilai Maksimal) &times; 100%
                      </td>
                      <td className="p-3 text-slate-600">
                        Membandingkan nilai yang berhasil didapat pegawai dengan nilai tertinggi jika hadir penuh 100% tanpa catatan pelanggaran waktu.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Langkah 4</td>
                      <td className="p-3 font-semibold text-slate-800">
                        Nilai Kehadiran &amp; Nilai Kedisiplinan SKP<br />
                        <span className="text-amber-700 font-bold text-[11px]">Kolom AU &amp; AV</span>
                      </td>
                      <td className="p-3 font-semibold text-amber-700 bg-slate-50/50">
                        Score 1 = Nilai skala 1 sampai 10<br />
                        Score 2 = Score 1 &times; 20% (Nilai maksimal 2.0)
                      </td>
                      <td className="p-3 text-slate-600">
                        Score 1 adalah nilai prestasi kehadiran (skala 1–10). Score 2 adalah bobot 20% (maksimal 2.0) untuk dimasukkan langsung ke laporan SKP pegawai.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian Baru: Tabel Komparasi Komprehensif Dampak Setiap Kode Presensi Terhadap HK & Nilai X */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tabel Komparasi Dampak Setiap Jenis Status Kehadiran Terhadap HK &amp; Nilai X</span>
                </h4>
                <span className="text-[11px] text-slate-500">Matriks Evaluasi Presensi</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 w-24">Kode</th>
                      <th className="p-3 font-bold text-slate-700 w-44">Nama Keterangan</th>
                      <th className="p-3 font-bold text-slate-700 w-24 text-center">Kolom Rekap</th>
                      <th className="p-3 font-bold text-slate-700 w-28">Status Fisik</th>
                      <th className="p-3 font-bold text-slate-700">Persyaratan / Bukti Sah</th>
                      <th className="p-3 font-bold text-slate-700 w-36">Dampak ke HK</th>
                      <th className="p-3 font-bold text-slate-700 w-36">Denda Nilai X</th>
                      <th className="p-3 font-bold text-slate-700 w-44">Kategori Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-emerald-700">HADIR</td>
                      <td className="p-3 font-semibold text-slate-900">Hadir Lengkap Tepat Waktu</td>
                      <td className="p-3 text-center text-slate-400">-</td>
                      <td className="p-3 text-emerald-700 font-semibold">Hadir di Tempat</td>
                      <td className="p-3 text-slate-600">Tap masuk dan pulang lengkap sesuai jam dinas</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">0 Denda (+2 Poin Penuh)</td>
                      <td className="p-3 text-emerald-700 font-semibold">Sempurna (Target Utama)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-amber-700">LE</td>
                      <td className="p-3 font-semibold text-slate-900">Late / Earlier</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AJ</td>
                      <td className="p-3 text-emerald-700 font-semibold">Hadir Bekerja</td>
                      <td className="p-3 text-slate-600">Telat masuk atau pulang awal tanpa surat izin</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-amber-700">Denda -1 Poin per Hari</td>
                      <td className="p-3 text-amber-700 font-semibold">Pelanggaran Jam Kerja</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-emerald-700">HIP</td>
                      <td className="p-3 font-semibold text-slate-900">Hak Izin Pagi</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AH</td>
                      <td className="p-3 text-emerald-700 font-semibold">Hadir Bekerja</td>
                      <td className="p-3 text-slate-600">Surat permohonan izin pagi disetujui pimpinan</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Bebas Denda (0 Poin)</td>
                      <td className="p-3 text-emerald-700 font-semibold">Hak Resmi Terverifikasi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-emerald-700">HIS</td>
                      <td className="p-3 font-semibold text-slate-900">Hak Izin Siang</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AI</td>
                      <td className="p-3 text-emerald-700 font-semibold">Hadir Bekerja</td>
                      <td className="p-3 text-slate-600">Surat permohonan izin pulang siang disetujui pimpinan</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Bebas Denda (0 Poin)</td>
                      <td className="p-3 text-emerald-700 font-semibold">Hak Resmi Terverifikasi</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-rose-700">I</td>
                      <td className="p-3 font-semibold text-slate-900">Sakit Tanpa Surat Dokter</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AK</td>
                      <td className="p-3 text-rose-700 font-semibold">Tidak Masuk</td>
                      <td className="p-3 text-slate-600">Tidak melampirkan surat keterangan dokter sah</td>
                      <td className="p-3 font-bold text-rose-700">Berkurang (-1 Hari)</td>
                      <td className="p-3 font-bold text-rose-700">Denda -1 Poin (Total -3)</td>
                      <td className="p-3 text-rose-700 font-semibold">Kehilangan Poin Ganda</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-blue-700">IL</td>
                      <td className="p-3 font-semibold text-slate-900">Sakit Dengan Surat Dokter</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AL</td>
                      <td className="p-3 text-slate-500 font-semibold">Tidak Masuk</td>
                      <td className="p-3 text-slate-600">Surat keterangan dokter/klinik/RS resmi</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Nilai Utuh (Bebas Denda)</td>
                      <td className="p-3 text-blue-700 font-semibold">Sakit Sah Berizin</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-blue-700">PM / P</td>
                      <td className="p-3 font-semibold text-slate-900">Izin Keperluan Khusus</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AM</td>
                      <td className="p-3 text-slate-500 font-semibold">Tidak Masuk</td>
                      <td className="p-3 text-slate-600">Surat permohonan izin disetujui Kepala Sekolah</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Nilai Utuh (Bebas Denda)</td>
                      <td className="p-3 text-blue-700 font-semibold">Izin Dinas Sah</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-blue-700">OTL</td>
                      <td className="p-3 font-semibold text-slate-900">Cuti Khusus / Alasan Penting</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AN</td>
                      <td className="p-3 text-slate-500 font-semibold">Tidak Masuk</td>
                      <td className="p-3 text-slate-600">Cuti melahirkan, cuti alasan penting keluarga</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Nilai Utuh (Bebas Denda)</td>
                      <td className="p-3 text-blue-700 font-semibold">Hak Cuti Resmi Negara</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-blue-700">AL</td>
                      <td className="p-3 font-semibold text-slate-900">Cuti Tahunan</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AO</td>
                      <td className="p-3 text-slate-500 font-semibold">Tidak Masuk</td>
                      <td className="p-3 text-slate-600">Formulir cuti tahunan disetujui pimpinan</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Nilai Utuh (Bebas Denda)</td>
                      <td className="p-3 text-blue-700 font-semibold">Hak Cuti Tahunan Pegawai</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-blue-700">DL</td>
                      <td className="p-3 font-semibold text-slate-900">Dinas Luar Sekolah</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AP</td>
                      <td className="p-3 text-blue-700 font-semibold">Dinas di Luar</td>
                      <td className="p-3 text-slate-600">Surat Tugas (ST) resmi dari Kepala Sekolah</td>
                      <td className="p-3 font-bold text-emerald-700">Tetap Utuh (1 Hari)</td>
                      <td className="p-3 font-bold text-emerald-700">Nilai Utuh (Bebas Denda)</td>
                      <td className="p-3 text-blue-700 font-semibold">Menjalankan Tugas Negara</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-rose-700">A</td>
                      <td className="p-3 font-semibold text-slate-900">Alpa / Tanpa Keterangan</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AQ</td>
                      <td className="p-3 text-rose-700 font-semibold">Tidak Masuk</td>
                      <td className="p-3 text-slate-600">Tanpa surat izin dan tanpa pemberitahuan</td>
                      <td className="p-3 font-bold text-rose-700">Berkurang (-1 Hari)</td>
                      <td className="p-3 font-bold text-rose-700">Denda Berat -3 Poin (Total -5)</td>
                      <td className="p-3 text-rose-700 font-semibold">Pelanggaran Disiplin Berat</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 2: Tabel Pedoman Konversi Nilai Resmi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Pedoman Nilai Kehadiran (Score 1) dan Nilai Kedisiplinan SKP (Score 2)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Pedoman Resmi SMANSS
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 w-44">Persentase Kehadiran</th>
                      <th className="p-3 font-bold text-slate-700">Tingkat Disiplin</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-36">Nilai Kehadiran (Skala 1 s/d 10)</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-48">Nilai Kedisiplinan SKP (Maksimal 2.0)</th>
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
                      <td className="p-3 text-slate-500">Kehadiran sangat baik, ada 1-2 izin dinas ringan</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">80.0% s/d 89.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Baik</td>
                      <td className="p-3 text-center font-black text-slate-900">8</td>
                      <td className="p-3 text-center font-black text-blue-700">1.6</td>
                      <td className="p-3 text-slate-500">Kehadiran memenuhi standar sekolah dengan baik</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">65.0% s/d 79.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Cukup</td>
                      <td className="p-3 text-center font-black text-slate-900">7</td>
                      <td className="p-3 text-center font-black text-blue-700">1.4</td>
                      <td className="p-3 text-slate-500">Perlu meningkatkan ketepatan waktu datang dan pulang</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">50.0% s/d 64.9%</td>
                      <td className="p-3 font-semibold text-slate-800">Kurang</td>
                      <td className="p-3 text-center font-black text-slate-900">6</td>
                      <td className="p-3 text-center font-black text-blue-700">1.2</td>
                      <td className="p-3 text-slate-500">Perlu bimbingan dan pembinaan disiplin kerja</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-rose-700">Di bawah 50.0%</td>
                      <td className="p-3 font-semibold text-slate-800">Sangat Kurang</td>
                      <td className="p-3 text-center font-black text-slate-900">5</td>
                      <td className="p-3 text-center font-black text-rose-700">1.0</td>
                      <td className="p-3 text-slate-500">Mendapatkan peringatan pembinaan disiplin</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-400">0.0% (Tidak Hadir)</td>
                      <td className="p-3 font-semibold text-slate-500">Tidak Pernah Hadir</td>
                      <td className="p-3 text-center font-black text-slate-500">0</td>
                      <td className="p-3 text-center font-black text-slate-500">0.0</td>
                      <td className="p-3 text-slate-400">Tidak ada catatan kehadiran selama sebulan</td>
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
            <p className="text-xs text-slate-600">
              Coba masukkan angka kehadiran di bawah ini untuk melihat contoh langsung cara sistem menghitung nilai kehadiran pegawai secara otomatis:
            </p>

            {/* Bagian Input & Hasil Simulasi (Tampilan Rapi & Sederhana) */}
            <div className="space-y-4">
              {/* Bagian 1: Isian Contoh Kehadiran Pegawai */}
              <div className="border border-slate-200 rounded-xl overflow-hidden space-y-3 p-4 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span>Parameter Simulasi Kehadiran Pegawai</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Ubah nilai angka di bawah untuk melihat kalkulasi langsung</span>
                </div>

                {/* Baris 1: Faktor Pengurang Nilai */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    1. Faktor Yang Mempengaruhi Pengurangan Nilai (Wajib Diperhatikan)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <label className="block font-bold text-slate-800 mb-1">
                        Hari Kerja Bulan Ini
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={calcWorkingDays}
                        onChange={(e) => setCalcWorkingDays(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Hari aktif sekolah (contoh: 21 hari)</span>
                    </div>

                    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3">
                      <label className="block font-bold text-amber-900 mb-1">
                        Terlambat / Pulang Cepat (LE)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcLE}
                        onChange={(e) => setCalcLE(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-amber-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-white"
                      />
                      <span className="text-[10px] text-amber-700 font-semibold mt-1 block">Denda -1 poin; HK tetap penuh</span>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3">
                      <label className="block font-bold text-rose-900 mb-1">
                        Sakit Tanpa Surat (I)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcI}
                        onChange={(e) => setCalcI(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-rose-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-white"
                      />
                      <span className="text-[10px] text-rose-700 font-semibold mt-1 block">Denda -1 poin &amp; kurang 1 HK</span>
                    </div>

                    <div className="bg-red-50/70 border border-red-200 rounded-xl p-3">
                      <label className="block font-bold text-red-900 mb-1">
                        Jumlah Alpa / Bolos (A)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={calcWorkingDays}
                        value={calcAlpha}
                        onChange={(e) => setCalcAlpha(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-red-300 rounded-lg text-red-900 font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 bg-white"
                      />
                      <span className="text-[10px] text-red-700 font-semibold mt-1 block">Denda berat -3 poin &amp; kurang 1 HK</span>
                    </div>
                  </div>
                </div>

                {/* Baris 2: Faktor Izin Sah Bebas Denda */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    2. Faktor Izin Kedinasan Resmi (Bebas Denda / Poin Tetap Utuh)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3">
                      <label className="block font-semibold text-emerald-900 mb-1">
                        Hak Izin Pagi (HIP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcHIP}
                        onChange={(e) => setCalcHIP(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-emerald-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                      />
                      <span className="text-[10px] text-emerald-700 mt-1 block">Bebas denda (0 poin pengurang)</span>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3">
                      <label className="block font-semibold text-emerald-900 mb-1">
                        Hak Izin Siang (HIS)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcHIS}
                        onChange={(e) => setCalcHIS(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg text-emerald-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                      />
                      <span className="text-[10px] text-emerald-700 mt-1 block">Bebas denda (0 poin pengurang)</span>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3">
                      <label className="block font-semibold text-blue-900 mb-1">
                        Sakit Surat Dokter (IL)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcIL}
                        onChange={(e) => setCalcIL(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-blue-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      />
                      <span className="text-[10px] text-blue-700 mt-1 block">Nilai utuh, HK tidak berkurang</span>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-3">
                      <label className="block font-semibold text-blue-900 mb-1">
                        Dinas Luar / Cuti (DL / AL)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={calcDL}
                        onChange={(e) => setCalcDL(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-blue-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      />
                      <span className="text-[10px] text-blue-700 mt-1 block">Nilai utuh, HK tidak berkurang</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Ringkasan Skor & Kualifikasi Kedisiplinan (Warna Baru & Status Kualifikasi Otomatis) */}
              {(() => {
                const getQualificationDetails = (score1: number, pct: number) => {
                  if (score1 === 0 || pct <= 0) {
                    return {
                      label: 'Tidak Pernah Hadir',
                      cardGradient: 'from-slate-800 via-slate-850 to-slate-900 border-slate-700',
                      badgeStyle: 'bg-white/15 text-slate-200 border-white/20',
                      subTextColor: 'text-slate-300',
                      score2Color: 'text-slate-200',
                    };
                  }
                  if (pct >= 100) {
                    return {
                      label: 'Sempurna / Sangat Baik',
                      cardGradient: 'from-emerald-700 via-teal-800 to-slate-900 border-emerald-600/50',
                      badgeStyle: 'bg-emerald-400/25 text-emerald-100 border-emerald-300/40',
                      subTextColor: 'text-emerald-100',
                      score2Color: 'text-amber-300',
                    };
                  }
                  if (pct >= 90) {
                    return {
                      label: 'Sangat Baik',
                      cardGradient: 'from-blue-700 via-indigo-800 to-slate-900 border-blue-600/50',
                      badgeStyle: 'bg-blue-400/25 text-blue-100 border-blue-300/40',
                      subTextColor: 'text-blue-100',
                      score2Color: 'text-amber-300',
                    };
                  }
                  if (pct >= 80) {
                    return {
                      label: 'Baik',
                      cardGradient: 'from-sky-700 via-blue-800 to-slate-900 border-sky-600/50',
                      badgeStyle: 'bg-sky-400/25 text-sky-100 border-sky-300/40',
                      subTextColor: 'text-sky-100',
                      score2Color: 'text-amber-300',
                    };
                  }
                  if (pct >= 65) {
                    return {
                      label: 'Cukup',
                      cardGradient: 'from-amber-700 via-yellow-800 to-slate-900 border-amber-600/50',
                      badgeStyle: 'bg-amber-400/25 text-amber-100 border-amber-300/40',
                      subTextColor: 'text-amber-100',
                      score2Color: 'text-yellow-200',
                    };
                  }
                  if (pct >= 50) {
                    return {
                      label: 'Kurang',
                      cardGradient: 'from-orange-700 via-rose-800 to-slate-900 border-orange-600/50',
                      badgeStyle: 'bg-orange-400/25 text-orange-100 border-orange-300/40',
                      subTextColor: 'text-orange-100',
                      score2Color: 'text-yellow-200',
                    };
                  }
                  return {
                    label: 'Sangat Kurang',
                    cardGradient: 'from-rose-800 via-red-900 to-slate-950 border-rose-700/50',
                    badgeStyle: 'bg-rose-400/25 text-rose-100 border-rose-300/40',
                    subTextColor: 'text-rose-100',
                    score2Color: 'text-yellow-200',
                  };
                };

                const qual = getQualificationDetails(calcScore1, calcPct);

                return (
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-r ${qual.cardGradient} text-white shadow-md border transition-all duration-300`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className={`text-[11px] font-bold ${qual.subTextColor} uppercase tracking-wider`}
                        >
                          SCORE 1 (SKALA NILAI 1 S/D 10)
                        </span>
                        <div className="text-3xl font-black mt-0.5">{calcScore1}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                          SCORE 2 (BOBOT 20%)
                        </span>
                        <div className={`text-3xl font-black mt-0.5 ${qual.score2Color}`}>
                          {calcScore2.toFixed(1)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-white/20 text-[11px] flex flex-wrap items-center justify-between gap-2">
                      <div className={qual.subTextColor}>
                        Target Nilai SKP:{' '}
                        <strong className="text-white">
                          Score Kedisiplinan = {calcScore2.toFixed(1)}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={qual.subTextColor}>Status Kualifikasi:</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border shadow-xs ${qual.badgeStyle}`}
                        >
                          {qual.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Card Rincian Breakdown Matematis Real-Time (Transparansi Hitung Nilai) */}
              <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span>Rincian Transparan Perhitungan Nilai Anda</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Nilai X = {calcX} / {calcY} ({calcPct.toFixed(1)}%)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">1. Poin Kehadiran Dasar</span>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {calcHK} Hari &times; 2 = <span className="text-blue-700">{calcBasePoints} Poin</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-tight">
                      Dari {calcWorkingDays} hari kerja dikurangi {calcI} sakit tanpa surat &amp; {calcAlpha} alpa.
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-rose-600 uppercase">2. Total Denda Pengurang</span>
                    <div className="font-mono text-sm font-bold text-rose-700">
                      -{calcTotalDeduction} Poin
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-tight">
                      LE: -{calcDeductionLE} | Sakit (I): -{calcDeductionI} | Alpa (A): -{calcDeductionAlpha}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-xl p-3 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase">3. Skor Bersih &amp; SKP</span>
                    <div className="font-mono text-sm font-bold text-emerald-700">
                      {calcX} Poin &rarr; SKP {calcScore2.toFixed(1)}
                    </div>
                    <p className="text-[10.5px] text-slate-500 leading-tight">
                      ({calcX} &divide; {calcY}) &times; 100% = {calcPct.toFixed(1)}% &rarr; Score 1 = {calcScore1}
                    </p>
                  </div>
                </div>

                {/* Pesan Saran & Analisis Otomatis */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-[11px] text-blue-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {calcPct >= 100 ? (
                      <span>
                        <strong>Status Sempurna:</strong> Kehadiran Anda 100% tepat waktu tanpa catatan denda keterlambatan maupun ketidakhadiran. Anda berhak memperoleh nilai tertinggi <strong>Score 1 = 10</strong> dan <strong>Score Kedisiplinan SKP = 2.0</strong>.
                      </span>
                    ) : calcPct >= 90 ? (
                      <span>
                        <strong>Status Sangat Baik:</strong> Capaian kehadiran Anda di atas 90%. Anda berada pada kategori <strong>Sangat Baik</strong> dengan <strong>Score SKP = 1.8</strong>. Toleransi denda masih berada dalam batas aman prestasi.
                      </span>
                    ) : calcPct >= 80 ? (
                      <span>
                        <strong>Status Baik:</strong> Capaian kehadiran Anda memenuhi standar kedisiplinan sekolah (<strong>Score SKP = 1.6</strong>). Kurangi keterlambatan (LE) dan hindari izin tanpa surat untuk menaikkan kembali ke kategori Sangat Baik (1.8).
                      </span>
                    ) : (
                      <span>
                        <strong>Peringatan Pembinaan:</strong> Nilai kedisiplinan Anda mengalami penurunan drastis karena denda alpa atau izin tanpa surat. Pastikan setiap ketidakhadiran selalu disertai bukti sah seperti Surat Dokter (IL) atau Surat Tugas Dinas (DL) agar nilai tidak terpotong.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bagian 2: Tabel Hasil Perhitungan Otomatis */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 w-40">Hasil Hitungan</th>
                      <th className="p-3 font-bold text-slate-700 w-28 text-center">Letak Kolom</th>
                      <th className="p-3 font-bold text-slate-700">Cara Hitung Sederhana</th>
                      <th className="p-3 font-bold text-slate-700 text-center w-36">Hasil</th>
                      <th className="p-3 font-bold text-slate-700 w-52">Arti &amp; Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Hari Kerja Nyata (HK)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AG</td>
                      <td className="p-3 text-slate-600">{calcWorkingDays} hari - {calcI} sakit tanpa surat - {calcAlpha} alpa</td>
                      <td className="p-3 text-center font-black text-slate-900 text-sm">{calcHK} Hari</td>
                      <td className="p-3 text-slate-500">Hari pegawai benar-benar masuk bekerja</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Nilai Bersih (Nilai X)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AR</td>
                      <td className="p-3 text-slate-600">
                        ({calcHK} hari &times; 2) dikurangi potongan denda ({calcLE * 1 + calcI * 1 + calcAlpha * 3} poin){calcLE > 0 ? ` [LE: -${calcLE} poin]` : ''} — LE denda 1 poin, HIP &amp; HIS bebas denda
                      </td>
                      <td className="p-3 text-center font-black text-blue-700 text-sm">{calcX} Poin</td>
                      <td className="p-3 text-slate-500">Poin bersih yang berhasil dikumpulkan</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Nilai Maksimal (Nilai Y)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AS</td>
                      <td className="p-3 text-slate-600">{calcWorkingDays} hari kerja &times; 2 poin</td>
                      <td className="p-3 text-center font-black text-slate-700 text-sm">{calcY} Poin</td>
                      <td className="p-3 text-slate-500">Poin tertinggi jika hadir lengkap 100%</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Persentase Kehadiran (%)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AT</td>
                      <td className="p-3 text-slate-600">({calcX} &divide; {calcY}) &times; 100%</td>
                      <td className="p-3 text-center font-black text-emerald-700 text-sm">{calcPct.toFixed(1)}%</td>
                      <td className="p-3 text-slate-500">Tingkat kehadiran kerja bulan ini</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors bg-blue-50/20">
                      <td className="p-3 font-bold text-slate-900">Score 1 (Nilai Kehadiran)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AU</td>
                      <td className="p-3 text-slate-600">Sesuai pedoman persentase (skala nilai 1 sampai 10)</td>
                      <td className="p-3 text-center font-black text-slate-900 text-base">{calcScore1}</td>
                      <td className="p-3 font-semibold text-blue-800">Nilai Prestasi Kehadiran (Skala 1 s/d 10)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors bg-blue-50/30">
                      <td className="p-3 font-bold text-blue-900">Score 2 (Kedisiplinan SKP)</td>
                      <td className="p-3 text-center font-bold text-blue-900">Kolom AV</td>
                      <td className="p-3 text-slate-600">Score 1 dikali bobot 20%</td>
                      <td className="p-3 text-center font-black text-blue-700 text-lg">{calcScore2.toFixed(1)}</td>
                      <td className="p-3 font-bold text-blue-900">Nilai Yang Dimasukkan ke SKP (Maksimal 2.0)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'cases':
        return (
          <div className="space-y-5">
            <p className="text-xs text-slate-600">
              Berikut ini adalah contoh nyata perhitungan nilai kehadiran untuk bulan dengan <strong>21 hari kerja</strong> (seperti bulan September) mencakup berbagai skenario kedinasan:
            </p>

            {/* Tabel Contoh Kasus Nyata (Bahasa Awam) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-52">Nama Contoh Kasus</th>
                    <th className="p-3 font-bold text-slate-700">Kondisi Kehadiran Pegawai</th>
                    <th className="p-3 font-bold text-slate-700 w-64">Langkah Perhitungan Sederhana</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-24">Persentase</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-20">Score 1</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-24">Score 2</th>
                    <th className="p-3 font-bold text-slate-700 w-40">Kesimpulan Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 1: Hadir Lengkap 100%<br />
                      <span className="text-[11px] font-normal text-slate-500">Contoh: Bapak Eko Valery Freddie</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Masuk setiap hari kerja, tidak pernah datang terlambat, dan tidak pernah pulang lebih awal.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: 21 hari penuh.<br />
                      Nilai Didapat: 42 poin dari maksimal 42 poin.
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700">100.0%</td>
                    <td className="p-3 text-center font-black text-slate-900">10</td>
                    <td className="p-3 text-center font-black text-blue-700">2.0</td>
                    <td className="p-3 font-semibold text-emerald-700">Sangat Baik (Nilai Sempurna)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 2: Hak Izin Pagi &amp; Hak Izin Siang<br />
                      <span className="text-[11px] font-normal text-slate-500">Menggunakan Hak Izin Resmi (HIP &amp; HIS)</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Menggunakan Hak Izin Pagi (HIP) 2 kali dan Hak Izin Siang (HIS) 1 kali dengan surat izin resmi. Tidak pernah alpa.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: Tetap 21 hari penuh.<br />
                      Nilai: 42 poin utuh (izin resmi bebas denda / 0 denda) = <strong>42 Poin</strong>.
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700">100.0%</td>
                    <td className="p-3 text-center font-black text-slate-900">10</td>
                    <td className="p-3 text-center font-black text-blue-700">2.0</td>
                    <td className="p-3 font-semibold text-emerald-700">Sangat Baik (Bebas Potongan Nilai)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 3: Terlambat / Pulang Cepat (LE)<br />
                      <span className="text-[11px] font-normal text-slate-500">Terlambat Datang atau Pulang Cepat Tanpa Izin</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Masuk bekerja setiap hari (21 hari kerja), namun tercatat datang terlambat atau pulang mendahului jam kerja 2 kali (LE = 2). Tidak pernah alpa.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: Tetap 21 hari penuh (tidak berkurang).<br />
                      Nilai: (21 &times; 2) dikurangi denda 2 poin (2 &times; 1) = <strong>40 Poin</strong> dari 42 poin.
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700">95.2%</td>
                    <td className="p-3 text-center font-black text-slate-900">9</td>
                    <td className="p-3 text-center font-black text-blue-700">1.8</td>
                    <td className="p-3 font-semibold text-emerald-700">Sangat Baik (Kena Denda 1 Poin per LE)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 4: Tidak Masuk 1 Hari Tanpa Izin<br />
                      <span className="text-[11px] font-normal text-slate-500">Ada 1 Hari Alpa (A = 1)</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Tidak masuk bekerja 1 hari tanpa pemberitahuan atau surat izin.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: Berkurang menjadi 20 hari.<br />
                      Nilai: (20 &times; 2) dikurangi denda alpa 3 poin = <strong>37 Poin</strong>.
                    </td>
                    <td className="p-3 text-center font-black text-amber-700">88.1%</td>
                    <td className="p-3 text-center font-black text-slate-900">8</td>
                    <td className="p-3 text-center font-black text-blue-700">1.6</td>
                    <td className="p-3 font-semibold text-amber-700">Baik (Kena Potongan Alpa)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 5: Sakit Surat Dokter vs Tanpa Surat<br />
                      <span className="text-[11px] font-normal text-slate-500">Perbandingan Pentingnya Bukti Sah</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Jika sakit membawa surat keterangan dokter: nilai tetap utuh 100% (Score 2 = 2.0). Namun jika sakit tanpa surat dokter: hari kerja berkurang dan nilai kedisiplinan turun menjadi 1.6.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      <strong>Pakai Surat Dokter:</strong> Nilai 42 poin (100%)<br />
                      <strong>Tanpa Surat:</strong> Nilai 36 poin (85.7%)
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

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 6: Kombinasi Realistis Kedinasan<br />
                      <span className="text-[11px] font-normal text-slate-500">1 LE + 1 HIP + 1 DL + 1 Sakit Dokter</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Masuk 21 hari kerja, pernah 1 kali telat (LE=1), 1 kali izin pagi berizin (HIP=1), 1 kali dinas luar ber-Surat Tugas (DL=1), dan 1 kali sakit ber-surat dokter (IL=1).
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: Tetap 21 hari penuh (tidak berkurang).<br />
                      Nilai: (21 &times; 2) - denda 1 poin (hanya dari LE) = <strong>41 Poin</strong> dari 42 poin.
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700">97.6%</td>
                    <td className="p-3 text-center font-black text-slate-900">9</td>
                    <td className="p-3 text-center font-black text-blue-700">1.8</td>
                    <td className="p-3 font-semibold text-emerald-700">Sangat Baik (Aman &amp; Tertib Administrasi)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-rose-900">
                      Kasus 7: Sanksi Berat Multi-Alpa<br />
                      <span className="text-[11px] font-normal text-slate-500">Tidak Masuk 3 Hari Tanpa Keterangan (A = 3)</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Tidak masuk bekerja sebanyak 3 hari tanpa pemberitahuan atau izin resmi.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: Berkurang drastis menjadi 18 hari.<br />
                      Nilai: (18 &times; 2) dikurangi denda 9 poin (3 &times; 3) = <strong>27 Poin</strong> dari 42 poin.
                    </td>
                    <td className="p-3 text-center font-black text-rose-700">64.3%</td>
                    <td className="p-3 text-center font-black text-slate-900">6</td>
                    <td className="p-3 text-center font-black text-rose-700">1.2</td>
                    <td className="p-3 font-semibold text-rose-700">Kurang (Wajib Pembinaan Disiplin)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Kotak Edukasi: 5 Tips Emas Menjaga Nilai Kedisiplinan SKP 2.0 */}
            <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 border border-emerald-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
                  <Award className="w-4 h-4 text-white" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    5 Kiat Utama Menjaga Nilai Kedisiplinan SKP Tetap 2.0 (Sempurna)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Panduan praktis bagi seluruh guru dan tenaga kependidikan SMAN Sumatera Selatan
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-xs">
                <div className="bg-white border border-emerald-200/70 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-emerald-900 block">1. Tertib Tap Mesin</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Pastikan selalu melakukan tap in pagi dan tap out sore pada mesin scanner sekolah.
                  </p>
                </div>

                <div className="bg-white border border-emerald-200/70 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-emerald-900 block">2. Manfaatkan HIP/HIS</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Jika ada keperluan penting pagi/siang, buat surat izin resmi pimpinan agar bebas denda (0 poin).
                  </p>
                </div>

                <div className="bg-white border border-emerald-200/70 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-emerald-900 block">3. Wajib Surat Dokter</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Bila sakit, selalu lampirkan surat dokter sah agar terhitung status IL (nilai tetap utuh 100%).
                  </p>
                </div>

                <div className="bg-white border border-emerald-200/70 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-emerald-900 block">4. Surat Tugas Dinas</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Untuk dinas luar kota/sekolah, mintakan Surat Perintah Tugas (ST) resmi kepada kepala sekolah.
                  </p>
                </div>

                <div className="bg-white border border-rose-200/70 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-rose-900 block">5. Hindari Alpa</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Satu hari alpa menghilangkan 5 poin (rugi 2 poin hari + denda 3) dan langsung menjatuhkan nilai SKP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Print PDF Trigger Helper (Menamai judul file PDF otomatis dan memanggil print dialog)
  const handlePrintPDF = () => {
    if (typeof window !== 'undefined') {
      const originalTitle = document.title;
      document.title = `SOP_Pedoman_Rekapitulasi_Presensi_SMANSS_${new Date().getFullYear()}`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  };

  return (
    <>
      {/* 1. TAMPILAN INTERAKTIF DI LAYAR (SEMBUNYI SAAT DICETAK/PDF) */}
      <div className="print:hidden">
        {isEmbeddedView ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col p-6 space-y-6">
            {/* Header Bersih & Seragam dengan Tab Lainnya */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Panduan Perhitungan &amp; Arti Tabel Rekapitulasi
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Penjelasan susunan kolom laporan, arti keterangan absen, cara hitung nilai kehadiran, dan pedoman nilai kedisiplinan pegawai SMAN Sumatera Selatan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const fullUrl = `${window.location.origin}/panduan`;
                      navigator.clipboard.writeText(fullUrl);
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2500);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${linkCopied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  title="Salin tautan publik tanpa login untuk dibagikan ke seluruh pegawai"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Link Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Bagikan Link Publik</span>
                    </>
                  )}
                </button>


                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Cetak atau simpan sebagai dokumen PDF resmi SMANSS"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen PDF</span>
                </button>
              </div>
            </div>

            {/* Sub-Navigasi Menggunakan Garis Bawah Aktif (Seragam dengan Menu Atas) */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
              {[
                { id: 'anatomy', label: '1. Susunan & Arti Kolom', icon: Layers },
                { id: 'codes', label: '2. Arti Keterangan Absen', icon: CheckCircle2 },
                { id: 'formulas', label: '3. Cara Hitung & Pedoman Nilai', icon: Percent },
                { id: 'simulator', label: '4. Simulasi Hitung Nilai', icon: Calculator },
                { id: 'cases', label: '5. Contoh Nyata Perhitungan', icon: FileSpreadsheet },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${isActive
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

            {/* Isi Tab */}
            <div>{renderTabContent()}</div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header Jendela Modal */}
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
                      Pedoman Resmi Penilaian Kehadiran &amp; Kedisiplinan SMAN Sumatera Selatan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintPDF}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Cetak atau simpan sebagai dokumen PDF resmi SMANSS"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Dokumen PDF</span>
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

              {/* Sub-Navigasi Modal */}
              <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto shrink-0 pb-px">
                {[
                  { id: 'anatomy', label: '1. Susunan Kolom', icon: Layers },
                  { id: 'codes', label: '2. Keterangan Absen', icon: CheckCircle2 },
                  { id: 'formulas', label: '3. Cara Hitung & Nilai', icon: Percent },
                  { id: 'simulator', label: '4. Simulasi Hitung', icon: Calculator },
                  { id: 'cases', label: '5. Contoh Nyata', icon: FileSpreadsheet },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${isActive
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

              {/* Isi Modal */}
              <div className="flex-1 overflow-y-auto p-6 text-slate-800 text-xs">
                {renderTabContent()}
              </div>

              {/* Penutup Modal */}
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DOKUMEN CETAK & PDF RESMI (HANYA MUNCUL SAAT MENCETAK / SIMPAN KE PDF) */}
      {/* ========================================================================= */}
      <div className="hidden print:block print-document font-sans text-black">
        {/* KOP SURAT RESMI DINAS SMANSS */}
        <div className="text-center pb-2 mb-4">
          <div className="flex items-center justify-between gap-3">
            {/* Logo Kiri: Pemerintah Provinsi Sumatera Selatan */}
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-sumsel.png"
                alt="Logo Pemerintah Provinsi Sumatera Selatan"
                className="w-18 h-18 max-h-20 object-contain"
              />
            </div>

            {/* Teks Kop Surat Dinas */}
            <div className="flex-1 text-center px-1">
              <h4 className="text-[10.5pt] font-bold uppercase tracking-wider text-slate-800 leading-tight">
                Pemerintah Provinsi Sumatera Selatan
              </h4>
              <h3 className="text-[11.5pt] font-bold uppercase tracking-wider text-slate-900 leading-tight">
                Dinas Pendidikan
              </h3>
              <h2 className="text-[14pt] font-black uppercase tracking-wide text-slate-950 leading-tight">
                SMA Negeri Sumatera Selatan
              </h2>
              <p className="text-[8pt] text-slate-700 mt-1 leading-snug">
                Jl. Pangeran Ratu, RT. 31 / RW. 08, Kel. 8 Ulu, Kec. Seberang Ulu I, Kota Palembang, Sumatera Selatan 30252
                <br />
                Laman Resmi: <em>smansumsel.sch.id</em> &bull; Pos-el: <em>info@smansumsel.sch.id</em>
              </p>
            </div>

            {/* Logo Kanan: SMAN Sumatera Selatan */}
            <div className="w-20 h-20 flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-smanss.png"
                alt="Logo SMAN Sumatera Selatan"
                className="w-18 h-18 max-h-20 object-contain"
              />
            </div>
          </div>
          {/* Garis Ganda Standar Kop Surat Resmi Dinas */}
          <div className="border-b-[2.5px] border-slate-950 mt-2"></div>
          <div className="border-b-[0.75px] border-slate-950 mt-0.5"></div>
        </div>

        {/* JUDUL DOKUMEN RESMI */}
        <div className="text-center mb-4 mt-2">
          <h3 className="text-[11.5pt] font-black uppercase tracking-wide text-slate-950 underline decoration-1 underline-offset-4">
            STANDAR OPERASIONAL PROSEDUR (SOP) &amp; PEDOMAN PERHITUNGAN PRESENSI
          </h3>
        </div>

        {/* BAGIAN I: SUSUNAN & ARTI KOLOM LAPORAN */}
        <div className="mb-5">
          <div className="font-bold text-[9.5pt] uppercase text-slate-900 mb-1.5 pb-1 border-b border-slate-400 print-heading">
            I. Susunan &amp; Arti Kolom Laporan Rekapitulasi (Kolom A s/d AV)
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Bagian Laporan</th>
                <th style={{ width: '12%' }}>Kolom</th>
                <th style={{ width: '18%' }}>Judul Header</th>
                <th style={{ width: '28%' }}>Maksud &amp; Definisi Kolom</th>
                <th style={{ width: '24%' }}>Aturan Pengisian</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={2} className="font-bold">1. Identitas Pegawai</td>
                <td className="font-semibold">Kolom A</td>
                <td className="font-bold">NO</td>
                <td>Nomor urut resmi pegawai aktif</td>
                <td>Angka bulat berurutan di tengah</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom B</td>
                <td className="font-bold">NAME</td>
                <td>Nama lengkap pegawai dan gelar dinas</td>
                <td>Rata kiri sesuai SK kedinasan resmi</td>
              </tr>

              <tr>
                <td rowSpan={3} className="font-bold">2. Kehadiran Harian</td>
                <td className="font-semibold">Kolom C s/d AF</td>
                <td className="font-bold">Hari Kerja Biasa</td>
                <td>Catatan harian pegawai (Senin–Jumat)</td>
                <td>Kosong jika hadir tepat waktu; Berisi kode jika izin/sakit/alpa</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom C s/d AF</td>
                <td className="font-bold">Sabtu &amp; Minggu</td>
                <td>Hari libur akhir pekan kalender</td>
                <td>Warna merah tanda libur rutin, tidak memotong nilai</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom C s/d AF</td>
                <td className="font-bold">Libur Sekolah/Nasional</td>
                <td>Libur resmi kalender pendidikan</td>
                <td>Tertulis LIBUR latar merah, tidak memotong nilai</td>
              </tr>

              <tr>
                <td rowSpan={11} className="font-bold">3. Ringkasan Hari &amp; Izin</td>
                <td className="font-semibold">Kolom AG</td>
                <td className="font-bold">HK</td>
                <td>Hari kerja nyata yang dihadiri</td>
                <td>Total Hari Kerja dikurangi I dan Alpa</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AH</td>
                <td className="font-bold">HIP</td>
                <td>Hak Izin Pagi</td>
                <td>Bebas denda (0 poin); Hari kerja (HK) tetap hadir</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AI</td>
                <td className="font-bold">HIS</td>
                <td>Hak Izin Siang</td>
                <td>Bebas denda (0 poin); Hari kerja (HK) tetap hadir</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AJ</td>
                <td className="font-bold">LE</td>
                <td>Late / Earlier (Terlambat/Pulang Awal)</td>
                <td>Denda -1 poin Nilai X, HK tetap hadir</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AK</td>
                <td className="font-bold">I</td>
                <td>Sakit Tanpa Surat Dokter</td>
                <td>Denda -1 poin dan mengurangi HK (-1 hari)</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AL</td>
                <td className="font-bold">IL</td>
                <td>Sakit Dengan Surat Dokter Sah</td>
                <td>Nilai utuh (bebas denda), HK tetap hadir</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AM</td>
                <td className="font-bold">PM / P</td>
                <td>Izin Keperluan Resmi</td>
                <td>Disetujui Kepala Sekolah, bebas denda</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AN</td>
                <td className="font-bold">OTL</td>
                <td>Cuti Khusus / Alasan Penting</td>
                <td>Cuti resmi yang sah, bebas denda</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AO</td>
                <td className="font-bold">AL</td>
                <td>Cuti Tahunan</td>
                <td>Hak cuti resmi tahunan, bebas denda</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AP</td>
                <td className="font-bold">DL</td>
                <td>Dinas Luar Sekolah</td>
                <td>Melampirkan Surat Tugas (ST), bebas denda</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AQ</td>
                <td className="font-bold">A</td>
                <td>Alpa / Tanpa Keterangan</td>
                <td>Denda berat -3 poin dan mengurangi HK (-1 hari)</td>
              </tr>

              <tr>
                <td rowSpan={5} className="font-bold">4. Penilaian Kedisiplinan</td>
                <td className="font-semibold">Kolom AR</td>
                <td className="font-bold">Nilai X</td>
                <td>Total skor poin bersih perolehan</td>
                <td>(HK &times; 2 poin) dikurangi potongan denda</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AS</td>
                <td className="font-bold">Nilai Y</td>
                <td>Total poin maksimal jika 100%</td>
                <td>Total hari kerja sebulan &times; 2 poin</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AT</td>
                <td className="font-bold">Persentase (%)</td>
                <td>Tingkat persentase kehadiran</td>
                <td>(Nilai X &divide; Nilai Y) &times; 100%</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AU</td>
                <td className="font-bold">Score 1</td>
                <td>Nilai prestasi kehadiran (skala 10)</td>
                <td>Angka bulat resmi: 10, 9, 8, 7, 6, atau 5</td>
              </tr>
              <tr>
                <td className="font-semibold">Kolom AV</td>
                <td className="font-bold">Score 2 (SKP)</td>
                <td>Nilai kedisiplinan berbobot 20%</td>
                <td>Score 1 &times; 20% (skala nilai 0.0 s/d 2.0)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BAGIAN II: GLOSARIUM KODE STATUS KEHADIRAN */}
        <div className="mb-5">
          <div className="font-bold text-[9.5pt] uppercase text-slate-900 mb-1.5 pb-1 border-b border-slate-400 print-heading">
            II. Glosarium &amp; Ketentuan Status Kehadiran Pegawai
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Kode</th>
                <th style={{ width: '22%' }}>Keterangan Resmi</th>
                <th style={{ width: '10%' }} className="text-center">Kolom</th>
                <th style={{ width: '30%' }}>Ketentuan Jam / Syarat Bukti Sah</th>
                <th style={{ width: '14%' }}>Pengurangan Poin</th>
                <th style={{ width: '14%' }}>Pengaruh ke HK</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">HADIR</td>
                <td>Hadir Lengkap Tepat Waktu</td>
                <td className="text-center">-</td>
                <td>Masuk dan pulang sesuai dengan jam kerja yang ditentukan</td>
                <td>Dapat 2 Poin Penuh</td>
                <td>Dihitung Hadir (1 Hari)</td>
              </tr>
              <tr>
                <td className="font-bold">A</td>
                <td>Alpa / Tanpa Keterangan</td>
                <td className="text-center font-bold">Kolom AP</td>
                <td>Tidak hadir tanpa pemberitahuan atau tanpa surat izin sah</td>
                <td>Dipotong 3 Poin</td>
                <td>Berkurang (-1 Hari)</td>
              </tr>
              <tr>
                <td className="font-bold">HIP</td>
                <td>Hak Izin Pagi</td>
                <td className="text-center font-bold">Kolom AH</td>
                <td>Pemanfaatan hak izin pada pagi hari dengan surat izin resmi</td>
                <td>Bebas Denda (0 Poin)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">HIS</td>
                <td>Hak Izin Siang</td>
                <td className="text-center font-bold">Kolom AI</td>
                <td>Pemanfaatan hak izin pada siang hari dengan surat izin resmi</td>
                <td>Bebas Denda (0 Poin)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">LE</td>
                <td>Late / Earlier (Terlambat / Pulang Awal)</td>
                <td className="text-center font-bold">Kolom AJ</td>
                <td>Terlambat datang atau pulang awal tanpa surat izin resmi</td>
                <td>Dipotong 1 Poin</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">I</td>
                <td>Sakit Tanpa Surat Dokter</td>
                <td className="text-center font-bold">Kolom AK</td>
                <td>Tidak hadir sakit tetapi tidak menyerahkan surat dokter</td>
                <td>Dipotong 1 Poin</td>
                <td>Berkurang (-1 Hari)</td>
              </tr>
              <tr>
                <td className="font-bold">IL</td>
                <td>Sakit Surat Dokter Sah</td>
                <td className="text-center font-bold">Kolom AL</td>
                <td>Melampirkan surat keterangan sakit resmi dari dokter/klinik</td>
                <td>Bebas Potongan (0)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">PM / P</td>
                <td>Izin Keperluan Resmi</td>
                <td className="text-center font-bold">Kolom AM</td>
                <td>Surat permohonan tertulis yang disetujui Kepala Sekolah</td>
                <td>Bebas Potongan (0)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">OTL</td>
                <td>Cuti Khusus / Alasan Penting</td>
                <td className="text-center font-bold">Kolom AN</td>
                <td>Cuti melahirkan, cuti alasan penting keluarga mendesak</td>
                <td>Bebas Potongan (0)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">AL</td>
                <td>Cuti Tahunan</td>
                <td className="text-center font-bold">Kolom AO</td>
                <td>Hak cuti tahunan resmi yang telah disetujui pimpinan</td>
                <td>Bebas Potongan (0)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">DL</td>
                <td>Dinas Luar Sekolah</td>
                <td className="text-center font-bold">Kolom AP</td>
                <td>Tugas luar sekolah berlandaskan Surat Tugas (ST) resmi</td>
                <td>Bebas Potongan (0)</td>
                <td>Tetap terhitung hadir</td>
              </tr>
              <tr>
                <td className="font-bold">LIBUR</td>
                <td>Hari Libur / Lepas Tugas</td>
                <td className="text-center">-</td>
                <td>Hari libur kalender atau jadwal lepas piket tugas</td>
                <td>Bukan Hari Kerja</td>
                <td>Tidak mempengaruhi nilai</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BAGIAN III: RUMUS & PEDOMAN NILAI KEDISIPLINAN (SKP) */}
        <div className="mb-5">
          <div className="font-bold text-[9.5pt] uppercase text-slate-900 mb-1.5 pb-1 border-b border-slate-400 print-heading">
            III. Rumus Perhitungan &amp; Pedoman Nilai Kedisiplinan (SKP)
          </div>
          <table className="print-table mb-3">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>Langkah</th>
                <th style={{ width: '22%' }}>Indikator &amp; Kolom</th>
                <th style={{ width: '38%' }}>Rumus Matematis Baku</th>
                <th style={{ width: '28%' }}>Penjelasan Singkat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">Langkah 1</td>
                <td>Hari Kerja Nyata (HK)<br /><span className="text-[7.5pt] font-semibold">Kolom AG</span></td>
                <td className="font-semibold">HK = Total Hari Kerja - (I + A)</td>
                <td>Hanya berkurang oleh Sakit Tanpa Surat (I) dan Alpa (A)</td>
              </tr>
              <tr>
                <td className="font-bold">Langkah 2</td>
                <td>Nilai Bersih (Nilai X)<br /><span className="text-[7.5pt] font-semibold">Kolom AR</span></td>
                <td className="font-semibold">X = (HK &times; 2) - (LE&times;1) - (I&times;1) - (A&times;3)</td>
                <td>Poin dasar 2/hari dikurangi denda keterlambatan dan alpa</td>
              </tr>
              <tr>
                <td className="font-bold">Langkah 3</td>
                <td>Nilai Maksimal (Y) &amp; %<br /><span className="text-[7.5pt] font-semibold">Kolom AS &amp; AT</span></td>
                <td className="font-semibold">Y = Hari Kerja &times; 2 | % = (X &divide; Y) &times; 100%</td>
                <td>Rasio perolehan poin riil terhadap poin target maksimal</td>
              </tr>
              <tr>
                <td className="font-bold">Langkah 4</td>
                <td>Score 1 &amp; Score 2 (SKP)<br /><span className="text-[7.5pt] font-semibold">Kolom AU &amp; AV</span></td>
                <td className="font-semibold">Score 1 = Skala 1 s/d 10 | Score 2 = Score 1 &times; 20%</td>
                <td>Score 2 (maksimal 2.0) dimasukkan langsung ke laporan SKP</td>
              </tr>
            </tbody>
          </table>

          <div className="font-bold text-[8.5pt] uppercase text-slate-800 mb-1">
            Tabel Komparasi Dampak Kode Presensi Terhadap HK &amp; Nilai X
          </div>
          <table className="print-table mb-3">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>Kode</th>
                <th style={{ width: '22%' }}>Keterangan</th>
                <th style={{ width: '10%' }} className="text-center">Kolom</th>
                <th style={{ width: '28%' }}>Persyaratan / Bukti Sah</th>
                <th style={{ width: '15%' }}>Dampak HK</th>
                <th style={{ width: '15%' }}>Denda Nilai X</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">HADIR</td>
                <td>Hadir Tepat Waktu</td>
                <td className="text-center">-</td>
                <td>Tap in dan tap out lengkap sesuai jam shift</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>0 Poin (+2 Penuh)</td>
              </tr>
              <tr>
                <td className="font-bold">LE</td>
                <td>Late / Earlier</td>
                <td className="text-center font-bold">Kolom AJ</td>
                <td>Telat datang atau pulang awal tanpa surat izin</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Denda -1 Poin</td>
              </tr>
              <tr>
                <td className="font-bold">HIP</td>
                <td>Hak Izin Pagi</td>
                <td className="text-center font-bold">Kolom AH</td>
                <td>Surat izin datang pagi disetujui pimpinan</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Bebas Denda (0 Poin)</td>
              </tr>
              <tr>
                <td className="font-bold">HIS</td>
                <td>Hak Izin Siang</td>
                <td className="text-center font-bold">Kolom AI</td>
                <td>Surat izin pulang siang disetujui pimpinan</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Bebas Denda (0 Poin)</td>
              </tr>
              <tr>
                <td className="font-bold">I</td>
                <td>Sakit Tanpa Surat</td>
                <td className="text-center font-bold">Kolom AK</td>
                <td>Tidak menyerahkan surat keterangan dokter sah</td>
                <td>Berkurang (-1 Hari)</td>
                <td>Denda -1 Poin</td>
              </tr>
              <tr>
                <td className="font-bold">IL</td>
                <td>Sakit Surat Dokter</td>
                <td className="text-center font-bold">Kolom AL</td>
                <td>Surat keterangan dokter/klinik/RS sah</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Bebas Denda (0 Poin)</td>
              </tr>
              <tr>
                <td className="font-bold">PM / P</td>
                <td>Izin Khusus Resmi</td>
                <td className="text-center font-bold">Kolom AM</td>
                <td>Surat izin khusus disetujui Kepala Sekolah</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Bebas Denda (0 Poin)</td>
              </tr>
              <tr>
                <td className="font-bold">OTL / AL</td>
                <td>Cuti Resmi</td>
                <td className="text-center font-bold">Kolom AN / AO</td>
                <td>Berkas pengajuan cuti resmi yang disetujui</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Bebas Denda (0 Poin)</td>
              </tr>
              <tr>
                <td className="font-bold">DL</td>
                <td>Dinas Luar</td>
                <td className="text-center font-bold">Kolom AP</td>
                <td>Surat Perintah Tugas (ST) resmi pimpinan</td>
                <td>Tetap Utuh (1 Hari)</td>
                <td>Bebas Denda (0 Poin)</td>
              </tr>
              <tr>
                <td className="font-bold">A</td>
                <td>Alpa / Bolos</td>
                <td className="text-center font-bold">Kolom AQ</td>
                <td>Tidak hadir tanpa kabar atau surat resmi</td>
                <td>Berkurang (-1 Hari)</td>
                <td>Denda Berat -3 Poin</td>
              </tr>
            </tbody>
          </table>

          <div className="font-bold text-[8.5pt] uppercase text-slate-800 mb-1">
            Tabel Pedoman Konversi Nilai Kehadiran &amp; Kedisiplinan SKP
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '24%' }}>Persentase Kehadiran</th>
                <th style={{ width: '24%' }}>Tingkat Kualifikasi</th>
                <th style={{ width: '18%' }} className="text-center">Score 1 (Skala 10)</th>
                <th style={{ width: '18%' }} className="text-center">Score 2 (Bobot 20%)</th>
                <th style={{ width: '16%' }}>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">100.0%</td>
                <td>Sempurna / Sangat Baik</td>
                <td className="text-center font-bold">10</td>
                <td className="text-center font-bold">2.0</td>
                <td>Hadir penuh tepat waktu</td>
              </tr>
              <tr>
                <td className="font-bold">90.0% s/d 99.9%</td>
                <td>Sangat Baik</td>
                <td className="text-center font-bold">9</td>
                <td className="text-center font-bold">1.8</td>
                <td>Toleransi 1-2 izin dinas ringan</td>
              </tr>
              <tr>
                <td className="font-bold">80.0% s/d 89.9%</td>
                <td>Baik</td>
                <td className="text-center font-bold">8</td>
                <td className="text-center font-bold">1.6</td>
                <td>Memenuhi standar kedisiplinan</td>
              </tr>
              <tr>
                <td className="font-bold">65.0% s/d 79.9%</td>
                <td>Cukup</td>
                <td className="text-center font-bold">7</td>
                <td className="text-center font-bold">1.4</td>
                <td>Perlu pembinaan ketepatan waktu</td>
              </tr>
              <tr>
                <td className="font-bold">50.0% s/d 64.9%</td>
                <td>Kurang</td>
                <td className="text-center font-bold">6</td>
                <td className="text-center font-bold">1.2</td>
                <td>Mendapat pembinaan pimpinan</td>
              </tr>
              <tr>
                <td className="font-bold">&lt; 50.0%</td>
                <td>Sangat Kurang</td>
                <td className="text-center font-bold">5</td>
                <td className="text-center font-bold">1.0</td>
                <td>Peringatan disiplin pegawai</td>
              </tr>
              <tr>
                <td className="font-bold">0.0% (Tidak Hadir)</td>
                <td>Tidak Pernah Hadir</td>
                <td className="text-center font-bold">0</td>
                <td className="text-center font-bold">0.0</td>
                <td>Nirkehadiran selama sebulan</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BAGIAN IV: CONTOH STUDI KASUS RIIL */}
        <div className="mb-5">
          <div className="font-bold text-[9.5pt] uppercase text-slate-900 mb-1.5 pb-1 border-b border-slate-400 print-heading">
            IV. Contoh Studi Kasus Perhitungan Riil (Simulasi Bulan 21 Hari Kerja)
          </div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Contoh Kasus</th>
                <th style={{ width: '26%' }}>Kondisi Kehadiran</th>
                <th style={{ width: '24%' }}>Rincian Hitung Nilai</th>
                <th style={{ width: '10%' }} className="text-center">Persen</th>
                <th style={{ width: '9%' }} className="text-center">Score 1</th>
                <th style={{ width: '9%' }} className="text-center">Score 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">Kasus 1: Hadir Penuh</td>
                <td>Masuk tepat waktu seluruh 21 hari</td>
                <td>HK = 21 | X = 42 poin dari 42 poin</td>
                <td className="text-center font-bold">100.0%</td>
                <td className="text-center font-bold">10</td>
                <td className="text-center font-bold">2.0</td>
              </tr>
              <tr>
                <td className="font-bold">Kasus 2: Hak Izin Pagi &amp; Siang</td>
                <td>Hak Izin Pagi (HIP) 2 kali &amp; Hak Izin Siang (HIS) 1 kali berizin</td>
                <td>HK = 21 | X = 42 poin (bebas denda / 0 denda)</td>
                <td className="text-center font-bold">100.0%</td>
                <td className="text-center font-bold">10</td>
                <td className="text-center font-bold">2.0</td>
              </tr>
              <tr>
                <td className="font-bold">Kasus 3: Terlambat/Pulang Cepat (LE)</td>
                <td>Masuk 21 hari, terlambat/pulang cepat 2 kali (LE=2)</td>
                <td>HK = 21 | X = (21&times;2) - 2 = 40 poin</td>
                <td className="text-center font-bold">95.2%</td>
                <td className="text-center font-bold">9</td>
                <td className="text-center font-bold">1.8</td>
              </tr>
              <tr>
                <td className="font-bold">Kasus 4: 1 Hari Alpa</td>
                <td>Tidak masuk 1 hari tanpa keterangan</td>
                <td>HK = 20 | X = (20&times;2) - 3 = 37 poin</td>
                <td className="text-center font-bold">88.1%</td>
                <td className="text-center font-bold">8</td>
                <td className="text-center font-bold">1.6</td>
              </tr>
              <tr>
                <td className="font-bold">Kasus 5: Sakit Surat vs Tanpa</td>
                <td>Sakit 2 hari surat dokter vs tanpa surat</td>
                <td>Surat: HK=21, X=42 | Tanpa: HK=19, X=36</td>
                <td className="text-center font-bold">100% vs 85.7%</td>
                <td className="text-center font-bold">10 vs 8</td>
                <td className="text-center font-bold">2.0 vs 1.6</td>
              </tr>
              <tr>
                <td className="font-bold">Kasus 6: Kombinasi Kedinasan</td>
                <td>1 LE + 1 HIP + 1 DL + 1 Sakit Surat Dokter</td>
                <td>HK = 21 | X = (21&times;2) - 1 = 41 poin</td>
                <td className="text-center font-bold">97.6%</td>
                <td className="text-center font-bold">9</td>
                <td className="text-center font-bold">1.8</td>
              </tr>
              <tr>
                <td className="font-bold">Kasus 7: Sanksi Berat Multi-Alpa</td>
                <td>Tidak masuk 3 hari tanpa keterangan (A = 3)</td>
                <td>HK = 18 | X = (18&times;2) - 9 = 27 poin</td>
                <td className="text-center font-bold">64.3%</td>
                <td className="text-center font-bold">6</td>
                <td className="text-center font-bold">1.2</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* BAGIAN V: LEMBAR PENGESAHAN DOKUMEN RESMI */}
        <div className="mt-8 pt-4 border-t-2 border-slate-800 print-avoid-break">
          <div className="flex justify-between items-start text-[9.5pt] text-slate-900">
            <div className="text-left w-72">
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-950">Iswan Djati Kusuma, S.Pd, M.Si</p>
              <p className="text-[8.5pt] text-slate-700">Pembina Utama Muda, IV.c</p>
              <p className="text-[8.5pt] text-slate-700">NIP. 196912232000121001</p>
            </div>

            <div className="text-left w-72">
              <p>Palembang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold">Kepala Tenaga Administrasi</p>
              <div className="h-16"></div>
              <p className="font-bold text-slate-950">Debby Leonella, A.Md.</p>
              <p className="text-[8.5pt] text-slate-700">NIP. 199007302025212024</p>
            </div>
          </div>

          <div className="mt-6 text-center text-[7.5pt] text-slate-500 border-t border-slate-300 pt-1.5">
            Dokumen ini dicetak secara sah melalui Sistem AutoAbsen SMANSS pada {new Date().toLocaleDateString('id-ID')} &bull; SMAN Sumatera Selatan
          </div>
        </div>
      </div>
    </>
  );
};
