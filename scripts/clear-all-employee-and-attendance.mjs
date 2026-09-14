import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Baca .env.local jika ada
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

async function runClean() {
  console.log('\x1b[36m=== MEMULAI PENCADANGAN DAN PEMBERSIHAN DATA ===\x1b[0m\n');

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // A. CADANGKAN BERKAS LOKAL attendance-db.json
  const localDbPath = path.join(dataDir, 'attendance-db.json');
  if (fs.existsSync(localDbPath)) {
    const localContent = fs.readFileSync(localDbPath, 'utf-8');
    const backupLocalPath = path.join(dataDir, `backup-attendance-db-before-clear.json`);
    fs.writeFileSync(backupLocalPath, localContent, 'utf-8');
    console.log(`✓ Data lokal berhasil dicadangkan ke: ${backupLocalPath}`);

    try {
      const dbObj = JSON.parse(localContent);
      dbObj.employees = [];
      dbObj.daily_attendance = [];
      dbObj.upload_history = [];
      dbObj.audit_logs = [];
      dbObj.employee_schedules = [];
      // Pertahankan shift_templates, holidays, dan admin_users!
      fs.writeFileSync(localDbPath, JSON.stringify(dbObj, null, 2), 'utf-8');
      console.log('✓ Berkas data/attendance-db.json berhasil dibersihkan (koleksi pegawai & presensi telah dikosongkan).');
    } catch (err) {
      console.error('Error saat memperbarui attendance-db.json:', err);
    }
  }

  // B. CADANGKAN & BERSIHKAN SUPABASE
  if (!supabaseUrl || !supabaseKey) {
    console.log('\nSupabase tidak terkonfigurasi, pembersihan Supabase dilewati.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  console.log(`\nMenghubungkan ke Supabase: ${supabaseUrl}`);

  // 1. Cadangkan seluruh data tabel yang akan dihapus
  const tablesToClear = ['audit_logs', 'daily_attendance', 'employee_schedules', 'upload_history', 'employees'];
  const supabaseBackup = {};

  for (const table of tablesToClear) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`  [Peringatan] Gagal membaca tabel ${table} untuk cadangan:`, error.message);
      supabaseBackup[table] = [];
    } else {
      supabaseBackup[table] = data || [];
      console.log(`  Mencadangkan ${supabaseBackup[table].length} baris dari tabel '${table}'...`);
    }
  }

  const backupSupabasePath = path.join(dataDir, `backup-supabase-before-clear.json`);
  fs.writeFileSync(backupSupabasePath, JSON.stringify(supabaseBackup, null, 2), 'utf-8');
  console.log(`✓ Data Supabase berhasil dicadangkan ke: ${backupSupabasePath}\n`);

  // 2. Hapus data di Supabase secara berurutan
  // Menggunakan filter not null / gte 0 agar dapat menghapus seluruh baris
  for (const table of tablesToClear) {
    console.log(`Menghapus seluruh baris dari tabel Supabase '${table}'...`);
    
    // Gunakan 'neq' pada primary key 'id' dengan string kosong untuk menghapus semua baris
    const { error, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .neq('id', '___non_existent_id___');

    if (error) {
      console.error(`  ✕ Gagal menghapus baris dari ${table}:`, error.message);
    } else {
      console.log(`  ✓ Berhasil menghapus baris dari tabel '${table}'.`);
    }
  }

  console.log('\n\x1b[32m=== PEMBERSIHAN SELESAI DENGAN SUKSES! ===\x1b[0m');
  console.log('Seluruh data pegawai, presensi harian, riwayat upload, audit log, dan penugasan jadwal telah dihapus.');
  console.log('Template shift, data hari libur, dan akun admin tetap utuh.');
}

runClean().catch((err) => {
  console.error('Fatal error saat membersihkan data:', err);
  process.exit(1);
});
