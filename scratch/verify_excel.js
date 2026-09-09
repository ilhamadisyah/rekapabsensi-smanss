const fs = require('fs');
const ExcelJS = require('exceljs');

async function testGeneratedExcel() {
  const res = await fetch('http://localhost:3000/api/attendance/export?month=9&year=2026');
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync('scratch/exported_rekap_sep_2026.xlsx', Buffer.from(arrayBuffer));
  console.log('Saved export to scratch/exported_rekap_sep_2026.xlsx, size:', arrayBuffer.byteLength);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('scratch/exported_rekap_sep_2026.xlsx');
  const ws = wb.worksheets[0];

  console.log('--- Cell A8 (Period) ---', ws.getCell('A8').value);
  console.log('--- Headers Day 1 to 7 ---');
  const cols = ['C','D','E','F','G','H','I'];
  for (let d = 1; d <= 7; d++) {
    const col = cols[d-1];
    console.log('Day ' + d + ' (' + col + '): Row 11=' + ws.getCell(col+'11').value + ', Row 12=' + ws.getCell(col+'12').value + ', Row 13=' + ws.getCell(col+'13').value);
  }

  console.log('--- Employee 5 (Row 18 in Excel: Eko Valery) ---');
  console.log('Name in B18:', ws.getCell('B18').value);
  console.log('C18 (Day 1): Val=' + ws.getCell('C18').value + ', Fill=' + ws.getCell('C18').fill?.fgColor?.argb);
  console.log('D18 (Day 2): Val=' + ws.getCell('D18').value + ', Fill=' + ws.getCell('D18').fill?.fgColor?.argb);
  console.log('E18 (Day 3): Val=' + ws.getCell('E18').value + ', Fill=' + ws.getCell('E18').fill?.fgColor?.argb);
  console.log('AG18 formula:', ws.getCell('AG18').formula);
  console.log('AH18 formula:', ws.getCell('AH18').formula);
  console.log('AP18 formula:', ws.getCell('AP18').formula);
}

testGeneratedExcel().catch(console.error);
