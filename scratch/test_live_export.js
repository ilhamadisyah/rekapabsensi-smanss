const http = require('http');
const XLSX = require('xlsx');

http.get('http://localhost:3000/api/attendance/export?month=9&year=2026', (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('Downloaded bytes:', buffer.length);
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    let badRows = [];
    let employeeCount = 0;
    for (let r = 16; r < data.length; r++) {
      const row = data[r];
      if (!row || !row[0] || typeof row[0] !== 'number') continue;
      employeeCount++;
      const name = String(row[1] || '').trim();
      if (name.toLowerCase().includes('pegawai id') || name.toLowerCase().includes('(id:')) {
        badRows.push({ row: r + 1, no: row[0], name });
      }
    }
    console.log('Total employee rows evaluated in Excel:', employeeCount);
    if (badRows.length > 0) {
      console.error('FOUND BAD ROWS WITH PLACEHOLDERS:', badRows);
    } else {
      console.log('SUCCESS! ZERO rows contain "Pegawai ID" or "Pegawai (ID:". All rows have proper names!');
    }
    console.log('\n--- First 10 rows from Excel ---');
    for (let r = 16; r < Math.min(26, data.length); r++) {
      if (data[r] && data[r][0]) console.log('Row ' + (r+1) + ': No=' + data[r][0] + ' | Name=' + data[r][1]);
    }
    console.log('\n--- Last 12 rows from Excel ---');
    const validRows = data.filter(r => r && typeof r[0] === 'number');
    validRows.slice(-12).forEach(r => console.log('No=' + r[0] + ' | Name=' + r[1]));
  });
}).on('error', err => console.error(err));
