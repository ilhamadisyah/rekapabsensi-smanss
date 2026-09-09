const fs = require('fs');
const path = require('path');

async function testApi() {
  console.log('Testing running Next.js endpoints on http://localhost:3000...');

  // 1. Test GET /api/attendance/data?month=9&year=2026
  const getRes = await fetch('http://localhost:3000/api/attendance/data?month=9&year=2026');
  const getData = await getRes.json();
  console.log('GET /api/attendance/data success:', getData.success);
  console.log('Month:', getData.month, 'Year:', getData.year);
  console.log('Detected Period:', getData.detectedPeriod?.formattedRange);
  console.log('Total Employees in matrix:', getData.employees?.length);

  // 2. Test POST /api/attendance/detect-period with ABSENSI 1111.xls
  const samplePath = path.resolve(__dirname, '../ABSENSI 1111.xls');
  const fileBytes = fs.readFileSync(samplePath);
  const blob = new Blob([fileBytes]);
  const formData = new FormData();
  formData.append('file', blob, 'ABSENSI 1111.xls');

  const detectRes = await fetch('http://localhost:3000/api/attendance/detect-period', {
    method: 'POST',
    body: formData,
  });
  const detectData = await detectRes.json();
  console.log('\nPOST /api/attendance/detect-period:');
  console.log('Success:', detectData.success);
  console.log('Detected Period Object:', detectData.period);

  // 3. Test POST /api/attendance/upload without specifying month & year
  // (Testing that it auto-detects from the file and smart-merges duplicate data)
  const uploadFormData = new FormData();
  uploadFormData.append('file', blob, 'ABSENSI 1111.xls');
  uploadFormData.append('uploaded_by', 'admin_tu');

  const uploadRes = await fetch('http://localhost:3000/api/attendance/upload', {
    method: 'POST',
    body: uploadFormData,
  });
  const uploadData = await uploadRes.json();
  console.log('\nPOST /api/attendance/upload (Auto Detect & Smart Duplicate Handling):');
  console.log('Status code:', uploadRes.status);
  console.log('Success:', uploadData.success);
  console.log('Total Processed:', uploadData.total_records_processed);
  console.log('Preserved Verified Count:', uploadData.preserved_verified_count);
  console.log('Updated Count:', uploadData.updated_count);
  console.log('New Count:', uploadData.new_count);
  console.log('Detected Period:', uploadData.detected_period);
}

testApi().catch(console.error);
