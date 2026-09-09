const fs = require('fs');
const emps = JSON.parse(fs.readFileSync('scratch/generated_employees.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('data/attendance-db.json', 'utf8'));

db.employees = emps;

const nameMap = new Map();
for (const e of emps) {
  nameMap.set(e.machine_id, e.full_name);
}

if (db.daily_attendance && Array.isArray(db.daily_attendance)) {
  for (const rec of db.daily_attendance) {
    const name = nameMap.get(rec.employee_id) || ('Pegawai ' + rec.employee_id);
    rec.employee_name = name;
  }
}

fs.writeFileSync('data/attendance-db.json', JSON.stringify(db, null, 2), 'utf8');
console.log('data/attendance-db.json updated successfully with', emps.length, 'employees and tagged daily attendance records.');
