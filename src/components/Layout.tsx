import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  TrendingDown,
  Target,
  Tags,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Settings as SettingsIcon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, displayName, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const isStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      if (isStandalone()) return;
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissed = sessionStorage.getItem('flowfin_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissClick = () => {
    sessionStorage.setItem('flowfin_install_dismissed', 'true');
    setShowInstallBanner(false);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Multi Wallet', path: '/wallets', icon: Wallet },
    { name: 'Budget Bulanan', path: '/budgets', icon: TrendingDown },
    { name: 'Saving Goals', path: '/goals', icon: Target },
    { name: 'Kategori', path: '/categories', icon: Tags },
    { name: 'Laporan', path: '/reports', icon: BarChart3 },
    { name: 'Pengaturan', path: '/settings', icon: SettingsIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300">
      {/* Top Header */}
      <header className="relative z-45 flex items-center justify-between px-6 py-4 glass-panel border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="FlowFin" className="w-8 h-8 rounded-lg glow-brand" />
          <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
            FlowFin
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 relative">
          {/* DB Service Mode Badge */}
          <span
            className={`hidden sm:flex px-3 py-1 text-xs font-semibold rounded-full items-center gap-1.5 ${
              dbService.provider === 'supabase'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 glow-emerald'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dbService.provider === 'supabase' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {dbService.provider === 'supabase' ? 'Supabase Cloud' : 'Offline Mode (Local)'}
          </span>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-10 h-10 rounded-full bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800/60 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-slate-250 flex items-center justify-center border border-slate-350 dark:border-slate-850 shadow-sm transition-all cursor-pointer"
              title="Menu Profil"
            >
              <User size={18} />
            </button>

            {profileDropdownOpen && (
              <>
                {/* Backdrop overlay to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                
                {/* Floating Dropdown Panel */}
                <div className="absolute right-0 mt-3 w-56 z-50 glass-panel rounded-2xl border border-[var(--color-border)] p-2 shadow-2xl animate-fade-in text-[var(--color-text-primary)] bg-[var(--color-card)]">
                  <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">
                      Akun Pengguna
                    </p>
                    <p className="font-extrabold text-sm truncate mt-0.5 text-slate-800 dark:text-slate-200">
                      {displayName || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-all"
                  >
                    <SettingsIcon size={14} className="text-violet-500 dark:text-violet-400" />
                    Pengaturan
                  </Link>
                  
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <LogOut size={14} />
                    Keluar Akun
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-[var(--color-border)] p-4 shrink-0 overflow-y-auto">
          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md glow-brand'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          {/* App Version Info */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border)]/60 text-center">
            <span className="text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 block uppercase">
              V1.0 FLOWFIN
            </span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 glass-panel rounded-2xl border border-[var(--color-border)] p-2 flex items-center justify-around shadow-2xl">
        {menuItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                active ? 'text-violet-600 dark:text-violet-400 scale-105 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
        {/* Toggle Mobile Menu for More Items */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer ${
            mobileMenuOpen ? 'text-violet-600 dark:text-violet-400 font-bold' : ''
          }`}
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">Lainnya</span>
        </button>
      </nav>

      {/* Mobile Drawer (Menu Lainnya) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full glass-panel border-t border-[var(--color-border)] rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="font-bold text-slate-800 dark:text-white">Menu Lainnya</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl text-sm font-semibold border transition-all ${
                      active
                        ? 'bg-violet-600/20 text-violet-600 dark:text-white border-violet-500/30'
                        : 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-500 dark:text-white border-slate-200/60 dark:border-slate-800/50 hover:bg-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-violet-600 dark:text-white' : 'text-slate-500 dark:text-white'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
              <div className="text-slate-500 dark:text-slate-300 text-xs truncate px-1 font-medium">
                Akun: <strong className="text-slate-800 dark:text-white">{displayName || user?.email}</strong>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut size={16} />
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm glass-panel rounded-2xl p-6 space-y-4 border border-[var(--color-border)] animate-slide-up bg-[var(--color-card)]">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Konfirmasi Keluar</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun FlowFin Anda? Data Anda akan tetap aman tersimpan.
            </p>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleSignOut();
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-md cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-49 glass-panel rounded-2xl p-4 border border-violet-500/20 shadow-2xl animate-fade-in bg-[var(--color-card)] pointer-events-auto">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <img src="/pwa-192x192.png" alt="FlowFin" className="w-7 h-7" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-xs text-slate-800 dark:text-white">Pasang Aplikasi FlowFin</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                Instal FlowFin di HP Anda untuk akses instan, penggunaan offline, dan performa yang lebih lancar!
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3">
            <button
              onClick={handleDismissClick}
              className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md transition-all cursor-pointer"
            >
              Instal Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
