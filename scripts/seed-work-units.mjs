import fs from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data', 'attendance-db.json');
const content = fs.readFileSync(DB_PATH, 'utf-8');
const parsed = JSON.parse(content);

const DEFAULT_WORK_UNITS = [
  {
    id: 'unit-security',
    name: 'Security / Satpam',
    description: 'Petugas keamanan dan ketertiban lingkungan sekolah',
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'unit-kebersihan',
    name: 'Tenaga Kebersihan / Cleaning',
    description: 'Petugas kebersihan area sekolah dan fasilitas umum',
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'unit-asrama',
    name: 'Pengelola Asrama',
    description: 'Pembina, pengasuh, dan pengurus asrama siswa',
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'unit-tu',
    name: 'Tata Usaha / Administrasi',
    description: 'Tenaga administrasi dan tata usaha sekolah',
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'unit-guru',
    name: 'Guru Mata Pelajaran',
    description: 'Tenaga pendidik kurikulum & pengajar',
    created_at: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'unit-it',
    name: 'Laboratorium & IT',
    description: 'Teknisi laboratorium dan infrastruktur IT',
    created_at: '2026-09-01T00:00:00.000Z',
  },
];

if (!parsed.work_units || parsed.work_units.length === 0) {
  parsed.work_units = DEFAULT_WORK_UNITS;
}

if (parsed.admin_users && parsed.admin_users.length > 0) {
  parsed.admin_users = parsed.admin_users.map(u => {
    if (u.role === 'superadmin' && (!u.work_unit_access || u.work_unit_access.length === 0)) {
      u.work_unit_access = ['ALL'];
    }
    return u;
  });
}

fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
console.log('✓ Inisialisasi local database berhasil dengan unit kerja default!');
console.log('Unit kerja terdaftar:', parsed.work_units.map(u => u.name));
