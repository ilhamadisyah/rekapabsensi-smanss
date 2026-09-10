export type UserRole = 'superadmin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type AdminUserPublic = Omit<AdminUser, 'password_hash'>;

export interface AuthSession {
  user: AdminUserPublic;
  token: string;
}

export type AttendanceCode = 
  | 'HADIR'  // Hadir Penuh (Tepat Waktu)
  | 'A'      // Without Info (Alpha / Merah)
  | 'HIP'    // Hak Izin Pagi (-1 poin)
  | 'HIS'    // Hak Izin Siang (-1 poin)
  | 'I'      // Ill (No Letter) (-1 poin)
  | 'IL'     // Ill (With Letter) (Bebas Pengurang)
  | 'PM'     // Permission (Izin Resmi)
  | 'OTL'    // Other Leave (Cuti Lainnya)
  | 'AL'     // Annual Leave (Cuti Tahunan)
  | 'DL'     // Dinas Luar (Tugas Kedinasan)
  | 'OFF'    // Libur Shift (Bebas Tugas)
  | 'LIBUR'; // Hari Libur Nasional / Sekolah

export interface AttendanceStatusInfo {
  code: AttendanceCode;
  label: string;
  category: 'present' | 'absent_unverified' | 'absent_verified';
  excelCode: string;
  targetCol: string; // e.g. 'AP', 'AH', etc.
  description: string;
  penaltyPoints: number;
  bgHex: string;
  textHex: string;
  tailwindClass: string;
}

