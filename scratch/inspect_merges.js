const ExcelJS = require('exceljs');
const path = require('path');

async function inspectFullTemplate() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  const ws = wb.worksheets[0];

  console.log('--- Merged Cells ---');
  console.log(Object.keys(ws._merges || {}));

  console.log('\n--- Rows 1 to 10 ---');
  for (let r = 1; r <= 10; r++) {
    const row = ws.getRow(r);
    const cells = [];
    row.eachCell({ includeEmpty: false }, cell => {
      cells.push(`${cell.address}=${JSON.stringify(cell.value)}`);
    });
    if (cells.length) console.log(`Row ${r}:`, cells.join(' | '));
  }
}

inspectFullTemplate().catch(console.error);
