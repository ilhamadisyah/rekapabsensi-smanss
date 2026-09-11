'use client';

import React, { useState, useEffect } from 'react';
import { AdminUserPublic } from '@/lib/types';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCog,
  Check,
  AlertCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUserPublic | null;
  onProfileUpdated: (updatedUser: AdminUserPublic) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  showToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setFullName(currentUser.full_name || '');
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setErrorMsg('Nama lengkap, username, dan email wajib diisi.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMsg('Username minimal 3 karakter.');
      return;
    }

    if (changePassword) {
      if (newPassword.length < 8) {
        setErrorMsg('Kata sandi baru minimal 8 karakter demi keamanan.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload: any = {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
      };

      if (changePassword && newPassword) {
        payload.new_password = newPassword;
      }

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui profil pengguna.');
      }

      setSuccessMsg('Profil berhasil diperbarui!');
      showToast('Profil pengguna Anda berhasil diperbarui!', 'success');
      onProfileUpdated(data.user);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Edit Profil Pengguna
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border uppercase tracking-wider ${
                    currentUser.role === 'superadmin'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  {currentUser.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Perbarui nama lengkap, username, email, dan kata sandi akun Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Alert Error */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alert Success */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Administrator SMANSS"
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  placeholder="username"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="admin@smansumsel.sch.id"
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Ubah Password Accordion / Section */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group py-1">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                  changePassword
                    ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                {changePassword && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="sr-only"
              />
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                Ingin Mengubah Kata Sandi?
              </span>
            </label>

            {changePassword && (
              <div className="mt-3 p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 animate-in fade-in duration-150">
                {/* Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi Baru (Minimal 8 Karakter)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru..."
                      className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru..."
                      className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
