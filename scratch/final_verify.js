const ExcelJS = require('exceljs');

async function finalVerify() {
  const wb = new ExcelJS.Workbook();
  // Fetch fresh export from local server
  const res = await fetch('http://localhost:3000/api/attendance/export?month=9&year=2026');
  const buffer = await res.arrayBuffer();
  await wb.xlsx.load(Buffer.from(buffer));
  const ws = wb.worksheets[0];

  console.log('--- EXPORT VERIFICATION REPORT ---');
  console.log('Worksheet name:', ws.name);
  console.log('Total rows:', ws.rowCount);
  console.log('Periode A8:', ws.getCell('A8').value);
  console.log('AG16 (Total Working Days):', ws.getCell('AG16').value);

  // Check first 5 employees
  console.log('\n--- First 5 Employees ---');
  for (let r = 17; r <= 21; r++) {
    const no = ws.getCell(`A${r}`).value;
    const name = ws.getCell(`B${r}`).value;
    const hk = ws.getCell(`AG${r}`).value;
    const hip = ws.getCell(`AH${r}`).value;
    const his = ws.getCell(`AI${r}`).value;
    const i = ws.getCell(`AJ${r}`).value;
    const dl = ws.getCell(`AO${r}`).value;
    const a = ws.getCell(`AP${r}`).value;
    const x = ws.getCell(`AQ${r}`).value;
    const y = ws.getCell(`AR${r}`).value;
    const as = ws.getCell(`AS${r}`).value;
    const at = ws.getCell(`AT${r}`).value;
    const au = ws.getCell(`AU${r}`).value;
    console.log(`Row ${r} [No ${no}]: ${name} -> HK:${hk}, A:${a}, DL:${dl}, X:${x}, Y:${y}, Persen:${(as*100).toFixed(1)}%, Score1:${at}, ScoreKedisiplinan:${au}`);
  }

  // Check formulas: verify there are NO formulas in columns AG to AU
  let hasFormula = false;
  for (let r = 17; r <= 128; r++) {
    for (const col of ['AG','AH','AI','AJ','AK','AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU']) {
      if (ws.getCell(`${col}${r}`).formula) {
        hasFormula = true;
        console.log(`Found formula at ${col}${r}:`, ws.getCell(`${col}${r}`).formula);
      }
    }
  }
  console.log('\nFormulas in AG:AU across all employee rows?:', hasFormula ? 'YES (FAILED)' : 'NONE (PASSED - Pure Calculated Values)');

  // Check signature block
  console.log('\n--- Signature Block ---');
  console.log('W130:', ws.getCell('W130').value);
  console.log('C131:', ws.getCell('C131').value, '| W131:', ws.getCell('W131').value);
  console.log('C132:', ws.getCell('C132').value, '| W132:', ws.getCell('W132').value);
  console.log('C136:', ws.getCell('C136').value, '| W136:', ws.getCell('W136').value);
}

finalVerify().catch(console.error);
