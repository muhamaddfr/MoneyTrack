import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasSupabaseKeys = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL';

export const supabase: SupabaseClient | null = hasSupabaseKeys
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
