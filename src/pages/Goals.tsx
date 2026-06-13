import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { FinancialGoal } from '../services/db/types';
import { Plus, Edit2, Trash2, X, Target, PiggyBank, Calendar, Coins } from 'lucide-react';

export const Goals: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Queries
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['financial_goals'],
    queryFn: () => dbService.getFinancialGoals(),
  });

  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [fundsModalOpen, setFundsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [fundDeposit, setFundDeposit] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newGoal: Omit<FinancialGoal, 'id' | 'user_id'>) =>
      dbService.addFinancialGoal(newGoal.title, newGoal.target_amount, newGoal.current_amount, newGoal.target_date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_goals'] });
      showToast('Saving Goal berhasil ditambahkan!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menambahkan goal', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<FinancialGoal, 'id' | 'user_id'> }) =>
      dbService.updateFinancialGoal(id, data.title, data.target_amount, data.current_amount, data.target_date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_goals'] });
      showToast('Saving Goal berhasil diperbarui!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal memperbarui goal', 'error');
    }
  });

  const depositMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      dbService.addGoalFunds(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_goals'] });
      showToast('Dana berhasil disimpan ke target!', 'success');
      closeFundsModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menyimpan dana', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteFinancialGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial_goals'] });
      showToast('Saving Goal berhasil dihapus!', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menghapus goal', 'error');
    }
  });

  // Action handlers
  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (g: FinancialGoal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setTargetAmount(g.target_amount.toString());
    setCurrentAmount(g.current_amount.toString());
    setTargetDate(g.target_date);
    setFormError(null);
    setModalOpen(true);
  };

  const openFundsModal = (id: string) => {
    setActiveGoalId(id);
    setFundDeposit('');
    setFormError(null);
    setFundsModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGoal(null);
  };

  const closeFundsModal = () => {
    setFundsModalOpen(false);
    setActiveGoalId(null);
  };

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Judul target saving harus diisi.');
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setFormError('Target nominal harus bernilai positif.');
      return;
    }

    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setFormError('Dana terkumpul awal tidak boleh bernilai negatif.');
      return;
    }

    if (!targetDate) {
      setFormError('Silakan pilih target tanggal pencapaian.');
      return;
    }

    const goalData = {
      title: title.trim(),
      target_amount: parsedTarget,
      current_amount: parsedCurrent,
      target_date: targetDate
    };

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      addMutation.mutate(goalData);
    }
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedDeposit = parseFloat(fundDeposit);
    if (isNaN(parsedDeposit) || parsedDeposit <= 0) {
      setFormError('Jumlah tabungan harus berupa angka positif.');
      return;
    }

    if (activeGoalId) {
      depositMutation.mutate({ id: activeGoalId, amount: parsedDeposit });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus saving goal ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const calculateSavingsRate = (targetDateStr: string, remaining: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return {
        days: 0,
        daily: remaining,
        weekly: remaining,
        monthly: remaining
      };
    }

    const daily = remaining / diffDays;
    const weekly = remaining / (diffDays / 7);
    const monthly = remaining / (diffDays / 30);

    return {
      days: diffDays,
      daily,
      weekly: weekly > remaining ? remaining : weekly,
      monthly: monthly > remaining ? remaining : monthly
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Saving Goals</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Rencanakan pembelian impian Anda dengan tabungan terarah</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
        >
          <Plus size={16} />
          Buat Saving Target
        </button>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-56 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {goals.map((g) => {
            const percentage = Math.min((g.current_amount / g.target_amount) * 100, 100);
            const remaining = Math.max(g.target_amount - g.current_amount, 0);
            
            return (
              <div key={g.id} className="glass-panel rounded-2xl p-6 border border-[var(--color-border)] flex flex-col justify-between hover:border-slate-350 dark:hover:border-slate-700 transition-all group">
                <div>
                  {/* Goal Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                        <Target size={20} />
                      </div>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-all truncate max-w-[150px]">
                        {g.title}
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap">
                      <Calendar size={12} />
                      Target: {g.target_date}
                    </span>
                  </div>

                  {/* Math Progress Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-5 bg-slate-200/50 dark:bg-[#151b2c]/40 p-3 rounded-xl border border-slate-300/40 dark:border-slate-800/60">
                    <div>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Terkumpul</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatIDR(g.current_amount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Target</span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{formatIDR(g.target_amount)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Progres Pencapaian</span>
                      <span className="font-bold text-violet-600 dark:text-violet-400">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full glow-brand transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {remaining > 0 ? (
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 text-right">
                        Kurang <strong className="text-slate-700 dark:text-slate-400">{formatIDR(remaining)}</strong> lagi
                      </p>
                    ) : (
                      <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 text-right font-bold flex items-center justify-end gap-1">
                        <PiggyBank size={10} /> Target Terpenuhi!
                      </p>
                    )}
                  </div>

                  {/* Estimated Required Savings Rate */}
                  {remaining > 0 && (() => {
                    const rate = calculateSavingsRate(g.target_date, remaining);
                    return (
                      <div className="mt-4 p-3 bg-violet-500/5 dark:bg-violet-500/10 rounded-xl border border-violet-500/10 dark:border-violet-500/20 text-[10px] space-y-1 text-slate-650 dark:text-slate-350">
                        <span className="font-extrabold uppercase tracking-wider text-[8px] text-violet-650 dark:text-violet-400 block mb-1">
                          Estimasi Tabungan Wajib ({rate.days} Hari Lagi)
                        </span>
                        <div className="flex justify-between">
                          <span>Harian:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatIDR(rate.daily)} /hari</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mingguan:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatIDR(rate.weekly)} /minggu</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bulanan:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatIDR(rate.monthly)} /bulan</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/40 pt-4 mt-6">
                  {remaining > 0 ? (
                    <button
                      onClick={() => openFundsModal(g.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Coins size={12} />
                      Tabung Uang
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircleIcon /> Terkumpul
                    </span>
                  )}

                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 rounded-lg transition-all cursor-pointer"
                      title="Edit Target"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl py-16 text-center border border-[var(--color-border)]">
          <PiggyBank size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4 animate-bounce" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada saving goal yang diatur. Ayo targetkan tabungan impian Anda!</p>
        </div>
      )}

      {/* Goal Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-[var(--color-border)] p-8 shadow-2xl animate-scale-up bg-[var(--color-card)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingGoal ? 'Edit Saving Target' : 'Buat Saving Target Baru'}
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

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Nama Pembelian / Target
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Laptop Kerja, Liburan Akhir Tahun"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Target Nominal
                  </label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Contoh: 10000000"
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Dana Terkumpul Awal
                  </label>
                  <input
                    type="number"
                    required
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="Contoh: 0"
                    className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Target Tanggal Pencapaian
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
                />
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
                  {addMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Funds Addition Modal */}
      {fundsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl border border-[var(--color-border)] p-8 shadow-2xl animate-scale-up bg-[var(--color-card)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Tabung Uang Target
              </h3>
              <button
                onClick={closeFundsModal}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mb-5 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-650 dark:text-rose-450">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Jumlah Tabungan Baru (Rupiah)
                </label>
                <input
                  type="number"
                  required
                  value={fundDeposit}
                  onChange={(e) => setFundDeposit(e.target.value)}
                  placeholder="Contoh: 500000"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeFundsModal}
                  className="px-4 py-2 font-bold text-xs border border-slate-300 dark:border-slate-800 hover:bg-slate-200/30 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={depositMutation.isPending}
                  className="px-5 py-2 font-bold text-xs rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md glow-brand transition-all cursor-pointer"
                >
                  {depositMutation.isPending ? 'Menyimpan...' : 'Tambahkan Tabungan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Check circle icon fallback helper
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600 dark:text-emerald-450" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
