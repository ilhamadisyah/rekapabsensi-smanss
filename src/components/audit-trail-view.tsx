import React, { useState, useEffect } from 'react';
import { AuditLog, ATTENDANCE_STATUS_MAP } from '@/lib/types';
import { History, Search, ArrowRight, UserCheck, Calendar } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      (l.employee_name && l.employee_name.toLowerCase().includes(search.toLowerCase())) ||
      l.employee_id.includes(search) ||
      (l.reason && l.reason.toLowerCase().includes(search.toLowerCase())) ||
      l.attendance_date.includes(search)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" />
            Audit Trail &amp; Riwayat Perubahan Status Presensi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mencatat setiap aksi penyesuaian status sel presensi oleh admin untuk transparansi kepegawaian.
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pegawai atau keterangan..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Memuat riwayat audit...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 italic">
          Belum ada riwayat perubahan status presensi yang dicatat.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-3 font-bold text-slate-700 w-44">Waktu Perubahan</th>
                <th className="p-3 font-bold text-slate-700">Pegawai &amp; ID</th>
                <th className="p-3 font-bold text-slate-700 w-32 text-center">Tanggal Presensi</th>
                <th className="p-3 font-bold text-slate-700 text-center w-48">Perubahan Status</th>
                <th className="p-3 font-bold text-slate-700">Keterangan / Alasan</th>
                <th className="p-3 font-bold text-slate-700 text-center w-28">Diubah Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const prev = ATTENDANCE_STATUS_MAP[log.previous_status];
                const next = ATTENDANCE_STATUS_MAP[log.new_status];
                const dateObj = new Date(log.changed_at);

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500 font-sans text-[11px] font-medium">
                      {dateObj.toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{log.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-sans">ID: {log.employee_id}</div>
                    </td>
                    <td className="p-3 text-center font-sans font-medium text-slate-700">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {log.attendance_date}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-sans text-[11px] font-bold">
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{ backgroundColor: prev?.bgHex || '#eee', color: prev?.textHex || '#333' }}
                        >
                          {log.previous_status}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className="px-2 py-0.5 rounded shadow-xs"
                          style={{ backgroundColor: next?.bgHex || '#eee', color: next?.textHex || '#333' }}
                        >
                          {log.new_status}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 italic">
                      &ldquo;{log.reason || '-'}&rdquo;
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-sans text-[10px] font-semibold flex items-center justify-center gap-1 mx-auto">
                        <UserCheck className="w-3 h-3 text-slate-500" />
                        {log.changed_by}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
