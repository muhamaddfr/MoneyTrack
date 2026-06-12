import { UserProfile, Wallet, Category, Transaction, Budget, FinancialGoal } from './types';

export interface AuthResponse {
  user: UserProfile | null;
  error: string | null;
}

export interface IDatabaseService {
  provider: 'mock' | 'supabase';

  // Authentication
  signUp(email: string, password: string): Promise<AuthResponse>;
  signIn(email: string, password: string): Promise<AuthResponse>;
  signOut(): Promise<{ error: string | null }>;
  getCurrentUser(): Promise<UserProfile | null>;
  resetPassword(email: string): Promise<{ error: string | null }>;
  deleteAccount(): Promise<{ error: string | null }>;
  signInWithGoogle(): Promise<AuthResponse>;
  verifyEmail(): Promise<{ error: string | null }>;
  linkGoogle(): Promise<{ error: string | null }>;
  unlinkGoogle(): Promise<{ error: string | null }>;

  // Wallets
  getWallets(): Promise<Wallet[]>;
  addWallet(name: string, balance: number): Promise<Wallet>;
  updateWallet(id: string, name: string, balance: number): Promise<Wallet>;
  deleteWallet(id: string): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  addCategory(name: string, type: 'income' | 'expense'): Promise<Category>;
  updateCategory(id: string, name: string, type: 'income' | 'expense'): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  addTransaction(transaction: Omit<Transaction, 'id' | 'user_id'>): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'user_id'>>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  addBudget(category_id: string, limit_amount: number, period: string): Promise<Budget>;
  updateBudget(id: string, limit_amount: number, period: string): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;

  // Financial Goals
  getFinancialGoals(): Promise<FinancialGoal[]>;
  addFinancialGoal(title: string, target_amount: number, current_amount: number, target_date: string): Promise<FinancialGoal>;
  updateFinancialGoal(id: string, title: string, target_amount: number, current_amount: number, target_date: string): Promise<FinancialGoal>;
  addGoalFunds(id: string, amount: number): Promise<FinancialGoal>;
  deleteFinancialGoal(id: string): Promise<void>;
}
