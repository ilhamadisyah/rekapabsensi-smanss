import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { DailyAttendance, Employee, AttendanceCode } from '../types';
import { getEmployeeNameByMachineId } from './employee-mapping';

// Map day index 1..30 to Excel Column letter C..AF
export function getColumnLetterForDay(day: number): string {
  // Day 1 = C (col index 3)
  // Day 2 = D (col index 4)
  // Day 24 = Z (col index 26)
  // Day 25 = AA (col index 27)
  // Day 30 = AF (col index 32)
  const colIndex = day + 2; // 1-based index where C is 3
  if (colIndex <= 26) {
    return String.fromCharCode(64 + colIndex);
  }
  const first = String.fromCharCode(64 + Math.floor((colIndex - 1) / 26));
  const second = String.fromCharCode(65 + ((colIndex - 1) % 26));
  return `${first}${second}`;
}

const DAY_NAMES_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const MONTH_NAMES_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface ExportOptions {
  month: number;
  year: number;
  employees: Employee[];
  attendanceRecords: DailyAttendance[];
  templatePath?: string;
  fromDay?: number;
  toDay?: number;
  department?: 'ALL' | 'Guru' | 'TU';
  includeSignatures?: boolean;
}

/**
 * Generates official attendance recapitulation Excel (.xlsx)
 * - Uses formt rekap absen.xlsx as visual template / layout
 * - All calculations (HK, HIP, HIS, I, IL, PM, OTL, AL, DL, A, X, Y, Persentase, Score 1, Score Kedisiplinan)
 *   are performed dynamically in web (pure values, no broken formulas)
 * - Injects all employee names from attendance & master records into column B
 * - Places signature section dynamically after the final employee row
 */
