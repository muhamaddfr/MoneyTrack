/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info as InfoIcon, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-6 right-6 z-55 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0 animate-fade-in">
        {toasts.map((toast) => {
          const { id, message, type } = toast;
          
          // Theme & Icon mappings
          let icon = <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
          let borderGlow = 'border-emerald-500/20 shadow-emerald-500/5 dark:shadow-emerald-500/10';
          
          if (type === 'error') {
            icon = <AlertTriangle size={16} className="text-rose-500 shrink-0" />;
            borderGlow = 'border-rose-500/20 shadow-rose-500/5 dark:shadow-rose-500/10';
          } else if (type === 'info') {
            icon = <InfoIcon size={16} className="text-violet-500 shrink-0" />;
            borderGlow = 'border-violet-500/20 shadow-violet-500/5 dark:shadow-violet-500/10';
          }

          return (
            <div
              key={id}
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl glass-panel border ${borderGlow} shadow-xl animate-slide-up transition-all bg-[var(--color-card)]`}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {message}
                </span>
              </div>
              <button
                onClick={() => removeToast(id)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-0.5 rounded transition-all cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
