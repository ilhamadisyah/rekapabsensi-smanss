const ExcelJS = require('exceljs');

async function inspectOutput() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('scratch/exported_rekap_sep_2026.xlsx');
  const ws = wb.worksheets[0];

  console.log('--- Cell AG16 (Total Working Days Header) ---', ws.getCell('AG16').value);

  console.log('\n--- Rows 17 to 22 (Employees, Day 1-3, Summary Columns) ---');
  for (let r = 17; r <= 22; r++) {
    const no = ws.getCell(`A${r}`).value;
    const name = ws.getCell(`B${r}`).value;
    const c1 = ws.getCell(`C${r}`).value;
    const d2 = ws.getCell(`D${r}`).value;
    const e3 = ws.getCell(`E${r}`).value;
    const hk = ws.getCell(`AG${r}`).value;
    const hip = ws.getCell(`AH${r}`).value;
    const his = ws.getCell(`AI${r}`).value;
    const i = ws.getCell(`AJ${r}`).value;
    const dl = ws.getCell(`AO${r}`).value;
    const a = ws.getCell(`AP${r}`).value;
    const x = ws.getCell(`AQ${r}`).value;
    const y = ws.getCell(`AR${r}`).value;
    const persen = ws.getCell(`AS${r}`).value;
    const score1 = ws.getCell(`AT${r}`).value;
    const scoreDis = ws.getCell(`AU${r}`).value;

    console.log(`[Row ${r}] No:${no} | ${name} | D1:${c1} D2:${d2} D3:${e3} | HK:${hk} HIP:${hip} HIS:${his} I:${i} DL:${dl} A:${a} | X:${x} Y:${y} AS:${persen} AT:${score1} AU:${scoreDis}`);
  }

  console.log('\n--- Signature Block ---');
  console.log('W113:', ws.getCell('W113').value);
  console.log('C114:', ws.getCell('C114').value, '| W114:', ws.getCell('W114').value);
}

inspectOutput().catch(console.error);
