const fs = require('fs');
const XLSX = require('xlsx');

function excelSerialToDate(serial) {
  const wholeDays = Math.floor(serial);
  const frac = serial - wholeDays;
  const totalSeconds = Math.round(frac * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const date = new Date(1899, 11, 30);
  date.setDate(date.getDate() + wholeDays);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

function detectPeriodFromDates(rawDates) {
  const monthCounts = {};
  const dayCounts = {};
  const yearCounts = {};

  rawDates.forEach(d => {
    yearCounts[d.year] = (yearCounts[d.year] || 0) + 1;
    monthCounts[d.month] = (monthCounts[d.month] || 0) + 1;
    dayCounts[d.day] = (dayCounts[d.day] || 0) + 1;
  });

  const detectedYear = Number(Object.entries(yearCounts).sort((a,b) => b[1] - a[1])[0][0]);
  const uniqueMonths = Object.keys(monthCounts).map(Number);
  const uniqueDays = Object.keys(dayCounts).map(Number);

  let targetMonth;
  let actualDays = [];

  // Check if days are constant (e.g. all 9s) and months vary (1, 2, 3) -> swapped!
  if (uniqueDays.length === 1 && uniqueMonths.length > 1) {
    targetMonth = uniqueDays[0];
    actualDays = uniqueMonths.sort((a,b) => a - b);
  } else if (uniqueMonths.length === 1 && uniqueDays.length > 1) {
    targetMonth = uniqueMonths[0];
    actualDays = uniqueDays.sort((a,b) => a - b);
  } else {
    targetMonth = Number(Object.entries(monthCounts).sort((a,b) => b[1] - a[1])[0][0]);
    actualDays = rawDates.filter(d => d.month === targetMonth).map(d => d.day);
    actualDays = Array.from(new Set(actualDays)).sort((a,b) => a - b);
  }

  const startDay = actualDays[0];
  const endDay = actualDays[actualDays.length - 1];

  const MONTH_NAMES_ID = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return {
    year: detectedYear,
    month: targetMonth,
    monthName: MONTH_NAMES_ID[targetMonth],
    startDay,
    endDay,
    totalDays: actualDays.length,
    startDate: `${detectedYear}-${String(targetMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
    endDate: `${detectedYear}-${String(targetMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    formattedRange: `${startDay} ${MONTH_NAMES_ID[targetMonth]} ${detectedYear} s/d ${endDay} ${MONTH_NAMES_ID[targetMonth]} ${detectedYear}`
  };
}

const buf = fs.readFileSync('ABSENSI 1111.xls');
const wb = XLSX.read(buf, { type: 'buffer' });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
const rawDates = [];
for (let r = 2; r < rows.length; r++) {
  const val = rows[r]?.[4];
  if (typeof val === 'number') {
    const d = excelSerialToDate(val);
    rawDates.push({ year: d.getFullYear(), month: d.getMonth()+1, day: d.getDate() });
  }
}

const res = detectPeriodFromDates(rawDates);
console.log('Detected Result from ABSENSI 1111.xls:');
console.log(JSON.stringify(res, null, 2));
