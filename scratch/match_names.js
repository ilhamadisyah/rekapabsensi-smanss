const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
const samplePath = path.resolve(__dirname, '../ABSENSI 1111.xls');
const workbook = XLSX.readFile(samplePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const headerRowIdx = rows.findIndex(row => {
  if (!Array.isArray(row)) return false;
  const str = row.map(c => String(c||'').toLowerCase());
  return str.includes('nama') || str.includes('name');
});
const header = rows[headerRowIdx];
const idCol = header.findIndex(c => String(c).toLowerCase().includes('id'));
const nameCol = header.findIndex(c => String(c).toLowerCase().includes('nama'));

const rawLogNames = new Map();
for (let r = headerRowIdx + 1; r < rows.length; r++) {
  const row = rows[r];
  if (!Array.isArray(row)) continue;
  const id = String(row[idCol] || '').trim().replace(/\.0$/, '');
  const name = String(row[nameCol] || '').trim();
  if (id && name && !rawLogNames.has(id)) {
    rawLogNames.set(id, name);
  }
}

console.log('--- Checking all machine IDs in ABSENSI 1111.xls ---');
rawLogNames.forEach((name, id) => {
  const matchedEmp = db.employees.find(e => e.machine_id === id);
  if (matchedEmp) {
    // matched
  } else {
    // Check if name resembles any employee in DB
    const similar = db.employees.find(e => e.full_name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(e.full_name.toLowerCase().split(' ')[0]));
    console.log(`Unmatched ID: ${id} -> Raw Log Name: "${name}" ${similar ? `(Similar to DB: "${similar.full_name}", DB ID: ${similar.machine_id})` : '(No DB match)'}`);
  }
});
