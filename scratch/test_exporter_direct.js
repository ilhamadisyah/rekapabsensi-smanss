const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function testExporterDirect() {
  const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
  const employees = db.employees.filter(e => e.is_active);
  const attendanceRecords = db.daily_attendance.filter(a => a.attendance_date.startsWith('2026-09'));

  const attendanceMap = new Map();
  const recordedDays = new Set();
  for (const record of attendanceRecords) {
    const parts = record.attendance_date.split('-');
    const rYear = parseInt(parts[0], 10);
    const rMonth = parseInt(parts[1], 10);
    const rDay = parseInt(parts[2], 10);

    if (rYear === 2026 && rMonth === 9) {
      recordedDays.add(rDay);
      attendanceMap.set(`${record.employee_id}__${rDay}`, record);
    }
  }

  const emp = employees[1]; // Eko Valery
  for (let day = 1; day <= 3; day++) {
    const rec = attendanceMap.get(`${emp.machine_id}__${day}`);
    const isRecorded = recordedDays.size > 0 ? recordedDays.has(day) : false;
    const isVerified = rec && rec.is_verified;
    const status = rec ? rec.final_status : 'A';
    console.log(`Day ${day}: rec exists?`, !!rec, 'status:', status, 'isRecorded:', isRecorded, 'isVerified:', isVerified);
  }
}

testExporterDirect().catch(console.error);
