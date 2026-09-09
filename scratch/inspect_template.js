const ExcelJS = require('exceljs');
const path = require('path');

async function inspect() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  const ws = wb.worksheets[0];

  console.log('Worksheet Name:', ws.name);
  console.log('Row count:', ws.rowCount);
  console.log('Column count:', ws.columnCount);

  console.log('\n--- Rows 10 to 16 (Headers) ---');
  for (let r = 10; r <= 16; r++) {
    const row = ws.getRow(r);
    const cells = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      cells.push({ col: colNumber, address: cell.address, value: cell.value });
    });
    console.log(`Row ${r}:`, cells.map(c => `${c.address}=${JSON.stringify(c.value)}`).join(' | '));
  }

  console.log('\n--- Columns AG to AU (Row 11 to 16 Headers and Row 17 Formula/Values) ---');
  const cols = ['AG','AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU','AV'];
  for (const c of cols) {
    const h11 = ws.getCell(`${c}11`).value;
    const h12 = ws.getCell(`${c}12`).value;
    const h13 = ws.getCell(`${c}13`).value;
    const h14 = ws.getCell(`${c}14`).value;
    const h15 = ws.getCell(`${c}15`).value;
    const c17 = ws.getCell(`${c}17`);
    console.log(`${c}: H11=${h11}, H12=${h12}, H13=${h13}, H14=${h14}, H15=${h15} | Row 17 Formula=${c17.formula} Value=${JSON.stringify(c17.value)}`);
  }

  console.log('\n--- Sample Employee Rows (Row 17, 18, 19, 110, 111, 112) ---');
  for (const r of [17, 18, 19, 110, 111, 112]) {
    const aVal = ws.getCell(`A${r}`).value;
    const bVal = ws.getCell(`B${r}`).value;
    console.log(`Row ${r}: A=${JSON.stringify(aVal)}, B=${JSON.stringify(bVal)}`);
  }
}

inspect().catch(console.error);
