import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, UserPlus, Info } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isReset) {
      const res = await resetPassword(email);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Link reset password telah dikirim ke email Anda.');
        setIsReset(false);
      }
      setLoading(false);
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Konfirmasi password tidak cocok.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password minimal harus 6 karakter.');
        setLoading(false);
        return;
      }
      const res = await signUp(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Pendaftaran berhasil! Mengalihkan ke dashboard...');
        setTimeout(() => navigate('/'), 1000);
      }
    } else {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess('Login berhasil! Mengalihkan...');
        setTimeout(() => navigate('/'), 800);
      }
    }
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const res = await signIn('admin@moneytrack.com', 'admin123');
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Login Demo Berhasil! Mengalihkan...');
      setTimeout(() => navigate('/'), 800);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0b0f19] relative overflow-hidden">
      {/* Dynamic Background Blur Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in border border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg glow-brand mb-4">
            <img src="/pwa-192x192.png" alt="MoneyTrack Logo" className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            MoneyTrack
          </h2>
          <p className="text-slate-400 text-sm mt-1 text-center">
            {isReset 
              ? 'Lupa Password Anda?' 
              : isSignUp 
                ? 'Buat akun untuk melacak keuangan Anda' 
                : 'Pencatatan keuangan praktis & real-time'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 text-sm rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-slide-up flex gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-slide-up">
            {success}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#151b2c] border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm transition-all"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          {!isReset && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#151b2c] border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {isSignUp && !isReset && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#151b2c] border border-slate-800 focus:border-violet-500 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-slate-100 placeholder-slate-500 text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {!isSignUp && !isReset && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsReset(true)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-all"
              >
                Lupa Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 font-semibold text-sm rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition-all shadow-lg glow-brand flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isReset ? (
              'Kirim Email Reset'
            ) : isSignUp ? (
              <>
                <UserPlus size={16} />
                Daftar Akun Baru
              </>
            ) : (
              <>
                <LogIn size={16} />
                Masuk Ke Aplikasi
              </>
            )}
          </button>
        </form>

        {/* Demo login option */}
        {!isReset && !isSignUp && (
          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 font-semibold text-xs rounded-xl text-slate-300 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Info size={14} className="text-violet-400" />
              Gunakan Akun Demo (Instan)
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          {isReset ? (
            <button
              onClick={() => {
                setIsReset(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-all"
            >
              Kembali ke Halaman Login
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-all"
            >
              {isSignUp ? (
                <span>
                  Sudah punya akun? <strong className="text-violet-400 hover:underline">Masuk disini</strong>
                </span>
              ) : (
                <span>
                  Belum punya akun? <strong className="text-violet-400 hover:underline">Daftar sekarang</strong>
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
