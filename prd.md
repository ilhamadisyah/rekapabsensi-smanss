# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# AutoAbsen SMANSS
### Sistem Otomasi Rekapitulasi Presensi Biometrik & Validasi Kehadiran Terintegrasi

---

## 1. Executive Summary & Ringkasan Proyek

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Produk** | **AutoAbsen SMANSS** (*Automated Attendance & Recapitulation System*) |
| **Versi Dokumen** | `v1.1.0` (Production Baseline) |
| **Platform Target** | Web Application (**Vercel Serverless** & **Supabase Cloud**) |
| **Pemilik Produk** | Tim IT & Urusan Kepegawaian SMAN Sumatera Selatan |
| **Format Input** | Berkas Transaksi Mesin Faceprint/Biometrik (`.xls`, contoh: `ABSENSI 1111.xls`) |
| **Format Output** | Laporan Rekap Bulanan Resmi (`formt rekap absen.xlsx` dengan formula utuh) |

### 1.1 Latar Belakang & Permasalahan
Setiap bulan, bagian Tata Usaha mengunduh rekaman transaksi mentah (*raw punch logs*) dari mesin absensi biometrik/faceprint berformat `.xls`. File mentah ini memuat ratusan hingga ribuan baris rekaman jam tanpa status kehadiran terpadu:
1. Satu pegawai dapat melakukan *tap* berkali-kali dalam sehari.
2. Penentuan kehadiran wajib memeriksa waktu ketukan paling awal (*check-in*) dan waktu ketukan paling akhir (*check-out*).
3. Jam kerja operasional resmi adalah **07:30 s/d 16:00 WIB**. Pegawai yang *check-in* setelah pukul 07:30 atau *check-out* sebelum pukul 16:00 (atau hanya melakukan satu kali tap) tidak memenuhi kualifikasi kehadiran penuh.
4. Data hasil rekapitulasi wajib dituangkan ke format laporan bulanan resmi (`formt rekap absen.xlsx`) yang memuat matriks tanggal 1–31, kop surat kedinasan sekolah, dan formula Excel otomatis untuk penilaian persentase kedisiplinan.
5. Proses verifikasi manual saat ini membutuhkan waktu 2–3 hari kerja tiap akhir bulan dan rentan terhadap kesalahan manusia (*human error*).

### 1.2 Tujuan & Solusi Produk
AutoAbsen SMANSS menghadirkan sistem web otomatis berbasis serverless yang:
* Mengurai (*parse*) data mentah mesin absensi secara instan (< 3 detik).
* Mengelompokkan log per pegawai per tanggal, lalu menghitung waktu masuk dan pulang.
* Mengklasifikasi kehadiran biner awal secara otomatis: **HADIR** (Hijau) vs **TIDAK HADIR** (Merah / Default Alpha).
* Menyediakan antarmuka peninjauan interaktif bagi admin untuk mengkategorikan sel merah ke dalam **9 status ketidakhadiran resmi**.
* Menginjeksi hasil akhir ke template master Excel resmi sekolah (`formt rekap absen.xlsx`) tanpa merusak formula bawaan (`COUNTIF`, skoring nilai kedisiplinan X/Y, serta predikat).

---

## 2. Tech Stack Architecture

Sistem dirancang dengan arsitektur serverless modern untuk efisiensi operasional, skalabilitas instan, dan zero-maintenance server fisik:

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                     │
│    Next.js 15 (React 19) + Tailwind CSS + shadcn/ui     │
└────────────┬───────────────────────────────▲────────────┘
             │ Upload Raw .xls               │ Live Matrix Table
             ▼                               │ & Excel Download
┌─────────────────────────────────────────────────────────┐
│              Vercel Serverless Functions                │
│  - Route Handler: /api/attendance/upload                │
│  - Route Handler: /api/attendance/update-cell           │
│  - Route Handler: /api/attendance/export                │
│  - File Processing: 'xlsx' (Parser) & 'exceljs' (Gen)   │
└────────────┬───────────────────────────────▲────────────┘
             │ Read / Write                  │ Auth Token & RLS
             ▼                               │
