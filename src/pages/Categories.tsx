import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { Category, TransactionType } from '../services/db/types';
import { Plus, Edit2, Trash2, X, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react';

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Queries
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => dbService.getCategories(),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => dbService.getTransactions(),
  });

  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const addMutation = useMutation({
    mutationFn: ({ name, type }: { name: string; type: TransactionType }) =>
      dbService.addCategory(name, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('Kategori berhasil ditambahkan!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menambahkan kategori', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, type }: { id: string; name: string; type: TransactionType }) =>
      dbService.updateCategory(id, name, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // update join names
      showToast('Kategori berhasil diperbarui!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal memperbarui kategori', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast('Kategori berhasil dihapus!', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menghapus kategori', 'error');
    }
  });

  // Action handlers
  const openAddModal = (initialType: TransactionType = 'expense') => {
    setEditingCategory(null);
    setName('');
    setType(initialType);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setType(c.type);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Nama kategori tidak boleh kosong.');
      return;
    }

    // Check duplicate
    const isDuplicate = categories.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && c.type === type && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      setFormError('Kategori dengan nama dan jenis yang sama sudah ada.');
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: name.trim(), type });
    } else {
      addMutation.mutate({ name: name.trim(), type });
    }
  };

  const handleDelete = (id: string, catName: string) => {
    const txCount = transactions.filter(t => t.category_id === id).length;
    let confirmMsg = `Apakah Anda yakin ingin menghapus kategori "${catName}"?`;
    if (txCount > 0) {
      confirmMsg += ` Terdapat ${txCount} transaksi yang menggunakan kategori ini. Menghapusnya akan membuat kategori transaksi tersebut menjadi "Unknown Category".`;
    }
    if (window.confirm(confirmMsg)) {
      deleteMutation.mutate(id);
    }
  };

  // Split categories
  const incomeCats = categories.filter(c => c.type === 'income');
  const expenseCats = categories.filter(c => c.type === 'expense');

  // Count helper
  const getCategoryUseCount = (catId: string) => {
    return transactions.filter(t => t.category_id === catId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Kategori Transaksi</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Buat dan atur kategori pemasukan serta pengeluaran kustom Anda</p>
        </div>
        <button
          onClick={() => openAddModal('expense')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {/* Info Message */}
      <div className="p-4 rounded-2xl bg-slate-200/50 dark:bg-slate-800/35 border border-slate-300/30 dark:border-slate-800 flex items-start gap-3 text-slate-600 dark:text-slate-400 text-xs">
        <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p>
          Mengelompokkan pencatatan keuangan ke dalam kategori mempermudah visualisasi analisis pengeluaran terbesar dan pemantauan limit anggaran (budget). Kategori yang dibuat di sini akan langsung muncul pada pilihan form transaksi.
        </p>
      </div>

      {/* Dual Column Category Grid */}
      {catsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 glass-panel rounded-2xl animate-pulse" />
          <div className="h-64 glass-panel rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories Column */}
          <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight size={16} />
                </span>
                Kategori Pemasukan ({incomeCats.length})
              </h3>
              <button
                onClick={() => openAddModal('income')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="space-y-2.5">
              {incomeCats.length > 0 ? (
                incomeCats.map((c) => {
                  const useCount = getCategoryUseCount(c.id);
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3.5 bg-slate-200/30 dark:bg-slate-850/30 hover:bg-slate-200/60 dark:hover:bg-slate-850/60 border border-slate-300/30 dark:border-slate-800/60 rounded-xl transition-all">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{c.name}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Digunakan: {useCount}x transaksi</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-10 text-xs text-slate-500">Belum ada kategori pemasukan.</p>
              )}
            </div>
          </div>

          {/* Expense Categories Column */}
          <div className="glass-panel rounded-2xl p-6 border border-[var(--color-border)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <ArrowDownLeft size={16} />
                </span>
                Kategori Pengeluaran ({expenseCats.length})
              </h3>
              <button
                onClick={() => openAddModal('expense')}
                className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            <div className="space-y-2.5">
              {expenseCats.length > 0 ? (
                expenseCats.map((c) => {
                  const useCount = getCategoryUseCount(c.id);
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3.5 bg-slate-200/30 dark:bg-slate-850/30 hover:bg-slate-200/60 dark:hover:bg-slate-850/60 border border-slate-300/30 dark:border-slate-800/60 rounded-xl transition-all">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{c.name}</h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Digunakan: {useCount}x transaksi</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center py-10 text-xs text-slate-500">Belum ada kategori pengeluaran.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-panel rounded-3xl border border-[var(--color-border)] p-8 shadow-2xl animate-scale-up bg-[var(--color-card)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
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
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Belanja, Gaji, Makanan"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-450 shadow-md glow-rose'
                        : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-400'
                    }`}
                  >
                    Pengeluaran (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-450 shadow-md glow-emerald'
                        : 'bg-[var(--color-input)] border-[var(--color-border)] text-slate-400'
                    }`}
                  >
                    Pemasukan (+)
                  </button>
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
                  {addMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
