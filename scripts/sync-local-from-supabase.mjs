import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function syncToLocal() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase is not configured.');
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const dbPath = path.resolve(process.cwd(), 'data/attendance-db.json');
  const local = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  const [emps, att, hist] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('daily_attendance').select('*'),
    supabase.from('upload_history').select('*')
  ]);

  if (emps.data) local.employees = emps.data;
  if (att.data) local.daily_attendance = att.data;
  if (hist.data) local.upload_history = hist.data;

  fs.writeFileSync(dbPath, JSON.stringify(local, null, 2), 'utf8');
  console.log('Synced to local attendance-db.json:');
  console.log('- Employees:', local.employees.length);
  console.log('- Daily Attendance:', local.daily_attendance.length);
  console.log('- Upload history:', local.upload_history.length);
}

syncToLocal().catch(console.error);
