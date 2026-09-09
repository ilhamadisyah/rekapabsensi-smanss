const ExcelJS = require('exceljs');
const path = require('path');

async function checkScores() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  const ws = wb.worksheets[0];

  const cells = ['AZ14', 'AZ15', 'AZ16', 'BD14', 'BD15', 'BD16', 'BA14', 'BA15', 'BB14', 'BC14'];
  for (const c of cells) {
    console.log(`${c}:`, ws.getCell(c).value);
  }

  // Also check rows 13 to 20 around column AZ to BD
  for (let r = 12; r <= 20; r++) {
    const row = ws.getRow(r);
    const vals = [];
    for (let c = 50; c <= 60; c++) {
      const cell = row.getCell(c);
      if (cell.value !== null && cell.value !== undefined) {
        vals.push(`${cell.address}=${JSON.stringify(cell.value)}`);
      }
    }
    if (vals.length) {
      console.log(`Row ${r}:`, vals.join(' | '));
    }
  }
}

checkScores().catch(console.error);