export const ATTENDANCE_STATUS_MAP: Record<AttendanceCode, AttendanceStatusInfo> = {
  HADIR: {
    code: 'HADIR',
    label: 'HADIR',
    category: 'present',
    excelCode: '',
    targetCol: '-',
    description: 'Hadir Penuh Tepat Waktu (Sesuai Jam Shift / Operasional)',
    penaltyPoints: 0,
    bgHex: '#C6EFCE',
    textHex: '#006100',
    tailwindClass: 'bg-[#C6EFCE] text-[#006100] border-[#93D097]',
  },
  A: {
    code: 'A',
    label: 'WITHOUT INFO (Alpha)',
    category: 'absent_unverified',
    excelCode: 'A',
    targetCol: 'AP',
    description: 'Tidak Hadir Tanpa Keterangan (-3 Poin)',
    penaltyPoints: 3,
    bgHex: '#FFC7CE',
    textHex: '#9C0006',
    tailwindClass: 'bg-[#FFC7CE] text-[#9C0006] border-[#F59DA7]',
  },
  HIP: {
    code: 'HIP',
    label: 'HAK IZIN PAGI',
    category: 'absent_verified',
    excelCode: 'HIP',
    targetCol: 'AH',
    description: 'Izin Datang Terlambat Pagi (-1 Poin)',
    penaltyPoints: 1,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  HIS: {
    code: 'HIS',
    label: 'HAK IZIN SIANG',
    category: 'absent_verified',
    excelCode: 'HIS',
    targetCol: 'AI',
    description: 'Izin Pulang Lebih Awal Siang (-1 Poin)',
    penaltyPoints: 1,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  I: {
    code: 'I',
    label: 'ILL (NO LETTER)',
    category: 'absent_verified',
    excelCode: 'I',
    targetCol: 'AJ',
    description: 'Sakit Tanpa Surat Dokter (-1 Poin)',
    penaltyPoints: 1,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  IL: {
    code: 'IL',
    label: 'ILL (WITH LETTER)',
    category: 'absent_verified',
    excelCode: 'IL',
    targetCol: 'AK',
    description: 'Sakit Dengan Surat Dokter (Bebas Pengurang)',
    penaltyPoints: 0,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  PM: {
    code: 'PM',
    label: 'PERMISSION',
    category: 'absent_verified',
    excelCode: 'PM',
    targetCol: 'AL',
    description: 'Izin Resmi Kedinasan/Pribadi',
    penaltyPoints: 0,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  OTL: {
    code: 'OTL',
    label: 'OTHER LEAVE',
    category: 'absent_verified',
    excelCode: 'OTL',
    targetCol: 'AM',
    description: 'Cuti Alasan Penting / Cuti Lainnya',
    penaltyPoints: 0,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  AL: {
    code: 'AL',
    label: 'ANNUAL LEAVE',
    category: 'absent_verified',
    excelCode: 'AL',
    targetCol: 'AN',
    description: 'Cuti Tahunan Pegawai',
    penaltyPoints: 0,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  DL: {
    code: 'DL',
    label: 'DINAS LUAR',
    category: 'absent_verified',
    excelCode: 'DL',
    targetCol: 'AO',
    description: 'Perjalanan Dinas / Tugas Luar Sekolah',
    penaltyPoints: 0,
    bgHex: '#FFEB9C',
    textHex: '#9C6500',
    tailwindClass: 'bg-[#FFEB9C] text-[#9C6500] border-[#ECC767]',
  },
  OFF: {
    code: 'OFF',
    label: 'LIBUR SHIFT',
    category: 'present',
    excelCode: '',
    targetCol: '-',
    description: 'Libur Shift / Bebas Tugas (Bebas Denda Alpha)',
    penaltyPoints: 0,
    bgHex: '#F1F5F9',
    textHex: '#475569',
    tailwindClass: 'bg-slate-100 text-slate-600 border-slate-300',
  },
  LIBUR: {
    code: 'LIBUR',
    label: 'HARI LIBUR',
    category: 'present',
    excelCode: '',
    targetCol: '-',
    description: 'Libur Rutin (Sabtu/Minggu) & Hari Libur Resmi',
    penaltyPoints: 0,
    bgHex: '#FFE4E6',
    textHex: '#BE123C',
    tailwindClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export interface Employee {
  id: string;
  machine_id: string;
  nik: string;
  full_name: string;
  department: string;
  excel_row_index: number; // Row 17 to 111 in official template
  is_active: boolean;
  created_at: string;
}

export interface UploadHistory {
  id: string;
  file_name: string;
  period_month: number;
  period_year: number;
  total_raw_rows: number;
  uploaded_by: string;
  created_at: string;
}

export interface DailyAttendance {
  id: string;
  upload_id: string;
  employee_id: string; // machine_id
  employee_name?: string; // Employee full name
  attendance_date: string; // YYYY-MM-DD
  first_in: string | null; // HH:mm:ss
  last_out: string | null; // HH:mm:ss
  tap_count: number;
  system_status: 'HADIR' | 'TIDAK_HADIR';
  final_status: AttendanceCode;
  notes?: string;
  shift_id?: string;
  shift_code?: string;
  shift_name?: string;
  shift_color?: string;
  is_off_day?: boolean;
  is_holiday?: boolean;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  is_custom_schedule?: boolean;
  has_assigned_duty?: boolean;
  is_cross_day?: boolean;
  checkout_date?: string;
  is_verified: boolean;
  verified_by?: string;
  updated_at: string;
}

export interface ShiftTemplate {
  id: string;
  code: string;
  name: string;
  start_time: string; // "HH:mm:ss"
  end_time: string; // "HH:mm:ss"
  grace_period_minutes: number;
  check_in_window_minutes?: number; // Menit sebelum start_time tap mulai diterima (default: 120)
  check_out_window_minutes?: number; // Menit setelah end_time tap masih diterima (default: 240)
  is_overnight: boolean;
  is_off_day: boolean;
  color: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSchedule {
  id: string; // `sched-${employee_id}-${date}`
  employee_id: string; // machine_id
  employee_name?: string;
  date: string; // "YYYY-MM-DD"
  shift_id: string;
  shift_code?: string;
  shift_name?: string;
  custom_start_time?: string;
  custom_end_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Holiday {
  id: string; // `hol-${date}` or uuid
  date: string; // "YYYY-MM-DD"
  name: string; // e.g. "Maulid Nabi", "Libur Khusus Sekolah"
  category: 'national' | 'school' | 'collective_leave';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  attendance_id: string;
  employee_id: string;
  employee_name?: string;
  attendance_date: string;
  previous_status: AttendanceCode | string;
  new_status: AttendanceCode | string;
  reason?: string;
  changed_by: string;
  changed_at: string;
}

export interface AttendanceMatrixDay {
  day: number;
  dateStr: string; // YYYY-MM-DD
  dayName: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  isWeekend: boolean;
  holiday?: Holiday | null;
}

export interface EmployeeAttendanceRow {
  employee: Employee;
  days: Record<number, DailyAttendance | null>;
  stats: {
    hadirCount: number;
    alphaCount: number;
    verifiedCount: number;
    totalWorkDays: number;
    disciplineScore: number;
  };
}

export interface MonthlyAttendanceSummary {
  periodMonth: number;
  periodYear: number;
  totalEmployees: number;
  avgAttendanceRate: number;
  totalUnverifiedRed: number;
  verificationProgress: number; // in percent
  totalWorkingDays: number;
}

export const MONTH_NAMES_ID = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export function getMonthName(monthNumber: number): string {
  if (monthNumber >= 1 && monthNumber <= 12) {
    return MONTH_NAMES_ID[monthNumber];
  }
  return `Bulan ${monthNumber}`;
}