┌─────────────────────────────────────────────────────────┐
│                     Supabase Cloud                      │
│  - PostgreSQL 15 (Relational Data & ENUMs)              │
│  - GoTrue Auth (Admin Authentication)                   │
│  - Storage Bucket (Template .xlsx & Upload Archives)    │
└─────────────────────────────────────────────────────────┘
```

| Lapisan (Layer) | Teknologi / Pustaka | Alasan Pemilihan & Peran Arsitektur |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15 (App Router, React 19, TypeScript)** | Server-side rendering super cepat, integrasi native di Vercel, type safety menyeluruh untuk struktur presensi. |
| **UI & Styling** | **Tailwind CSS + shadcn/ui (Radix UI)** | Desain modern, komponen tabel matriks interaktif, modal popover cepat, dan responsif. |
| **Client State & Cache** | **TanStack React Query v5** | Caching status matriks bulanan, penanganan mutasi data dengan *optimistic updates* saat status sel diubah admin. |
| **Backend Runtime** | **Vercel Serverless Functions (Node.js 20.x)** | Eksekusi parsing file Excel dan validasi aturan jam kerja secara on-demand tanpa kebutuhan dedicated VPS. |
| **Database & Auth** | **Supabase (PostgreSQL 15 + RLS + GoTrue)** | Relasi data absensi terstruktur, Row-Level Security (RLS), dan otentikasi login admin yang aman. |
| **Storage Engine** | **Supabase Storage Bucket** | Menyimpan master template `formt rekap absen.xlsx` dan arsip file mentah log absensi yang diunggah. |
| **Excel Ingestion** | **`xlsx` (SheetJS)** | Membaca format biner lama `.xls` (BIFF8/XML) dari mesin biometrik secara cepat. |
| **Excel Export** | **`exceljs`** | Membuka template resmi `.xlsx`, mengisi nilai matriks, mewarnai sel, dan mempertahankan seluruh formula Excel (`COUNTIF`, skoring) tanpa korupsi berkas. |

---

## 3. User Persona & User Journey

### 3.1 Profil Pengguna
* **Primary Persona:** Staf Tata Usaha / Admin Kepegawaian SMAN Sumatera Selatan.
* **Tanggung Jawab:** Mengunduh berkas log dari mesin absensi setiap pekan/akhir bulan, memvalidasi bukti surat izin/dokter pegawai, dan menyusun laporan kehadiran resmi untuk Kepala Sekolah.

### 3.2 Alur Pengguna (User Journey)
1. **Login:** Admin masuk ke dashboard menggunakan akun terdaftar melalui Supabase Auth.
2. **Pilih Periode & Upload:** Admin menentukan bulan & tahun, lalu mengunggah file mentah (misal: `ABSENSI 1111.xls`).
3. **Automated Parsing & Pre-classification:**
   * Sistem membaca seluruh baris log transaksi.
   * Menemukan tap paling awal (*check-in*) dan paling akhir (*check-out*) per pegawai per tanggal.
   * Memberikan penanda visual: **Hijau (Hadir)** atau **Merah (Tidak Hadir - Default: A)**.
4. **Verifikasi Admin (Interactive Review):**
   * Admin meninjau tampilan matriks tanggal 1–31.
   * Admin mengklik sel merah pada pegawai yang berhalangan dengan keterangan resmi.
   * Admin memilih status yang sesuai dari menu dropdown popover (misal: `HAK IZIN SIANG`, `DINAS LUAR`). Sel seketika berubah menjadi kuning dengan kode singkatan terkait.
5. **Download Laporan Final:**
   * Perubahan tersimpan secara otomatis (*auto-save* via API).
   * Admin menekan tombol **"Download Rekap Resmi (.xlsx)"** untuk mengunduh laporan final yang siap dicetak dan ditandatangani.

---

## 4. Business Rules & Logic Calculation

### 4.1 Spesifikasi Input Berkas Mesin (`ABSENSI 1111.xls`)
* Baris 1: Header kolom (`No. ID`, `NIK`, `Nama`, `Waktu`, `Status`, `Status baru`, `Pengecualian`, `Operasi`).
* Baris 2 s/d selesai: Rekaman transaksi absensi.
* Kunci identifikasi pegawai utama: **`No. ID`** (Machine ID, contoh: ID `5` = `EKO VALERY`, ID `9` = `KURNIAWATI`, ID `13` = `armansyah`).
* Format timestamp: `YYYY-MM-DD HH:mm:ss`. Zona waktu dikunci pada **WIB (`Asia/Jakarta` / UTC+7)**.

### 4.2 Algoritma Penentuan Hadir vs Tidak Hadir
Untuk setiap pegawai pada setiap tanggal kerja ($D$):
1. Kumpulkan seluruh rekaman waktu $T = \{t_1, t_2, \dots, t_n\}$.
2. Hitung:
   $$\text{Check-in } (T_{\text{in}}) = \min(T)$$
   $$\text{Check-out } (T_{\text{out}}) = \max(T)$$
   $$\text{Jumlah Ketukan } (N) = |T|$$
3. Batas toleransi jam operasional:
   * Batas Masuk: `07:30:00 WIB`
   * Batas Pulang: `16:00:00 WIB`
4. **Kondisi HADIR (Hijau):**
   $$\text{Status} = \mathbf{HADIR} \iff (N \ge 2) \land (T_{\text{in}} \le \text{07:30:00}) \land (T_{\text{out}} \ge \text{16:00:00})$$
5. **Kondisi TIDAK HADIR (Merah - Default: A):**
   $$\text{Status} = \mathbf{TIDAK\_HADIR} \iff (N < 2) \lor (T_{\text{in}} > \text{07:30:00}) \lor (T_{\text{out}} < \text{16:00:00})$$

### 4.3 Pemetaan Kode Status Ketidakhadiran ke Template Excel
Template resmi `formt rekap absen.xlsx` mengandalkan kode string tertentu pada rentang kolom tanggal (`C:AF`) untuk menghitung formula ringkasan di kolom `AG:AU`:

| Status UI Admin | Kode Excel | Kolom Target Formula | Bobot Nilai Kedisiplinan | Warna Sel (UI / Excel) |
| :--- | :---: | :---: | :---: | :--- |
| **HADIR** | *(Kosong / ✓)* | - | Poin Penuh | Hijau Muda (`#C6EFCE` / `#006100`) |
| **WITHOUT INFO** *(Default)* | `A` | **AP** (`=COUNTIF(C:AF,"A")`) | Pengurang: -3 Poin | Merah Muda (`#FFC7CE` / `#9C0006`) |
| **HAK IZIN PAGI** | `HIP` | **AH** (`=COUNTIF(C:AF,"HIP")`) | Pengurang: -1 Poin | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **HAK IZIN SIANG** | `HIS` | **AI** (`=COUNTIF(C:AF,"HIS")`) | Pengurang: -1 Poin | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **ILL (NO LETTER)** | `I` | **AJ** (`=COUNTIF(C:AF,"I")`) | Pengurang: -1 Poin | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **ILL (WITH LETTER)** | `IL` | **AK** (`=COUNTIF(C:AF,"IL")`) | Bebas Pengurang | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **PERMISSION** | `PM` | **AL** (`=COUNTIF(C:AF,"PM")`) | Izin Resmi | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **OTHER LEAVE** | `OTL` | **AM** (`=COUNTIF(C:AF,"OTL")`) | Cuti Lainnya | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **ANNUAL LEAVE** | `AL` | **AN** (`=COUNTIF(C:AF,"AL")`) | Cuti Tahunan | Kuning Muda (`#FFEB9C` / `#9C6500`) |
| **DINAS LUAR** | `DL` | **AO** (`=COUNTIF(C:AF,"DL")`) | Tugas Kedinasan | Kuning Muda (`#FFEB9C` / `#9C6500`) |

