import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { Wallet } from '../services/db/types';
import { Plus, Edit2, Trash2, X, Wallet as WalletIcon, Info } from 'lucide-react';

export const Wallets: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Queries
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => dbService.getWallets(),
  });

  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Mutations
  const addMutation = useMutation({
    mutationFn: ({ name, balance }: { name: string; balance: number }) => dbService.addWallet(name, balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast('Dompet berhasil ditambahkan!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menambahkan dompet', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name, balance }: { id: string; name: string; balance: number }) =>
      dbService.updateWallet(id, name, balance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast('Dompet berhasil diperbarui!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal memperbarui dompet', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      showToast('Dompet berhasil dihapus!', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menghapus dompet', 'error');
    }
  });

  // Event handlers
  const openAddModal = () => {
    setEditingWallet(null);
    setName('');
    setBalance('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (w: Wallet) => {
    setEditingWallet(w);
    setName(w.name);
    setBalance(w.balance.toString());
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingWallet(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Nama wallet tidak boleh kosong.');
      return;
    }

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) {
      setFormError('Saldo harus berupa angka.');
      return;
    }

    if (editingWallet) {
      updateMutation.mutate({ id: editingWallet.id, name: name.trim(), balance: parsedBalance });
    } else {
      addMutation.mutate({ name: name.trim(), balance: parsedBalance });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus wallet ini? Seluruh transaksi yang dikaitkan dengan wallet ini juga akan terpengaruh.')) {
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

  // Curated color schemes for cards based on indexing (These are gradients with white text so they stay identical)
  const cardGradients = [
    'from-violet-600 to-indigo-800 shadow-violet-900/40 glow-brand',
    'from-cyan-600 to-blue-800 shadow-blue-900/40',
    'from-emerald-600 to-teal-800 shadow-teal-900/40 glow-emerald',
    'from-rose-600 to-amber-700 shadow-amber-900/40 glow-rose',
    'from-fuchsia-600 to-pink-850 shadow-pink-900/40',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Multi Wallet</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Kelola beberapa sumber dana dan saldo Anda secara terpisah</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
        >
          <Plus size={16} />
          Tambah Wallet
        </button>
      </div>

      {/* Info Warning */}
      <div className="p-4 rounded-2xl bg-slate-200/50 dark:bg-slate-800/35 border border-slate-300/30 dark:border-slate-800 flex items-start gap-3 text-slate-600 dark:text-slate-400 text-xs">
        <Info size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p>
          Anda dapat mendaftarkan rekening bank (BCA, Mandiri), dompet digital (OVO, Dana, ShopeePay), maupun dana tunai. Menambahkan transaksi baru yang memotong atau menambah dana di wallet ini secara otomatis akan mengupdate saldo yang ditampilkan di sini.
        </p>
      </div>

      {/* Wallet Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 glass-panel rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : wallets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {wallets.map((w, idx) => {
            const gradient = cardGradients[idx % cardGradients.length];
            return (
              <div
                key={w.id}
                className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-tr ${gradient} border border-white/10 flex flex-col justify-between h-48 shadow-xl transition-all duration-300 hover:scale-[1.02]`}
              >
                {/* Chip decoration & Name */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white/60 font-bold uppercase tracking-wider text-[10px]">
                      Sumber Dana
                    </h4>
                    <h3 className="text-lg font-extrabold text-white mt-1">
                      {w.name}
                    </h3>
                  </div>
                  <div className="w-9 h-7 rounded-md bg-white/15 border border-white/20 flex items-center justify-center text-white/80">
                    <WalletIcon size={16} />
                  </div>
                </div>

                {/* Card Number Representation */}
                <div className="text-white/30 text-xs font-mono tracking-widest my-3">
                  ••••  ••••  ••••  {1000 + (idx * 333)}
                </div>

                {/* Balance & Actions */}
                <div className="flex justify-between items-end border-t border-white/10 pt-3">
                  <div>
                    <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider block">Saldo Wallet</span>
                    <span className="text-xl font-extrabold text-white">
                      {formatIDR(w.balance)}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1.5 bg-black/20 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => openEditModal(w)}
                      className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-all cursor-pointer"
                      title="Edit Wallet"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="p-1.5 text-white/70 hover:text-rose-450 hover:bg-white/10 rounded-md transition-all cursor-pointer"
                      title="Hapus Wallet"
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
          <WalletIcon size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada wallet yang ditambahkan. Silakan klik "Tambah Wallet" di atas.</p>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-[var(--color-border)] p-8 shadow-2xl animate-scale-up bg-[var(--color-card)]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingWallet ? 'Edit Wallet' : 'Tambah Wallet Baru'}
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
                  Nama Wallet
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: BCA, Dompet Tunai, OVO"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {editingWallet ? 'Saldo Saat Ini' : 'Saldo Awal'}
                </label>
                <input
                  type="number"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="Contoh: 1000000"
                  className="w-full bg-[var(--color-input)] border border-[var(--color-border)] focus:border-violet-500 focus:outline-none rounded-xl py-2.5 px-3.5 text-xs text-[var(--color-text-primary)] transition-all"
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
                  {addMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
