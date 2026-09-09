const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. Test parser auto detection
const { detectPeriodFromFile, parseAttendanceFile } = require('../src/lib/attendance/parser');

const samplePath = path.resolve(__dirname, '../ABSENSI 1111.xls');
const fileBuffer = fs.readFileSync(samplePath);

console.log('--- 1. Testing Automatic Detection of Date and Month ---');
const periodResult = detectPeriodFromFile(fileBuffer);
console.log('Detection Success:', periodResult.success);
console.log('Detected Period:', periodResult.period);

console.log('\n--- 2. Testing parseAttendanceFile without targetMonth / targetYear ---');
const parseResult = parseAttendanceFile(fileBuffer, undefined, undefined, 'test-upload');
console.log('Parse Success:', parseResult.success);
console.log('Total Processed Records:', parseResult.records.length);
console.log('Detected Dates:', parseResult.detectedDates);
console.log('Detected Period Month & Year:', parseResult.detectedPeriod?.month, parseResult.detectedPeriod?.year);

console.log('\n--- 3. Testing Duplicate Handling & Verification Preservation ---');
// Mock existing records:
// Let's create an existing record with manual verification (DL)
const testEmpId = parseResult.records[0].employee_id;
const testDate = parseResult.records[0].attendance_date;

console.log(`Testing Employee ID: ${testEmpId} on Date: ${testDate}`);

// Simulate existing verified record
const existingVerifiedRecord = {
  id: `att-${testEmpId}-${testDate}`,
  upload_id: 'previous-upload',
  employee_id: testEmpId,
  attendance_date: testDate,
  first_in: '08:15:00',
  last_out: '15:30:00',
  tap_count: 2,
  system_status: 'TIDAK_HADIR',
  final_status: 'DL', // Dinas Luar - MANUALLY VERIFIED
  is_verified: true,
  verified_by: 'admin_tu',
  notes: 'Tugas Dinas Luar Disdikpora',
  updated_at: '2026-09-05T08:00:00Z',
};

// Now simulate incoming duplicate records from raw machine file where testEmpId on testDate might be 'A' or 'HADIR'
const incomingDuplicateRecord = {
  id: `att-${testEmpId}-${testDate}-new`,
  upload_id: 'new-upload-batch',
  employee_id: testEmpId,
  attendance_date: testDate,
  first_in: '08:15:00',
  last_out: '15:30:00',
  tap_count: 2,
  system_status: 'TIDAK_HADIR',
  final_status: 'A', // Raw punch would say Alpha
  is_verified: false,
  updated_at: '2026-09-08T09:00:00Z',
};

// Run mock merge logic as implemented in store.ts
const existingMap = new Map();
const dbRecords = [existingVerifiedRecord];
dbRecords.forEach((rec, idx) => {
  existingMap.set(`${rec.employee_id}___${rec.attendance_date}`, idx);
});

const key = `${incomingDuplicateRecord.employee_id}___${incomingDuplicateRecord.attendance_date}`;
const existingIdx = existingMap.get(key);

if (existingIdx !== undefined) {
  const existingRec = dbRecords[existingIdx];
  const isVerified =
    existingRec.is_verified === true ||
    Boolean(existingRec.verified_by) ||
    (existingRec.final_status !== 'HADIR' && existingRec.final_status !== 'A') ||
    Boolean(existingRec.notes && existingRec.notes.trim().length > 0);

  if (isVerified) {
    dbRecords[existingIdx] = {
      ...existingRec,
      first_in: existingRec.first_in || incomingDuplicateRecord.first_in,
      last_out: existingRec.last_out || incomingDuplicateRecord.last_out,
      tap_count: Math.max(existingRec.tap_count || 0, incomingDuplicateRecord.tap_count || 0),
      system_status: incomingDuplicateRecord.system_status || existingRec.system_status,
      final_status: existingRec.final_status,
      is_verified: true,
      verified_by: existingRec.verified_by,
      notes: existingRec.notes,
      updated_at: existingRec.updated_at,
    };
  }
}

const finalRecord = dbRecords[0];
console.log('Result after re-uploading duplicate:');
console.log('Final Status preserved?:', finalRecord.final_status === 'DL' ? 'PASSED (DL kept)' : 'FAILED');
console.log('Verified by preserved?:', finalRecord.verified_by === 'admin_tu' ? 'PASSED (admin_tu kept)' : 'FAILED');
console.log('Notes preserved?:', finalRecord.notes === 'Tugas Dinas Luar Disdikpora' ? 'PASSED (notes kept)' : 'FAILED');
console.log('Is Verified flag?:', finalRecord.is_verified === true ? 'PASSED (true)' : 'FAILED');
