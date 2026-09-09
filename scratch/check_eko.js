const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
const ekoRecs = db.daily_attendance.filter(a => a.employee_id === '5' && a.attendance_date.startsWith('2026-09'));
console.log('Records for ID 5 (Eko / Handayani):', ekoRecs);
