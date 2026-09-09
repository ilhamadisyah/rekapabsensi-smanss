'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Employee,
  AttendanceMatrixDay,
  DailyAttendance,
  MonthlyAttendanceSummary,
  UserRole,
  AttendanceCode,
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
import Link from 'next/link';
import {
  Calendar,
  Layers,
  Users,
  History,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [userRole, setUserRole] = useState<UserRole>('admin_tu');
  const [activeTab, setActiveTab] = useState<'matrix' | 'schedules' | 'employees' | 'audit'>('matrix');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [onlyNeedsVerification, setOnlyNeedsVerification] = useState<boolean>(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [days, setDays] = useState<AttendanceMatrixDay[]>([]);
  const [recordedDays, setRecordedDays] = useState<number[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Record<number, DailyAttendance>>>({});
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [detectedPeriod, setDetectedPeriod] = useState<any>(null);

  // Modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
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
    setTimeout(() => setToastMsg(null), 3500);
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
      if (tab === 'schedules' || tab === 'matrix' || tab === 'employees' || tab === 'audit') {
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
    if (userRole === 'pimpinan') {
      showToast('Peran Pimpinan hanya memiliki hak akses baca (Read-Only).');
      return;
    }

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  AutoAbsen SMANSS
                </h1>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-sans text-[10px] font-bold rounded-full">
                  v1.1 Production
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                SMAN Sumatera Selatan | Sistem Rekap Presensi Biometrik
              </p>
            </div>
          </div>

          {/* Role Switcher (FR-01) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200/80 p-1 rounded-xl text-xs">
              <span className="text-[10px] font-bold text-blue-800 uppercase px-1.5">
                Peran:
              </span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-white text-blue-900 text-xs font-bold px-2 py-1 rounded-lg border border-blue-200 focus:outline-none cursor-pointer"
              >
                <option value="admin_tu">Admin TU (Upload &amp; Verifikasi)</option>
                <option value="superadmin">Superadmin (Akses Penuh + Master)</option>
                <option value="pimpinan">Pimpinan (Read-Only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Uniform & Unified) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-slate-100 overflow-x-auto gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'matrix', label: 'Matriks Presensi', icon: Calendar },
              { id: 'schedules', label: 'Jadwal & Shift Pegawai', icon: Clock },
              { id: 'employees', label: `Master Pegawai (${employees.length || 107})`, icon: Users },
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

        {/* TAB 2: Master Pegawai */}
        {activeTab === 'employees' && (
          <EmployeeManager
            employees={employees}
            onEmployeeUpdated={loadData}
            userRole={userRole}
          />
        )}

        {/* TAB 3: Audit Trail */}
        {activeTab === 'audit' && <AuditTrailView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          AutoAbsen SMANSS &copy; 2026 Tim IT &amp; Urusan Kepegawaian SMAN Sumatera Selatan.
          Sistem Otomasi Rekapitulasi Presensi Terintegrasi.
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
