import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IDatabaseService, AuthResponse } from './dbInterface';
import { UserProfile, Wallet, Category, Transaction, Budget, FinancialGoal } from './types';

export class SupabaseDbService implements IDatabaseService {
  provider: 'mock' | 'supabase' = 'supabase';
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Helper to get active user ID
  private async getUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User tidak terautentikasi.');
    return user.id;
  }

  // --- Authentication ---
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      const isGoogle = data.user.app_metadata?.provider === 'google';
      return {
        user: { 
          id: data.user.id, 
          email: data.user.email || '',
          email_verified: !!data.user.email_confirmed_at || !!data.user.confirmed_at || isGoogle
        },
        error: null,
      };
    }

    return { user: null, error: 'Pendaftaran gagal.' };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user) {
      const isGoogle = data.user.app_metadata?.provider === 'google';
      return {
        user: { 
          id: data.user.id, 
          email: data.user.email || '',
          email_verified: !!data.user.email_confirmed_at || !!data.user.confirmed_at || isGoogle
        },
        error: null,
      };
    }

    return { user: null, error: 'Login gagal.' };
  }

  async signOut(): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signOut();
    return { error: error ? error.message : null };
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;
    const isGoogle = user.app_metadata?.provider === 'google';
    const googleLinked = user.identities?.some(id => id.provider === 'google') || isGoogle;
    return { 
      id: user.id, 
      email: user.email || '', 
      email_verified: !!user.email_confirmed_at || !!user.confirmed_at || isGoogle,
      google_linked: googleLinked
    };
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    return { error: error ? error.message : null };
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) return { user: null, error: error.message };
    return { user: null, error: null };
  }

  async verifyEmail(): Promise<{ error: string | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      if (!user) return { error: 'Sesi tidak ditemukan.' };

      const isGoogle = user.app_metadata?.provider === 'google';
      const isConfirmed = !!user.email_confirmed_at || !!user.confirmed_at || isGoogle;
      if (!isConfirmed) {
        return { error: 'Email belum diverifikasi. Silakan cek kotak masuk email Anda.' };
      }
      return { error: null };
    } catch (e) {
      const err = e as Error;
      return { error: err.message || 'Gagal memverifikasi email.' };
    }
  }

  async deleteAccount(): Promise<{ error: string | null }> {
    try {
      const userId = await this.getUserId();
      
      // Panggil RPC database untuk menghapus user dari auth.users secara aman
      const { error: rpcErr } = await this.supabase.rpc('delete_user_account');
      
      if (rpcErr) {
        // Jika fungsi RPC belum dipasang di Supabase Editor, jalankan fallback penghapusan data manual di client
        console.warn('RPC delete_user_account tidak ditemukan di database. Menjalankan fallback...', rpcErr);
        
        const { error: txErr } = await this.supabase.from('transactions').delete().eq('user_id', userId);
        if (txErr) throw txErr;

        const { error: budgetErr } = await this.supabase.from('budgets').delete().eq('user_id', userId);
        if (budgetErr) throw budgetErr;

        const { error: goalErr } = await this.supabase.from('financial_goals').delete().eq('user_id', userId);
        if (goalErr) throw goalErr;

        const { error: walletErr } = await this.supabase.from('wallets').delete().eq('user_id', userId);
        if (walletErr) throw walletErr;

        const { error: categoryErr } = await this.supabase.from('categories').delete().eq('user_id', userId);
        if (categoryErr) throw categoryErr;
      }

      // Keluar dari sesi autentikasi Supabase
      const { error: signOutError } = await this.supabase.auth.signOut();
      if (signOutError) return { error: signOutError.message };

      return { error: null };
    } catch (e) {
      const err = e as Error;
      return { error: err.message || 'Gagal menghapus akun.' };
    }
  }

  async linkGoogle(): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/settings'
      }
    });
    return { error: error ? error.message : null };
  }

  async unlinkGoogle(): Promise<{ error: string | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      if (!user) return { error: 'Sesi tidak ditemukan.' };

      const googleIdentity = user.identities?.find(id => id.provider === 'google');
      if (!googleIdentity) return { error: 'Google tidak terhubung.' };

      const { error: unlinkError } = await this.supabase.auth.unlinkIdentity(googleIdentity);
      if (unlinkError) throw unlinkError;

      return { error: null };
    } catch (e) {
      const err = e as Error;
      return { error: err.message || 'Gagal memutuskan hubungan Google.' };
    }
  }

  // --- Wallets ---
  async getWallets(): Promise<Wallet[]> {
    const { data, error } = await this.supabase
      .from('wallets')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async addWallet(name: string, balance: number): Promise<Wallet> {
    const userId = await this.getUserId();
    const { data, error } = await this.supabase
      .from('wallets')
      .insert({ name, balance, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateWallet(id: string, name: string, balance: number): Promise<Wallet> {
    const { data, error } = await this.supabase
      .from('wallets')
      .update({ name, balance })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteWallet(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('wallets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- Categories ---
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  }

  async addCategory(name: string, type: 'income' | 'expense'): Promise<Category> {
    const userId = await this.getUserId();
    const { data, error } = await this.supabase
      .from('categories')
      .insert({ name, type, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, name: string, type: 'income' | 'expense'): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .update({ name, type })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select(`
        *,
        wallets (name),
        categories (name)
      `)
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((t) => {
      const item = t as unknown as { wallets: { name: string } | null; categories: { name: string } | null } & Record<string, unknown>;
      return {
        ...item,
        wallet_name: item.wallets?.name || 'Unknown Wallet',
        category_name: item.categories?.name || 'Unknown Category',
      } as unknown as Transaction;
    });
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'user_id'>): Promise<Transaction> {
    const userId = await this.getUserId();

    // Begin updates in code
    const { data: newTx, error: txError } = await this.supabase
      .from('transactions')
      .insert({ ...transaction, user_id: userId })
      .select()
      .single();

    if (txError) throw txError;

    // Update wallet balance
    const { data: wallet, error: walletGetError } = await this.supabase
      .from('wallets')
      .select('balance')
      .eq('id', transaction.wallet_id)
      .single();

    if (!walletGetError && wallet) {
      const delta = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      await this.supabase
        .from('wallets')
        .update({ balance: wallet.balance + delta })
        .eq('id', transaction.wallet_id);
    }

    return newTx;
  }

  async updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'user_id'>>): Promise<Transaction> {
    // Get the old transaction
    const { data: oldTx, error: getOldError } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (getOldError) throw getOldError;

    // Update the transaction
    const { data: updatedTx, error: updateError } = await this.supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Balance sync: reverse old, apply new
    const finalTx = updatedTx as Transaction;
    
    // Reverse old
    const { data: oldWallet } = await this.supabase
      .from('wallets')
      .select('balance')
      .eq('id', oldTx.wallet_id)
      .single();
    if (oldWallet) {
      const reverseDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
      await this.supabase
        .from('wallets')
        .update({ balance: oldWallet.balance + reverseDelta })
        .eq('id', oldTx.wallet_id);
    }

    // Apply new
    const { data: newWallet } = await this.supabase
      .from('wallets')
      .select('balance')
      .eq('id', finalTx.wallet_id)
      .single();
    if (newWallet) {
      const applyDelta = finalTx.type === 'income' ? finalTx.amount : -finalTx.amount;
      await this.supabase
        .from('wallets')
        .update({ balance: newWallet.balance + applyDelta })
        .eq('id', finalTx.wallet_id);
    }

    return finalTx;
  }

  async deleteTransaction(id: string): Promise<void> {
    // Get transaction to delete
    const { data: txToDelete, error: getTxError } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (getTxError) throw getTxError;

    // Delete transaction
    const { error: deleteError } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Adjust wallet balance
    const { data: wallet } = await this.supabase
      .from('wallets')
      .select('balance')
      .eq('id', txToDelete.wallet_id)
      .single();

    if (wallet) {
      const delta = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
      await this.supabase
        .from('wallets')
        .update({ balance: wallet.balance + delta })
        .eq('id', txToDelete.wallet_id);
    }
  }

  // --- Budgets ---
  async getBudgets(): Promise<Budget[]> {
    const { data, error } = await this.supabase
      .from('budgets')
      .select(`
        *,
        categories (name)
      `);
    if (error) throw error;
    return (data || []).map((b) => {
      const item = b as unknown as { categories: { name: string } | null } & Record<string, unknown>;
      return {
        ...item,
        category_name: item.categories?.name || 'Unknown Category',
      } as unknown as Budget;
    });
  }

  async addBudget(category_id: string, limit_amount: number, period: string): Promise<Budget> {
    const userId = await this.getUserId();
    const { data, error } = await this.supabase
      .from('budgets')
      .insert({ category_id, limit_amount, period, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateBudget(id: string, limit_amount: number, period: string): Promise<Budget> {
    const { data, error } = await this.supabase
      .from('budgets')
      .update({ limit_amount, period })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBudget(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('budgets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // --- Financial Goals ---
  async getFinancialGoals(): Promise<FinancialGoal[]> {
    const { data, error } = await this.supabase
      .from('financial_goals')
      .select('*')
      .order('target_date');
    if (error) throw error;
    return data || [];
  }

  async addFinancialGoal(title: string, target_amount: number, current_amount: number, target_date: string): Promise<FinancialGoal> {
    const userId = await this.getUserId();
    const { data, error } = await this.supabase
      .from('financial_goals')
      .insert({ title, target_amount, current_amount, target_date, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateFinancialGoal(id: string, title: string, target_amount: number, current_amount: number, target_date: string): Promise<FinancialGoal> {
    const { data, error } = await this.supabase
      .from('financial_goals')
      .update({ title, target_amount, current_amount, target_date })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async addGoalFunds(id: string, amount: number): Promise<FinancialGoal> {
    const { data: goal, error: getError } = await this.supabase
      .from('financial_goals')
      .select('current_amount')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;

    const { data, error } = await this.supabase
      .from('financial_goals')
      .update({ current_amount: goal.current_amount + amount })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFinancialGoal(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('financial_goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
