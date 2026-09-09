const { generateRekapExcel } = require('./src/lib/attendance/exporter.ts');
const { db } = require('./src/lib/storage/store.ts');
const ExcelJS = require('exceljs');

async function test() {
  const employees = db.getEmployees().filter((e) => e.is_active);
  const attendanceRecords = db.getAttendanceForMonth(9, 2026);

  console.log('Employees:', employees.length);
  console.log('Records:', attendanceRecords.length);

  const buf = await generateRekapExcel({
    month: 9,
    year: 2026,
    employees,
    attendanceRecords,
  });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];

  const c18 = ws.getCell('C18');
  console.log('C18 val:', c18.value);
  console.log('C18 fill:', c18.fill);
}

test().catch(console.error);
