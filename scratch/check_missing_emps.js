const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
const samplePath = path.resolve(__dirname, '../ABSENSI 1111.xls');
const workbook = XLSX.readFile(samplePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const dbMap = new Map();
db.employees.forEach(e => dbMap.set(e.machine_id, e.full_name));

console.log('Employees in DB:', db.employees.length);

const logEmps = new Map();
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || !row[0]) continue;
  const id = String(row[0]).trim().replace(/\.0$/, '');
  const name = String(row[1] || '').trim();
  if (id && id.toLowerCase() !== 'no. id' && !logEmps.has(id)) {
    logEmps.set(id, name);
  }
}

console.log('Unique Machine IDs in ABSENSI 1111.xls:', logEmps.size);
const notInDb = [];
logEmps.forEach((name, id) => {
  if (!dbMap.has(id)) {
    notInDb.push({ id, name });
  }
});

console.log('In log but NOT in DB:', notInDb);
