import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function main() {
  console.log('--- Starting Database Restoration Script with Full Pagination ---');

  // 1. Fetch ALL audit logs sorted chronologically ascending
  const allLogs = [];
  let fromLog = 0;
  const pageSize = 1000;
  let hasMoreLogs = true;

  while (hasMoreLogs) {
    const { data: logChunk, error: logErr } = await supabase
      .from('audit_logs')
      .select('*')
      .order('changed_at', { ascending: true })
      .range(fromLog, fromLog + pageSize - 1);

    if (logErr) {
      console.error('Error fetching audit logs:', logErr);
      return;
    }

    if (logChunk && logChunk.length > 0) {
      allLogs.push(...logChunk);
      if (logChunk.length < pageSize) hasMoreLogs = false;
      else fromLog += pageSize;
    } else {
      hasMoreLogs = false;
    }
  }

  console.log(`Fetched ${allLogs.length} total audit log entries.`);

  // Key by `employee_id___date` AND by `attendance_id`
  const latestAuditByEmpDate = new Map();
  const latestAuditByAttId = new Map();

  for (const l of allLogs) {
    if (l.employee_id && l.attendance_date && l.new_status) {
      latestAuditByEmpDate.set(`${l.employee_id}___${l.attendance_date}`, l);
    }
    if (l.attendance_id && l.new_status) {
      latestAuditByAttId.set(l.attendance_id, l);
    }
  }

  // 2. Fetch ALL daily_attendance for September 2026 with pagination
  const allAttRecords = [];
  let fromAtt = 0;
  let hasMoreAtt = true;

  while (hasMoreAtt) {
    const { data: attChunk, error: attErr } = await supabase
      .from('daily_attendance')
      .select('*')
      .like('attendance_date', '2026-09%')
      .order('attendance_date', { ascending: true })
      .order('employee_id', { ascending: true })
      .range(fromAtt, fromAtt + pageSize - 1);

    if (attErr) {
      console.error('Error fetching daily_attendance:', attErr);
      return;
    }

    if (attChunk && attChunk.length > 0) {
      allAttRecords.push(...attChunk);
      if (attChunk.length < pageSize) hasMoreAtt = false;
      else fromAtt += pageSize;
    } else {
      hasMoreAtt = false;
    }
  }

  console.log(`Fetched ${allAttRecords.length} total daily attendance records for September 2026.`);

  const updates = [];
  const validManualStatuses = ['AL', 'DL', 'IL', 'PM', 'OTL', 'HIP', 'HIS', 'I', 'S', 'C', 'HADIR', 'OFF', 'LIBUR'];

  for (const rec of allAttRecords) {
    const audit =
      latestAuditByEmpDate.get(`${rec.employee_id}___${rec.attendance_date}`) ||
      latestAuditByAttId.get(rec.id);

    if (!audit) continue;

    if (
      rec.final_status === 'A' &&
      audit.new_status !== 'A' &&
      validManualStatuses.includes(audit.new_status)
    ) {
      let cleanReason = audit.reason;
      if (cleanReason === 'Alpha (Tidak Ada Rekaman Mesin)' || cleanReason === 'Pembaruan verifikasi oleh admin') {
        cleanReason = rec.notes || cleanReason;
      }

      updates.push({
        ...rec,
        upload_id: 'manual_override',
        final_status: audit.new_status,
        notes: cleanReason,
        is_verified: true,
        verified_by: audit.changed_by || 'superadmin',
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Explicitly ensure Mico Ruswanto's 3 days (04, 07, 08) are included and set to 'AL'
  const micoEmpId = '1671030707850002';
  const micoDates = ['2026-09-04', '2026-09-07', '2026-09-08'];
  for (const d of micoDates) {
    const existing = allAttRecords.find((r) => r.employee_id === micoEmpId && r.attendance_date === d);
    const existingInUpdates = updates.find((u) => u.employee_id === micoEmpId && u.attendance_date === d);
    if (!existingInUpdates && existing) {
      updates.push({
        ...existing,
        upload_id: 'manual_override',
        final_status: 'AL',
        notes: 'menghadiri keponakan menikah',
        is_verified: true,
        verified_by: 'superadmin',
        updated_at: new Date().toISOString(),
      });
    } else if (existingInUpdates) {
      existingInUpdates.final_status = 'AL';
      existingInUpdates.notes = 'menghadiri keponakan menikah';
      existingInUpdates.upload_id = 'manual_override';
      existingInUpdates.is_verified = true;
      existingInUpdates.verified_by = 'superadmin';
    }
  }

  console.log(`\nPrepared ${updates.length} records to restore in Supabase:`);
  for (const u of updates) {
    console.log(`- [${u.attendance_date}] ${u.employee_name} (${u.employee_id}) -> ${u.final_status} ("${u.notes}")`);
  }

  // Execute batch upsert in chunks of 200
  const chunkSize = 200;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error: upsertErr } = await supabase
      .from('daily_attendance')
      .upsert(chunk, { onConflict: 'employee_id,attendance_date' });

    if (upsertErr) {
      console.error('Error upserting restored records chunk:', upsertErr);
      return;
    }
  }

  console.log('\nSuccessfully restored all records in Supabase daily_attendance!');

  // Also update local JSON store if it exists
  const localDbPath = path.resolve('data', 'db.json');
  if (fs.existsSync(localDbPath)) {
    try {
      const localData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
      if (Array.isArray(localData.daily_attendance)) {
        let localUpdated = 0;
        for (const u of updates) {
          const idx = localData.daily_attendance.findIndex(
            (r) => (r.employee_id === u.employee_id || r.id === u.id) && r.attendance_date === u.attendance_date
          );
          if (idx !== -1) {
            localData.daily_attendance[idx] = {
              ...localData.daily_attendance[idx],
              ...u,
            };
            localUpdated++;
          } else {
            localData.daily_attendance.push(u);
            localUpdated++;
          }
        }
        fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2), 'utf8');
        console.log(`Updated ${localUpdated} records in local db.json.`);
      }
    } catch (e) {
      console.warn('Could not update local db.json:', e.message);
    }
  }

  console.log('--- Restoration Complete ---');
}

main();
