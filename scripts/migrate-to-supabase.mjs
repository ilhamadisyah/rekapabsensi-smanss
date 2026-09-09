import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Baca .env.local jika ada
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31m[ERROR] NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_KEY belum diisi di .env.local!\x1b[0m');
  console.log('Silakan buat file .env.local dengan isi:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-or-anon-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  console.log('\x1b[36m=== MEMULAI MIGRASI DATA KE SUPABASE ===\x1b[0m');
  console.log(`Menghubungkan ke Supabase: ${supabaseUrl}`);

  const dbPath = path.resolve(process.cwd(), 'data', 'attendance-db.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`Berkas lokal ${dbPath} tidak ditemukan.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  const dbData = JSON.parse(raw);

  // 1. Migrate Employees
  if (dbData.employees && dbData.employees.length > 0) {
    console.log(`Mengunggah ${dbData.employees.length} master pegawai...`);
    const { error } = await supabase
      .from('employees')
      .upsert(dbData.employees, { onConflict: 'machine_id' });
    if (error) console.error('  Gagal employees:', error.message);
    else console.log('  ✓ Berhasil migrasi master pegawai.');
  }

  // 2. Migrate Shift Templates
  if (dbData.shift_templates && dbData.shift_templates.length > 0) {
    console.log(`Mengunggah ${dbData.shift_templates.length} master shift templates...`);
    const { error } = await supabase
      .from('shift_templates')
      .upsert(dbData.shift_templates, { onConflict: 'id' });
    if (error) console.error('  Gagal shift_templates:', error.message);
    else console.log('  ✓ Berhasil migrasi shift templates.');
  }

  // 3. Migrate Holidays
  if (dbData.holidays && dbData.holidays.length > 0) {
    console.log(`Mengunggah ${dbData.holidays.length} data hari libur...`);
    const { error } = await supabase
      .from('holidays')
      .upsert(dbData.holidays, { onConflict: 'date' });
    if (error) console.error('  Gagal holidays:', error.message);
    else console.log('  ✓ Berhasil migrasi hari libur.');
  }

  // 4. Migrate Employee Schedules
  if (dbData.employee_schedules && dbData.employee_schedules.length > 0) {
    console.log(`Mengunggah ${dbData.employee_schedules.length} penugasan jadwal kerja...`);
    const chunkSize = 200;
    for (let i = 0; i < dbData.employee_schedules.length; i += chunkSize) {
      const chunk = dbData.employee_schedules.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('employee_schedules')
        .upsert(chunk, { onConflict: 'employee_id,date' });
      if (error) console.error(`  Gagal chunk schedules ${i}:`, error.message);
    }
    console.log('  ✓ Berhasil migrasi penugasan jadwal pegawai.');
  }

  // 5. Migrate Upload History
  if (dbData.upload_history && dbData.upload_history.length > 0) {
    console.log(`Mengunggah ${dbData.upload_history.length} riwayat unggahan...`);
    const { error } = await supabase
      .from('upload_history')
      .upsert(dbData.upload_history, { onConflict: 'id' });
    if (error) console.error('  Gagal upload_history:', error.message);
    else console.log('  ✓ Berhasil migrasi riwayat unggahan.');
  }

  // 6. Migrate Daily Attendance (in chunks)
  if (dbData.daily_attendance && dbData.daily_attendance.length > 0) {
    console.log(`Mengunggah ${dbData.daily_attendance.length} baris rekap kehadiran harian...`);
    const chunkSize = 500;
    let successCount = 0;
    for (let i = 0; i < dbData.daily_attendance.length; i += chunkSize) {
      const chunk = dbData.daily_attendance.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('daily_attendance')
        .upsert(chunk, { onConflict: 'employee_id,attendance_date' });
      if (error) {
        console.error(`  Gagal chunk presensi ${i}:`, error.message);
      } else {
        successCount += chunk.length;
        process.stdout.write(`\r  Progress: ${successCount} / ${dbData.daily_attendance.length} data...`);
      }
    }
    console.log('\n  ✓ Berhasil migrasi seluruh rekap absensi harian.');
  }

  // 7. Migrate Audit Logs
  if (dbData.audit_logs && dbData.audit_logs.length > 0) {
    console.log(`Mengunggah ${dbData.audit_logs.length} riwayat audit log...`);
    const { error } = await supabase
      .from('audit_logs')
      .upsert(dbData.audit_logs, { onConflict: 'id' });
    if (error) console.error('  Gagal audit_logs:', error.message);
    else console.log('  ✓ Berhasil migrasi audit logs.');
  }

  console.log('\x1b[32m=== MIGRASI SELESAI DENGAN SUKSES! ===\x1b[0m');
  console.log('Database Supabase Anda kini siap digunakan dan terhubung penuh.');
}

runMigration().catch((err) => {
  console.error('Fatal error saat migrasi:', err);
  process.exit(1);
});
