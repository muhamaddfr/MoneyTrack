import { IDatabaseService } from './dbInterface';
import { MockDbService } from './mockDb';
import { SupabaseDbService } from './supabaseDb';

const hasSupabaseKeys = 
  !!import.meta.env.VITE_SUPABASE_URL && 
  !!import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL';

export const dbService: IDatabaseService = hasSupabaseKeys
  ? new SupabaseDbService()
  : new MockDbService();

console.log(`[FlowFin] Active database provider: ${dbService.provider.toUpperCase()}`);
