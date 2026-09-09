'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JadwalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?tab=schedules');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Membuka Jadwal &amp; Shift Pegawai...</p>
      </div>
    </div>
  );
}