### 4.4 Penanganan Akhir Pekan (Weekend)
* Kolom yang jatuh pada hari **Sabtu** (`SAT`) dan **Minggu** (`SUN`) pada template tidak diproses oleh mesin absensi.
* Kolom ini secara visual tetap ditandai merah arsir sesuai template aslinya dan nilainya dibiarkan kosong agar tidak dihitung sebagai Alpha oleh formula Excel.

---

## 5. Functional Requirements (FR) Lengkap

### FR-01: Otentikasi & Manajemen Hak Akses Pengguna (RBAC)
* **FR-01.1:** Sistem wajib menyediakan formulir login berbasis email/password yang terhubung langsung ke Supabase Auth (GoTrue).
* **FR-01.2:** Sistem wajib membatasi hak akses pengguna berdasarkan 3 level peran:
  * `admin_tu`: Memiliki wewenang mengunggah file absensi mentah, mengubah status sel merah, dan mengunduh laporan rekapitulasi.
  * `superadmin`: Memiliki hak penuh admin, ditambah pengelolaan master pegawai (pemetaan ID mesin ke nomor baris Excel) dan peninjauan log audit sistem.
  * `pimpinan`: Memiliki akses *read-only* untuk memantau ringkasan kehadiran dan mengunduh laporan final.
* **FR-01.3:** Sistem wajib menerapkan pengamanan rute dashboard menggunakan Next.js Middleware dan mengelola siklus token (*auto-refresh session*).

