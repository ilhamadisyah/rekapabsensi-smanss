const ExcelJS = require('exceljs');

async function debugRow18() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('scratch/exported_rekap_sep_2026.xlsx');
  const ws = wb.worksheets[0];

  const row = ws.getRow(18);
  console.log('Row 18:');
  console.log('B18:', ws.getCell('B18').value);
  console.log('C18 (Day 1):', ws.getCell('C18').value, ws.getCell('C18').fill);
  console.log('D18 (Day 2):', ws.getCell('D18').value, ws.getCell('D18').fill);
  console.log('E18 (Day 3):', ws.getCell('E18').value, ws.getCell('E18').fill);
  console.log('F18 (Day 4):', ws.getCell('F18').value, ws.getCell('F18').fill);
  console.log('G18 (Day 5):', ws.getCell('G18').value, ws.getCell('G18').fill);
}

debugRow18().catch(console.error);
