import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl glow-brand animate-pulse mb-1">
            <img src="/pwa-192x192.png" alt="FlowFin Loading..." className="w-14 h-14 animate-bounce" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold animate-pulse tracking-widest uppercase">FlowFin</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