### FR-02: Modul Unggah & Ingestion Berkas Mentah (.xls)
* **FR-02.1:** Sistem wajib menyediakan antarmuka drag-and-drop untuk mengunggah berkas format `.xls` dan `.xlsx` hingga batas ukuran 15 MB.
* **FR-02.2:** Sistem wajib memvalidasi skema header pada baris pertama file (harus memuat kolom: `No. ID`, `Nama`, `Waktu`, `Status`). Jika header tidak sesuai, sistem menolak file dan menampilkan pesan galat deskriptif.
* **FR-02.3:** Sistem wajib meminta input parameter Periode (Bulan: 1–12, Tahun: >= 2024) sebelum eksekusi pengolahan file.
* **FR-02.4:** Sistem wajib memeriksa riwayat unggahan untuk mendeteksi duplikasi periode dan meminta konfirmasi sebelum menimpa (*overwrite*) data yang telah ada.
* **FR-02.5:** Sistem wajib mencatat metadata berkas ke tabel `upload_history` beserta ID pengguna pengunggah.

### FR-03: Mesin Normalisasi Data & Agregasi Harian
* **FR-03.1:** Sistem wajib mem-parsing seluruh baris log transaksi dan mengonversi format tanggal-waktu ke objek datetime dengan zona waktu terstandarisasi **WIB (UTC+7)**.
* **FR-03.2:** Sistem wajib mengelompokkan baris log berdasarkan pasangan unik `(No. ID, Tanggal)`.
* **FR-03.3:** Untuk setiap kelompok tanggal, sistem wajib mengekstrak:
  * `first_in`: Waktu tap paling awal (`MIN(Waktu)`).
  * `last_out`: Waktu tap paling akhir (`MAX(Waktu)`).
  * `tap_count`: Total frekuensi ketukan pada hari tersebut.
* **FR-03.4:** Sistem wajib melakukan pembersihan data (*string sanitization*) pada nama pegawai (menghapus spasi berlebih dan penanganan *case-insensitivity*).

### FR-04: Mesin Evaluasi Aturan Presensi (Attendance Rule Engine)
* **FR-04.1:** Sistem wajib membandingkan nilai `first_in` terhadap ambang batas jam masuk (default: `07:30:00 WIB`).
* **FR-04.2:** Sistem wajib membandingkan nilai `last_out` terhadap ambang batas jam pulang (default: `16:00:00 WIB`).
* **FR-04.3:** Sistem wajib menetapkan status sistem sebagai **`HADIR`** jika `tap_count >= 2`, `first_in <= 07:30:00`, dan `last_out >= 16:00:00`.
* **FR-04.4:** Sistem wajib menetapkan status sistem sebagai **`TIDAK_HADIR`** dan mengisikan kode default `A` (WITHOUT INFO) jika salah satu kriteria kehadiran tidak terpenuhi.
* **FR-04.5:** Sistem wajib mengecualikan hari Sabtu, Minggu, dan tanggal merah nasional dari perhitungan Alpha.

### FR-05: Antarmuka Matriks Kalender Interaktif (Attendance Grid Dashboard)
* **FR-05.1:** Sistem wajib menyajikan data kehadiran bulanan dalam format matriks kalender (kolom Tanggal 1 s/d 31 horizontal, baris Nama Pegawai vertikal).
* **FR-05.2:** Antarmuka wajib menerapkan fitur *Sticky Header* (baris tanggal tetap terlihat saat scroll vertikal) dan *Sticky Column* (kolom No dan Nama Pegawai tetap terkunci saat scroll horizontal).
* **FR-05.3:** Setiap sel wajib memiliki pembeda visual yang tegas:
  * **Sel Hijau:** Kehadiran tepat waktu (tanda centang atau tag hijau).
  * **Sel Merah:** Ketidakhadiran / Alpha (tag `A`).
  * **Sel Kuning:** Ketidakhadiran yang telah diverifikasi admin (tag `HIP`, `HIS`, `DL`, dll).
* **FR-05.4:** Setiap sel wajib menampilkan *Tooltip Hover* yang memunculkan rincian: `Jam Masuk`, `Jam Pulang`, dan `Jumlah Tap`.
* **FR-05.5:** Sistem wajib menyediakan fitur pencarian instan (*real-time filter*) berdasarkan nama pegawai atau unit kerja.

