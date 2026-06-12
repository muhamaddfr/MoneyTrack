export interface UserProfile {
  id: string;
  email: string;
  email_verified?: boolean;
  google_linked?: boolean;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  created_at?: string;
}

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  notes: string;
  transaction_date: string;
  created_at?: string;
  // Joins for convenience in UI
  wallet_name?: string;
  category_name?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  limit_amount: number;
  period: string; // e.g., '2026-06' (monthly) or 'monthly'
  created_at?: string;
  // Joins
  category_name?: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  created_at?: string;
}
