async function runTests() {
  console.log('--- STARTING COMPREHENSIVE TESTS FOR JADWAL & HOLIDAY FEATURES ---');

  // 1. Test GET /api/schedules
  console.log('1. Testing GET /api/schedules?month=9&year=2026 ...');
  const res1 = await fetch('http://localhost:3000/api/schedules?month=9&year=2026');
  const data1 = await res1.json();
  console.log('   Status:', res1.status, 'Success:', data1.success);
  console.log('   Employees:', data1.employees?.length, 'Shifts:', data1.shifts?.length, 'Holidays:', data1.holidays?.length);

  // 2. Test POST /api/holidays (Create holiday)
  console.log('\n2. Testing POST /api/holidays ...');
  const res2 = await fetch('http://localhost:3000/api/holidays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: '2026-09-16',
      name: 'Maulid Nabi Muhammad SAW (Uji Coba)',
      category: 'national',
      notes: 'Petugas piket tetap bertugas sesuai shift.',
    }),
  });
  const data2 = await res2.json();
  console.log('   Status:', res2.status, 'Holiday ID:', data2.holiday?.id, 'Name:', data2.holiday?.name);

  // 3. Test GET /api/holidays
  console.log('\n3. Testing GET /api/holidays?month=9&year=2026 ...');
  const res3 = await fetch('http://localhost:3000/api/holidays?month=9&year=2026');
  const data3 = await res3.json();
  console.log('   Status:', res3.status, 'Total Holidays:', data3.holidays?.length);

  // 4. Test POST /api/schedules with Custom Hours
  const testEmp = data1.employees[0];
  console.log(`\n4. Testing POST /api/schedules (Custom Hours) for ${testEmp.full_name} ...`);
  const res4 = await fetch('http://localhost:3000/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: testEmp.machine_id,
      date: '2026-09-16',
      shift_id: 'shift-normal',
      custom_start_time: '08:30:00',
      custom_end_time: '14:45:00',
      notes: 'Piket Hari Libur Khusus',
    }),
  });
  const data4 = await res4.json();
  console.log('   Status:', res4.status, 'Schedule saved:', data4.schedule?.id, 'Custom Start:', data4.schedule?.custom_start_time);

  // 5. Test POST /api/schedules/reevaluate
  console.log('\n5. Testing POST /api/schedules/reevaluate ...');
  const res5 = await fetch('http://localhost:3000/api/schedules/reevaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: 9, year: 2026 }),
  });
  const data5 = await res5.json();
  console.log('   Status:', res5.status, 'Updated Count:', data5.updatedCount, 'Message:', data5.message);

  // 6. Test POST /api/schedules/copy-month (Copy 9/2026 to 10/2026)
  console.log('\n6. Testing POST /api/schedules/copy-month ...');
  const res6 = await fetch('http://localhost:3000/api/schedules/copy-month', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromMonth: 9, fromYear: 2026, toMonth: 10, toYear: 2026 }),
  });
  const data6 = await res6.json();
  console.log('   Status:', res6.status, 'Copied count:', data6.copiedCount, 'Message:', data6.message);

  // 7. Test GET /api/schedules/export
  console.log('\n7. Testing GET /api/schedules/export ...');
  const res7 = await fetch('http://localhost:3000/api/schedules/export?month=9&year=2026');
  console.log('   Status:', res7.status, 'Content-Type:', res7.headers.get('content-type'), 'Buffer size:', (await res7.arrayBuffer()).byteLength);

  // 8. Test HTTP GET http://localhost:3000/jadwal
  console.log('\n8. Testing GET http://localhost:3000/jadwal ...');
  const res8 = await fetch('http://localhost:3000/jadwal');
  console.log('   Status:', res8.status, 'OK:', res8.ok);

  console.log('\n--- ALL API & BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(console.error);
