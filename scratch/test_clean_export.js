const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function testCleanExport() {
  const templatePath = path.resolve(__dirname, '../formt rekap absen.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
  const employees = db.employees.filter(e => e.is_active);
  const attendanceRecords = db.daily_attendance.filter(a => a.attendance_date.startsWith('2026-09'));

  const allEmployees = [...employees];
  const knownMachineIds = new Set(employees.map(e => e.machine_id));
  for (const rec of attendanceRecords) {
    if (!knownMachineIds.has(rec.employee_id)) {
      knownMachineIds.add(rec.employee_id);
      allEmployees.push({
        id: `emp-auto-${rec.employee_id}`,
        machine_id: rec.employee_id,
        nik: '',
        full_name: `Pegawai (ID: ${rec.employee_id})`,
        department: 'Pegawai',
        excel_row_index: 999,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  console.log(`Total employees to write: ${allEmployees.length}`);
  console.log('First employee:', allEmployees[0].full_name);
  console.log('Second employee:', allEmployees[1].full_name);
  console.log('Last employee:', allEmployees[allEmployees.length - 1].full_name);

  const lastEmpRow = 17 + allEmployees.length - 1;
  const signStartRow = lastEmpRow + 2;
  console.log(`Employees written in rows 17 to ${lastEmpRow}`);
  console.log(`Signature block placed at row ${signStartRow} to ${signStartRow + 8}`);
}

testCleanExport().catch(console.error);
