const { evaluateAttendanceStatus, addMinutesToTime } = require('../src/lib/attendance/parser');

console.log('Testing addMinutesToTime:');
console.log('20:00:00 - 120m =', addMinutesToTime('20:00:00', -120));
console.log('06:00:00 + 240m =', addMinutesToTime('06:00:00', 240));

const shiftMalamContext = {
  startTime: '20:00:00',
  endTime: '06:00:00',
  gracePeriodMinutes: 0,
  checkInWindowMinutes: 120, // 18:00 - 20:00
  checkOutWindowMinutes: 240, // 06:00 - 10:00
  isOvernight: true,
  isCrossDaySession: true,
};

// Case 1: The user's exact bug (daytime taps 06:22 and 17:45)
const case1 = evaluateAttendanceStatus('06:22:00', '17:45:00', 2, false, {
  ...shiftMalamContext,
  isCrossDaySession: false, // Same day daytime punch!
});
console.log('Case 1 (Daytime 06:22 - 17:45 same day):', case1);

// Case 2: Daytime taps on different days (e.g. 06:22 day 1, 17:45 day 2)
const case2 = evaluateAttendanceStatus('06:22:00', '17:45:00', 2, false, shiftMalamContext);
console.log('Case 2 (Daytime 06:22 day 1, 17:45 day 2):', case2);

// Case 3: Legitimate night shift (19:45 in evening, 06:15 next morning)
const case3 = evaluateAttendanceStatus('19:45:00', '06:15:00', 2, false, shiftMalamContext);
console.log('Case 3 (Legitimate night shift 19:45 - 06:15 next day):', case3);

// Case 4: Night shift checkout too late (19:45 in evening, 14:00 afternoon next day)
const case4 = evaluateAttendanceStatus('19:45:00', '14:00:00', 2, false, shiftMalamContext);
console.log('Case 4 (Checkout too late 14:00 next day):', case4);

// Case 5: Night shift check-in too late / terlambat (20:45 in evening, 06:15 next morning)
const case5 = evaluateAttendanceStatus('20:45:00', '06:15:00', 2, false, shiftMalamContext);
console.log('Case 5 (Check-in late 20:45 - 06:15):', case5);
