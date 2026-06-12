import { IDatabaseService, AuthResponse } from './dbInterface';
import { UserProfile, Wallet, Category, Transaction, Budget, FinancialGoal } from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDbService implements IDatabaseService {
  provider: 'mock' | 'supabase' = 'mock';

  private getActiveUserId(): string {
    const userStr = localStorage.getItem('flowfin_current_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as UserProfile;
        return user.id;
      } catch {
        // ignore
      }
    }
    return 'default-user-id';
  }

  constructor() {
    this.migrateKeys();
    this.seedInitialData();
  }

  private migrateKeys() {
    const keys = ['categories', 'wallets', 'transactions', 'budgets', 'goals', 'registered_users', 'current_user'];
    keys.forEach(key => {
      const oldKey = `moneytrack_${key}`;
      const newKey = `flowfin_${key}`;
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldVal);
      }
    });
  }

  private seedInitialData() {
    const userId = 'default-user-id';
    
    // Seed Categories
    if (!localStorage.getItem('flowfin_categories')) {
      const defaultCategories: Category[] = [
        { id: 'cat-1', user_id: userId, name: 'Gaji', type: 'income' },
        { id: 'cat-2', user_id: userId, name: 'Freelance', type: 'income' },
        { id: 'cat-3', user_id: userId, name: 'Makan & Minum', type: 'expense' },
        { id: 'cat-4', user_id: userId, name: 'Transportasi', type: 'expense' },
        { id: 'cat-5', user_id: userId, name: 'Belanja', type: 'expense' },
        { id: 'cat-6', user_id: userId, name: 'Tagihan', type: 'expense' },
        { id: 'cat-7', user_id: userId, name: 'Hiburan', type: 'expense' },
        { id: 'cat-8', user_id: userId, name: 'Investasi', type: 'income' },
      ];
      localStorage.setItem('flowfin_categories', JSON.stringify(defaultCategories));
    }

    // Seed Wallets
    if (!localStorage.getItem('flowfin_wallets')) {
      const defaultWallets: Wallet[] = [
        { id: 'wal-1', user_id: userId, name: 'Tunai', balance: 1200000 },
        { id: 'wal-2', user_id: userId, name: 'BCA', balance: 8500000 },
        { id: 'wal-3', user_id: userId, name: 'OVO', balance: 350000 },
      ];
      localStorage.setItem('flowfin_wallets', JSON.stringify(defaultWallets));
    }

    // Seed Transactions
    if (!localStorage.getItem('flowfin_transactions')) {
      const now = new Date();
      const formatOffsetDate = (daysAgo: number) => {
        const d = new Date();
        d.setDate(now.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      };

      const defaultTransactions: Transaction[] = [
        {
          id: 'tx-1',
          user_id: userId,
          wallet_id: 'wal-2',
          category_id: 'cat-1',
          amount: 8000000,
          type: 'income',
          notes: 'Gaji bulanan kantor',
          transaction_date: formatOffsetDate(10),
        },
        {
          id: 'tx-2',
          user_id: userId,
          wallet_id: 'wal-1',
          category_id: 'cat-3',
          amount: 55000,
          type: 'expense',
          notes: 'Makan siang nasi padang',
          transaction_date: formatOffsetDate(1),
        },
        {
          id: 'tx-3',
          user_id: userId,
          wallet_id: 'wal-3',
          category_id: 'cat-4',
          amount: 25000,
          type: 'expense',
          notes: 'Gojek ke kantor',
          transaction_date: formatOffsetDate(2),
        },
        {
          id: 'tx-4',
          user_id: userId,
          wallet_id: 'wal-2',
          category_id: 'cat-6',
          amount: 350000,
          type: 'expense',
          notes: 'Tagihan wifi bulanan',
          transaction_date: formatOffsetDate(5),
        },
        {
          id: 'tx-5',
          user_id: userId,
          wallet_id: 'wal-2',
          category_id: 'cat-2',
          amount: 1500000,
          type: 'income',
          notes: 'Projek website landing page',
          transaction_date: formatOffsetDate(3),
        },
        {
          id: 'tx-6',
          user_id: userId,
          wallet_id: 'wal-1',
          category_id: 'cat-5',
          amount: 450000,
          type: 'expense',
          notes: 'Beli baju kaos baru',
          transaction_date: formatOffsetDate(4),
        },
        {
          id: 'tx-7',
          user_id: userId,
          wallet_id: 'wal-3',
          category_id: 'cat-7',
          amount: 120000,
          type: 'expense',
          notes: 'Tiket bioskop & popcorn',
          transaction_date: formatOffsetDate(0),
        },
      ];
      localStorage.setItem('flowfin_transactions', JSON.stringify(defaultTransactions));
    }

    // Seed Budgets
    if (!localStorage.getItem('flowfin_budgets')) {
      const defaultBudgets: Budget[] = [
        { id: 'bud-1', user_id: userId, category_id: 'cat-3', limit_amount: 1500000, period: new Date().toISOString().slice(0, 7) },
        { id: 'bud-2', user_id: userId, category_id: 'cat-4', limit_amount: 500000, period: new Date().toISOString().slice(0, 7) },
        { id: 'bud-3', user_id: userId, category_id: 'cat-5', limit_amount: 1000000, period: new Date().toISOString().slice(0, 7) },
      ];
      localStorage.setItem('flowfin_budgets', JSON.stringify(defaultBudgets));
    }

    // Seed Financial Goals
    if (!localStorage.getItem('flowfin_goals')) {
      const defaultGoals: FinancialGoal[] = [
        {
          id: 'goal-1',
          user_id: userId,
          title: 'Laptop Macbook Pro M3',
          target_amount: 25000000,
          current_amount: 10050000,
          target_date: '2026-12-31',
        },
        {
          id: 'goal-2',
          user_id: userId,
          title: 'Dana Darurat',
          target_amount: 10000000,
          current_amount: 4000000,
          target_date: '2026-09-30',
        },
      ];
      localStorage.setItem('flowfin_goals', JSON.stringify(defaultGoals));
    }
  }

  // --- Authentication ---
  async signUp(email: string, password: string): Promise<AuthResponse> {
    await delay(500);
    const usersStr = localStorage.getItem('flowfin_registered_users') || '[]';
    const users = JSON.parse(usersStr) as { email: string; password: string; id: string }[];
    
    if (users.find(u => u.email === email)) {
      return { user: null, error: 'Email sudah terdaftar!' };
    }

    const newUser = { id: 'usr-' + Math.random().toString(36).substr(2, 9), email, password };
    users.push(newUser);
    localStorage.setItem('flowfin_registered_users', JSON.stringify(users));

    const userProfile: UserProfile = { id: newUser.id, email: newUser.email };
    localStorage.setItem('flowfin_current_user', JSON.stringify(userProfile));
    
    // Seed new data for this specific user if desired (uses their ID)
    this.seedInitialData();

    return { user: userProfile, error: null };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    await delay(500);
    const usersStr = localStorage.getItem('flowfin_registered_users') || '[]';
    const users = JSON.parse(usersStr) as { email: string; password: string; id: string }[];
    
    // Always allow default login for quick testing
    if (email === 'admin@flowfin.com' && password === 'admin123') {
      const adminProfile = { id: 'default-user-id', email: 'admin@flowfin.com' };
      localStorage.setItem('flowfin_current_user', JSON.stringify(adminProfile));
      return { user: adminProfile, error: null };
    }

    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      return { user: null, error: 'Email atau password salah.' };
    }

    const userProfile: UserProfile = { id: found.id, email: found.email };
    localStorage.setItem('flowfin_current_user', JSON.stringify(userProfile));
    return { user: userProfile, error: null };
  }

  async signOut(): Promise<{ error: string | null }> {
    await delay(300);
    localStorage.removeItem('flowfin_current_user');
    return { error: null };
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const userStr = localStorage.getItem('flowfin_current_user');
    if (!userStr) return null;
    return JSON.parse(userStr) as UserProfile;
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    await delay(400);
    const usersStr = localStorage.getItem('flowfin_registered_users') || '[]';
    const users = JSON.parse(usersStr) as { email: string; password: string; id: string }[];
    const found = users.find(u => u.email === email);
    if (!found && email !== 'admin@flowfin.com') {
      return { error: 'Email tidak ditemukan.' };
    }
    return { error: null };
  }

  async deleteAccount(): Promise<{ error: string | null }> {
    await delay(500);
    const userId = this.getActiveUserId();
    
    try {
      // 1. Hapus profil nama
      localStorage.removeItem(`flowfin_profile_name_${userId}`);

      // 2. Hapus dari daftar user terdaftar
      const usersStr = localStorage.getItem('flowfin_registered_users') || '[]';
      const users = JSON.parse(usersStr) as { email: string; password: string; id: string }[];
      const updatedUsers = users.filter(u => u.id !== userId);
      if (updatedUsers.length === 0) {
        localStorage.removeItem('flowfin_registered_users');
      } else {
        localStorage.setItem('flowfin_registered_users', JSON.stringify(updatedUsers));
      }

      // 3. Hapus transaksi
      const txsStr = localStorage.getItem('flowfin_transactions') || '[]';
      const txs = JSON.parse(txsStr) as Transaction[];
      const updatedTxs = txs.filter(t => t.user_id !== userId);
      if (updatedTxs.length === 0) {
        localStorage.removeItem('flowfin_transactions');
      } else {
        localStorage.setItem('flowfin_transactions', JSON.stringify(updatedTxs));
      }

      // 4. Hapus anggaran
      const budgetsStr = localStorage.getItem('flowfin_budgets') || '[]';
      const budgets = JSON.parse(budgetsStr) as Budget[];
      const updatedBudgets = budgets.filter(b => b.user_id !== userId);
      if (updatedBudgets.length === 0) {
        localStorage.removeItem('flowfin_budgets');
      } else {
        localStorage.setItem('flowfin_budgets', JSON.stringify(updatedBudgets));
      }

      // 5. Hapus target tabungan
      const goalsStr = localStorage.getItem('flowfin_goals') || '[]';
      const goals = JSON.parse(goalsStr) as FinancialGoal[];
      const updatedGoals = goals.filter(g => g.user_id !== userId);
      if (updatedGoals.length === 0) {
        localStorage.removeItem('flowfin_goals');
      } else {
        localStorage.setItem('flowfin_goals', JSON.stringify(updatedGoals));
      }

      // 6. Hapus dompet
      const walletsStr = localStorage.getItem('flowfin_wallets') || '[]';
      const wallets = JSON.parse(walletsStr) as Wallet[];
      const updatedWallets = wallets.filter(w => w.user_id !== userId);
      if (updatedWallets.length === 0) {
        localStorage.removeItem('flowfin_wallets');
      } else {
        localStorage.setItem('flowfin_wallets', JSON.stringify(updatedWallets));
      }

      // 7. Hapus kategori
      const categoriesStr = localStorage.getItem('flowfin_categories') || '[]';
      const categories = JSON.parse(categoriesStr) as Category[];
      const updatedCategories = categories.filter(c => c.user_id !== userId);
      if (updatedCategories.length === 0) {
        localStorage.removeItem('flowfin_categories');
      } else {
        localStorage.setItem('flowfin_categories', JSON.stringify(updatedCategories));
      }

      // 8. Keluar dari sesi aktif
      localStorage.removeItem('flowfin_current_user');

      return { error: null };
    } catch (e) {
      const err = e as Error;
      return { error: err.message || 'Gagal menghapus akun.' };
    }
  }

  // --- Wallets ---
  async getWallets(): Promise<Wallet[]> {
    await delay(200);
    const walletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    const all = JSON.parse(walletsStr) as Wallet[];
    const userId = this.getActiveUserId();
    return all.filter(w => w.user_id === userId);
  }

  async addWallet(name: string, balance: number): Promise<Wallet> {
    await delay(200);
    const allWalletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    const all = JSON.parse(allWalletsStr) as Wallet[];

    const newWallet: Wallet = {
      id: 'wal-' + Math.random().toString(36).substr(2, 9),
      user_id: this.getActiveUserId(),
      name,
      balance,
    };
    all.push(newWallet);
    localStorage.setItem('flowfin_wallets', JSON.stringify(all));
    return newWallet;
  }

  async updateWallet(id: string, name: string, balance: number): Promise<Wallet> {
    await delay(200);
    const allWalletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    let all = JSON.parse(allWalletsStr) as Wallet[];
    
    let updatedWallet: Wallet | null = null;
    all = all.map(w => {
      if (w.id === id) {
        updatedWallet = { ...w, name, balance };
        return updatedWallet;
      }
      return w;
    });

    if (!updatedWallet) throw new Error('Wallet tidak ditemukan.');
    localStorage.setItem('flowfin_wallets', JSON.stringify(all));
    return updatedWallet;
  }

  async deleteWallet(id: string): Promise<void> {
    await delay(200);
    const allWalletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    const all = JSON.parse(allWalletsStr) as Wallet[];
    const filtered = all.filter(w => w.id !== id);
    localStorage.setItem('flowfin_wallets', JSON.stringify(filtered));
  }

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    await delay(100);
    const categoriesStr = localStorage.getItem('flowfin_categories') || '[]';
    const all = JSON.parse(categoriesStr) as Category[];
    const userId = this.getActiveUserId();
    return all.filter(c => c.user_id === userId);
  }

  async addCategory(name: string, type: 'income' | 'expense'): Promise<Category> {
    await delay(150);
    const allCategoriesStr = localStorage.getItem('flowfin_categories') || '[]';
    const all = JSON.parse(allCategoriesStr) as Category[];

    const newCategory: Category = {
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      user_id: this.getActiveUserId(),
      name,
      type,
    };
    all.push(newCategory);
    localStorage.setItem('flowfin_categories', JSON.stringify(all));
    return newCategory;
  }

  async updateCategory(id: string, name: string, type: 'income' | 'expense'): Promise<Category> {
    await delay(150);
    const allCategoriesStr = localStorage.getItem('flowfin_categories') || '[]';
    let all = JSON.parse(allCategoriesStr) as Category[];

    let updated: Category | null = null;
    all = all.map(c => {
      if (c.id === id) {
        updated = { ...c, name, type };
        return updated;
      }
      return c;
    });

    if (!updated) throw new Error('Kategori tidak ditemukan.');
    localStorage.setItem('flowfin_categories', JSON.stringify(all));
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    await delay(150);
    const allCategoriesStr = localStorage.getItem('flowfin_categories') || '[]';
    const all = JSON.parse(allCategoriesStr) as Category[];
    const filtered = all.filter(c => c.id !== id);
    localStorage.setItem('flowfin_categories', JSON.stringify(filtered));
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    await delay(250);
    const txsStr = localStorage.getItem('flowfin_transactions') || '[]';
    const allTxs = JSON.parse(txsStr) as Transaction[];
    const userId = this.getActiveUserId();
    const userTxs = allTxs.filter(t => t.user_id === userId);
    
    // Fetch categories and wallets for names
    const wallets = await this.getWallets();
    const categories = await this.getCategories();

    return userTxs.map(t => ({
      ...t,
      wallet_name: wallets.find(w => w.id === t.wallet_id)?.name || 'Unknown Wallet',
      category_name: categories.find(c => c.id === t.category_id)?.name || 'Unknown Category',
    }));
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'user_id'>): Promise<Transaction> {
    await delay(300);
    const allTxsStr = localStorage.getItem('flowfin_transactions') || '[]';
    const all = JSON.parse(allTxsStr) as Transaction[];
    const userId = this.getActiveUserId();

    const newTx: Transaction = {
      ...transaction,
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
    };

    all.push(newTx);
    localStorage.setItem('flowfin_transactions', JSON.stringify(all));

    // Update wallet balance
    const walletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    const wallets = JSON.parse(walletsStr) as Wallet[];
    const updatedWallets = wallets.map(w => {
      if (w.id === transaction.wallet_id) {
        const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        return { ...w, balance: w.balance + delta };
      }
      return w;
    });
    localStorage.setItem('flowfin_wallets', JSON.stringify(updatedWallets));

    return newTx;
  }

  async updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'user_id'>>): Promise<Transaction> {
    await delay(300);
    const allTxsStr = localStorage.getItem('flowfin_transactions') || '[]';
    let all = JSON.parse(allTxsStr) as Transaction[];
    const walletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    let wallets = JSON.parse(walletsStr) as Wallet[];

    const oldTx = all.find(t => t.id === id);
    if (!oldTx) throw new Error('Transaksi tidak ditemukan.');

    // Reverse old wallet change
    wallets = wallets.map(w => {
      if (w.id === oldTx.wallet_id) {
        const delta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
        return { ...w, balance: w.balance + delta };
      }
      return w;
    });

    let updatedTx: Transaction | null = null;
    all = all.map(t => {
      if (t.id === id) {
        updatedTx = { ...t, ...transaction };
        return updatedTx;
      }
      return t;
    });

    if (!updatedTx) throw new Error('Gagal memperbarui transaksi.');

    // Apply new wallet change
    const newTx = updatedTx as Transaction;
    wallets = wallets.map(w => {
      if (w.id === newTx.wallet_id) {
        const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
        return { ...w, balance: w.balance + delta };
      }
      return w;
    });

    localStorage.setItem('flowfin_transactions', JSON.stringify(all));
    localStorage.setItem('flowfin_wallets', JSON.stringify(wallets));
    return newTx;
  }

  async deleteTransaction(id: string): Promise<void> {
    await delay(250);
    const allTxsStr = localStorage.getItem('flowfin_transactions') || '[]';
    const all = JSON.parse(allTxsStr) as Transaction[];
    const walletsStr = localStorage.getItem('flowfin_wallets') || '[]';
    let wallets = JSON.parse(walletsStr) as Wallet[];

    const txToDelete = all.find(t => t.id === id);
    if (!txToDelete) throw new Error('Transaksi tidak ditemukan.');

    // Reverse wallet impact
    wallets = wallets.map(w => {
      if (w.id === txToDelete.wallet_id) {
        const delta = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
        return { ...w, balance: w.balance + delta };
      }
      return w;
    });

    const filtered = all.filter(t => t.id !== id);
    
    localStorage.setItem('flowfin_transactions', JSON.stringify(filtered));
    localStorage.setItem('flowfin_wallets', JSON.stringify(wallets));
  }

  // --- Budgets ---
  async getBudgets(): Promise<Budget[]> {
    await delay(200);
    const budgetsStr = localStorage.getItem('flowfin_budgets') || '[]';
    const all = JSON.parse(budgetsStr) as Budget[];
    const userId = this.getActiveUserId();
    const userBudgets = all.filter(b => b.user_id === userId);
    
    const categories = await this.getCategories();
    return userBudgets.map(b => ({
      ...b,
      category_name: categories.find(c => c.id === b.category_id)?.name || 'Unknown Category',
    }));
  }

  async addBudget(category_id: string, limit_amount: number, period: string): Promise<Budget> {
    await delay(200);
    const allBudgetsStr = localStorage.getItem('flowfin_budgets') || '[]';
    const all = JSON.parse(allBudgetsStr) as Budget[];
    const userId = this.getActiveUserId();

    const newBudget: Budget = {
      id: 'bud-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      category_id,
      limit_amount,
      period,
    };
    all.push(newBudget);
    localStorage.setItem('flowfin_budgets', JSON.stringify(all));
    return newBudget;
  }

  async updateBudget(id: string, limit_amount: number, period: string): Promise<Budget> {
    await delay(200);
    const allBudgetsStr = localStorage.getItem('flowfin_budgets') || '[]';
    let all = JSON.parse(allBudgetsStr) as Budget[];

    let updated: Budget | null = null;
    all = all.map(b => {
      if (b.id === id) {
        updated = { ...b, limit_amount, period };
        return updated;
      }
      return b;
    });

    if (!updated) throw new Error('Budget tidak ditemukan.');
    localStorage.setItem('flowfin_budgets', JSON.stringify(all));
    return updated;
  }

  async deleteBudget(id: string): Promise<void> {
    await delay(150);
    const allBudgetsStr = localStorage.getItem('flowfin_budgets') || '[]';
    const all = JSON.parse(allBudgetsStr) as Budget[];
    const filtered = all.filter(b => b.id !== id);
    localStorage.setItem('flowfin_budgets', JSON.stringify(filtered));
  }

  // --- Financial Goals ---
  async getFinancialGoals(): Promise<FinancialGoal[]> {
    await delay(200);
    const goalsStr = localStorage.getItem('flowfin_goals') || '[]';
    const all = JSON.parse(goalsStr) as FinancialGoal[];
    const userId = this.getActiveUserId();
    return all.filter(g => g.user_id === userId);
  }

  async addFinancialGoal(title: string, target_amount: number, current_amount: number, target_date: string): Promise<FinancialGoal> {
    await delay(200);
    const allGoalsStr = localStorage.getItem('flowfin_goals') || '[]';
    const all = JSON.parse(allGoalsStr) as FinancialGoal[];
    const userId = this.getActiveUserId();

    const newGoal: FinancialGoal = {
      id: 'goal-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      target_amount,
      current_amount,
      target_date,
    };
    all.push(newGoal);
    localStorage.setItem('flowfin_goals', JSON.stringify(all));
    return newGoal;
  }

  async updateFinancialGoal(id: string, title: string, target_amount: number, current_amount: number, target_date: string): Promise<FinancialGoal> {
    await delay(200);
    const allGoalsStr = localStorage.getItem('flowfin_goals') || '[]';
    let all = JSON.parse(allGoalsStr) as FinancialGoal[];

    let updated: FinancialGoal | null = null;
    all = all.map(g => {
      if (g.id === id) {
        updated = { ...g, title, target_amount, current_amount, target_date };
        return updated;
      }
      return g;
    });

    if (!updated) throw new Error('Goal tidak ditemukan.');
    localStorage.setItem('flowfin_goals', JSON.stringify(all));
    return updated;
  }

  async addGoalFunds(id: string, amount: number): Promise<FinancialGoal> {
    await delay(200);
    const allGoalsStr = localStorage.getItem('flowfin_goals') || '[]';
    let all = JSON.parse(allGoalsStr) as FinancialGoal[];

    let updated: FinancialGoal | null = null;
    all = all.map(g => {
      if (g.id === id) {
        updated = { ...g, current_amount: g.current_amount + amount };
        return updated;
      }
      return g;
    });

    if (!updated) throw new Error('Goal tidak ditemukan.');
    localStorage.setItem('flowfin_goals', JSON.stringify(all));
    return updated;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    await delay(150);
    const allGoalsStr = localStorage.getItem('flowfin_goals') || '[]';
    const all = JSON.parse(allGoalsStr) as FinancialGoal[];
    const filtered = all.filter(g => g.id !== id);
    localStorage.setItem('flowfin_goals', JSON.stringify(filtered));
  }
}
