import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, Calendar, AlertTriangle, UserCheck } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (detectedPeriod?: any) => void;
  initialMonth?: number;
  initialYear?: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  initialMonth = 9,
  initialYear = 2026,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [detectedPeriod, setDetectedPeriod] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [missingNikData, setMissingNikData] = useState<{
    count: number;
    records: { machine_id: string; employee_name: string; punch_count: number }[];
  } | null>(null);
  const [autoRegisteredCount, setAutoRegisteredCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith('.xls') && !ext.endsWith('.xlsx')) {
        setErrorMsg('Format file harus berupa .xls atau .xlsx');
        return;
      }

      setFile(selected);
      setErrorMsg(null);
      setSuccessMsg(null);
      setMissingNikData(null);
      setAutoRegisteredCount(0);
      setDetectedPeriod(null);
      setIsAnalyzing(true);

      // Inspect file to auto-detect date, month, and year
      try {
        const formData = new FormData();
        formData.append('file', selected);

        const res = await fetch('/api/attendance/detect-period', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.period) {
          setDetectedPeriod(data.period);
        }
      } catch (err) {
        console.error('Failed to auto-detect period:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setErrorMsg('Pilih berkas mesin absensi (.csv, .xls, atau .xlsx) terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setMissingNikData(null);
    setAutoRegisteredCount(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (detectedPeriod) {
        formData.append('month', String(detectedPeriod.month));
        formData.append('year', String(detectedPeriod.year));
      }
      formData.append('uploaded_by', 'admin_tu');

      const res = await fetch('/api/attendance/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Terjadi kesalahan saat memproses berkas.');
        return;
      }

      let message = `Berhasil! ${data.total_records_processed} rekaman diproses.`;
      if (data.preserved_verified_count > 0) {
        message += ` ${data.preserved_verified_count} data yang sudah diverifikasi (data lama) tetap dipertahankan.`;
      } else {
        message += ` (${data.summary.total_present} Hadir, ${data.summary.total_unverified_red} Perlu Verifikasi).`;
      }

      setSuccessMsg(message);

      if (data.auto_registered_count > 0) {
        setAutoRegisteredCount(data.auto_registered_count);
      }

      if (data.has_missing_nik) {
        const rawList = data.missing_nik_records || [];
        const mappedRecords = rawList.map((r: any) => ({
          machine_id: String(r.machine_id || r.machineId || '').trim(),
          employee_name: String(r.employee_name || r.name || '').trim(),
          punch_count: Number(r.punch_count || r.punchCount || 0),
        }));
        setMissingNikData({
          count: data.missing_nik_count || mappedRecords.length,
          records: mappedRecords,
        });
      } else {
        setTimeout(() => {
          onUploadSuccess(data.detected_period || detectedPeriod);
          onClose();
        }, 1400);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Unggah Log Mesin Absensi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem akan otomatis mendeteksi tanggal &amp; bulan dari berkas presensi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop File Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              file
                ? 'border-emerald-500 bg-emerald-50/30'
                : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div
                className={`p-3 rounded-full ${
                  file ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {file ? <FileSpreadsheet className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              {file ? (
                <div>
                  <div className="text-xs font-bold text-slate-900">{file.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB - Klik untuk mengganti berkas
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xs font-bold text-slate-700">
                    Pilih atau Tarik Berkas ke Sini
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Mendukung file .csv, .xls &amp; .xlsx mesin absensi (Maks. 15 MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analyzing indicator */}
          {isAnalyzing && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Memeriksa isi berkas dan mendeteksi tanggal serta bulan secara otomatis...</span>
            </div>
          )}

          {/* Auto-detected period badge */}
          {detectedPeriod && !isAnalyzing && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-emerald-950 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Periode Terdeteksi Secara Otomatis:</span>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800 border border-emerald-300">
                  {detectedPeriod.monthName} {detectedPeriod.year}
                </span>
              </div>

              <div className="text-sm font-black text-emerald-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{detectedPeriod.formattedRange}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-700 font-semibold pt-1 border-t border-emerald-200/70">
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                  Total: <strong>{detectedPeriod.totalDays} Hari Transaksi</strong>
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                  <strong>{detectedPeriod.uniqueEmployees} Pegawai</strong>
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                  <strong>{detectedPeriod.totalRawPunches} Tap</strong>
                </span>
              </div>
            </div>
          )}

          {/* Auto registered count notification */}
          {autoRegisteredCount > 0 && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-bold">Pendaftaran Otomatis Berhasil:</div>
                <div>Sebanyak <strong>{autoRegisteredCount}</strong> pegawai baru berhasil ditambahkan ke master berdasarkan NIK dari berkas.</div>
              </div>
            </div>
          )}

          {/* Missing NIK Warning Notification */}
          {missingNikData && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/90 text-amber-950 text-xs space-y-2.5 animate-in fade-in shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pemberitahuan: Terdapat {missingNikData.count} data pegawai yang belum memiliki NIK!</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Log absensi pegawai berikut tetap diproses menggunakan ID Mesin sementara. Silakan lengkapi NIK mereka di menu <strong>Master Pegawai</strong> agar pengenalan presensi berbasis NIK berjalan optimal.
              </p>
              {missingNikData.records.length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-amber-200/90 bg-white/95 p-2 shadow-inner divide-y divide-amber-100/60">
                  {missingNikData.records.slice(0, 20).map((item, idx) => {
                    const cleanName =
                      item.employee_name &&
                      item.employee_name !== 'Tanpa Nama' &&
                      !item.employee_name.startsWith('Pegawai ID')
                        ? item.employee_name
                        : `Pegawai (ID Mesin: ${item.machine_id})`;

                    return (
                      <div key={idx} className="flex items-center justify-between text-xs text-slate-700 py-1.5 px-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {cleanName}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono font-bold text-[10.5px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md whitespace-nowrap">
                          ID Mesin: {item.machine_id}
                        </span>
                      </div>
                    );
                  })}
                  {missingNikData.records.length > 20 && (
                    <div className="text-[10px] text-amber-700 text-center pt-1.5 font-medium italic">
                      ... dan {missingNikData.records.length - 20} pegawai lainnya
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Perhatian:</div>
                <div>{errorMsg}</div>
              </div>
            </div>
          )}

          {successMsg && !missingNikData && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            {missingNikData ? (
              <button
                type="button"
                onClick={() => {
                  onUploadSuccess(detectedPeriod);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai &amp; Lihat Rekap Presensi</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!file || isUploading || isAnalyzing}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  {isUploading ? 'Mengolah Log...' : 'Mulai Pengolahan'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