### FR-06: Modul Override & Verifikasi Ketidakhadiran oleh Admin
* **FR-06.1:** Admin dapat mengklik sel berwarna merah untuk membuka menu popover/dialog pilihan status.
* **FR-06.2:** Popover wajib menyediakan menu dropdown dengan **9 pilihan kategori resmi**: `HAK IZIN PAGI`, `HAK IZIN SIANG`, `ILL (NO LETTER)`, `ILL (WITH LETTER)`, `PERMISSION`, `OTHER LEAVE`, `ANNUAL LEAVE`, `DINAS LUAR`, dan `WITHOUT INFO`.
* **FR-06.3:** Popover menyediakan input catatan opsional (misal: nomor surat tugas atau keterangan dokter).
* **FR-06.4:** Sistem wajib menerapkan *Optimistic UI Update* sehingga warna sel langsung berganti seketika tanpa menunggu respon server selesai.
* **FR-06.5:** Sistem wajib menyediakan fitur perubahan massal (*bulk update*) untuk menetapkan status yang sama pada rentang tanggal tertentu.

### FR-07: Mesin Injeksi & Ekspor Laporan Excel (.xlsx)
* **FR-07.1:** Sistem wajib memuat berkas template master `formt rekap absen.xlsx` langsung dari Supabase Storage ke memory buffer.
* **FR-07.2:** Sistem wajib memperbarui label periode pada sel `A8` sesuai bulan dan tahun laporan yang diekspor.
* **FR-07.3:** Sistem wajib memetakan baris pegawai secara presisi pada baris 17 s/d 121 sesuai master data sekolah.
* **FR-07.4:** Sistem wajib mengisi nilai kolom tanggal (Kolom `C` s/d `AF`) dengan kode string dan warna latar (*cell fill*) yang sesuai standar:
  * Hadir: Cell fill `#C6EFCE`, teks font `#006100`.
  * Alpha (`A`): Cell fill `#FFC7CE`, teks font `#9C0006`.
  * Izin/Cuti/Sakit (`HIP`, `HIS`, `DL`, dll): Cell fill `#FFEB9C`, teks font `#9C6500`.
* **FR-07.5:** **Preservasi Formula Wajib:** Sistem DILARANG menimpa atau menghapus formula bawaan pada kolom `AG` s/d `AU` (`COUNTIF`, formula hari kerja efektif, skoring nilai X, Y, persentase kedisiplinan, dan predikat).
* **FR-07.6:** Berkas luaran wajib berbentuk file `.xlsx` biner yang kompatibel dengan Microsoft Excel 2013+ dan Google Sheets.

### FR-08: Audit Trail & Riwayat Perubahan Data
* **FR-08.1:** Sistem wajib mencatat setiap aksi penyesuaian status oleh admin ke tabel `audit_logs` (waktu, user pengubah, status lama, status baru, catatan).
* **FR-08.2:** Sistem wajib menyediakan log riwayat aktivitas yang dapat ditinjau oleh Superadmin.

### FR-09: Ringkasan Analitik & Widget Metrik
* **FR-09.1:** Dashboard wajib menampilkan ringkasan metrik: Total Pegawai Aktif, Persentase Kehadiran Rata-rata Bulan Berjalan, Jumlah Sel Menunggu Verifikasi (Merah), dan Progres Verifikasi (%).

---

## 6. Non-Functional Requirements (NFR) Lengkap

### NFR-01: Kinerja & Waktu Respons (Performance & Latency)
* **NFR-01.1:** Proses parsing dan kalkulasi file mentah berisi hingga 5.000 log transaksi wajib selesai dalam waktu **< 3,0 detik** pada runtime Vercel Serverless.
* **NFR-01.2:** Waktu render awal (*First Contentful Paint*) dashboard matriks kalender wajib berada di bawah **1,2 detik**.
* **NFR-01.3:** Respons antarmuka saat admin mengubah status sel (*optimistic update*) wajib berlangsung seketika (**< 100 milidetik**).
* **NFR-01.4:** Waktu proses injeksi template dan unduhan berkas laporan `.xlsx` wajib selesai di bawah **4,0 detik**.

