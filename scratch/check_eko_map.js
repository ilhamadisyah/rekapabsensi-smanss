const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
const recs = db.daily_attendance.filter(a => a.attendance_date.startsWith('2026-09'));

const attendanceMap = new Map();
const recordedDays = new Set();
recs.forEach(r => {
  const parts = r.attendance_date.split('-');
  const rYear = parseInt(parts[0], 10);
  const rMonth = parseInt(parts[1], 10);
  const rDay = parseInt(parts[2], 10);
  if (rYear === 2026 && rMonth === 9) {
    recordedDays.add(rDay);
    attendanceMap.set(`${r.employee_id}__${rDay}`, r);
  }
});

const emp = db.employees.find(e => e.full_name.includes('EKO VALERY'));
console.log('Emp:', emp.full_name, 'Machine ID:', emp.machine_id);
console.log('Rec for Day 1:', attendanceMap.get(`${emp.machine_id}__1`));
