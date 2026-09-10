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
  ExternalLink,
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
  const [calcHIP, setCalcHIP] = useState<number>(1);
  const [calcHIS, setCalcHIS] = useState<number>(0);
  const [calcI, setCalcI] = useState<number>(0);

  // Perhitungan Hasil Simulasi
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

  // Render Konten Pilihan Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'anatomy':
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                Laporan rekapitulasi kehadiran resmi SMAN Sumatera Selatan terbagi menjadi 4 bagian utama yang tersusun rapi dari Kolom A sampai AU:
              </p>
              <div className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/60">
                Susunan Resmi Laporan SMANSS
              </div>
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
                    <td rowSpan={10} className="p-3 font-bold text-amber-700 align-top bg-amber-50/20 border-r border-slate-100">
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
                    <td className="p-3 text-slate-600">Izin Pagi: Jumlah berapa kali pegawai datang terlambat (lewat 07:30) dengan surat izin.</td>
                    <td className="p-3 text-slate-500">Dipotong 1 poin. Hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AI</td>
                    <td className="p-3 font-bold text-slate-900">HIS</td>
                    <td className="p-3 text-slate-600">Izin Siang: Jumlah berapa kali pegawai pulang lebih awal (sebelum 16:00) dengan surat izin.</td>
                    <td className="p-3 text-slate-500">Dipotong 1 poin. Hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AJ</td>
                    <td className="p-3 font-bold text-slate-900">I (Sakit Tanpa Surat)</td>
                    <td className="p-3 text-slate-600">Sakit tetapi tidak melampirkan surat keterangan dokter.</td>
                    <td className="p-3 text-slate-500">Dipotong 1 poin dan mengurangi jumlah hari kerja (HK) sebanyak 1 hari.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AK</td>
                    <td className="p-3 font-bold text-slate-900">IL (Sakit Surat Dokter)</td>
                    <td className="p-3 text-slate-600">Sakit dengan melampirkan surat dokter yang sah.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AL</td>
                    <td className="p-3 font-bold text-slate-900">PM / P (Izin Resmi)</td>
                    <td className="p-3 text-slate-600">Izin keperluan tertulis yang disetujui Kepala Sekolah.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AM</td>
                    <td className="p-3 font-bold text-slate-900">OTL (Cuti Lainnya)</td>
                    <td className="p-3 text-slate-600">Cuti resmi seperti cuti melahirkan, cuti alasan penting keluarga, dll.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AN</td>
                    <td className="p-3 font-bold text-slate-900">AL (Cuti Tahunan)</td>
                    <td className="p-3 text-slate-600">Hak cuti tahunan resmi pegawai yang telah disetujui.</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AO</td>
                    <td className="p-3 font-bold text-slate-900">DL (Dinas Luar)</td>
                    <td className="p-3 text-slate-600">Menjalankan tugas kedinasan di luar sekolah disertai Surat Tugas (ST).</td>
                    <td className="p-3 text-slate-500">Nilai utuh (tidak dipotong) dan hari kerja (HK) tetap dihitung hadir.</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AP</td>
                    <td className="p-3 font-bold text-slate-900">A (Alpa / Tanpa Keterangan)</td>
                    <td className="p-3 text-slate-600">Tidak masuk bekerja tanpa pemberitahuan atau tanpa izin resmi.</td>
                    <td className="p-3 text-slate-500">Pengurangan berat: dipotong 3 poin dan mengurangi hari kerja (HK) 1 hari.</td>
                  </tr>

                  {/* Bagian 4: Penilaian Kedisiplinan */}
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td rowSpan={5} className="p-3 font-bold text-purple-700 align-top bg-purple-50/20 border-r border-slate-100">
                      Bagian 4: Penilaian Nilai &amp; Kedisiplinan
                    </td>
                    <td className="p-3 font-bold text-slate-800">Kolom AQ</td>
                    <td className="p-3 font-bold text-slate-900">Nilai X</td>
                    <td className="p-3 text-slate-600">Total poin nilai kehadiran bersih yang berhasil dikumpulkan pegawai.</td>
                    <td className="p-3 text-slate-500">
                      Hari kerja dihadiri dikali 2 poin, lalu dikurangi potongan izin atau alpa.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AR</td>
                    <td className="p-3 font-bold text-slate-900">Nilai Y</td>
                    <td className="p-3 text-slate-600">Nilai maksimal jika pegawai hadir lengkap 100% tanpa ada potongan.</td>
                    <td className="p-3 text-slate-500">
                      Total seluruh hari kerja dalam sebulan dikali 2 poin.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AS</td>
                    <td className="p-3 font-bold text-slate-900">Persentase (%)</td>
                    <td className="p-3 text-slate-600">Tingkat kehadiran pegawai dalam bentuk persen (%).</td>
                    <td className="p-3 text-slate-500">
                      Nilai yang didapat (X) dibagi nilai maksimal (Y) dikali 100%.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AT</td>
                    <td className="p-3 font-bold text-slate-900">Score 1 (Nilai Kehadiran)</td>
                    <td className="p-3 text-slate-600">Nilai prestasi kehadiran pegawai dalam skala angka 1 sampai 10.</td>
                    <td className="p-3 text-slate-500">
                      Berupa angka bulat resmi: 10, 9, 8, 7, 6, atau 5.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-800">Kolom AU</td>
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
                Jam kerja normal di SMAN Sumatera Selatan adalah <strong>pukul 07:30 sampai 16:00 WIB</strong> (atau sesuai jadwal tugas/shift). Pegawai wajib melakukan absen datang saat masuk dan absen pulang saat selesai bertugas:
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
                    <td className="p-3 text-slate-600">Masuk sebelum 07:30 dan pulang setelah 16:00 (absen datang dan pulang lengkap)</td>
                    <td className="p-3 font-bold text-emerald-600">Dapat 2 Poin Penuh</td>
                    <td className="p-3 text-emerald-700 font-semibold">Dihitung Hadir Penuh (1 Hari)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-rose-700">A</td>
                    <td className="p-3 font-semibold text-slate-900">Alpa / Tanpa Keterangan</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AP</td>
                    <td className="p-3 text-slate-600">Tidak masuk bekerja tanpa menyerahkan surat izin atau pemberitahuan</td>
                    <td className="p-3 font-bold text-rose-600">Dipotong 3 Poin (Sanksi Berat)</td>
                    <td className="p-3 text-rose-700 font-semibold">Hari Kerja Berkurang 1 Hari</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIP</td>
                    <td className="p-3 font-semibold text-slate-900">Izin Datang Terlambat</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AH</td>
                    <td className="p-3 text-slate-600">Datang lewat dari pukul 07:30 dengan membawa surat izin resmi</td>
                    <td className="p-3 font-bold text-amber-600">Dipotong 1 Poin</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">HIS</td>
                    <td className="p-3 font-semibold text-slate-900">Izin Pulang Cepat</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AI</td>
                    <td className="p-3 text-slate-600">Pulang sebelum pukul 16:00 dengan membawa surat izin resmi</td>
                    <td className="p-3 font-bold text-amber-600">Dipotong 1 Poin</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-amber-700">I</td>
                    <td className="p-3 font-semibold text-slate-900">Sakit Tanpa Surat Dokter</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AJ</td>
                    <td className="p-3 text-slate-600">Tidak masuk karena sakit tetapi tidak melampirkan surat dokter</td>
                    <td className="p-3 font-bold text-amber-600">Dipotong 1 Poin</td>
                    <td className="p-3 text-rose-700 font-semibold">Hari Kerja Berkurang 1 Hari</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">IL</td>
                    <td className="p-3 font-semibold text-slate-900">Sakit Dengan Surat Dokter</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AK</td>
                    <td className="p-3 text-slate-600">Melampirkan surat keterangan sakit resmi dari dokter/klinik</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">PM / P</td>
                    <td className="p-3 font-semibold text-slate-900">Izin Keperluan Resmi</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AL</td>
                    <td className="p-3 text-slate-600">Ada surat permohonan izin tertulis yang disetujui Kepala Sekolah</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">OTL</td>
                    <td className="p-3 font-semibold text-slate-900">Cuti Khusus / Alasan Penting</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AM</td>
                    <td className="p-3 text-slate-600">Cuti melahirkan, cuti alasan penting keluarga, atau cuti besar</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">AL</td>
                    <td className="p-3 font-semibold text-slate-900">Cuti Tahunan</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AN</td>
                    <td className="p-3 text-slate-600">Hak cuti tahunan pegawai yang telah diajukan dan disetujui</td>
                    <td className="p-3 font-bold text-blue-600">Nilai Utuh (Tidak Dipotong)</td>
                    <td className="p-3 text-slate-600">Tetap dihitung hadir bekerja</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-blue-700">DL</td>
                    <td className="p-3 font-semibold text-slate-900">Dinas Luar Sekolah</td>
                    <td className="p-3 text-center font-bold text-slate-700">Kolom AO</td>
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
          </div>
        );

      case 'formulas':
        return (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-slate-600">
                Penilaian kehadiran pegawai dihitung secara adil dan transparan melalui 4 langkah mudah berikut:
              </p>
            </div>

            {/* Bagian 1: Tabel 4 Langkah Cara Menghitung (Bahasa Awam) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-28">Langkah</th>
                    <th className="p-3 font-bold text-slate-700 w-44">Yang Dihitung &amp; Kolom</th>
                    <th className="p-3 font-bold text-slate-700 w-80">Cara Menghitung</th>
                    <th className="p-3 font-bold text-slate-700">Penjelasan Singkat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 1</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Hari Kerja Nyata (HK)<br />
                      <span className="text-slate-500 text-[11px]">Kolom AG</span>
                    </td>
                    <td className="p-3 font-semibold text-blue-700 bg-slate-50/50">
                      Hari Kerja Bulan Ini dikurangi Sakit Tanpa Surat (I) dikurangi Alpa (A)
                    </td>
                    <td className="p-3 text-slate-600">
                      Hari kerja pegawai hanya berkurang jika tidak masuk tanpa keterangan (Alpa) atau sakit tanpa surat dokter.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 2</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Nilai Bersih Yang Didapat (Nilai X)<br />
                      <span className="text-slate-500 text-[11px]">Kolom AQ</span>
                    </td>
                    <td className="p-3 font-semibold text-blue-700 bg-slate-50/50">
                      (Hari Kerja Nyata &times; 2 poin) dikurangi potongan terlambat, pulang cepat, sakit tanpa surat, dan alpa
                    </td>
                    <td className="p-3 text-slate-600">
                      Setiap hari kerja bernilai 2 poin. Terlambat dipotong 1 poin, pulang cepat dipotong 1 poin, dan alpa dipotong 3 poin.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 3</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Nilai Maksimal &amp; Persentase (%)<br />
                      <span className="text-slate-500 text-[11px]">Kolom AR &amp; AS</span>
                    </td>
                    <td className="p-3 font-semibold text-blue-700 bg-slate-50/50">
                      Nilai Maksimal = Hari Kerja Bulan Ini &times; 2 poin<br />
                      Persentase = (Nilai Bersih &divide; Nilai Maksimal) &times; 100%
                    </td>
                    <td className="p-3 text-slate-600">
                      Membandingkan nilai yang berhasil didapat pegawai dengan nilai tertinggi jika hadir penuh 100%.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">Langkah 4</td>
                    <td className="p-3 font-semibold text-slate-800">
                      Nilai Kehadiran &amp; Nilai Kedisiplinan SKP<br />
                      <span className="text-slate-500 text-[11px]">Kolom AT &amp; AU</span>
                    </td>
                    <td className="p-3 font-semibold text-blue-700 bg-slate-50/50">
                      Score 1 = Nilai skala 1 sampai 10<br />
                      Score 2 = Score 1 &times; 20% (Nilai maksimal 2.0)
                    </td>
                    <td className="p-3 text-slate-600">
                      Score 1 adalah nilai prestasi kehadiran (skala 1–10). Score 2 adalah bobot 20% (maksimal 2.0) untuk dimasukkan ke laporan SKP pegawai.
                    </td>
                  </tr>
                </tbody>
              </table>
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
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 font-bold text-xs text-slate-700">
                  Isian Contoh Kehadiran Pegawai
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-white text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Hari Kerja Bulan Ini
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={calcWorkingDays}
                      onChange={(e) => setCalcWorkingDays(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Hari aktif sekolah (contoh: 21)</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jumlah Alpa (A)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={calcWorkingDays}
                      value={calcAlpha}
                      onChange={(e) => setCalcAlpha(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-rose-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-rose-500 mt-0.5 block">Dipotong 3 poin &amp; kurang 1 hari kerja</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Izin Datang Terlambat (HIP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcHIP}
                      onChange={(e) => setCalcHIP(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Dipotong 1 poin per kali</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Izin Pulang Cepat (HIS)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcHIS}
                      onChange={(e) => setCalcHIS(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Dipotong 1 poin per kali</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sakit Tanpa Surat Dokter (I)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={calcI}
                      onChange={(e) => setCalcI(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-amber-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Dipotong 1 poin &amp; kurang 1 hari kerja</span>
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
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AQ</td>
                      <td className="p-3 text-slate-600">({calcHK} hari &times; 2) dikurangi potongan denda ({calcHIP + calcHIS + calcI + calcAlpha * 3} poin)</td>
                      <td className="p-3 text-center font-black text-blue-700 text-sm">{calcX} Poin</td>
                      <td className="p-3 text-slate-500">Poin bersih yang berhasil dikumpulkan</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Nilai Maksimal (Nilai Y)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AR</td>
                      <td className="p-3 text-slate-600">{calcWorkingDays} hari kerja &times; 2 poin</td>
                      <td className="p-3 text-center font-black text-slate-700 text-sm">{calcY} Poin</td>
                      <td className="p-3 text-slate-500">Poin tertinggi jika hadir lengkap 100%</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">Persentase Kehadiran (%)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AS</td>
                      <td className="p-3 text-slate-600">({calcX} &divide; {calcY}) &times; 100%</td>
                      <td className="p-3 text-center font-black text-emerald-700 text-sm">{calcPct.toFixed(1)}%</td>
                      <td className="p-3 text-slate-500">Tingkat kehadiran kerja bulan ini</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors bg-blue-50/20">
                      <td className="p-3 font-bold text-slate-900">Score 1 (Nilai Kehadiran)</td>
                      <td className="p-3 text-center font-bold text-slate-700">Kolom AT</td>
                      <td className="p-3 text-slate-600">Sesuai pedoman persentase (skala nilai 1 sampai 10)</td>
                      <td className="p-3 text-center font-black text-slate-900 text-base">{calcScore1}</td>
                      <td className="p-3 font-semibold text-blue-800">Nilai Prestasi Kehadiran (Skala 1 s/d 10)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors bg-blue-50/30">
                      <td className="p-3 font-bold text-blue-900">Score 2 (Kedisiplinan SKP)</td>
                      <td className="p-3 text-center font-bold text-blue-900">Kolom AU</td>
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
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Berikut ini adalah contoh nyata perhitungan nilai kehadiran untuk bulan dengan <strong>21 hari kerja</strong> (seperti bulan September):
            </p>

            {/* Tabel Contoh Kasus Nyata (Bahasa Awam) */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-3 font-bold text-slate-700 w-52">Nama Contoh Kasus</th>
                    <th className="p-3 font-bold text-slate-700">Kondisi Kehadiran Pegawai</th>
                    <th className="p-3 font-bold text-slate-700 w-64">Langkah Perhitungan Sederhana</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-28">Persentase</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-24">Score 1</th>
                    <th className="p-3 font-bold text-slate-700 text-center w-28">Score 2</th>
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
                      Kasus 2: Pernah Terlambat &amp; Pulang Cepat<br />
                      <span className="text-[11px] font-normal text-slate-500">Semua Membawa Surat Izin Resmi</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      Datang terlambat 2 kali dan pulang cepat 1 kali, seluruhnya ada surat izin. Tidak pernah alpa.
                    </td>
                    <td className="p-3 text-[11px] text-slate-700">
                      Hari Kerja: Tetap 21 hari.<br />
                      Nilai: 42 dikurangi 2 (izin pagi) dikurangi 1 (izin siang) = <strong>39 Poin</strong>.
                    </td>
                    <td className="p-3 text-center font-black text-slate-800">92.8%</td>
                    <td className="p-3 text-center font-black text-slate-900">9</td>
                    <td className="p-3 text-center font-black text-blue-700">1.8</td>
                    <td className="p-3 font-semibold text-slate-700">Sangat Baik (Disiplin Terjaga)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      Kasus 3: Tidak Masuk 1 Hari Tanpa Izin<br />
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
                      Kasus 4: Sakit Surat Dokter vs Tanpa Surat<br />
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
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // JIKA DITAMPILKAN SEBAGAI TAB DI HALAMAN DASHBOARD
  if (isEmbeddedView) {
    return (
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
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                linkCopied
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

            <a
              href="/panduan"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hidden sm:flex"
              title="Buka tampilan publik di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Buka Halaman Publik</span>
            </a>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Panduan</span>
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

        {/* Isi Tab */}
        <div>{renderTabContent()}</div>
      </div>
    );
  }

  // JIKA DITAMPILKAN SEBAGAI JENDELA POPUP (MODAL)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
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
  );
};
