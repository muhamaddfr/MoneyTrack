import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Transaction, TransactionType } from '../services/db/types';
import {
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FilterX,
  FileText
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: transactions = [], isLoading: txsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => dbService.getTransactions(),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => dbService.getWallets(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => dbService.getCategories(),
  });

  // State for Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for Modal (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newTx: Omit<Transaction, 'id' | 'user_id'>) => dbService.addTransaction(newTx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Transaction, 'id' | 'user_id'>> }) =>
      dbService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    }
  });

  // Modal Open/Close handlers
  const openAddModal = () => {
    setEditingTx(null);
    setAmount('');
    setType('expense');
    setWalletId(wallets[0]?.id || '');
    const expenseCats = categories.filter(c => c.type === 'expense');
    setCategoryId(expenseCats[0]?.id || categories[0]?.id || '');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setAmount(tx.amount.toString());
    setType(tx.type);
    setWalletId(tx.wallet_id);
    setCategoryId(tx.category_id);
    setTransactionDate(tx.transaction_date);
    setNotes(tx.notes);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTx(null);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Nominal transaksi harus berupa angka lebih besar dari 0.');
      return;
    }

    if (!walletId) {
      setFormError('Silakan pilih wallet sumber dana.');
      return;
    }

    if (!categoryId) {
      setFormError('Silakan pilih kategori transaksi.');
      return;
    }

    const txData = {
      amount: parsedAmount,
      type,
      wallet_id: walletId,
      category_id: categoryId,
      transaction_date: transactionDate,
      notes
    };

    if (editingTx) {
      updateMutation.mutate({ id: editingTx.id, data: txData });
    } else {
      addMutation.mutate(txData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini? Saldo wallet terkait akan disesuaikan kembali.')) {
      deleteMutation.mutate(id);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterWallet('all');
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
  };

  // Filter & Search Logic
  const filteredTxs = transactions.filter(tx => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesNotes = tx.notes.toLowerCase().includes(q);
      const matchesAmount = tx.amount.toString().includes(q);
      if (!matchesNotes && !matchesAmount) return false;
    }

    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterWallet !== 'all' && tx.wallet_id !== filterWallet) return false;
    if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false;

    if (startDate && tx.transaction_date < startDate) return false;
    if (endDate && tx.transaction_date > endDate) return false;

    return true;
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter categories by form transaction type
  const availableCategoriesForForm = categories.filter(c => c.type === type);

  if (modalOpen) {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up pb-12">
        {/* Form Card */}
        <div className="glass-panel rounded-3xl border border-[var(--color-border)] p-5 sm:p-8 shadow-2xl bg-[var(--color-card)]">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
              {editingTx ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </h3>
            <button
              onClick={closeModal}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 animate-slide-up">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Jenis Transaksi
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    const expenseCats = categories.filter(c => c.type === 'expense');
                    setCategoryId(expenseCats[0]?.id || '');
                  }}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    type === 'expense'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-455 shadow-md glow-rose'
                      : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Pengeluaran (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    const incomeCats = categories.filter(c => c.type === 'income');
                    setCategoryId(incomeCats[0]?.id || '');
                  }}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    type === 'income'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-450 shadow-md glow-emerald'
                      : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Pemasukan (+)
                </button>
              </div>
            </div>

            {/* Amount & Date in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Nominal (Rupiah)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-sm text-[var(--color-text-primary)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  required
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2 px-3 text-sm text-[var(--color-text-primary)] transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Wallet & Category in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Wallet Sumber
                </label>
                <select
                  required
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3 text-sm text-[var(--color-text-primary)] transition-all cursor-pointer"
                >
                  <option value="">Pilih Wallet</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} (Saldo: {formatIDR(w.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3 text-sm text-[var(--color-text-primary)] transition-all cursor-pointer"
                >
                  <option value="">Pilih Kategori</option>
                  {availableCategoriesForForm.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {availableCategoriesForForm.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1.5">
                    Belum ada kategori custom tipe ini. Silakan tambahkan di halaman Kategori.
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Catatan / Deskripsi
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Keterangan transaksi..."
                rows={3}
                className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-sm text-[var(--color-text-primary)] transition-all"
              />
            </div>

            {/* Actions */}
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
                {addMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Manajemen Transaksi</h2>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-1">Catat dan kelola pemasukan serta pengeluaran Anda</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
        >
          <Plus size={16} />
          Tambah Transaksi
        </button>
      </div>

      {/* Filters Card */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider flex items-center gap-2">
            <Filter size={14} className="text-violet-500 dark:text-violet-400" />
            Filter & Pencarian
          </h4>
          {(searchQuery || filterType !== 'all' || filterWallet !== 'all' || filterCategory !== 'all' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <FilterX size={12} />
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan atau nominal..."
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 pl-10 text-xs text-[var(--color-text-primary)] placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              <option value="all">Semua Jenis</option>
              <option value="income">Pemasukan (+)</option>
              <option value="expense">Pengeluaran (-)</option>
            </select>
          </div>

          {/* Wallet */}
          <div>
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              <option value="all">Semua Wallet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})</option>
              ))}
            </select>
          </div>

          {/* Date Range - Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
            />
          </div>

          {/* Date Range - End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2 px-3 text-xs text-[var(--color-text-primary)] transition-all cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)]">
        {txsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-800/10 dark:bg-slate-800/20 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredTxs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-500 tracking-wider">
                  <th className="py-4 px-3">Tanggal</th>
                  <th className="py-4 px-3">Deskripsi / Catatan</th>
                  <th className="py-4 px-3">Wallet</th>
                  <th className="py-4 px-3">Kategori</th>
                  <th className="py-4 px-3 text-right">Nominal</th>
                  <th className="py-4 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40 text-sm">
                {filteredTxs.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/10 transition-all">
                    <td className="py-4 px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400 dark:text-slate-550" />
                        {tx.transaction_date}
                      </div>
                    </td>
                    <td className="py-4 px-3 font-extrabold text-slate-800 dark:text-slate-200">
                      {tx.notes || '-'}
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-xs px-2 py-1 bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300/40 dark:border-slate-700/50">
                        {tx.wallet_name}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-xs px-2 py-1 bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300/40 dark:border-slate-700/50">
                        {tx.category_name}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-right">
                      <span className={`font-bold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                        {formatIDR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-1.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 text-sm">Tidak ada transaksi ditemukan yang cocok dengan kriteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
