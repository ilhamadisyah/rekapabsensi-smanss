const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
const employees = db.employees.filter(e => e.is_active);
const attendanceRecords = db.daily_attendance.filter(a => a.attendance_date.startsWith('2026-09'));

const PRESENT_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFC6EFCE' },
};

const ABSENT_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFC7CE' },
};

async function testDirect() {
  const templatePath = path.resolve(__dirname, '../formt rekap absen.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const cell = ws.getCell('C18');
  console.log('Before set:', cell.fill);
  cell.fill = PRESENT_FILL;
  console.log('After set PRESENT_FILL:', cell.fill);

  const buf = await wb.xlsx.writeBuffer();
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(buf);
  const cell2 = wb2.worksheets[0].getCell('C18');
  console.log('After reload from buffer:', cell2.fill);
}

testDirect().catch(console.error);
