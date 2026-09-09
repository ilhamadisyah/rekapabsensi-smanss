const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function testNewExport() {
  const templatePath = path.resolve(__dirname, '../formt rekap absen.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.worksheets[0];

  const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/attendance-db.json'), 'utf-8'));
  const employees = db.employees.filter(e => e.is_active);
  const attendanceRecords = db.daily_attendance.filter(a => a.attendance_date.startsWith('2026-09'));

  console.log(`Loaded ${employees.length} employees and ${attendanceRecords.length} attendance records.`);

  // Calculate working days for Sept 2026 (days 1 to 30)
  let totalWorkingDays = 0;
  for (let d = 1; d <= 30; d++) {
    const dt = new Date(2026, 8, d);
    const dow = dt.getDay();
    if (dow !== 0 && dow !== 6) totalWorkingDays++;
  }
  console.log('Total working days in month (1..30):', totalWorkingDays);

  // Map attendance
  const attendanceMap = new Map();
  const recordedDays = new Set();
  attendanceRecords.forEach(r => {
    const day = parseInt(r.attendance_date.split('-')[2], 10);
    recordedDays.add(day);
    attendanceMap.set(`${r.employee_id}__${day}`, r);
  });

  console.log('Recorded days in log:', Array.from(recordedDays).sort((a,b)=>a-b));

  // Inspect first 3 employees and write them
  for (let i = 0; i < 3; i++) {
    const emp = employees[i];
    const rowIdx = 17 + i;

    let countHIP = 0, countHIS = 0, countI = 0, countIL = 0, countPM = 0, countOTL = 0, countAL = 0, countDL = 0, countA = 0;
    for (let d = 1; d <= 30; d++) {
      const dt = new Date(2026, 8, d);
      if (dt.getDay() === 0 || dt.getDay() === 6) continue;
      const rec = attendanceMap.get(`${emp.machine_id}__${d}`);
      const isRecorded = recordedDays.has(d);
      const isVerified = rec && rec.is_verified;
      if (!isRecorded && !isVerified) continue;

      const status = rec ? rec.final_status : 'A';
      if (status === 'HIP') countHIP++;
      else if (status === 'HIS') countHIS++;
      else if (status === 'I') countI++;
      else if (status === 'IL') countIL++;
      else if (status === 'PM') countPM++;
      else if (status === 'OTL') countOTL++;
      else if (status === 'AL') countAL++;
      else if (status === 'DL') countDL++;
      else if (status === 'A') countA++;
    }

    const hk = Math.max(0, totalWorkingDays - countI - countA);
    const scoreX = Math.max(0, (hk * 2) - countHIP - countHIS - countI - (countA * 3));
    const scoreY = totalWorkingDays * 2;
    const persen = scoreY > 0 ? Math.min(100, Math.max(0, Math.round((scoreX / scoreY) * 10000) / 100)) : 0;
    let score1 = 50;
    if (persen >= 100) score1 = 100;
    else if (persen >= 90) score1 = 90;
    else if (persen >= 80) score1 = 80;
    else if (persen >= 65) score1 = 70;
    else if (persen >= 50) score1 = 60;
    const scoreDisiplin = Math.round((score1 * 0.2) * 100) / 100;

    console.log(`[Row ${rowIdx}] ${emp.full_name}: HK=${hk}, A=${countA}, DL=${countDL}, X=${scoreX}, Y=${scoreY}, Persen=${persen}%, Score1=${score1}, ScoreDisiplin=${scoreDisiplin}`);
  }
}

testNewExport().catch(console.error);
