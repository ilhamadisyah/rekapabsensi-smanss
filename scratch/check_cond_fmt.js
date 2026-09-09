const ExcelJS = require('exceljs');
const path = require('path');

async function checkCondFmt() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  const ws = wb.worksheets[0];

  console.log('Conditional formatting rules count:', ws.conditionalFormatting?.length || 0);
  if (ws.conditionalFormatting) {
    console.log(JSON.stringify(ws.conditionalFormatting, null, 2));
  }
}

checkCondFmt().catch(console.error);
