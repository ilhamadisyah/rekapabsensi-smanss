'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Silakan masukkan username/email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Autentikasi gagal. Periksa kembali kredensial Anda.');
      }

      // Login berhasil, arahkan ke dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan jaringan atau sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Landscape Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-black/50 border border-white/20 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* Left Column: Brand & Hero Showcase (Landscape Side) */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden text-white">
          {/* Subtle Ambient Background in Left Side */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center justify-center p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-black/20 border border-white/30">
              <img
                src="/logo-smanss.png"
                alt="Logo SMAN Sumatera Selatan"
                className="h-20 w-auto object-contain drop-shadow-sm"
              />
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
                AutoAbsen SMANSS
              </h1>
              <p className="text-emerald-100/80 text-xs sm:text-sm font-medium leading-relaxed">
                Sistem Rekapitulasi Presensi &amp; Penjadwalan Shift Kerja SMAN Sumatera Selatan
              </p>
            </div>
          </div>

          {/* Bottom Left Note */}
          <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] text-emerald-200/60 font-medium">
            Learn Today, Lead Tomorrow
          </div>
        </div>

        {/* Right Column: Clean Login Form */}
        <div className="md:col-span-7 bg-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header Form */}
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs text-slate-500">
                Silakan masukkan kredensial akun Anda untuk masuk ke sistem
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username / Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Username atau Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan username atau email..."
                    className="w-full pl-10 pr-3.5 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <div className="pt-8 text-center sm:text-left text-[11px] text-slate-400 font-medium">
            AutoAbsen SMANSS &copy; 2026 SMAN Sumatera Selatan
          </div>
        </div>
      </div>
    </div>
  );
}
