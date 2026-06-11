import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Budget } from '../services/db/types';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle, Flame } from 'lucide-react';

export const Budgets: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => dbService.getBudgets(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => dbService.getCategories(),
  });

  const { data: transactions = [], isLoading: txsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => dbService.getTransactions(),
  });

  const isLoading = budgetsLoading || txsLoading;

  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form Fields
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // 'YYYY-MM'
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newBudget: Omit<Budget, 'id' | 'user_id'>) =>
      dbService.addBudget(newBudget.category_id, newBudget.limit_amount, newBudget.period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, limit_amount, period }: { id: string; limit_amount: number; period: string }) =>
      dbService.updateBudget(id, limit_amount, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  // Modal actions
  const openAddModal = () => {
    setEditingBudget(null);
    const expenseCats = categories.filter(c => c.type === 'expense');
    setCategoryId(expenseCats[0]?.id || '');
    setLimitAmount('');
    setPeriod(new Date().toISOString().slice(0, 7));
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.category_id);
    setLimitAmount(b.limit_amount.toString());
    setPeriod(b.period);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBudget(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryId) {
      setFormError('Pilih kategori terlebih dahulu.');
      return;
    }

    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setFormError('Limit budget harus berupa angka positif.');
      return;
    }

    // Check duplicate budget in add mode
    if (!editingBudget) {
      const isDuplicate = budgets.some(
        b => b.category_id === categoryId && b.period === period
      );
      if (isDuplicate) {
        setFormError('Budget untuk kategori ini di periode yang sama sudah ada.');
        return;
      }
    }

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, limit_amount: parsedLimit, period });
    } else {
      addMutation.mutate({ category_id: categoryId, limit_amount: parsedLimit, period });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus budget ini?')) {
      deleteMutation.mutate(id);
    }
  };

  // Math Helper for Categories
  const getCategorySpending = (catId: string, currentPeriod: string) => {
    return transactions
      .filter(
        t =>
          t.category_id === catId &&
          t.type === 'expense' &&
          t.transaction_date.slice(0, 7) === currentPeriod
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage > 100) {
      return {
        label: 'Melebihi Budget',
        color: 'text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400',
        barColor: 'bg-rose-500 glow-rose',
        icon: Flame
      };
    } else if (percentage >= 80) {
      return {
        label: 'Hampir Habis',
        color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
        barColor: 'bg-amber-500',
        icon: AlertTriangle
      };
    } else {
      return {
        label: 'Aman',
        color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
        barColor: 'bg-emerald-500',
        icon: CheckCircle
      };
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Budget Bulanan</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Batasi pengeluaran per kategori agar keuangan tetap sehat</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
        >
          <Plus size={16} />
          Buat Budget
        </button>
      </div>

      {/* Budget Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-44 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {budgets.map((b) => {
            const spent = getCategorySpending(b.category_id, b.period);
            const percentage = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
            const status = getBudgetStatus(percentage);
            const StatusIcon = status.icon;

            return (
              <div key={b.id} className="glass-panel rounded-2xl p-6 border border-[var(--color-border)] flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">
                      {b.category_name}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                      Periode: {b.period}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 ${status.color}`}>
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>

                {/* Progress Indicators */}
                <div className="my-6">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <span>Terpakai: <strong className="text-slate-800 dark:text-slate-200">{formatIDR(spent)}</strong></span>
                    <span>Limit: <strong className="text-slate-900 dark:text-slate-300">{formatIDR(b.limit_amount)}</strong></span>
                  </div>

                  {/* Outer Bar */}
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    {/* Inner Progress */}
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${status.barColor}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                    <span>Persentase Penggunaan:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{percentage.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/40 pt-4">
                  <button
                    onClick={() => openEditModal(b)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Edit2 size={12} />
                    Edit Limit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl py-16 text-center border border-[var(--color-border)]">
          <AlertTriangle size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada budget bulanan yang diatur. Ayo buat budget pertama Anda!</p>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-[var(--color-border)] p-8 shadow-2xl animate-scale-up bg-[var(--color-card)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingBudget ? 'Edit Limit Budget' : 'Buat Budget Baru'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-5 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Kategori Pengeluaran
                </label>
                <select
                  disabled={!!editingBudget}
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[var(--color-input)] disabled:opacity-40 border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
                >
                  <option value="">Pilih Kategori</option>
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {expenseCategories.length === 0 && (
                  <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-1.5">
                    Silakan daftarkan kategori pengeluaran terlebih dahulu di halaman Kategori.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Batas Pengeluaran (Limit)
                  </label>
                  <input
                    type="number"
                    required
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="Contoh: 1000000"
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Periode Bulan
                  </label>
                  <input
                    type="month"
                    required
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 font-bold text-xs border border-slate-300 dark:border-slate-800 hover:bg-slate-200/30 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 font-bold text-xs rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md glow-brand transition-all cursor-pointer"
                >
                  {addMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
