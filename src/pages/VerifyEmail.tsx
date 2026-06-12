import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, RefreshCw, LogOut, ShieldAlert } from 'lucide-react';
import { dbService } from '../services/db';
import { supabase } from '../services/db/supabaseClient';

export const VerifyEmail: React.FC = () => {
  const { user, verifyEmail, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.email_verified) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleCheckVerification = async () => {
    setChecking(true);
    const res = await verifyEmail();
    setChecking(false);

    if (res.error) {
      showToast(res.error, 'info');
    } else {
      showToast('Email berhasil diverifikasi! Selamat datang di FlowFin.', 'success');
      navigate('/');
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;
    setResending(true);

    try {
      if (dbService.provider === 'supabase' && supabase) {
        
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (error) throw error;
        showToast('Email verifikasi baru berhasil dikirim ulang!', 'success');
      } else {
        // Mock Mode simulation
        await new Promise(resolve => setTimeout(resolve, 800));
        showToast('Email verifikasi baru berhasil dikirim ulang! (Simulasi)', 'success');
      }
    } catch (e) {
      const err = e as Error;
      showToast(err.message || 'Gagal mengirim ulang email.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300 relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in text-center space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg glow-brand mb-6 animate-pulse">
            <Mail className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
            Verifikasi Email Anda
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
            Tautan konfirmasi telah dikirim ke alamat email berikut:
          </p>
          <div className="mt-3 px-3 py-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-800/40 border border-[var(--color-border)] text-xs font-semibold text-slate-700 dark:text-slate-300 inline-block max-w-full truncate">
            {user.email}
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left flex gap-3 text-xs text-amber-600 dark:text-amber-400 leading-normal">
          <ShieldAlert size={28} className="shrink-0 text-amber-500" />
          <div>
            <span className="font-bold">Perhatian:</span> Anda harus mengonfirmasi email sebelum dapat mengakses fitur pencatatan keuangan FlowFin.
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full py-3 px-4 font-bold text-xs rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md glow-brand flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {checking ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <RefreshCw size={14} />
            )}
            Saya Sudah Verifikasi
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="py-2.5 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Mengirim...' : 'Kirim Ulang'}
            </button>
            <button
              onClick={handleBackToLogin}
              className="py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={12} />
              Batal / Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
