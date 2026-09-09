const ExcelJS = require('exceljs');

async function testFill() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('scratch/exported_rekap_sep_2026.xlsx');
  const ws = wb.worksheets[0];

  const c18 = ws.getCell('C18');
  console.log('B18 (Name):', ws.getCell('B18').value);
  console.log('C18 (Day 1): Value =', c18.value, ', Fill =', JSON.stringify(c18.fill));
}

testFill().catch(console.error);