export async function generateRekapExcel(options: ExportOptions): Promise<Buffer> {
  const { month, year, attendanceRecords } = options;
  const fromDay = Math.max(1, options.fromDay || 1);
  const toDay = Math.min(30, options.toDay || 30);
  const includeSignatures = options.includeSignatures !== false;

  // Filter employees by department if specified
  let employees = options.employees;
  if (options.department === 'Guru') {
    employees = employees.filter((e) => e.department.includes('Guru'));
  } else if (options.department === 'TU') {
    employees = employees.filter((e) => e.department.includes('TU'));
  }

  const templatePath = options.templatePath || path.resolve(process.cwd(), 'formt rekap absen.xlsx');

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Master template tidak ditemukan di path: ${templatePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Worksheet utama tidak ditemukan dalam template.');
  }

  // 1. Update Periode pada sel A8
  const a8Cell = worksheet.getCell('A8');
  a8Cell.value = new Date(Date.UTC(year, month - 1, 1));
  a8Cell.numFmt = 'mmmm yyyy';

  // 2. Hitung jumlah Hari Kerja Efektif (Senin - Jumat) dalam rentang fromDay s/d toDay
  let totalWorkingDays = 0;
  for (let day = fromDay; day <= toDay; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0: SUN, 1: MON, ..., 6: SAT
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      totalWorkingDays++;
    }
  }

  // Set total hari kerja pada header sel AG16
  const ag16Cell = worksheet.getCell('AG16');
  ag16Cell.value = totalWorkingDays;
  ag16Cell.alignment = { horizontal: 'center', vertical: 'middle' };
  ag16Cell.font = { name: 'Calibri', size: 10, bold: true };

  // 3. Update Header Hari (Row 11 & Row 12) sesuai kalender bulan yang dipilih
  for (let day = 1; day <= 30; day++) {
    const colLetter = getColumnLetterForDay(day);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dayName = DAY_NAMES_EN[dayOfWeek];

    const cellRow11 = worksheet.getCell(`${colLetter}11`);
    const cellRow12 = worksheet.getCell(`${colLetter}12`);

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: SAT / SUN di Row 11, kosongkan di Row 12
      cellRow11.value = dayName;
      cellRow12.value = null;
    } else {
      // Weekday: Kosong di Row 11, Day Name di Row 12
      cellRow11.value = null;
      cellRow12.value = dayName;
    }
  }

  // 4. Bangun daftar seluruh pegawai (seluruh master employees + pegawai baru yang ada di log)
  const allEmployees: Employee[] = [...employees];
  const existingMachineIds = new Set(employees.map((e) => e.machine_id));

  for (const record of attendanceRecords) {
    if (!existingMachineIds.has(record.employee_id)) {
      // If department filter is active, check if record matches
      if (options.department === 'Guru' && !record.employee_name?.includes('Guru')) {
        continue;
      }
      if (options.department === 'TU' && !record.employee_name?.includes('TU')) {
        continue;
      }
      existingMachineIds.add(record.employee_id);
      const resolvedName =
        record.employee_name ||
        getEmployeeNameByMachineId(record.employee_id) ||
        `Pegawai ${record.employee_id}`;

      allEmployees.push({
        id: `emp-auto-${record.employee_id}`,
        machine_id: record.employee_id,
        nik: '',
        full_name: resolvedName,
        department: options.department === 'Guru' ? 'Guru' : options.department === 'TU' ? 'Tata Usaha' : 'Pegawai',
        excel_row_index: 999,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 5. Map attendance records for fast lookup: `${employee_id}__${day}`
  const attendanceMap = new Map<string, DailyAttendance>();
  const recordedDays = new Set<number>();
  for (const record of attendanceRecords) {
    const parts = record.attendance_date.split('-');
    const rYear = parseInt(parts[0], 10);
    const rMonth = parseInt(parts[1], 10);
    const rDay = parseInt(parts[2], 10);

    if (rYear === year && rMonth === month) {
      recordedDays.add(rDay);
      attendanceMap.set(`${record.employee_id}__${rDay}`, record);
    }
  }

  // Visual Styles
  const PRESENT_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC6EFCE' },
  };
  const PRESENT_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    color: { argb: 'FF006100' },
    size: 9,
    bold: true,
  };

  const ABSENT_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC7CE' },
  };
  const ABSENT_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    color: { argb: 'FF9C0006' },
    size: 9,
    bold: true,
  };

  const VERIFIED_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEB9C' },
  };
  const VERIFIED_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    color: { argb: 'FF9C6500' },
    size: 9,
    bold: true,
  };

  const DEFAULT_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
  };

  // Bersihkan baris lama di template dari baris 17 s/d 140 agar bebas dari formula korup dan teks lama
  for (let r = 17; r <= Math.max(130, 17 + allEmployees.length + 15); r++) {
    const row = worksheet.getRow(r);
    row.eachCell((cell) => {
      cell.value = null;
      cell.fill = { type: 'pattern', pattern: 'none' };
      cell.border = {};
    });
  }

  // 6. Masukkan seluruh nama pegawai, hari kehadiran, dan perhitungan otomatis ke baris 17 dst.
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i];
    const rowIdx = 17 + i;

    // Kolom A: NO
    const cellA = worksheet.getCell(`A${rowIdx}`);
    cellA.value = i + 1;
    cellA.alignment = { horizontal: 'center', vertical: 'middle' };
    cellA.font = { name: 'Calibri', size: 9, bold: true };
    cellA.border = DEFAULT_BORDER;

    // Kolom B: NAMA LENGKAP PEGAWAI
    const cellB = worksheet.getCell(`B${rowIdx}`);
    const finalDisplayName =
      emp.full_name && !emp.full_name.toLowerCase().includes('pegawai (id:') && !emp.full_name.toLowerCase().includes('pegawai id')
        ? emp.full_name
        : getEmployeeNameByMachineId(emp.machine_id, emp.full_name);
    cellB.value = finalDisplayName;
    cellB.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cellB.font = { name: 'Calibri', size: 9, bold: false };
    cellB.border = DEFAULT_BORDER;

    // Variabel kalkulasi kehadiran per pegawai
    let countHIP = 0;
    let countHIS = 0;
    let countI = 0;
    let countIL = 0;
    let countPM = 0;
    let countOTL = 0;
    let countAL = 0;
    let countDL = 0;
    let countA = 0;

    // Kolom C s/d AF: Presensi Hari 1 s/d 30
    for (let day = 1; day <= 30; day++) {
      const colLetter = getColumnLetterForDay(day);
      const cell = worksheet.getCell(`${colLetter}${rowIdx}`);

      // Jika hari berada di luar rentang pilihan ekspor (fromDay s/d toDay) -> kosongkan
      if (day < fromDay || day > toDay) {
        cell.value = null;
        cell.fill = { type: 'pattern', pattern: 'none' };
        cell.border = DEFAULT_BORDER;
        continue;
      }

      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = DEFAULT_BORDER;

      if (isWeekend) {
        cell.value = null;
        cell.fill = { type: 'pattern', pattern: 'none' };
        continue;
      }

      const rec = attendanceMap.get(`${emp.machine_id}__${day}`);
      const isRecorded = recordedDays.size > 0 ? recordedDays.has(day) : false;
      const isVerified = rec && rec.is_verified;

      // Jika hari tersebut belum ada log mesin dan belum diverifikasi manual -> kosongkan
      if (!isRecorded && !isVerified) {
        cell.value = null;
        cell.fill = { type: 'pattern', pattern: 'none' };
        continue;
      }

      const status: AttendanceCode = rec ? rec.final_status : 'A';

      if (status === 'HADIR') {
        cell.value = null; // Dibiarkan kosong dengan warna hijau sesuai format resmi
        cell.fill = PRESENT_FILL;
        cell.font = PRESENT_FONT;
      } else if (status === 'A') {
        cell.value = 'A';
        cell.fill = ABSENT_FILL;
        cell.font = ABSENT_FONT;
        countA++;
      } else {
        // Status verifikasi izin/sakit/cuti/dinas
        cell.value = status;
        cell.fill = VERIFIED_FILL;
        cell.font = VERIFIED_FONT;

        if (status === 'HIP') countHIP++;
        else if (status === 'HIS') countHIS++;
        else if (status === 'I') countI++;
        else if (status === 'IL') countIL++;
        else if (status === 'PM') countPM++;
        else if (status === 'OTL') countOTL++;
        else if (status === 'AL') countAL++;
        else if (status === 'DL') countDL++;
      }
    }

    // Perhitungan logika di Web (Tanpa ketergantungan rumus Excel yang rentan korup)
    // 1. Hari Kerja (HK): Hari kerja aktif yang dihadiri / tidak terhitung I atau A
    const hk = Math.max(0, totalWorkingDays - countI - countA);

    // 2. Skor Nilai X:
    // (HK * 2) - HIP(1) - HIS(1) - I(1) - A(3)
    const scoreX = Math.max(0, (hk * 2) - (countHIP * 1) - (countHIS * 1) - (countI * 1) - (countA * 3));

    // 3. Skor Nilai Y: Total poin maksimal hari kerja
    const scoreY = totalWorkingDays * 2;

    // 4. Persentase Kehadiran
    const persentase = scoreY > 0 ? Math.min(100, Math.max(0, Math.round((scoreX / scoreY) * 10000) / 100)) : 0;

    // 5. SCORE 1 (Skala Nilai SMANSS)
    let score1 = 50;
    if (persentase >= 100) score1 = 100;
    else if (persentase >= 90) score1 = 90;
    else if (persentase >= 80) score1 = 80;
    else if (persentase >= 65) score1 = 70;
    else if (persentase >= 50) score1 = 60;
    else score1 = 50;

    // 6. SCORE KEDISIPLINAN (20% dari Score 1)
    const scoreKedisiplinan = Math.round(score1 * 0.2 * 10) / 10;

    // Tulis nilai hasil perhitungan ke kolom AG s/d AU (Nilai murni tanpa rumus)
    const calculatedColumns: [string, number | null, string?][] = [
      ['AG', hk],
      ['AH', countHIP],
      ['AI', countHIS],
      ['AJ', countI],
      ['AK', countIL],
      ['AL', countPM],
      ['AM', countOTL],
      ['AN', countAL],
      ['AO', countDL],
      ['AP', countA],
      ['AQ', scoreX],
      ['AR', scoreY],
      ['AS', persentase / 100, '0.0%'],
      ['AT', score1],
      ['AU', scoreKedisiplinan, '0.0'],
    ];

    for (const [col, val, fmt] of calculatedColumns) {
      const cell = worksheet.getCell(`${col}${rowIdx}`);
      cell.value = val;
      cell.border = DEFAULT_BORDER;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { name: 'Calibri', size: 9 };
      if (fmt) {
        cell.numFmt = fmt;
      }
    }
  }

  // 7. Letakkan blok tanda tangan resmi secara dinamis tepat setelah baris pegawai terakhir (jika diaktifkan)
  if (includeSignatures) {
    const lastRowUsed = 17 + allEmployees.length - 1;
    const mName = MONTH_NAMES_ID[month] || `Bulan ${month}`;
    const signRow = lastRowUsed + 2;

    // Tanggal Pengesahan
    const cellSignDate = worksheet.getCell(`W${signRow}`);
    cellSignDate.value = `Palembang, ${toDay} ${mName} ${year}`;
    cellSignDate.font = { name: 'Calibri', size: 9 };
    cellSignDate.alignment = { horizontal: 'center', vertical: 'middle' };

    // Mengetahui & Dibuat Oleh
    const cellMengetahui = worksheet.getCell(`C${signRow + 1}`);
    cellMengetahui.value = 'Mengetahui,';
    cellMengetahui.font = { name: 'Calibri', size: 9 };
    cellMengetahui.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellDibuat = worksheet.getCell(`W${signRow + 1}`);
    cellDibuat.value = 'Dibuat Oleh,';
    cellDibuat.font = { name: 'Calibri', size: 9 };
    cellDibuat.alignment = { horizontal: 'center', vertical: 'middle' };

    // Jabatan
    const cellJabatanKepsek = worksheet.getCell(`C${signRow + 2}`);
    cellJabatanKepsek.value = 'Kepala Sekolah';
    cellJabatanKepsek.font = { name: 'Calibri', size: 9 };
    cellJabatanKepsek.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellJabatanTU = worksheet.getCell(`W${signRow + 2}`);
    cellJabatanTU.value = 'Kepala Tenaga Administrasi';
    cellJabatanTU.font = { name: 'Calibri', size: 9 };
    cellJabatanTU.alignment = { horizontal: 'center', vertical: 'middle' };

    // Nama Pejabat
    const cellNamaKepsek = worksheet.getCell(`C${signRow + 6}`);
    cellNamaKepsek.value = 'Iswan Djati Kusuma, S.Pd, M.Si';
    cellNamaKepsek.font = { name: 'Calibri', size: 9, bold: true, underline: true };
    cellNamaKepsek.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellNamaTU = worksheet.getCell(`W${signRow + 6}`);
    cellNamaTU.value = 'Debby Leonella, A.Md.';
    cellNamaTU.font = { name: 'Calibri', size: 9, bold: true, underline: true };
    cellNamaTU.alignment = { horizontal: 'center', vertical: 'middle' };

    // NIP & Pangkat
    const cellPangkatKepsek = worksheet.getCell(`C${signRow + 7}`);
    cellPangkatKepsek.value = 'Pembina Utama Muda, IV.c';
    cellPangkatKepsek.font = { name: 'Calibri', size: 9 };
    cellPangkatKepsek.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellNipTU = worksheet.getCell(`W${signRow + 7}`);
    cellNipTU.value = 'NIP 199007302025212024';
    cellNipTU.font = { name: 'Calibri', size: 9 };
    cellNipTU.alignment = { horizontal: 'center', vertical: 'middle' };

    const cellNipKepsek = worksheet.getCell(`C${signRow + 8}`);
    cellNipKepsek.value = 'NIP 196912232000121001';
    cellNipKepsek.font = { name: 'Calibri', size: 9 };
    cellNipKepsek.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // 8. Return as binary Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
