const ExcelJS = require('exceljs');
const path = require('path');

async function findLegend() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(__dirname, '../formt rekap absen.xlsx'));
  console.log('Worksheet names:', wb.worksheets.map(w => w.name));

  const ws = wb.worksheets[0];
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      const v = String(cell.value || '');
      if (v.includes('SCORE') || v.includes('KEDISIPLINAN') || v.includes('Keterangan') || v.includes('NILAI') || v.includes('Predikat') || v.includes('Sangat Baik')) {
        console.log(`[${cell.address}] =`, cell.value);
      }
    });
  });
}

findLegend().catch(console.error);