### NFR-02: Keandalan & Ketersediaan (Reliability & Availability)
* **NFR-02.1:** Ketersediaan layanan (*uptime SLA*) ditargetkan minimal **99,9%** memanfaatkan infrastruktur redundan Vercel dan Supabase Cloud.
* **NFR-02.2:** Sistem wajib menerapkan *fault-tolerant parsing*; kegagalan pembacaan satu baris log yang rusak tidak boleh menggagalkan proses parsing seluruh berkas.
* **NFR-02.3:** Basis data Supabase wajib memiliki mekanisme pencadangan harian otomatis (*automated daily backup*).

### NFR-03: Skalabilitas & Batasan Sumber Daya (Scalability & Resource Limits)
* **NFR-03.1:** Sistem harus mampu menampung data riwayat kehadiran hingga 5 tahun kalender tanpa penurunan performa kueri berkat penerapan indeks PostgreSQL.
* **NFR-03.2:** Penggunaan memori Vercel Function dibatasi maksimal **1024 MB** per eksekusi fungsi serverless streaming.

### NFR-04: Integritas Data & Preservasi Berkas (Data Integrity)
* **NFR-04.1:** Seluruh operasi pembaruan data transaksi presensi harian wajib menggunakan transaksi atomik (ACID compliance).
* **NFR-04.2:** Sistem menjamin **100% preservasi struktur template Excel**; tidak boleh ada baris kop surat, logo, format border, atau formula perhitungan yang hilang atau menghasilkan galat `#REF!`, `#VALUE!`, atau `#NAME?`.

### NFR-05: Keamanan & Kepatuhan Privasi (Security & Privacy)
* **NFR-05.1:** Seluruh lalu lintas data klien dan server wajib terenkripsi menggunakan HTTPS dengan protokol TLS 1.3.
* **NFR-05.2:** Setiap tabel di Supabase wajib menerapkan kebijakan *Row-Level Security* (RLS).
* **NFR-05.3:** Menerapkan sanitasi input ketat terhadap nama file dan isi sel untuk mencegah serangan *CSV / Formula Injection* dan *Cross-Site Scripting* (XSS).
* **NFR-05.4:** Kredensial rahasia (*Service Role Key*, database password) disimpan secara aman di Vercel Environment Variables dan dilarang dipublikasikan ke klien.

### NFR-06: Aksesibilitas & Kenyamanan Pengguna (Usability & Accessibility)
* **NFR-06.1:** Rasio kontras warna status (Hijau, Merah, Kuning) wajib memenuhi standar **WCAG 2.1 Level AA** agar tetap terbaca jelas di layar monitor.
* **NFR-06.2:** Antarmuka web wajib mendukung navigasi cepat melalui keyboard (tombol panah untuk navigasi sel dan Enter untuk membuka popover status).
* **NFR-06.3:** Layout web dioptimalkan untuk perangkat monitor laptop/desktop staf TU (resolusi 1366x768 hingga 1920x1080).

### NFR-07: Kompatibilitas Perangkat Lunak (Compatibility & Portability)
* **NFR-07.1:** Aplikasi web wajib berjalan mulus di semua peramban modern: Google Chrome (v110+), Microsoft Edge (v110+), Mozilla Firefox (v110+), dan Safari (v16+).
* **NFR-07.2:** Berkas `.xlsx` hasil ekspor harus dapat dibuka dan dihitung sempurna di Microsoft Excel (2013 hingga Microsoft 365), Google Sheets, dan LibreOffice Calc.

### NFR-08: Kemudahan Pemeliharaan & Kualitas Kode (Maintainability)
* **NFR-08.1:** Seluruh basis kode ditulis menggunakan TypeScript dengan *strict type-checking* aktif.
* **NFR-08.2:** Logika kalkulasi jam kerja diisolasi sebagai fungsi murni (*pure functions*) yang dilengkapi unit test otomatis (Vitest / Jest).

---

## 7. Skema Basis Data Lengkap (Supabase / PostgreSQL DDL)

