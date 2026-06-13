import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, UserPlus, Check, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Generate a random CAPTCHA code
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 1, I, O, 0
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
  };

  // Draw the CAPTCHA code on a canvas
  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background color
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9'; // slate-800 or slate-100
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some noise lines
    ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1'; // slate-600 or slate-300
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Add some noise dots
    ctx.fillStyle = isDark ? '#64748b' : '#94a3b8'; // slate-500 or slate-400
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 1.5, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw characters
    ctx.font = 'bold 24px Courier New, monospace';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      // Random rotation and translation
      ctx.save();
      const x = 15 + i * 24 + Math.random() * 6;
      const y = canvas.height / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() * 30 - 15) * Math.PI / 180; // +/- 15 degrees
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Random character color
      const colors = isDark 
        ? ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#f472b6'] 
        : ['#6d28d9', '#4338ca', '#1d4ed8', '#047857', '#be185d'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.email_verified) {
        navigate('/', { replace: true });
      } else {
        navigate('/verify-email', { replace: true });
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isSignUp) {
      generateCaptcha();
    }
  }, [isSignUp]);

  useEffect(() => {
    if (captchaCode) {
      const timer = setTimeout(() => {
        drawCaptcha(captchaCode);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [captchaCode]);

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
      if (!acceptedTerms) {
        setError('Anda harus menyetujui Ketentuan Penggunaan dan Kebijakan Privasi.');
        setLoading(false);
        return;
      }
      if (captchaInput.trim().toUpperCase() !== captchaCode) {
        setError('Kode CAPTCHA tidak cocok. Silakan coba lagi.');
        generateCaptcha();
        setLoading(false);
        return;
      }

      const res = await signUp(email, password);
      if (res.error) {
        setError(res.error);
        generateCaptcha();
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



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300 relative overflow-hidden">
      {/* Dynamic Background Blur Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg glow-brand mb-4">
            <img src="/pwa-192x192.png" alt="FlowFin Logo" className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
            FlowFin
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center">
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-3 pl-11 pr-4 text-[var(--color-text-primary)] placeholder-slate-400 dark:placeholder-slate-550 text-sm transition-all"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          {!isReset && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-3 pl-11 pr-11 text-[var(--color-text-primary)] placeholder-slate-400 dark:placeholder-slate-550 text-sm transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-550 hover:text-slate-700 dark:hover:text-slate-350 transition-all cursor-pointer flex items-center justify-center"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {isSignUp && !isReset && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-3 pl-11 pr-11 text-[var(--color-text-primary)] placeholder-slate-400 dark:placeholder-slate-550 text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-555 hover:text-slate-700 dark:hover:text-slate-350 transition-all cursor-pointer flex items-center justify-center"
                    title={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
                    {password === confirmPassword ? (
                      <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                        <Check size={12} className="shrink-0" />
                        Kata sandi cocok
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <span className="shrink-0">✕</span>
                        Kata sandi tidak cocok
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CAPTCHA Section */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Verifikasi Keamanan (CAPTCHA)
                </label>
                <div className="flex items-center gap-3">
                  <canvas 
                    ref={canvasRef} 
                    width={150} 
                    height={46} 
                    className="rounded-xl border border-[var(--color-border)] shadow-inner cursor-pointer"
                    title="Klik untuk memuat ulang CAPTCHA"
                    onClick={generateCaptcha}
                  />
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="py-3 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-3 px-4 text-[var(--color-text-primary)] placeholder-slate-400 dark:placeholder-slate-550 text-sm transition-all"
                  placeholder="Masukkan 5 karakter kode di atas"
                  maxLength={5}
                />
              </div>

              {/* Terms of Use and Privacy Policy Checkboxes */}
              <div className="flex items-start gap-3 mt-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--color-border)] text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer">
                  Saya menyetujui <a href="#terms" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline" onClick={(e) => {e.preventDefault(); alert("Terms of Use: Aplikasi ini digunakan untuk mencatat dan mengelola keuangan pribadi Anda secara aman. Data disimpan lokal atau di cloud Supabase sesuai pilihan Anda.");}}>Ketentuan Penggunaan</a> dan <a href="#privacy" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline" onClick={(e) => {e.preventDefault(); alert("Privacy Policy: Kami menghargai privasi Anda. Data keuangan Anda sepenuhnya milik Anda dan tidak akan dibagikan ke pihak ketiga mana pun.");}}>Kebijakan Privasi</a>.
                </label>
              </div>
            </>
          )}

          {!isSignUp && !isReset && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsReset(true)}
                className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium transition-all"
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





        <div className="mt-6 text-center">
          {isReset ? (
            <button
              onClick={() => {
                setIsReset(false);
                setError(null);
                setSuccess(null);
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-all cursor-pointer"
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
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 font-medium transition-all cursor-pointer"
            >
              {isSignUp ? (
                <span>
                  Sudah punya akun? <strong className="text-violet-600 dark:text-violet-400 hover:underline">Masuk disini</strong>
                </span>
              ) : (
                <span>
                  Belum punya akun? <strong className="text-violet-600 dark:text-violet-400 hover:underline">Daftar sekarang</strong>
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
