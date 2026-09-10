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
  Info,
  Briefcase,
  Fingerprint
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
    title: 'Libur Rutin (Sabtu/Minggu) / Hari Libur',
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
  'Dispensasi',
  'Izin Sakit',
  'Izin Kepentingan Keluarga',
  'Tugas Dinas Luar',
  'Surat Keterangan Dokter',
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
  const isWeekendDay = (() => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    } catch {
      return false;
    }
  })();

  const [selectedStatus, setSelectedStatus] = useState<AttendanceCode>(
    currentAttendance?.final_status || (isWeekendDay ? 'LIBUR' : 'A')
  );
  const [notes, setNotes] = useState(currentAttendance?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever opened
  useEffect(() => {
    if (currentAttendance) {
      setSelectedStatus(currentAttendance.final_status);
      setNotes(currentAttendance.notes || '');
    } else if (isWeekendDay) {
      setSelectedStatus('LIBUR');
      setNotes('');
    } else {
      setSelectedStatus('A');
      setNotes('');
    }
  }, [currentAttendance, dateStr, isWeekendDay, isOpen]);

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
            {/* Employee & Schedule Information Card */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-3">
              {/* Employee Header */}
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

              {/* Info Badges (Tanggal, Jam Kerja, Shift, Tap Mesin) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/70 text-[11px]">
                {/* 1. Tanggal */}
                <div className="flex items-center gap-2 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{formatDateLabel(dateStr, dayNumber)}</span>
                </div>

                {/* 2. Jam Kerja */}
                <div className="flex items-center justify-between gap-2 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-slate-600">Jam Kerja:</span>
                  </div>
                  <strong className="text-indigo-950 font-bold truncate">
                    {currentAttendance?.is_off_day
                      ? 'Libur Shift (Bebas Tugas)'
                      : (currentAttendance?.is_holiday || currentAttendance?.final_status === 'LIBUR')
                      ? 'Hari Libur Resmi'
                      : isWeekendDay && !currentAttendance?.shift_id
                      ? 'Libur Akhir Pekan (Bebas Tugas)'
                      : `${currentAttendance?.scheduled_start?.substring(0, 5) || '07:30'} s/d ${currentAttendance?.scheduled_end?.substring(0, 5) || '16:00'} WIB`}
                  </strong>
                </div>

                {/* 3. Shift */}
                <div className="flex items-center justify-between gap-2 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-slate-600">Shift:</span>
                  </div>
                  <span className="font-semibold text-slate-800 truncate">
                    {currentAttendance?.shift_name || (currentAttendance?.is_off_day ? 'Libur Shift' : (currentAttendance?.is_holiday || currentAttendance?.final_status === 'LIBUR') ? 'Hari Libur' : isWeekendDay ? 'Libur Akhir Pekan' : 'Jam Kerja Normal')}
                  </span>
                </div>

                {/* 4. Tap Log */}
                <div className="flex items-center justify-between gap-2 text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-slate-600">Tap:</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <strong className="text-slate-900 font-bold truncate">
                      {currentAttendance?.first_in || '--:--'} s/d {currentAttendance?.last_out || '--:--'}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      ({currentAttendance?.tap_count || 0} tap)
                    </span>
                  </div>
                </div>
              </div>

              {/* Notifikasi Sistem (Selalu Muncul Dinamis) */}
              {(() => {
                const scheduledStart = currentAttendance?.scheduled_start?.substring(0, 5) || '07:30';
                const scheduledEnd = currentAttendance?.scheduled_end?.substring(0, 5) || '16:00';
                const firstIn = currentAttendance?.first_in;
                const lastOut = currentAttendance?.last_out;
                const tapCount = currentAttendance?.tap_count || 0;

                if (currentAttendance?.is_off_day) {
                  return (
                    <div className="text-[11px] text-slate-800 bg-slate-100/90 p-2.5 rounded-lg border border-slate-300 flex items-start gap-2">
                      <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Notifikasi Sistem: Libur Shift (Bebas Tugas)</div>
                        <div className="text-slate-600 mt-0.5 leading-relaxed">
                          Pegawai dijadwalkan bebas tugas/shift libur pada tanggal ini sesuai jadwal matriks. Tidak ada kewajiban jam kerja dan tap presensi.
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isWeekendDay && !currentAttendance?.shift_id && !currentAttendance?.first_in && (!currentAttendance || !currentAttendance.is_verified)) {
                  return (
                    <div className="text-[11px] text-rose-900 bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-950 flex items-center gap-1.5">
                          <span>Notifikasi Sistem: Libur Akhir Pekan (Sabtu / Minggu)</span>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">Libur Rutin</span>
                        </div>
                        <div className="text-rose-700 mt-0.5 leading-relaxed">
                          Tanggal ini merupakan akhir pekan (Sabtu/Minggu). Pegawai dibebaskan dari kewajiban jam kerja reguler. Jika pegawai bertugas piket, dinas luar, atau lembur, silakan pilih status kehadiran terkait.
                        </div>
                      </div>
                    </div>
                  );
                }

                if (currentAttendance?.is_holiday || currentAttendance?.final_status === 'LIBUR') {
                  return (
                    <div className="text-[11px] text-rose-900 bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                      <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-950 flex items-center gap-1.5">
                          <span>Notifikasi Sistem: Hari Libur Resmi ({currentAttendance?.shift_name || 'Libur Sekolah/Nasional'})</span>
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">Libur Resmi</span>
                        </div>
                        <div className="text-rose-700 mt-0.5 leading-relaxed">
                          Tanggal ini merupakan hari libur resmi yang terdaftar di kalender. Pegawai dibebaskan dari jam kerja reguler.
                        </div>
                      </div>
                    </div>
                  );
                }

                const isOvernight = (scheduledStart > scheduledEnd) || currentAttendance?.shift_code === 'MALAM';
                const isCrossDay = Boolean(currentAttendance?.is_cross_day);

                // Anti-daytime cheat verification for overnight:
                // Check if firstIn is actually in evening (>= 17:00) and lastOut in morning (<= 11:00)
                const isLegitimateNightShiftTaps = isOvernight && isCrossDay && Boolean(firstIn && firstIn >= '17:00:00' && lastOut && lastOut <= '11:00:00');
                const isDaytimeTapsOnNightShift = isOvernight && Boolean(firstIn && (firstIn < '17:00:00' || (lastOut && lastOut > '12:00:00') || !isCrossDay));

                if (currentAttendance?.system_status === 'HADIR' && (!isOvernight || isLegitimateNightShiftTaps)) {
                  if (isOvernight) {
                    return (
                      <div className="text-[11px] text-emerald-900 bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span>Notifikasi Sistem: Jam Kerja Shift Malam Terpenuhi</span>
                            <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[9px] font-bold">Lintas Hari (Valid)</span>
                          </div>
                          <div className="text-emerald-800 mt-0.5 leading-relaxed">
                            Tap presensi memenuhi jam kerja wajib shift <strong>{currentAttendance?.shift_name || 'Shift Malam'}</strong> (<strong>{scheduledStart} s/d {scheduledEnd} WIB</strong>). Pegawai tercatat masuk malam pukul <strong>{firstIn}</strong> dan pulang subuh pukul <strong>{lastOut}</strong> pada keesokan harinya (<strong>beda hari terverifikasi</strong>) dengan total {tapCount} tap.
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="text-[11px] text-emerald-900 bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-200 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>Notifikasi Sistem: Jam Kerja Terpenuhi (Hadir Penuh)</span>
                          <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[9px] font-bold">Valid</span>
                        </div>
                        <div className="text-emerald-800 mt-0.5 leading-relaxed">
                          Tap presensi memenuhi jam kerja wajib shift {currentAttendance?.shift_name || 'Normal'} (<strong>{scheduledStart} s/d {scheduledEnd} WIB</strong>). Pegawai tercatat masuk pukul <strong>{firstIn}</strong> (&le; {scheduledStart}) dan pulang pukul <strong>{lastOut}</strong> (&ge; {scheduledEnd}) dengan total {tapCount} tap.
                        </div>
                      </div>
                    </div>
                  );
                }

                if (tapCount === 0) {
                  return (
                    <div className="text-[11px] text-rose-900 bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-950 flex items-center gap-1.5">
                          <span>Notifikasi Sistem: Belum Memenuhi Jam Kerja (Alpha)</span>
                          <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded text-[9px] font-bold">0 Tap</span>
                        </div>
                        <div className="text-rose-800 mt-0.5 leading-relaxed">
                          Tidak ditemukan rekaman tap mesin pada tanggal ini. Jam kerja yang berlaku adalah <strong>{scheduledStart} s/d {scheduledEnd} WIB</strong>. Silakan pilih status override (DL, Sakit, Izin, Cuti) jika ada dokumen pendukung.
                        </div>
                      </div>
                    </div>
                  );
                }

                // If assigned overnight shift but taps occurred in daytime / not legitimate night shift
                if (isOvernight && isDaytimeTapsOnNightShift) {
                  return (
                    <div className="text-[11px] text-rose-900 bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-950 flex items-center gap-1.5">
                          <span>Notifikasi Sistem: Jam Tap Di Luar Jendela Shift Malam</span>
                          <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded text-[9px] font-bold">Tap Siang Tidak Sah</span>
                        </div>
                        <div className="text-rose-800 mt-0.5 leading-relaxed">
                          Pegawai terjadwal <strong>{currentAttendance?.shift_name || 'Shift Malam'} ({scheduledStart} s/d {scheduledEnd} WIB)</strong>, namun tap presensi tercatat pada <strong>jam siang</strong> (masuk: <strong>{firstIn}</strong>, pulang: <strong>{lastOut}</strong>). Sistem menolak tap siang untuk shift malam karena pegawai tidak hadir pada jam kerja malam wajib.
                        </div>
                      </div>
                    </div>
                  );
                }

                // If assigned overnight shift but taps occurred on the SAME DAY (not cross-day)
                if (isOvernight && !isCrossDay && firstIn && lastOut) {
                  return (
                    <div className="text-[11px] text-rose-900 bg-rose-50/90 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-rose-950 flex items-center gap-1.5">
                          <span>Notifikasi Sistem: Jam Tap Tidak Sesuai Shift Malam</span>
                          <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded text-[9px] font-bold">Bukan Beda Hari</span>
                        </div>
                        <div className="text-rose-800 mt-0.5 leading-relaxed">
                          Pegawai tercatat melakukan tap pada <strong>hari yang sama</strong> (masuk pukul <strong>{firstIn}</strong> dan pulang pukul <strong>{lastOut}</strong>). Shift <strong>{currentAttendance?.shift_name || 'Shift Malam'}</strong> ({scheduledStart} s/d {scheduledEnd} WIB) merupakan shift lintas hari yang mewajibkan tap masuk pada malam hari dan tap pulang subuh pada keesokan harinya (<strong>beda hari</strong>).
                        </div>
                      </div>
                    </div>
                  );
                }

                // tapCount > 0 but not HADIR
                let reason = `Tap presensi belum memenuhi ketentuan jam kerja penuh (${scheduledStart} s/d ${scheduledEnd} WIB).`;
                if (tapCount === 1) {
                  reason = isOvernight
                    ? `Pegawai hanya melakukan 1 kali tap (${firstIn}). Shift Malam mewajibkan tap masuk malam dan tap pulang subuh pada keesokan harinya (beda hari).`
                    : `Pegawai hanya melakukan 1 kali tap (${firstIn}). Kehadiran penuh mewajibkan minimal 2 tap (masuk & pulang).`;
                } else if (firstIn && firstIn > scheduledStart && lastOut && lastOut < scheduledEnd) {
                  reason = `Masuk terlambat (${firstIn} > ${scheduledStart}) dan pulang mendahului (${lastOut} < ${scheduledEnd}).`;
                } else if (firstIn && firstIn > scheduledStart) {
                  reason = `Masuk terlambat pada pukul ${firstIn} (batas maksimal masuk: ${scheduledStart} WIB).`;
                } else if (lastOut && lastOut < scheduledEnd) {
                  reason = `Pulang mendahului jam kerja pada pukul ${lastOut} (batas minimal pulang: ${scheduledEnd} WIB).`;
                }

                return (
                  <div className="text-[11px] text-amber-900 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span>Notifikasi Sistem: Jam Kerja Belum Terpenuhi</span>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[9px] font-bold">{tapCount} Tap</span>
                      </div>
                      <div className="text-amber-800 mt-0.5 leading-relaxed">
                        {reason} Jam kerja shift: <strong>{scheduledStart} s/d {scheduledEnd} WIB</strong>.
                      </div>
                    </div>
                  </div>
                );
              })()}
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
