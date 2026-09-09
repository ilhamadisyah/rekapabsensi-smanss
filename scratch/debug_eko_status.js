const fs = require('fs');
const path = require('path');

const dbJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
const employees = dbJson.employees.filter(e => e.is_active);
const attendanceRecords = dbJson.daily_attendance.filter(a => a.attendance_date.startsWith('2026-09'));

const attendanceMap = new Map();
attendanceRecords.forEach(r => {
  const parts = r.attendance_date.split('-');
  const day = parseInt(parts[2], 10);
  attendanceMap.set(`${r.employee_id}__${day}`, r);
});

const emp = employees[1]; // Eko Valery
console.log('Employee:', emp.full_name, 'Machine ID:', emp.machine_id);

for (let d = 1; d <= 5; d++) {
  const rec = attendanceMap.get(`${emp.machine_id}__${d}`);
  console.log(`Day ${d}: rec =`, rec ? { status: rec.final_status, first_in: rec.first_in, last_out: rec.last_out } : 'NOT FOUND');
}
