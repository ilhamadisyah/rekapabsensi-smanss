const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const samplePath = path.resolve(__dirname, '../ABSENSI 1111.xls');
const workbook = XLSX.readFile(samplePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const headerRowIdx = rows.findIndex(row => {
  if (!Array.isArray(row)) return false;
  const str = row.map(c => String(c||'').toLowerCase());
  return str.includes('nama') || str.includes('name');
});

console.log('Header row:', headerRowIdx);
const header = rows[headerRowIdx];
console.log('Columns:', header);

const idCol = header.findIndex(c => String(c).toLowerCase().includes('id'));
const nameCol = header.findIndex(c => String(c).toLowerCase().includes('nama'));

console.log('ID col:', idCol, 'Name col:', nameCol);

const idToName = new Map();
for (let r = headerRowIdx + 1; r < rows.length; r++) {
  const row = rows[r];
  if (!Array.isArray(row)) continue;
  const id = String(row[idCol] || '').trim().replace(/\.0$/, '');
  const name = String(row[nameCol] || '').trim();
  if (id && name && !idToName.has(id)) {
    idToName.set(id, name);
  }
}

console.log('Total unique IDs with names in file:', idToName.size);

// Print IDs 15, 33, 63, 135, 141, etc.
for (const id of ['15', '33', '63', '135', '141', '184', '190', '193', '200', '202', '222', '243', '258', '259', '260', '261', '262']) {
  console.log(`ID ${id} -> Name: "${idToName.get(id)}"`);
}
