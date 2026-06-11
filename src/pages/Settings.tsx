import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dbService } from '../services/db';
import { User, Sun, Moon, Info, Settings as SettingsIcon, Check, Monitor } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, displayName, updateProfileName } = useAuth();
  const { theme, setTheme } = useTheme();

  const [nameInput, setNameInput] = useState(displayName);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    } else {
      setSuccess('Profil berhasil diperbarui!');
      setTimeout(() => setSuccess(null), 3000);
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
    </div>
  );
};