```sql
-- 1. Inisialisasi Tipe Data ENUM
CREATE TYPE attendance_code_enum AS ENUM (
    'HADIR', 'A', 'HIP', 'HIS', 'I', 'IL', 'PM', 'OTL', 'AL', 'DL'
);

CREATE TYPE user_role_enum AS ENUM (
    'superadmin', 'admin_tu', 'pimpinan'
);

-- 2. Master Profil Pengguna
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'admin_tu',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Master Pegawai SMAN Sumatera Selatan
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id VARCHAR(50) UNIQUE NOT NULL, -- ID dari mesin absensi (misal: '5', '9', '13')
    nik VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    excel_row_index INT NOT NULL,           -- Posisi baris target di template (17 s/d 121)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Riwayat Berkas Unggahan
CREATE TABLE upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL CHECK (period_year >= 2024),
    total_raw_rows INT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Rekap Kehadiran Harian
CREATE TABLE daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES upload_history(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) REFERENCES employees(machine_id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    first_in TIME,
    last_out TIME,
    tap_count INT DEFAULT 0,
    system_status VARCHAR(20) NOT NULL, -- 'HADIR' atau 'TIDAK_HADIR'
    final_status attendance_code_enum NOT NULL DEFAULT 'A',
    notes TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_employee_attendance UNIQUE (employee_id, attendance_date)
);

-- 6. Log Audit Perubahan Status
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES daily_attendance(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    attendance_date DATE NOT NULL,
    previous_status attendance_code_enum NOT NULL,
    new_status attendance_code_enum NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- Pembuatan Indeks untuk Kecepatan Kueri
CREATE INDEX idx_daily_att_lookup ON daily_attendance(attendance_date, employee_id);
CREATE INDEX idx_daily_att_status ON daily_attendance(final_status);
CREATE INDEX idx_emp_machine ON employees(machine_id);

-- Kebijakan Keamanan Row-Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read attendance"
ON daily_attendance FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin_tu to update attendance"
ON daily_attendance FOR UPDATE TO authenticated USING (true);
```

---

## 8. Spesifikasi API & Route Handlers

### 8.1 `POST /api/attendance/upload`
* **Deskripsi:** Menerima unggahan file mentah `.xls`, mengekstrak log, melakukan kalkulasi harian, dan menyimpan ke Supabase.
* **Content-Type:** `multipart/form-data`
* **Payload:** `file` (File .xls), `month` (number), `year` (number)
* **Response:**
  ```json
  {
    "success": true,
    "upload_id": "8b52f6ea-6e01-4475-8d81-bf00941db902",
    "total_records_processed": 512,
    "summary": {
      "total_employees": 45,
      "total_present": 480,
      "total_unverified_red": 32
    }
  }
  ```

### 8.2 `PATCH /api/attendance/update-cell`
* **Deskripsi:** Memperbarui status ketidakhadiran satu sel presensi oleh Admin.
* **Payload:**
  ```json
  {
    "employee_id": "13",
    "date": "2026-09-01",
    "final_status": "HIS",
    "notes": "Izin pulang cepat ada keperluan keluarga"
  }
  ```
* **Response:**
  ```json
  {
    "success": true,
    "updated_cell": {
      "employee_id": "13",
      "date": "2026-09-01",
      "final_status": "HIS",
      "color": "YELLOW"
    }
  }
  ```

### 8.3 `GET /api/attendance/export?month=9&year=2026`
* **Deskripsi:** Menghasilkan dan menyajikan stream unduhan berkas `.xlsx` hasil rekapitulasi.
* **Response Headers:**
  * `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  * `Content-Disposition: attachment; filename="Rekap_Absensi_SMANSS_09_2026.xlsx"`

---

## 9. Roadmap & Milestone Implementasi

| Fase | Fokus & Capaian (Deliverables) | Cakupan Fungsional | Durasi |
| :---: | :--- | :--- | :---: |
| **Sprint 1** | **Inisialisasi & Database Setup** | Setup project Next.js 15, skema PostgreSQL Supabase, RLS policies, Auth login, dan parser SheetJS untuk membaca file mentah `.xls`. | 1 Minggu |
| **Sprint 2** | **Attendance Engine & Grid Matrix** | Pembuatan evaluator jam 07:30 & 16:00, komponen tabel matriks kalender interaktif dengan *sticky headers*, tooltip detail jam, dan pencarian pegawai. | 1.5 Minggu |
| **Sprint 3** | **Admin Override & ExcelJS Injection** | Pembuatan dialog popover 9 status izin, mutasi update status seketika, dan integrasi modul `exceljs` untuk clone template `formt rekap absen.xlsx` dengan formula utuh. | 1.5 Minggu |
| **Sprint 4** | **Audit Log, QA & Production Deploy** | Pencatatan audit trail, pengujian menyeluruh (UAT) menggunakan file log aktual SMAN Sumatera Selatan, konfigurasi custom domain di Vercel, dan serah terima sistem. | 1 Minggu |
