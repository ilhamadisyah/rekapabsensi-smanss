const ExcelJS = require('exceljs');
const path = require('path');

async function checkRow18Original() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  const ws = wb.worksheets[0];

  console.log('Original Row 18:');
  console.log('B18:', ws.getCell('B18').value);
  console.log('C18:', ws.getCell('C18').value, ws.getCell('C18').fill);
}

checkRow18Original().catch(console.error);
