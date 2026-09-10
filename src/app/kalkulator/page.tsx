'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KalkulatorRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/panduan');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Membuka Panduan &amp; Kalkulator Simulasi...</p>
      </div>
    </div>
  );
}
