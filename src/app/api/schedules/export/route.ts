import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { db } from '@/lib/storage/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9', 10);
    const year = parseInt(searchParams.get('year') || '2026', 10);
    const department = searchParams.get('department') || 'ALL';

    const allEmployees = await db.getEmployees();
    const rawEmployees = allEmployees.filter((e) => e.is_active);
    const employees = department === 'ALL'
      ? rawEmployees
      : rawEmployees.filter((e) => e.department === department);

    const schedules = await db.getEmployeeSchedules(month, year);
    const shifts = await db.getShiftTemplates();
    const holidays = await db.getHolidays(month, year);

    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const holidayMap = new Map(holidays.map((h) => [h.date, h]));
    const scheduleMap = new Map(schedules.map((s) => [`${s.employee_id}_${s.date}`, s]));

    const defaultShift = shifts.find((s) => s.is_default) || shifts[0];
    const totalDays = new Date(year, month, 0).getDate();
    const monthPad = String(month).padStart(2, '0');

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AutoAbsen SMAN Sumatera Selatan';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Roster ${MONTH_NAMES_ID[month - 1]} ${year}`, {
      views: [{ state: 'frozen', xSplit: 4, ySplit: 6 }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // 1. Title Rows
    sheet.mergeCells(1, 1, 1, totalDays + 6);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = 'ROSTER JADWAL KERJA & SHIFT PEGAWAI';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells(2, 1, 2, totalDays + 6);
    const subCell = sheet.getCell(2, 1);
    subCell.value = `SMAN SUMATERA SELATAN • PERIODE: ${MONTH_NAMES_ID[month - 1].toUpperCase()} ${year} • BAGIAN: ${department}`;
    subCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF475569' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Legend Summary Row
    sheet.mergeCells(4, 1, 4, totalDays + 6);
    const legendCell = sheet.getCell(4, 1);
    const shiftLegendStrs = shifts.map(s => `${s.code}=${s.name} (${s.is_off_day ? 'LIBUR' : s.start_time.substring(0, 5) + '-' + s.end_time.substring(0, 5)})`);
    legendCell.value = `KETERANGAN KODE SHIFT: ${shiftLegendStrs.join(' | ')}`;
    legendCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
    legendCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // 3. Header Table (Row 5: Numbers, Row 6: Day names)
    // Col 1: No
    sheet.mergeCells(5, 1, 6, 1);
    sheet.getCell(5, 1).value = 'NO';
    sheet.getColumn(1).width = 5;

    // Col 2: NIK
    sheet.mergeCells(5, 2, 6, 2);
    sheet.getCell(5, 2).value = 'NIK / NIP';
    sheet.getColumn(2).width = 16;

    // Col 3: Nama
    sheet.mergeCells(5, 3, 6, 3);
    sheet.getCell(5, 3).value = 'NAMA PEGAWAI';
    sheet.getColumn(3).width = 28;

    // Col 4: Bagian
    sheet.mergeCells(5, 4, 6, 4);
    sheet.getCell(5, 4).value = 'UNIT / BAGIAN';
    sheet.getColumn(4).width = 16;

    // Date Columns (Col 5 .. totalDays + 4)
    for (let day = 1; day <= totalDays; day++) {
      const colIdx = day + 4;
      const dayPad = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthPad}-${dayPad}`;
      const d = new Date(`${dateStr}T00:00:00`);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayMap.has(dateStr);

      const cellTop = sheet.getCell(5, colIdx);
      cellTop.value = day;
      const cellBot = sheet.getCell(6, colIdx);
      cellBot.value = DAY_NAMES_ID[dayOfWeek];

      sheet.getColumn(colIdx).width = 6;

      let fillArgb = 'FFF8FAFC';
      if (isHoliday) fillArgb = 'FFFFE4E6'; // Rose for holiday
      else if (isWeekend) fillArgb = 'FFF1F5F9'; // Light slate for weekend

      [cellTop, cellBot].forEach(c => {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } };
        c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: isHoliday ? 'FFE11D48' : isWeekend ? 'FF94A3B8' : 'FF1E293B' } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        c.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });
    }

    // Col Total Kerja
    const colKerja = totalDays + 5;
    sheet.mergeCells(5, colKerja, 6, colKerja);
    sheet.getCell(5, colKerja).value = 'HARI KERJA';
    sheet.getColumn(colKerja).width = 12;

    // Col Total Libur
    const colLibur = totalDays + 6;
    sheet.mergeCells(5, colLibur, 6, colLibur);
    sheet.getCell(5, colLibur).value = 'HARI LIBUR';
    sheet.getColumn(colLibur).width = 12;

    // Header styling for left & right meta columns
    [1, 2, 3, 4, colKerja, colLibur].forEach(cIdx => {
      const c = sheet.getCell(5, cIdx);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF1E293B' } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      c.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // 4. Populate Employee Rows
    let curRow = 7;
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      let workDaysCount = 0;
      let offDaysCount = 0;

      sheet.getCell(curRow, 1).value = i + 1;
      sheet.getCell(curRow, 1).alignment = { horizontal: 'center' };
      sheet.getCell(curRow, 2).value = emp.nik || emp.machine_id;
      sheet.getCell(curRow, 3).value = emp.full_name;
      sheet.getCell(curRow, 4).value = emp.department || 'Umum';

      // Date cells
      for (let day = 1; day <= totalDays; day++) {
        const colIdx = day + 4;
        const dayPad = String(day).padStart(2, '0');
        const dateStr = `${year}-${monthPad}-${dayPad}`;
        const d = new Date(`${dateStr}T00:00:00`);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidayMap.has(dateStr);

        const customSched = scheduleMap.get(`${emp.machine_id}_${dateStr}`);
        const assignedShift = customSched ? shiftMap.get(customSched.shift_id) : null;

        const effectiveShift = assignedShift || (isWeekend || isHoliday ? null : defaultShift);
        const cell = sheet.getCell(curRow, colIdx);

        if (effectiveShift) {
          if (effectiveShift.is_off_day) {
            cell.value = 'OFF';
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF64748B' } };
            offDaysCount++;
          } else {
            cell.value = effectiveShift.code;
            cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
            const hex = (effectiveShift.color || '#2563eb').replace('#', '');
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${hex}` } };
            workDaysCount++;
          }
        } else {
          cell.value = isHoliday ? 'LIBUR' : 'OFF';
          cell.font = { name: 'Calibri', size: 8, color: { argb: 'FF94A3B8' } };
          offDaysCount++;
        }

        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      }

      // Summary columns
      const cellW = sheet.getCell(curRow, colKerja);
      cellW.value = workDaysCount;
      cellW.alignment = { horizontal: 'center' };
      cellW.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF059669' } };

      const cellO = sheet.getCell(curRow, colLibur);
      cellO.value = offDaysCount;
      cellO.alignment = { horizontal: 'center' };
      cellO.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF64748B' } };

      // Borders for left & right
      [1, 2, 3, 4, colKerja, colLibur].forEach(cIdx => {
        sheet.getCell(curRow, cIdx).border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      curRow++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const rangeSuffix = department !== 'ALL' ? `_${department}` : '';
    const filename = `Roster_Jadwal_SMANSS_${monthPad}_${year}${rangeSuffix}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting schedule roster to Excel:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
