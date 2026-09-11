'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  Key,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminUserPublic, UserRole } from '@/lib/types';

interface AdminManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  onToast: (msg: string) => void;
}

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onToast,
}) => {
  const [admins, setAdmins] = useState<AdminUserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form tambah admin
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAdmins();
    }
  }, [isOpen]);

  const loadAdmins = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin-users');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat daftar admin');
      }
      setAdmins(data.admins || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newFullName.trim() || !newPassword) {
      setErrorMsg('Semua kolom formulir admin wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          full_name: newFullName,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan admin baru.');
      }

      onToast(`Admin "${newFullName}" berhasil ditambahkan!`);
      // Reset form
      setNewUsername('');
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      setIsAddingOpen(false);
      await loadAdmins();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, name: string) => {
    if (id === currentUserId) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus akun admin "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin-users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus admin.');
      }

      onToast(`Akun admin "${name}" berhasil dihapus.`);
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus admin.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Manajemen Akun Admin
              </h2>
              <p className="text-xs text-slate-300">
                Tambah, kelola, atau hapus akun pengguna sistem AutoAbsen SMANSS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Total Akun Terdaftar:{' '}
              <span className="font-bold text-slate-900">{admins.length}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingOpen(!isAddingOpen)}
              className={`px-3 py-1.5 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAddingOpen
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isAddingOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{isAddingOpen ? 'Tutup Formulir' : '+ Tambah Admin Baru'}</span>
            </button>
          </div>

          {/* Expandable Form Tambah Admin */}
          {isAddingOpen && (
            <form
              onSubmit={handleCreateAdmin}
              className="bg-indigo-50/50 rounded-2xl p-4 sm:p-5 border border-indigo-100 space-y-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Formulir Pendaftaran Admin Baru</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: admin_kurikulum"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama@smansumsel.sch.id"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nama Lengkap Pegawai
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Contoh: Ahmad Fadilah, S.Kom."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tingkat Peran (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="admin">Admin (Operasional Presensi Penuh)</option>
                    <option value="superadmin">Superadmin (Akses Penuh + Kelola Admin)</option>
                  </select>
                </div>

                {/* Password */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Kata Sandi Awal (Minimal 8 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi yang kuat..."
                      className="w-full px-3 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun Admin'}
                </button>
              </div>
            </form>
          )}

          {/* Table Daftar Admin */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase">
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Username &amp; Email</th>
                  <th className="px-4 py-3">Peran (Role)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Memuat daftar admin...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Belum ada data admin.
                    </td>
                  </tr>
                ) : (
                  admins.map((adm) => {
                    const isSelf = adm.id === currentUserId;
                    const isSuper = adm.role === 'superadmin';

                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSuper
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {adm.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div>{adm.full_name}</div>
                              {isSelf && (
                                <span className="text-[10px] text-emerald-600 font-bold">
                                  (Akun Anda Saat Ini)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                          <div>@{adm.username}</div>
                          <div className="text-slate-400">{adm.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isSuper
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {isSuper ? 'SUPERADMIN' : 'ADMIN'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={isSelf || deletingId === adm.id}
                            onClick={() => handleDeleteAdmin(adm.id, adm.full_name)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus admin'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Peran <strong>Superadmin</strong> dapat menambah dan menghapus akun Admin.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
