import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { dbService } from '../services/db';
import { User, Sun, Moon, Info, Settings as SettingsIcon, Check, Monitor, Trash2, AlertTriangle, Link2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, displayName, updateProfileName, deleteAccount, linkGoogle, unlinkGoogle } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [nameInput, setNameInput] = useState(displayName);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    const res = await linkGoogle();
    setLinkingGoogle(false);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Berhasil menautkan akun Google!', 'success');
    }
  };

  const handleUnlinkGoogle = async () => {
    setLinkingGoogle(true);
    const res = await unlinkGoogle();
    setLinkingGoogle(false);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Koneksi akun Google berhasil diputuskan.', 'success');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    
    if (!nameInput.trim()) {
      setError('Nama tidak boleh kosong.');
      return;
    }

    setSaving(true);
    const res = await updateProfileName(nameInput.trim());
    setSaving(false);

    if (res.error) {
      setError(res.error);
      showToast(res.error, 'error');
    } else {
      setSuccess('Profil berhasil diperbarui!');
      showToast('Profil berhasil diperbarui!', 'success');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Akun Anda berhasil dihapus permanen.', 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-[var(--color-text-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-500/15 text-violet-600 dark:text-violet-400 rounded-xl">
          <SettingsIcon size={22} />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Pengaturan</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Sesuaikan profil dan tampilan aplikasi Anda</p>
        </div>
      </div>

      {/* Profile Name Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)] space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <User size={16} className="text-violet-500 dark:text-violet-400" />
          Ubah Profil Pengguna
        </h3>

        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 animate-slide-up">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-slide-up">
            {success}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Nama Lengkap / Panggilan
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Pengguna (Tidak Dapat Diubah)
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-200/40 dark:bg-slate-800/20 opacity-50 border border-[var(--color-border)] focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-slate-500 dark:text-slate-400"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 font-bold text-xs rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md glow-brand transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>

      {/* Connected Accounts Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)] space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Link2 size={16} className="text-violet-500 dark:text-violet-400" />
          Koneksi Akun Sosial
        </h3>

        <div className="flex items-center justify-between p-4 bg-slate-200/30 dark:bg-slate-800/20 rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-[var(--color-border)] flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.02c2.34-2.16 3.69-5.35 3.69-8.74z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.12c-1.12.75-2.54 1.19-3.94 1.19-3.04 0-5.62-2.06-6.54-4.83H1.31v3.23A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.46 14.33a7.17 7.17 0 0 1 0-2.66V8.44H1.31a12 12 0 0 0 0 7.12l4.15-3.23z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0 7.34 0 3.38 2.67 1.31 6.56l4.15 3.23c.92-2.77 3.5-4.83 6.54-4.83z" />
              </svg>
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Google Account</h4>
              <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5">
                {user?.google_linked ? 'Akun Google Anda terhubung.' : 'Hubungkan untuk mempermudah masuk aplikasi.'}
              </p>
            </div>
          </div>

          <div>
            {user?.google_linked ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Terhubung
                </span>
                <button
                  type="button"
                  onClick={handleUnlinkGoogle}
                  disabled={linkingGoogle}
                  className="px-3 py-1.5 font-bold text-[10px] rounded-lg text-slate-500 dark:text-slate-450 bg-slate-200/50 dark:bg-slate-800/40 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 transition-all cursor-pointer disabled:opacity-50"
                >
                  {linkingGoogle ? 'Memproses...' : 'Putuskan'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={linkingGoogle}
                className="px-3.5 py-1.5 font-bold text-[10px] rounded-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/10 transition-all cursor-pointer disabled:opacity-50"
              >
                {linkingGoogle ? 'Memproses...' : 'Hubungkan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Theme Toggler Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)] space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          {theme === 'dark' && <Moon size={16} className="text-violet-500 dark:text-violet-400" />}
          {theme === 'light' && <Sun size={16} className="text-violet-500 dark:text-violet-400" />}
          {theme === 'system' && <Monitor size={16} className="text-violet-500 dark:text-violet-400" />}
          Tema Tampilan
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Pilih Mode Tampilan
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl font-bold text-xs border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === 'light'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-600 dark:text-violet-400 shadow-md'
                  : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sun size={20} />
              Mode Terang
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl font-bold text-xs border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-600 dark:text-violet-400 shadow-md glow-brand'
                  : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Moon size={20} />
              Mode Gelap
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl font-bold text-xs border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                theme === 'system'
                  ? 'bg-violet-600/10 border-violet-500/30 text-violet-600 dark:text-violet-400 shadow-md glow-brand'
                  : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-500 dark:text-slate-455 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Monitor size={20} />
              Sistem (HP)
            </button>
          </div>
        </div>
      </div>

      {/* Database Service Status Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)] space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Info size={16} className="text-violet-500 dark:text-violet-400" />
          Status Layanan Database
        </h3>

        <div className="flex items-center justify-between p-4 bg-slate-200/50 dark:bg-[#1a2336] rounded-xl border border-slate-300/40 dark:border-slate-800/80">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Provider: {dbService.provider === 'supabase' ? 'Supabase Cloud' : 'Offline Mode (Local)'}
            </h4>
            <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 max-w-sm">
              {dbService.provider === 'supabase'
                ? 'Semua data disimpan di server cloud Supabase secara real-time.'
                : 'Data disimpan lokal di browser Anda. Setup file .env untuk menghubungkan ke Supabase Cloud.'}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${
              dbService.provider === 'supabase'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            <Check size={12} />
            Aktif
          </span>
        </div>

        {dbService.provider === 'mock' && (
          <div className="p-4 bg-slate-200/30 dark:bg-slate-800/20 rounded-xl border border-[var(--color-border)] text-xs text-slate-550 dark:text-slate-400 space-y-2 leading-relaxed">
            <h5 className="font-bold text-slate-700 dark:text-slate-300">Cara Migrasi ke Cloud (Supabase):</h5>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Buat proyek baru di dashboard Supabase.</li>
              <li>Eksekusi query SQL yang ada di file <code className="text-violet-600 dark:text-violet-400 font-bold">supabase_schema.sql</code> di editor Supabase.</li>
              <li>Buat file <code className="text-violet-600 dark:text-violet-400 font-bold">.env</code> di root folder proyek Anda.</li>
              <li>Tambahkan <code className="text-slate-700 dark:text-slate-350">VITE_SUPABASE_URL</code> dan <code className="text-slate-700 dark:text-slate-350">VITE_SUPABASE_ANON_KEY</code>.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Danger Zone Card */}
      <div className="glass-panel rounded-2xl p-6 border border-rose-500/20 bg-rose-500/5 space-y-4">
        <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 border-b border-rose-500/10 pb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-500" />
          Zona Bahaya (Danger Zone)
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Hapus Akun Permanen</h4>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-normal max-w-md">
              Menghapus akun Anda akan menghapus seluruh data transaksi, dompet, anggaran, kategori, dan target tabungan secara permanen dari penyimpanan. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-5 py-2.5 font-bold text-xs rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/10 transition-all cursor-pointer shrink-0 self-start sm:self-center flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Hapus Akun
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 space-y-4 border border-rose-500/20 animate-slide-up bg-[var(--color-card)] text-[var(--color-text-primary)]">
            <h3 className="font-bold text-rose-600 dark:text-rose-455 text-lg flex items-center gap-2">
              <AlertTriangle size={20} className="text-rose-500" />
              Hapus Akun Permanen
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Apakah Anda yakin ingin menghapus akun FlowFin Anda? Tindakan ini <strong>tidak dapat dibatalkan</strong> dan seluruh data keuangan Anda akan dihapus selamanya.
            </p>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
