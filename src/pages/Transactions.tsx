import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
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
  FileText,
  Check,
  AlertTriangle,
  Upload,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ParsedImportTx {
  transaction_date: string;
  type: TransactionType;
  amount: number;
  wallet_id: string;
  wallet_name: string;
  category_id: string;
  category_name: string;
  notes: string;
  status: 'valid' | 'defaulted_wallet' | 'defaulted_category' | 'invalid';
  errorMsg?: string;
}

export const Transactions: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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

  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterWallet, filterCategory, startDate, endDate]);

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

  // State for CSV Import
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedTxs, setParsedTxs] = useState<ParsedImportTx[]>([]);
  const [importing, setImporting] = useState(false);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCSVText(text);
    };
    reader.readAsText(file);
  };

  const processCSVText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
      showToast('File CSV kosong atau tidak memiliki data.', 'error');
      return;
    }

    const parseCSVRow = (row: string) => {
      const result = [];
      let insideQuote = false;
      let current = '';
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const parseImportDate = (rawDate: string): string | null => {
      let clean = rawDate.trim();
      if (!clean) return null;

      // 1. Convert Indonesian and English month names to numeric representation
      const monthNames: { [key: string]: string } = {
        'januari': '01', 'jan': '01', 'january': '01',
        'februari': '02', 'feb': '02', 'february': '02',
        'maret': '03', 'mar': '03', 'march': '03',
        'april': '04', 'apr': '04',
        'mei': '05', 'may': '05',
        'juni': '06', 'jun': '06', 'june': '06',
        'juli': '07', 'jul': '07', 'july': '07',
        'agustus': '08', 'agt': '08', 'agu': '08', 'august': '08', 'aug': '08',
        'september': '09', 'sep': '09',
        'oktober': '10', 'okt': '10', 'october': '10', 'oct': '10',
        'november': '11', 'nov': '11',
        'desember': '12', 'des': '12', 'december': '12', 'dec': '12'
      };

      if (/[a-zA-Z]/.test(clean)) {
        let temp = clean.toLowerCase();
        Object.entries(monthNames).forEach(([name, num]) => {
          temp = temp.replace(new RegExp(`\\b${name}\\b`, 'g'), `-${num}-`);
        });
        clean = temp;
      }

      // 2. Extract all numeric segments
      const segments = clean.split(/[^0-9]+/).filter(s => s !== '');
      if (segments.length < 3) {
        const ts = Date.parse(rawDate);
        if (!isNaN(ts)) {
          const d = new Date(ts);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return null;
      }

      let p1 = parseInt(segments[0], 10);
      let p2 = parseInt(segments[1], 10);
      let p3 = parseInt(segments[2], 10);

      let year = 0;
      let month = 0;
      let day = 0;

      // 3. Classify segment ordering
      if (segments[0].length === 4 && p1 >= 1000) {
        year = p1;
        if (p2 > 12) {
          day = p2;
          month = p3;
        } else if (p3 > 12) {
          day = p3;
          month = p2;
        } else {
          month = p2;
          day = p3;
        }
      } else if (segments[2].length === 4 && p3 >= 1000) {
        year = p3;
        if (p1 > 12) {
          day = p1;
          month = p2;
        } else if (p2 > 12) {
          day = p2;
          month = p1;
        } else {
          day = p1;
          month = p2;
        }
      } else {
        if (p1 > 12) {
          day = p1;
          month = p2;
          year = p3 < 100 ? (p3 + 2000) : p3;
        } else {
          day = p1;
          month = p2;
          year = p3 < 100 ? (p3 + 2000) : p3;
        }
      }

      // 4. Validate range boundaries (avoid Postgres date out of range)
      if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
        const ts = Date.parse(rawDate);
        if (!isNaN(ts)) {
          const d = new Date(ts);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return null;
      }

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().trim());
    const dateIdx = headers.findIndex(h => h.includes('tanggal') || h.includes('date'));
    const typeIdx = headers.findIndex(h => h.includes('tipe') || h.includes('type') || h.includes('jenis'));
    const amountIdx = headers.findIndex(h => h.includes('nominal') || h.includes('amount') || h.includes('jumlah') || h.includes('value'));
    const walletIdx = headers.findIndex(h => h.includes('wallet') || h.includes('dompet') || h.includes('sumber'));
    const categoryIdx = headers.findIndex(h => h.includes('kategori') || h.includes('category'));
    const notesIdx = headers.findIndex(h => h.includes('catatan') || h.includes('notes') || h.includes('keterangan') || h.includes('deskripsi'));

    if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1 || walletIdx === -1 || categoryIdx === -1) {
      showToast('Format kolom CSV tidak sesuai. Pastikan ada kolom: Tanggal, Tipe, Nominal, Wallet, dan Kategori.', 'error');
      return;
    }

    const matchedTxs: ParsedImportTx[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseCSVRow(line);
      if (values.length < Math.max(dateIdx, typeIdx, amountIdx, walletIdx, categoryIdx) + 1) continue;

      const rawDate = values[dateIdx] || '';
      const rawType = values[typeIdx] || '';
      const rawAmount = values[amountIdx] || '';
      const rawWallet = values[walletIdx] || '';
      const rawCategory = values[categoryIdx] || '';
      const rawNotes = notesIdx !== -1 ? values[notesIdx] || '' : '';

      const parsedDate = parseImportDate(rawDate);
      const isDateValid = parsedDate !== null;
      const transaction_date = parsedDate || rawDate;

      let txType: TransactionType = 'expense';
      if (rawType.toLowerCase().includes('in') || rawType.toLowerCase().includes('masuk')) {
        txType = 'income';
      }

      const amountVal = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
      const isAmountValid = !isNaN(amountVal) && amountVal > 0;

      let status: ParsedImportTx['status'] = 'valid';
      let walletId = '';
      let walletName = '';

      const matchedWallet = wallets.find(w => w.name.toLowerCase() === rawWallet.toLowerCase());
      if (matchedWallet) {
        walletId = matchedWallet.id;
        walletName = matchedWallet.name;
      } else {
        if (wallets.length > 0) {
          walletId = wallets[0].id;
          walletName = wallets[0].name + ' (Default)';
          status = 'defaulted_wallet';
        } else {
          status = 'invalid';
        }
      }

      const matchedCat = categories.find(c => c.name.toLowerCase() === rawCategory.toLowerCase() && c.type === txType);
      let categoryId = '';
      let categoryName = '';
      if (matchedCat) {
        categoryId = matchedCat.id;
        categoryName = matchedCat.name;
      } else {
        const availableCats = categories.filter(c => c.type === txType);
        if (availableCats.length > 0) {
          categoryId = availableCats[0].id;
          categoryName = availableCats[0].name + ' (Default)';
          if (status === 'valid') status = 'defaulted_category';
        } else {
          status = 'invalid';
        }
      }

      if (!isAmountValid) status = 'invalid';
      if (!isDateValid) status = 'invalid';

      matchedTxs.push({
        transaction_date,
        type: txType,
        amount: isAmountValid ? amountVal : 0,
        wallet_id: walletId,
        wallet_name: walletName,
        category_id: categoryId,
        category_name: categoryName,
        notes: rawNotes,
        status,
        errorMsg: !isAmountValid 
          ? 'Nominal tidak valid' 
          : (!isDateValid ? 'Format tanggal tidak dikenali' : undefined)
      });
    }

    if (matchedTxs.length === 0) {
      showToast('Tidak ada data transaksi valid ditemukan.', 'error');
      return;
    }

    setParsedTxs(matchedTxs);
    setImportModalOpen(true);
  };

  const handleConfirmImport = async () => {
    const validTxs = parsedTxs.filter(tx => tx.status !== 'invalid');
    if (validTxs.length === 0) {
      showToast('Tidak ada transaksi valid untuk diimport.', 'error');
      return;
    }

    setImporting(true);
    try {
      const txsData = validTxs.map(tx => ({
        amount: tx.amount,
        type: tx.type,
        wallet_id: tx.wallet_id,
        category_id: tx.category_id,
        transaction_date: tx.transaction_date,
        notes: tx.notes
      }));

      await dbService.addTransactions(txsData);

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast(`Berhasil mengimport ${validTxs.length} transaksi!`, 'success');
      setImportModalOpen(false);
      setParsedTxs([]);
    } catch (err) {
      const error = err as Error;
      showToast(error.message || 'Gagal mengimport data.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Mutations
  const addMutation = useMutation({
    mutationFn: (newTx: Omit<Transaction, 'id' | 'user_id'>) => dbService.addTransaction(newTx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast('Transaksi berhasil ditambahkan!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menambahkan transaksi', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Transaction, 'id' | 'user_id'>> }) =>
      dbService.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast('Transaksi berhasil diperbarui!', 'success');
      closeModal();
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal memperbarui transaksi', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dbService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      showToast('Transaksi berhasil dihapus!', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Gagal menghapus transaksi', 'error');
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

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);
  const paginatedTxs = filteredTxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const startItem = filteredTxs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredTxs.length);

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
        <div className="flex flex-wrap items-center gap-3">
          {/* CSV File Input (hidden) */}
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
          <label
            htmlFor="csv-upload"
            className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl transition-all shadow-sm cursor-pointer select-none"
            title="Import Transaksi dari file CSV"
          >
            <Upload size={14} className="text-violet-500 dark:text-violet-400" />
            Import CSV
          </label>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-lg glow-brand cursor-pointer"
          >
            <Plus size={14} />
            Tambah Transaksi
          </button>
        </div>
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
              onChange={(e) => {
                const newType = e.target.value;
                setFilterType(newType);
                if (newType !== 'all') {
                  const currentCat = categories.find(c => c.id === filterCategory);
                  if (currentCat && currentCat.type !== newType) {
                    setFilterCategory('all');
                  }
                }
              }}
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
              {categories
                .filter(c => filterType === 'all' || c.type === filterType)
                .map(c => (
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
          <>
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
                {paginatedTxs.map((tx) => (
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
                      <span className={`font-bold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'}`}>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-5 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
              <div className="text-slate-550 dark:text-slate-400">
                Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{startItem}</span> - <span className="font-bold text-slate-800 dark:text-slate-200">{endItem}</span> dari <span className="font-bold text-slate-800 dark:text-slate-200">{filteredTxs.length}</span> transaksi
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-300 dark:border-slate-800 hover:bg-slate-200/30 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-450 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="font-bold px-3 py-1 bg-slate-200/30 dark:bg-slate-800/40 border border-slate-300/30 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-300 dark:border-slate-800 hover:bg-slate-200/30 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-450 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-16">
            <FileText size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 text-sm">Tidak ada transaksi ditemukan yang cocok dengan kriteria.</p>
          </div>
        )}
      </div>

      {/* CSV Import Preview Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl glass-panel rounded-3xl border border-[var(--color-border)] p-6 bg-[var(--color-card)] shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Upload size={18} className="text-violet-500" />
                  Pratinjau Import CSV ({parsedTxs.length} Transaksi)
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Format Kolom: Tanggal (YYYY-MM-DD), Tipe (income/expense), Nominal, Wallet, Kategori, Catatan</p>
              </div>
              <button
                onClick={() => { setImportModalOpen(false); setParsedTxs([]); }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning info about defaulted mappings */}
            {parsedTxs.some(tx => tx.status === 'defaulted_wallet' || tx.status === 'defaulted_category') && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 text-xs text-amber-600 dark:text-amber-450 leading-normal">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-bold">Perhatian:</span> Beberapa nama Wallet atau Kategori tidak cocok dengan database Anda. Sistem secara otomatis mencocokkannya ke Wallet/Kategori default (bertanda <span className="font-semibold italic">Default</span>). Anda dapat membatalkannya atau melanjutkan dengan penyesuaian otomatis ini.
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-y-auto mb-6 border border-[var(--color-border)] rounded-2xl bg-[var(--color-input)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[9px] uppercase font-bold text-slate-500 tracking-wider sticky top-0 z-10">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Tipe</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850/40">
                  {parsedTxs.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/10">
                      <td className="py-3 px-4 font-bold">
                        {tx.status === 'valid' && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                            <Check size={10} /> Valid
                          </span>
                        )}
                        {tx.status === 'defaulted_wallet' && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10" title="Nama Wallet disesuaikan ke default">
                            <AlertTriangle size={10} /> Wallet Baru
                          </span>
                        )}
                        {tx.status === 'defaulted_category' && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10" title="Kategori disesuaikan ke default">
                            <AlertTriangle size={10} /> Kategori Baru
                          </span>
                        )}
                        {tx.status === 'invalid' && (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-455 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/15" title={tx.errorMsg}>
                            ✕ Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.transaction_date}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}>
                          {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-200">{formatIDR(tx.amount)}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-350">{tx.wallet_name}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-350">{tx.category_name}</td>
                      <td className="py-3 px-4 text-slate-550 dark:text-slate-400 truncate max-w-[150px]" title={tx.notes}>{tx.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500">
                Akan mengimport <span className="font-bold text-slate-700 dark:text-slate-300">{parsedTxs.filter(tx => tx.status !== 'invalid').length}</span> dari <span className="font-bold">{parsedTxs.length}</span> baris data.
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setImportModalOpen(false); setParsedTxs([]); }}
                  className="px-4 py-2 font-bold text-xs border border-slate-300 dark:border-slate-800 hover:bg-slate-200/30 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-450 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={importing || parsedTxs.filter(tx => tx.status !== 'invalid').length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 font-bold text-xs rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md glow-brand transition-all cursor-pointer disabled:opacity-50"
                >
                  {importing ? 'Mengimport...' : 'Konfirmasi Import'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
