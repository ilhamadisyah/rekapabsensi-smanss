-- =================================================================
-- SMAN SUMATERA SELATAN - AUTOABSEN SMANSS DATABASE INITIALIZATION
-- Run this script in Supabase SQL Editor (Dashboard > SQL Editor)
-- =================================================================

-- 1. Master Pegawai SMAN Sumatera Selatan
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(100) PRIMARY KEY,
    machine_id VARCHAR(50) UNIQUE NOT NULL,
    nik VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    excel_row_index INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Master Shift & Jam Kerja
CREATE TABLE IF NOT EXISTS shift_templates (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    grace_period_minutes INT DEFAULT 0,
    is_overnight BOOLEAN DEFAULT FALSE,
    is_off_day BOOLEAN DEFAULT FALSE,
    color VARCHAR(50) DEFAULT '#2563eb',
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Master Hari Libur
CREATE TABLE IF NOT EXISTS holidays (
    id VARCHAR(100) PRIMARY KEY,
    date VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'school',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Penugasan Jadwal Kerja Pegawai
CREATE TABLE IF NOT EXISTS employee_schedules (
    id VARCHAR(100) PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    date VARCHAR(20) NOT NULL,
    shift_id VARCHAR(100) NOT NULL REFERENCES shift_templates(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    custom_start_time VARCHAR(20),
    custom_end_time VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_emp_date UNIQUE (employee_id, date)
);

-- 5. Riwayat Berkas Unggahan
CREATE TABLE IF NOT EXISTS upload_history (
    id VARCHAR(100) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    total_raw_rows INT NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Rekap Kehadiran Harian
CREATE TABLE IF NOT EXISTS daily_attendance (
    id VARCHAR(100) PRIMARY KEY,
    upload_id VARCHAR(100),
    employee_id VARCHAR(50) NOT NULL,
    employee_name VARCHAR(255),
    attendance_date VARCHAR(20) NOT NULL,
    first_in VARCHAR(20),
    last_out VARCHAR(20),
    tap_count INT DEFAULT 0,
    system_status VARCHAR(50) NOT NULL,
    final_status VARCHAR(50) NOT NULL DEFAULT 'A',
    notes TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(100),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_emp_att UNIQUE (employee_id, attendance_date)
);

-- 7. Log Audit Perubahan Status
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    attendance_id VARCHAR(100),
    employee_id VARCHAR(50) NOT NULL,
    attendance_date VARCHAR(20) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by VARCHAR(100),
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Indeks Kinerja Kueri
CREATE INDEX IF NOT EXISTS idx_emp_machine ON employees(machine_id);
CREATE INDEX IF NOT EXISTS idx_daily_att_date ON daily_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_daily_att_emp_date ON daily_attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_emp_sched_date ON employee_schedules(date);
CREATE INDEX IF NOT EXISTS idx_emp_sched_emp_date ON employee_schedules(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(attendance_date);

-- 9. Row Level Security (RLS) - Diaktifkan dengan akses penuh untuk anon & service_role
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses publik (dibaca dan ditulis oleh aplikasi Next.js via API Key)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow all for employees" ON employees;
    DROP POLICY IF EXISTS "Allow all for shift_templates" ON shift_templates;
    DROP POLICY IF EXISTS "Allow all for holidays" ON holidays;
    DROP POLICY IF EXISTS "Allow all for employee_schedules" ON employee_schedules;
    DROP POLICY IF EXISTS "Allow all for upload_history" ON upload_history;
    DROP POLICY IF EXISTS "Allow all for daily_attendance" ON daily_attendance;
    DROP POLICY IF EXISTS "Allow all for audit_logs" ON audit_logs;
END
$$;

CREATE POLICY "Allow all for employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for shift_templates" ON shift_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for holidays" ON holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for employee_schedules" ON employee_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for upload_history" ON upload_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for daily_attendance" ON daily_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 10. Data Bawaan Shift Kerja (Default Templates)
INSERT INTO shift_templates (id, code, name, start_time, end_time, grace_period_minutes, is_overnight, is_off_day, color, description, is_default)
VALUES 
('shift-normal', 'NORM', 'Jam Kerja Normal (Reguler)', '07:30:00', '16:00:00', 0, false, false, '#2563eb', 'Jam operasional standar harian (07:30 - 16:00 WIB)', true),
('shift-pagi', 'PAGI', 'Shift Pagi (Piket/Asrama)', '06:00:00', '14:00:00', 0, false, false, '#059669', 'Shift pagi operasional & asrama (06:00 - 14:00 WIB)', false),
('shift-siang', 'SIANG', 'Shift Siang (Layanan)', '14:00:00', '22:00:00', 0, false, false, '#d97706', 'Shift siang pelayanan (14:00 - 22:00 WIB)', false),
('shift-malam', 'MALAM', 'Shift Malam (Security/Asrama)', '20:00:00', '06:00:00', 0, true, false, '#7c3aed', 'Shift malam penjagaan & pengawasan (20:00 - 06:00 WIB)', false),
('shift-off', 'OFF', 'Libur Shift (Bebas Tugas)', '00:00:00', '00:00:00', 0, false, true, '#64748b', 'Hari libur/lepas piket bagi pegawai sistem shift (bebas tap/alpha)', false)
ON CONFLICT (id) DO NOTHING;

-- 11. Kolom Tambahan (Migrasi Skema Opsional)
ALTER TABLE daily_attendance ADD COLUMN IF NOT EXISTS is_cross_day BOOLEAN DEFAULT FALSE;
ALTER TABLE shift_templates ADD COLUMN IF NOT EXISTS check_in_window_minutes INT DEFAULT 120;
ALTER TABLE shift_templates ADD COLUMN IF NOT EXISTS check_out_window_minutes INT DEFAULT 240;

