import React, { useState } from 'react';
import { Employee, AttendanceCode, ATTENDANCE_STATUS_MAP } from '@/lib/types';
import { X, Layers, Users, Calendar } from 'lucide-react';

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  totalDays: number;
  month: number;
  year: number;
  onBulkUpdateSuccess: () => void;
}

const QUICK_NOTES = [
  'Dispensasi',
  'Izin Sakit',
  'Izin Kepentingan Keluarga',
  'Tugas Dinas Luar',
  'Surat Keterangan Dokter',
];

export const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  employees,
  totalDays,
  month,
  year,
  onBulkUpdateSuccess,
}) => {
  const [selectedDept, setSelectedDept] = useState<'ALL' | 'Guru' | 'TU'>('ALL');
  const [fromDay, setFromDay] = useState<number>(1);
  const [toDay, setToDay] = useState<number>(3);
  const [targetStatus, setTargetStatus] = useState<AttendanceCode>('DL');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((e) => {
    if (selectedDept === 'ALL') return true;
    if (selectedDept === 'Guru') return e.department.includes('Guru');
    if (selectedDept === 'TU') return e.department.includes('TU');
    return true;
  });

  const handleApplyBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDay > toDay) {
      setErrorMsg('Rentang hari awal tidak boleh melebihi hari akhir.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const dates: string[] = [];
      for (let d = fromDay; d <= toDay; d++) {
        // Exclude weekends
        const dt = new Date(year, month - 1, d);
        const dayOfWeek = dt.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }

      if (dates.length === 0) {
        setErrorMsg('Rentang hari yang dipilih hanya mencakup akhir pekan (Sabtu/Minggu).');
        setIsSubmitting(false);
        return;
      }

      const employeeIds = filteredEmployees.map((e) => e.machine_id);

      const res = await fetch('/api/attendance/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_ids: employeeIds,
          dates,
          final_status: targetStatus,
          notes: notes || `Pembaruan Massal (${targetStatus})`,
          changed_by: 'admin_tu',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menerapkan pembaruan massal');
      }

      onBulkUpdateSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pembaruan Status Massal (Bulk Update)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Terapkan status izin/dinas luar ke banyak pegawai sekaligus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleApplyBulk} className="p-6 space-y-4">
          {/* Target Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Kelompok Pegawai Target:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ALL', label: `Semua (${employees.length})` },
                { id: 'Guru', label: 'Tenaga Pendidik' },
                { id: 'TU', label: 'Tenaga Kependidikan' },
              ].map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedDept(group.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    selectedDept === group.id
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Akan diterapkan ke <strong>{filteredEmployees.length} pegawai</strong> yang terpilih.
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Rentang Tanggal (Hari 1 s/d {totalDays}):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Dari Tanggal:</span>
                <input
                  type="number"
                  min={1}
                  max={totalDays}
                  value={fromDay}
                  onChange={(e) => setFromDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Sampai Tanggal:</span>
                <input
                  type="number"
                  min={1}
                  max={totalDays}
                  value={toDay}
                  onChange={(e) => setToDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              * Hari Sabtu &amp; Minggu secara otomatis dilewati dari penimpaan.
            </span>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status Presensi Yang Ditetapkan:
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as AttendanceCode)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500/20 font-bold"
            >
              {Object.values(ATTENDANCE_STATUS_MAP).map((status) => (
                <option key={status.code} value={status.code}>
                  [{status.code}] - {status.label} ({status.description})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keterangan / Nomor Surat Tugas:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Dinas Pendidikan atau Cuti Bersama"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20"
            />
            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium mr-0.5">
                Saran cepat:
              </span>
              {QUICK_NOTES.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => setNotes(text)}
                  className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-md text-slate-600 transition-colors"
                >
                  + {text}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isSubmitting ? 'Menerapkan...' : 'Terapkan Ke Semua'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
