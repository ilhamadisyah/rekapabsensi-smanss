const ExcelJS = require('exceljs');
const path = require('path');

async function checkFooter() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  const ws = wb.worksheets[0];

  console.log('--- Rows 112 to 125 ---');
  for (let r = 112; r <= 125; r++) {
    const row = ws.getRow(r);
    const cells = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      cells.push(`${cell.address}=${JSON.stringify(cell.value)}`);
    });
    if (cells.length > 0) {
      console.log(`Row ${r}:`, cells.join(' | '));
    } else {
      console.log(`Row ${r}: (empty)`);
    }
  }
}

checkFooter().catch(console.error);
