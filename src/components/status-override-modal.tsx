import React, { useState, useEffect } from 'react';
import { AttendanceCode, ATTENDANCE_STATUS_MAP, DailyAttendance, Employee } from '@/lib/types';
import { 
  X, 
  Check, 
  AlertCircle, 
  Clock, 
  Calendar, 
  FileText, 
  User, 
  CheckCircle2, 
  Sparkles,
  Info
} from 'lucide-react';

interface StatusOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  dateStr: string;
  dayNumber: number;
  currentAttendance: DailyAttendance | null;
  onSaveStatus: (newStatus: AttendanceCode, notes: string) => Promise<void>;
}

// Friendly titles and clean badges for presentation
const STATUS_DISPLAY_CONFIG: Record<AttendanceCode, {
  title: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  HADIR: {
    title: 'Hadir Tepat Waktu',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-300',
  },
  DL: {
    title: 'Dinas Luar',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-300',
  },
  IL: {
    title: 'Sakit (Surat Dokter)',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-300',
  },
  PM: {
    title: 'Izin Resmi (Permission)',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-300',
  },
  AL: {
    title: 'Cuti Tahunan',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-300',
  },
  OTL: {
    title: 'Cuti Alasan Penting',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-300',
  },
  HIP: {
    title: 'Hak Izin Pagi',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
  },
  HIS: {
    title: 'Hak Izin Siang',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
  },
  I: {
    title: 'Sakit Tanpa Surat',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
  },
  A: {
    title: 'Alpha (Tanpa Ket.)',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
  },
  OFF: {
    title: 'Libur Shift (Bebas Tugas)',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
  },
  LIBUR: {
    title: 'Hari Libur Tambahan',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-300',
  },
};

const ORDERED_STATUS_LIST: AttendanceCode[] = [
  'HADIR',
  'DL',
  'IL',
  'PM',
  'AL',
  'OTL',
  'HIP',
  'HIS',
  'I',
  'OFF',
  'LIBUR',
  'A',
];

const QUICK_NOTES = [
  'Surat Tugas Dinas Luar',
  'Surat Keterangan Dokter',
  'Izin Kepentingan Keluarga',
  'Dispensasi Pimpinan Sekolah',
];

export const StatusOverrideModal: React.FC<StatusOverrideModalProps> = ({
  isOpen,
  onClose,
  employee,
  dateStr,
  dayNumber,
  currentAttendance,
  onSaveStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceCode>(
    currentAttendance?.final_status || 'A'
  );
  const [notes, setNotes] = useState(currentAttendance?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever opened
  useEffect(() => {
    if (currentAttendance) {
      setSelectedStatus(currentAttendance.final_status);
      setNotes(currentAttendance.notes || '');
    } else {
      setSelectedStatus('A');
      setNotes('');
    }
  }, [currentAttendance, dateStr, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveStatus(selectedStatus, notes);
      onClose();
    } catch (err) {
      console.error('Gagal menyimpan status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date display
  const formatDateLabel = (dateString: string, dayNum: number) => {
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const m = parseInt(parts[1], 10) - 1;
        return `${parts[2]} ${monthNames[m]} ${parts[0]} (Hari ke-${dayNum})`;
      }
    } catch {
      // Fallback
    }
    return `${dateString} (Hari ke-${dayNum})`;
  };

  const selectedConfig = STATUS_DISPLAY_CONFIG[selectedStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header - Fixed & Compact */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ubah Status Presensi
              </h3>
              <p className="text-[11px] text-slate-500">
                Verifikasi atau sesuaikan kategori presensi harian pegawai
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Container with Scrollable Body & Fixed Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Employee & Date Information Card */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate" title={employee.full_name}>
                      {employee.full_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {employee.department}
                    </div>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md font-sans text-[11px] font-bold shrink-0">
                  ID: {employee.machine_id}
                </span>
              </div>

              {/* Date & Machine Tap Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{formatDateLabel(dateStr, dayNumber)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    Tap:{' '}
                    <strong>
                      {currentAttendance?.first_in || '--:--'} s/d{' '}
                      {currentAttendance?.last_out || '--:--'}
                    </strong>{' '}
                    ({currentAttendance?.tap_count || 0} tap)
                  </span>
                </div>
              </div>

              {currentAttendance?.system_status === 'TIDAK_HADIR' && (
                <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200/80 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Sistem mendeteksi tap log tidak memenuhi syarat Hadir Penuh (07:30 - 16:00).</span>
                </div>
              )}
            </div>

            {/* Status Selection Grid (Clean 2-Column Compact Layout) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Pilih Kategori Status:
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Klik untuk memilih status
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ORDERED_STATUS_LIST.map((code) => {
                  const cfg = STATUS_DISPLAY_CONFIG[code];
                  const isSelected = selectedStatus === code;

                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedStatus(code)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Code Badge */}
                        <div
                          className={`w-11 h-7 rounded-lg border flex items-center justify-center font-sans font-black text-xs shrink-0 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                        >
                          {code}
                        </div>

                        {/* Title */}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {cfg.title}
                          </div>
                        </div>
                      </div>

                      {/* Selection Radio / Check Indicator */}
                      <div className="shrink-0 pr-1">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes / Reason Input & Quick Suggestions */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Nomor Surat (Opsional):
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ketik keterangan atau pilih saran cepat di bawah..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white transition-all placeholder:text-slate-400"
                />
              </div>

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
          </div>

          {/* Footer - Fixed, Clean & Always Visible */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between gap-3 shrink-0">
            {/* Status Summary on Left */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-500">Status baru:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-xs border ${selectedConfig.badgeBg} ${selectedConfig.badgeText} ${selectedConfig.badgeBorder}`}>
                {selectedStatus} - {selectedConfig.title}
              </span>
            </div>

            {/* Action Buttons on Right */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
