'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Employee,
  AttendanceMatrixDay,
  DailyAttendance,
  MonthlyAttendanceSummary,
  UserRole,
  AttendanceCode,
  AdminUserPublic,
  ShiftTemplate,
} from '@/lib/types';
import { DashboardStats } from '@/components/dashboard-stats';
import { AttendanceGrid } from '@/components/attendance-grid';
import { StatusOverrideModal } from '@/components/status-override-modal';
import { UploadModal } from '@/components/upload-modal';
import { BulkUpdateModal } from '@/components/bulk-update-modal';
import { ExportModal, ExportConfig } from '@/components/export-modal';
import { EmployeeManager } from '@/components/employee-manager';
import { AuditTrailView } from '@/components/audit-trail-view';
import { ScheduleManagerView } from '@/components/schedule-manager-view';
import { AdminManagerModal } from '@/components/admin-manager-modal';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { CalculationGuideModal } from '@/components/calculation-guide-modal';
import Link from 'next/link';
import {
  Calendar,
  Layers,
  Users,
  History,
  CheckCircle2,
  Clock,
  Shield,
  LogOut,
  User as UserIcon,
  ChevronDown,
  UserCog,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [currentUser, setCurrentUser] = useState<AdminUserPublic | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState<boolean>(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'schedules' | 'employees' | 'guide' | 'audit'>('matrix');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [onlyNeedsVerification, setOnlyNeedsVerification] = useState<boolean>(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [days, setDays] = useState<AttendanceMatrixDay[]>([]);
  const [recordedDays, setRecordedDays] = useState<number[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<number, DailyAttendance>>>({});
  const [shifts, setShifts] = useState<ShiftTemplate[]>([]);
  const [defaultShift, setDefaultShift] = useState<ShiftTemplate | null>(null);
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [detectedPeriod, setDetectedPeriod] = useState<any>(null);

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
    day: AttendanceMatrixDay | null;
    attendance: DailyAttendance | null;
  }>({
    isOpen: false,
    employee: null,
    day: null,
    attendance: null,
  });

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Muat data sesi user saat ini
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setUserRole(data.user.role);
        }
      })
      .catch((err) => console.error('Gagal memuat info akun:', err));
  }, []);

  // Tutup dropdown saat klik di luar area profil
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar (logout) dari AutoAbsen SMANSS?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/login';
    }
  };

  const loadData = useCallback(async (overrideMonth?: number, overrideYear?: number) => {
    setIsLoading(true);
    const m = overrideMonth !== undefined ? overrideMonth : selectedMonth;
    const y = overrideYear !== undefined ? overrideYear : selectedYear;
    try {
      const res = await fetch(`/api/attendance/data?month=${m}&year=${y}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setEmployees(data.employees || []);
        setDays(data.days || []);
        setRecordedDays(data.recordedDays || []);
        setAttendanceMap(data.attendanceMap || {});
        setShifts(data.shifts || []);
        setDefaultShift(data.defaultShift || null);
        setSummary(data.summary || null);
        setDetectedPeriod(data.detectedPeriod || null);
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'schedules' || tab === 'matrix' || tab === 'employees' || tab === 'guide' || tab === 'audit') {
        setActiveTab(tab as any);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'matrix') {
      loadData();
    }
  }, [activeTab, loadData]);

  // Handle cell click
  const handleCellClick = (
    employee: Employee,
    day: AttendanceMatrixDay,
    attendance: DailyAttendance | null
  ) => {
    setOverrideModal({
      isOpen: true,
      employee,
      day,
      attendance,
    });
  };

  // Handle save status override (Optimistic UI)
  const handleSaveStatus = async (newStatus: AttendanceCode, notes: string) => {
    if (!overrideModal.employee || !overrideModal.day) return;

    const empId = overrideModal.employee.machine_id;
    const dayNum = overrideModal.day.day;
    const dateStr = overrideModal.day.dateStr;

    // 1. Optimistic Update in UI
    setAttendanceMap((prev) => {
      const next = { ...prev };
      if (!next[empId]) next[empId] = {};
      const existing = next[empId][dayNum];

      next[empId][dayNum] = {
        id: existing?.id || `att-${empId}-${dateStr}`,
        upload_id: existing?.upload_id || 'manual',
        employee_id: empId,
        attendance_date: dateStr,
        first_in: existing?.first_in || null,
        last_out: existing?.last_out || null,
        tap_count: existing?.tap_count || 0,
        system_status: existing?.system_status || 'TIDAK_HADIR',
        final_status: newStatus,
        notes: notes || existing?.notes,
        is_verified: true,
        verified_by: userRole,
        updated_at: new Date().toISOString(),
      };
      return next;
    });

    showToast(`Status pegawai ${overrideModal.employee.full_name} diubah menjadi [${newStatus}].`);

    // 2. Persist to API
    try {
      const res = await fetch('/api/attendance/update-cell', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empId,
          date: dateStr,
          final_status: newStatus,
          notes,
          changed_by: userRole,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan pembaruan ke server');
      }
      // Refresh summary stats quietly
      loadData();
    } catch (e: any) {
      console.error(e);
      showToast('Galat: ' + (e.message || 'Gagal menyimpan status'));
      loadData(); // Revert
    }
  };

  // Handle Export Excel with user options
  const handleExportWithOptions = async (config: ExportConfig) => {
    setIsExporting(true);
    try {
      showToast('Menghasilkan berkas Excel resmi...');
      const params = new URLSearchParams({
        month: String(selectedMonth),
        year: String(selectedYear),
        fromDay: String(config.fromDay),
        toDay: String(config.toDay),
        department: config.department,
        includeSignatures: String(config.includeSignatures),
      });
      const url = `/api/attendance/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Gagal mengekspor berkas Excel.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const monthPad = String(selectedMonth).padStart(2, '0');
      const rangeSuffix = config.fromDay === 1 && config.toDay === 30 ? '' : `_Tgl${config.fromDay}-${config.toDay}`;
      const deptSuffix = config.department !== 'ALL' ? `_${config.department}` : '';
      a.download = `Rekap_Absensi_SMANSS_${monthPad}_${selectedYear}${deptSuffix}${rangeSuffix}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setIsExportModalOpen(false);
      showToast('Laporan rekapitulasi Excel resmi berhasil diunduh!');
    } catch (e: any) {
      showToast('Galat: ' + (e.message || 'Gagal mengekspor'));
    } finally {
      setIsExporting(false);
    }
  };

  // Synchronize entire attendance matrix with Supabase database
  const handleSyncDatabase = async () => {
    try {
      setIsSyncingDb(true);
      showToast('Menyinkronkan data presensi & hari libur ke database Supabase...');
      const res = await fetch('/api/attendance/sync-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Sinkronisasi berhasil! ${data.syncedRecords || 0} catatan presensi tersimpan di Supabase.`);
        await loadData(selectedMonth, selectedYear);
      } else {
        showToast(`Gagal sinkronisasi: ${data.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      showToast(`Kesalahan sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white print:min-h-0 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-9 flex items-center justify-center shrink-0">
              <img
                src="/logo-smanss.png"
                alt="Logo SMAN Sumatera Selatan"
                className="max-h-full max-w-full object-contain drop-shadow-xs"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                AutoAbsen SMANSS
              </h1>
              <p className="text-[11px] text-slate-500">
                SMAN Sumatera Selatan | Sistem Rekap Presensi Biometrik
              </p>
            </div>
          </div>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-2xl shadow-2xs transition-all cursor-pointer group"
              title="Menu Pengguna & Pengaturan Profil"
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 ${
                  userRole === 'superadmin'
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                    : 'bg-gradient-to-br from-blue-600 to-teal-600 text-white'
                }`}
              >
                {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                  {currentUser?.full_name || 'Admin Presensi'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono leading-tight mt-0.5">
                  @{currentUser?.username || 'user'}
                </div>
              </div>
              <span
                className={`hidden md:inline-block px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold border uppercase tracking-wider ${
                  userRole === 'superadmin'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                {userRole === 'superadmin' ? 'SUPERADMIN' : 'ADMIN'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Floating Dropdown Panel */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header User Identity */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
                      userRole === 'superadmin'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                        : 'bg-gradient-to-br from-blue-600 to-teal-600 text-white'
                    }`}
                  >
                    {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.full_name || 'Pengguna'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email || `@${currentUser?.username}`}
                    </div>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold border uppercase tracking-wider ${
                        userRole === 'superadmin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {userRole === 'superadmin' ? 'Super Administrator' : 'Administrator Presensi'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Menu Items */}
                <div className="p-1.5 space-y-0.5 text-xs">
                  {/* Item 1: Edit Profil */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsEditProfileOpen(true);
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <UserCog className="w-4 h-4 text-slate-500" />
                    <div>
                      <div className="font-semibold leading-tight">Edit Profil &amp; Sandi</div>
                      <div className="text-[10px] text-slate-400">Ubah nama, email, dan kata sandi</div>
                    </div>
                  </button>

                  {/* Item 2: Kelola Admin (Superadmin Only) */}
                  {userRole === 'superadmin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsAdminManagerOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-indigo-700 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-semibold leading-tight">Kelola Administrator</div>
                        <div className="text-[10px] text-indigo-400">Tambah atau hapus akun admin</div>
                      </div>
                    </button>
                  )}
                </div>

                {/* Divider & Logout */}
                <div className="border-t border-slate-100 pt-1 px-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <div className="font-semibold leading-tight">Keluar dari Sistem</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Uniform & Unified) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-slate-100 overflow-x-auto gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'matrix', label: 'Matriks Presensi', icon: Calendar },
              { id: 'schedules', label: 'Jadwal & Shift Pegawai', icon: Clock },
              { id: 'employees', label: `Master Pegawai (${employees.length || 107})`, icon: Users },
              { id: 'guide', label: 'Panduan Perhitungan', icon: BookOpen },
              { id: 'audit', label: 'Audit Trail', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.set('tab', tab.id);
                      window.history.replaceState({}, '', url.toString());
                    }
                  }}
                  className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* TAB 1: Matriks Presensi */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <DashboardStats
              summary={summary}
              detectedPeriod={detectedPeriod}
              onlyNeedsVerification={onlyNeedsVerification}
              onToggleVerificationFilter={setOnlyNeedsVerification}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenGuide={() => setIsGuideModalOpen(true)}
              userRole={userRole}
            />

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-xs font-bold text-slate-600">
                  Memuat matriks kehadiran pegawai...
                </div>
              </div>
            ) : (
              <AttendanceGrid
                employees={employees}
                days={days}
                attendanceMap={attendanceMap}
                onCellClick={handleCellClick}
                userRole={userRole}
                onlyNeedsVerification={onlyNeedsVerification}
                recordedDays={recordedDays}
                onOpenBulk={() => setIsBulkOpen(true)}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                  loadData(m, y);
                }}
                detectedPeriod={detectedPeriod}
                onOpenExport={() => setIsExportModalOpen(true)}
                isExporting={isExporting}
                onSyncDatabase={handleSyncDatabase}
                isSyncingDatabase={isSyncingDb}
                onOpenGuide={() => setIsGuideModalOpen(true)}
                defaultShift={defaultShift}
                shifts={shifts}
              />
            )}
          </div>
        )}

        {/* TAB 2: Jadwal & Shift Pegawai (Unified) */}
        {activeTab === 'schedules' && (
          <ScheduleManagerView
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={(m, y) => {
              setSelectedMonth(m);
              setSelectedYear(y);
              loadData(m, y);
            }}
            onScheduleUpdated={() => loadData(selectedMonth, selectedYear)}
            showToast={(msg) => showToast(msg)}
          />
        )}

        {/* TAB 3: Master Pegawai */}
        {activeTab === 'employees' && (
          <EmployeeManager
            employees={employees}
            onEmployeeUpdated={loadData}
            userRole={userRole}
          />
        )}

        {/* TAB 4: Panduan Perhitungan Lengkap */}
        {activeTab === 'guide' && (
          <CalculationGuideModal
            isOpen={true}
            onClose={() => setActiveTab('matrix')}
            isEmbeddedView={true}
          />
        )}

        {/* TAB 5: Audit Trail */}
        {activeTab === 'audit' && <AuditTrailView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          AutoAbsen SMANSS &copy; 2026
        </div>
      </footer>

      {/* Modals */}
      <StatusOverrideModal
        isOpen={overrideModal.isOpen}
        onClose={() => setOverrideModal((prev) => ({ ...prev, isOpen: false }))}
        employee={overrideModal.employee}
        dateStr={overrideModal.day?.dateStr || ''}
        dayNumber={overrideModal.day?.day || 0}
        currentAttendance={overrideModal.attendance}
        onSaveStatus={handleSaveStatus}
        defaultShift={defaultShift}
        shifts={shifts}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={(newPeriod) => {
          // 1. Otomatis buka tab matriks presensi (tabel utama)
          setActiveTab('matrix');

          // 2. Jika ada periode terdeteksi dari berkas baru, langsung beralih dan buka tabelnya
          if (newPeriod && newPeriod.month && newPeriod.year) {
            setSelectedMonth(newPeriod.month);
            setSelectedYear(newPeriod.year);
            loadData(newPeriod.month, newPeriod.year);
            showToast(`Tabel presensi ${newPeriod.formattedRange || (newPeriod.monthName + ' ' + newPeriod.year)} otomatis dibuka!`);
          } else {
            loadData();
            showToast('Tabel presensi berhasil dibuka dan diperbarui!');
          }
        }}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
      />

      <BulkUpdateModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        employees={employees}
        totalDays={days.length}
        month={selectedMonth}
        year={selectedYear}
        onBulkUpdateSuccess={() => {
          showToast('Pembaruan massal berhasil diterapkan!');
          loadData();
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        month={selectedMonth}
        year={selectedYear}
        detectedPeriod={detectedPeriod}
        recordedDays={recordedDays}
        onConfirmExport={handleExportWithOptions}
        isExporting={isExporting}
      />

      {/* Superadmin Exclusive: Admin Management Modal */}
      <AdminManagerModal
        isOpen={isAdminManagerOpen}
        onClose={() => setIsAdminManagerOpen(false)}
        currentUserId={currentUser?.id}
        onToast={showToast}
      />

      {/* User Profile Editor Modal (Admin & Superadmin) */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          setUserRole(updated.role);
        }}
        showToast={showToast}
      />

      {/* Panduan Perhitungan Modal */}
      <CalculationGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        isEmbeddedView={false}
      />

      {/* Floating Toast Message */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
