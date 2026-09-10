import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { DailyAttendance, Employee, AttendanceCode, Holiday, EmployeeSchedule, ShiftTemplate } from '../types';
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
  holidays?: Holiday[];
  schedules?: EmployeeSchedule[];
  shifts?: ShiftTemplate[];
  templatePath?: string;
  fromDay?: number;
  toDay?: number;
  department?: 'ALL' | 'Guru' | 'TU';
  includeSignatures?: boolean;
}

/**
 * Helper to assign independent (unshared) styles to an ExcelJS cell
 * Prevents mutation leaks across cells that shared style instances in template
 */
function setCellStyle(
  cell: ExcelJS.Cell,
  style: {
    font?: Partial<ExcelJS.Font>;
    fill?: ExcelJS.Fill;
    border?: Partial<ExcelJS.Borders>;
    alignment?: Partial<ExcelJS.Alignment>;
    numFmt?: string;
  }
) {
  cell.style = {
    font: style.font,
    fill: style.fill,
    border: style.border,
    alignment: style.alignment,
    numFmt: style.numFmt,
  };
}

/**
 * Generates official attendance recapitulation Excel (.xlsx)
 * - Uses formt rekap absen.xlsx as visual template / layout
 * - All calculations (HK, HIP, HIS, I, IL, PM, OTL, AL, DL, A, X, Y, Persentase, Score 1, Score Kedisiplinan)
 *   are performed dynamically in web (pure values, no broken formulas)
 * - Injects all employee names from attendance & master records into column B
 * - Places signature section dynamically after the final employee row
 * - Dynamically colors weekends & holidays red (#FFFF0000) on header and column cells
 * - Aligns all attendance and summary cells to center & middle
 * - Ensures clean borders on all four sides of each data cell
 * - Cleans old template comments and formula artifacts (e.g. Jun-26)
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

  // 1. Hapus SEMUA sisa note/comment lama template secara mendalam agar tidak muncul segitiga merah
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      (cell as any)._comment = undefined;
      delete (cell as any)._comment;
      delete (cell as any).note;
      delete (cell as any).comment;
      if ((cell as any)._value && (cell as any)._value.model) {
        delete (cell as any)._value.model.comment;
      }
    });
  });

  // 2. Lookup Maps untuk hari libur & jadwal khusus
  const holidays = options.holidays || [];
  const holidayMap = new Map(holidays.map((h) => [h.date, h]));

  const schedules = options.schedules || [];
  const scheduleMap = new Map(schedules.map((s) => [`${s.employee_id}___${s.date}`, s]));

  // Visual Styles
  const RED_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF0000' },
  };

  const NONE_FILL: ExcelJS.FillPattern = {
    type: 'pattern',
    pattern: 'none',
  };

  const WHITE_BOLD_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 9,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };

  const BLACK_BOLD_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 9,
    bold: true,
    color: { argb: 'FF000000' },
  };

  const BLACK_REGULAR_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 9,
    bold: false,
    color: { argb: 'FF000000' },
  };

  const RED_BOLD_FONT: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    size: 9,
    bold: true,
    color: { argb: 'FF9C0006' },
  };

  const DEFAULT_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  const CENTER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
    horizontal: 'center',
    vertical: 'middle',
  };

  const LEFT_INDENT_ALIGNMENT: Partial<ExcelJS.Alignment> = {
    horizontal: 'left',
    vertical: 'middle',
    indent: 1,
  };

  // 3. Update Judul Periode pada sel A8
  const a8Cell = worksheet.getCell('A8');
  a8Cell.value = `${MONTH_NAMES_ID[month] || `Bulan ${month}`} ${year}`;
  setCellStyle(a8Cell, {
    font: { name: 'Calibri', size: 11, bold: true },
    alignment: CENTER_ALIGNMENT,
  });

  // 4. Update Banner Hijau Bulan pada sel C10 (sebelumnya terkunci formula Jun-26)
  const c10Cell = worksheet.getCell('C10');
  const shortMonth = (MONTH_NAMES_ID[month] || '').slice(0, 3);
  c10Cell.value = `${shortMonth}-${String(year).slice(-2)}`;
  setCellStyle(c10Cell, {
    font: { name: 'Calibri', size: 10, bold: true },
    alignment: CENTER_ALIGNMENT,
  });

  // Hapus formula AG12 yang mengunci Jun-26
  const ag12Cell = worksheet.getCell('AG12');
  ag12Cell.value = null;

  // 5. Hitung jumlah Hari Kerja Efektif (Senin - Jumat yang bukan hari libur)
  let totalWorkingDays = 0;
  for (let day = fromDay; day <= toDay; day++) {
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0: SUN, 1: MON, ..., 6: SAT
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayMap.has(dateStr);

    if (!isWeekend && !isHoliday) {
      totalWorkingDays++;
    }
  }

  // Set total hari kerja pada header sel AG16
  const ag16Cell = worksheet.getCell('AG16');
  ag16Cell.value = totalWorkingDays;
  setCellStyle(ag16Cell, {
    font: { name: 'Calibri', size: 10, bold: true },
    border: DEFAULT_BORDER,
    alignment: CENTER_ALIGNMENT,
  });

  // 6. Rapikan Header Tabel (Row 11 s/d 16): Satukan row 11 & 12 agar presisi, rapi, dan border hitam tegas
  // Kolom A: NO (Merged A11:A15)
  try { worksheet.unMergeCells('A12:A15'); } catch {}
  try { worksheet.mergeCells('A11:A15'); } catch {}
  const a11Cell = worksheet.getCell('A11');
  a11Cell.value = 'NO';
  for (let r = 11; r <= 15; r++) {
    setCellStyle(worksheet.getCell(`A${r}`), {
      font: BLACK_BOLD_FONT,
      fill: NONE_FILL,
      border: DEFAULT_BORDER,
      alignment: CENTER_ALIGNMENT,
    });
  }

  // Kolom B: NAME (Merged B11:B15)
  try { worksheet.unMergeCells('B12:B15'); } catch {}
  try { worksheet.mergeCells('B11:B15'); } catch {}
  const b11Cell = worksheet.getCell('B11');
  b11Cell.value = 'NAME';
  for (let r = 11; r <= 15; r++) {
    setCellStyle(worksheet.getCell(`B${r}`), {
      font: BLACK_BOLD_FONT,
      fill: NONE_FILL,
      border: DEFAULT_BORDER,
      alignment: CENTER_ALIGNMENT,
    });
  }

  // Header Ringkasan Kolom AG..AP: REKAPITULASI KEHADIRAN (Merged AG11:AP12)
  try { worksheet.unMergeCells('AG12:AP12'); } catch {}
  try { worksheet.mergeCells('AG11:AP12'); } catch {}
  const ag11Cell = worksheet.getCell('AG11');
  ag11Cell.value = 'REKAPITULASI KEHADIRAN';
  for (let r = 11; r <= 12; r++) {
    for (let c = 33; c <= 42; c++) {
      const colLet = worksheet.getColumn(c).letter;
      setCellStyle(worksheet.getCell(`${colLet}${r}`), {
        font: BLACK_BOLD_FONT,
        fill: NONE_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });
    }
  }

  // Header Ringkasan Kolom AQ..AU: NILAI KEDISIPLINAN (Merged AQ11:AU12)
  try { worksheet.unMergeCells('AQ12:AU12'); } catch {}
  try { worksheet.mergeCells('AQ11:AU12'); } catch {}
  const aq11Cell = worksheet.getCell('AQ11');
  aq11Cell.value = 'NILAI KEDISIPLINAN';
  for (let r = 11; r <= 12; r++) {
    for (let c = 43; c <= 47; c++) {
      const colLet = worksheet.getColumn(c).letter;
      setCellStyle(worksheet.getCell(`${colLet}${r}`), {
        font: BLACK_BOLD_FONT,
        fill: NONE_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });
    }
  }

  // Pastikan seluruh baris subheader ringkasan (13 s/d 16 untuk kolom AG..AU) memiliki border rapi
  for (let r = 13; r <= 16; r++) {
    for (let c = 33; c <= 47; c++) {
      const colLet = worksheet.getColumn(c).letter;
      const cell = worksheet.getCell(`${colLet}${r}`);
      cell.border = DEFAULT_BORDER;
    }
  }

  // Header Hari (Hari 1 s/d 30, Kolom C s/d AF)
  for (let day = 1; day <= 30; day++) {
    const colLetter = getColumnLetterForDay(day);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    const dayName = DAY_NAMES_EN[dayOfWeek];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holiday = holidayMap.get(dateStr);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = Boolean(holiday);

    // Merge baris 11 dan 12 agar label hari menyatu utuh di tengah tanpa garis potong horizontal
    try { worksheet.mergeCells(`${colLetter}11:${colLetter}12`); } catch {}

    const cellRow11 = worksheet.getCell(`${colLetter}11`);
    const cellRow12 = worksheet.getCell(`${colLetter}12`);
    const cellRow13 = worksheet.getCell(`${colLetter}13`);

    if (isWeekend || isHoliday) {
      // Libur atau Weekend: Merah pekat dengan teks putih tebal
      const holidayLabel = holiday?.name && holiday.name.length <= 6 ? holiday.name.toUpperCase() : 'LIBUR';
      cellRow11.value = isWeekend ? dayName : holidayLabel;
      setCellStyle(cellRow11, {
        font: WHITE_BOLD_FONT,
        fill: RED_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });

      setCellStyle(cellRow12, {
        fill: RED_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });

      // Baris 13: Tanggal (1..30)
      cellRow13.value = day;
      setCellStyle(cellRow13, {
        font: WHITE_BOLD_FONT,
        fill: RED_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });

      // Baris 14 s/d 16 untuk kolom weekend/holiday diwarnai merah seragam
      for (let r = 14; r <= 16; r++) {
        const c = worksheet.getCell(`${colLetter}${r}`);
        c.value = null;
        setCellStyle(c, {
          fill: RED_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
      }
    } else {
      // Hari kerja normal: Bersih, teks hitam, tanpa warna merah template lama
      cellRow11.value = dayName;
      setCellStyle(cellRow11, {
        font: BLACK_BOLD_FONT,
        fill: NONE_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });

      setCellStyle(cellRow12, {
        fill: NONE_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });

      // Baris 13: Tanggal (1..30)
      cellRow13.value = day;
      setCellStyle(cellRow13, {
        font: BLACK_BOLD_FONT,
        fill: NONE_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
      });

      // Baris 14 s/d 16 untuk kolom hari kerja normal dikosongkan tanpa warna merah
      for (let r = 14; r <= 16; r++) {
        const c = worksheet.getCell(`${colLetter}${r}`);
        c.value = null;
        setCellStyle(c, {
          fill: NONE_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
      }
    }
  }

  // 7. Bangun daftar seluruh pegawai (master employees + pegawai baru yang ada di log)
  const allEmployees: Employee[] = [...employees];
  const existingMachineIds = new Set(employees.map((e) => e.machine_id));

  for (const record of attendanceRecords) {
    if (!existingMachineIds.has(record.employee_id)) {
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

  // Urutkan pegawai sesuai urutan resmi master SMANSS (atau urutan excel_row_index)
  allEmployees.sort((a, b) => (a.excel_row_index || 999) - (b.excel_row_index || 999));

  // 8. Buat lookup map presensi per pegawai dan per hari
  const attendanceMap = new Map<string, DailyAttendance>();
  const recordedDays = new Set<number>();

  for (const record of attendanceRecords) {
    const rawDate = record.attendance_date || (record as any).date;
    if (!rawDate) continue;
    const parts = rawDate.split('-');
    const rYear = parseInt(parts[0], 10);
    const rMonth = parseInt(parts[1], 10);
    const rDay = parseInt(parts[2], 10);

    if (rYear === year && rMonth === month) {
      recordedDays.add(rDay);
      attendanceMap.set(`${record.employee_id}__${rDay}`, record);
    }
  }

  // 9. Bersihkan baris lama di template dari baris 17 s/d 140 agar bebas dari formula korup, warna lama, & border sisa
  const lastEmployeeRow = 17 + allEmployees.length - 1;
  for (let r = 17; r <= Math.max(140, lastEmployeeRow + 20); r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 48; c++) {
      const cell = row.getCell(c);
      cell.value = null;
      setCellStyle(cell, {
        fill: NONE_FILL,
        border: undefined,
        alignment: CENTER_ALIGNMENT,
      });
      (cell as any)._comment = undefined;
      delete (cell as any)._comment;
      delete (cell as any).note;
      delete (cell as any).comment;
    }
  }

  // 10. Masukkan seluruh nama pegawai, presensi harian, dan kalkulasi dinamis ke baris 17 dst.
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i];
    const rowIdx = 17 + i;

    // Kolom A: NO (Rata Tengah)
    const cellA = worksheet.getCell(`A${rowIdx}`);
    cellA.value = i + 1;
    setCellStyle(cellA, {
      font: BLACK_BOLD_FONT,
      fill: NONE_FILL,
      border: DEFAULT_BORDER,
      alignment: CENTER_ALIGNMENT,
    });

    // Kolom B: NAMA LENGKAP PEGAWAI (Rata Kiri, Indent 1)
    const cellB = worksheet.getCell(`B${rowIdx}`);
    const finalDisplayName =
      emp.full_name && !emp.full_name.toLowerCase().includes('pegawai (id:') && !emp.full_name.toLowerCase().includes('pegawai id')
        ? emp.full_name
        : getEmployeeNameByMachineId(emp.machine_id, emp.full_name);
    cellB.value = finalDisplayName;
    setCellStyle(cellB, {
      font: BLACK_REGULAR_FONT,
      fill: NONE_FILL,
      border: DEFAULT_BORDER,
      alignment: LEFT_INDENT_ALIGNMENT,
    });

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
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayMap.has(dateStr);
      const sched = scheduleMap.get(`${emp.machine_id}___${dateStr}`);
      const hasAssignedDuty = Boolean(sched && sched.shift_id && sched.shift_id !== 'shift-off');

      delete (cell as any).note;
      (cell as any).comment = undefined;

      // Jika hari berada di luar rentang pilihan ekspor (fromDay s/d toDay) -> kosongkan bersih
      if (day < fromDay || day > toDay) {
        cell.value = null;
        setCellStyle(cell, {
          fill: NONE_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
        continue;
      }

      // Jika akhir pekan atau hari libur dan pegawai tidak punya tugas khusus -> warnai merah pekat
      if ((isWeekend || isHoliday) && !hasAssignedDuty) {
        cell.value = null;
        setCellStyle(cell, {
          fill: RED_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
        continue;
      }

      const rec = attendanceMap.get(`${emp.machine_id}__${day}`);
      const isRecorded = recordedDays.size > 0 ? recordedDays.has(day) : false;
      const isVerified = rec && rec.is_verified;

      // Jika hari kerja tersebut belum ada log mesin dan belum diverifikasi manual -> kosongkan bersih
      if (!isRecorded && !isVerified) {
        cell.value = null;
        setCellStyle(cell, {
          fill: NONE_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
        continue;
      }

      const status: AttendanceCode = rec ? rec.final_status : 'A';

      if (status === 'HADIR') {
        // Format resmi SMANSS: hadir dibiarkan kosong bersih dengan border rapi
        cell.value = null;
        setCellStyle(cell, {
          fill: NONE_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
      } else if (status === 'A') {
        cell.value = 'A';
        setCellStyle(cell, {
          font: RED_BOLD_FONT,
          fill: NONE_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });
        countA++;
      } else {
        // Status perizinan / sakit / cuti / dinas
        cell.value = status;
        setCellStyle(cell, {
          font: BLACK_BOLD_FONT,
          fill: NONE_FILL,
          border: DEFAULT_BORDER,
          alignment: CENTER_ALIGNMENT,
        });

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

    // Perhitungan logika di Web (Tanpa rumus Excel yang rentan korup)
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

    // Tulis nilai hasil perhitungan ke kolom AG s/d AU (Rata tengah vertikal & horizontal, border seragam)
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
      setCellStyle(cell, {
        font: (col === 'AG' || col === 'AS' || col === 'AU') ? BLACK_BOLD_FONT : BLACK_REGULAR_FONT,
        fill: NONE_FILL,
        border: DEFAULT_BORDER,
        alignment: CENTER_ALIGNMENT,
        numFmt: fmt,
      });
    }
  }

  // 11. Letakkan blok tanda tangan resmi secara dinamis tepat setelah baris pegawai terakhir (jika diaktifkan)
  if (includeSignatures) {
    const lastRowUsed = 17 + allEmployees.length - 1;
    const mName = MONTH_NAMES_ID[month] || `Bulan ${month}`;
    const signRow = lastRowUsed + 2;

    // Tanggal Pengesahan
    const cellSignDate = worksheet.getCell(`W${signRow}`);
    cellSignDate.value = `Palembang, ${toDay} ${mName} ${year}`;
    setCellStyle(cellSignDate, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    // Mengetahui & Dibuat Oleh
    const cellMengetahui = worksheet.getCell(`C${signRow + 1}`);
    cellMengetahui.value = 'Mengetahui,';
    setCellStyle(cellMengetahui, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    const cellDibuat = worksheet.getCell(`W${signRow + 1}`);
    cellDibuat.value = 'Dibuat Oleh,';
    setCellStyle(cellDibuat, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    // Jabatan
    const cellJabatanKepsek = worksheet.getCell(`C${signRow + 2}`);
    cellJabatanKepsek.value = 'Kepala Sekolah';
    setCellStyle(cellJabatanKepsek, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    const cellJabatanTU = worksheet.getCell(`W${signRow + 2}`);
    cellJabatanTU.value = 'Kepala Tenaga Administrasi';
    setCellStyle(cellJabatanTU, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    // Nama Pejabat
    const cellNamaKepsek = worksheet.getCell(`C${signRow + 6}`);
    cellNamaKepsek.value = 'Iswan Djati Kusuma, S.Pd, M.Si';
    setCellStyle(cellNamaKepsek, {
      font: { name: 'Calibri', size: 9, bold: true, underline: true },
      alignment: CENTER_ALIGNMENT,
    });

    const cellNamaTU = worksheet.getCell(`W${signRow + 6}`);
    cellNamaTU.value = 'Debby Leonella, A.Md.';
    setCellStyle(cellNamaTU, {
      font: { name: 'Calibri', size: 9, bold: true, underline: true },
      alignment: CENTER_ALIGNMENT,
    });

    // NIP & Pangkat
    const cellPangkatKepsek = worksheet.getCell(`C${signRow + 7}`);
    cellPangkatKepsek.value = 'Pembina Utama Muda, IV.c';
    setCellStyle(cellPangkatKepsek, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    const cellNipTU = worksheet.getCell(`W${signRow + 7}`);
    cellNipTU.value = 'NIP 199007302025212024';
    setCellStyle(cellNipTU, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });

    const cellNipKepsek = worksheet.getCell(`C${signRow + 8}`);
    cellNipKepsek.value = 'NIP 196912232000121001';
    setCellStyle(cellNipKepsek, {
      font: { name: 'Calibri', size: 9 },
      alignment: CENTER_ALIGNMENT,
    });
  }

  // 12. Return as binary Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
