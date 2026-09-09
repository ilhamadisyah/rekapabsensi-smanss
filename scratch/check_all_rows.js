const ExcelJS = require('exceljs');

async function checkAllRows() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('scratch/exported_rekap_sep_2026.xlsx');
  const ws = wb.worksheets[0];

  console.log('Row count:', ws.rowCount);
  for (let r = 105; r <= ws.rowCount; r++) {
    const a = ws.getCell(`A${r}`).value;
    const b = ws.getCell(`B${r}`).value;
    const c = ws.getCell(`C${r}`).value;
    const w = ws.getCell(`W${r}`).value;
    console.log(`Row ${r}: A=${a}, B=${b}, C=${c}, W=${w}`);
  }
}

checkAllRows().catch(console.error);
