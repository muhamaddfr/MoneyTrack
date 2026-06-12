/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { UserProfile } from '../services/db/types';
import { createClient } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  displayName: string;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfileName: (name: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load display name based on user
  const loadDisplayName = async (currentUser: UserProfile | null) => {
    if (!currentUser) {
      setDisplayName('');
      return;
    }

    if (dbService.provider === 'supabase') {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      
      if (sbUser?.user_metadata?.display_name) {
        setDisplayName(sbUser.user_metadata.display_name);
        return;
      }
    }

    // Fallback to localStorage for mock database or missing metadata
    const oldKey = `moneytrack_profile_name_${currentUser.id}`;
    const newKey = `flowfin_profile_name_${currentUser.id}`;
    const oldName = localStorage.getItem(oldKey);
    if (oldName && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, oldName);
    }
    const savedName = localStorage.getItem(newKey);
    setDisplayName(savedName || currentUser.email.split('@')[0]);
  };

  useEffect(() => {
    async function checkUser() {
      try {
        const currentUser = await dbService.getCurrentUser();
        setUser(currentUser);
        await loadDisplayName(currentUser);
      } catch (err) {
        console.error('Error fetching current user:', err);
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const res = await dbService.signIn(email, password);
    if (res.user) {
      setUser(res.user);
      await loadDisplayName(res.user);
    }
    setLoading(false);
    return { error: res.error };
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const res = await dbService.signUp(email, password);
    if (res.user) {
      setUser(res.user);
      await loadDisplayName(res.user);
    }
    setLoading(false);
    return { error: res.error };
  };

  const signOut = async () => {
    setLoading(true);
    await dbService.signOut();
    setUser(null);
    setDisplayName('');
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    return await dbService.resetPassword(email);
  };

  const updateProfileName = async (newName: string) => {
    if (!user) return { error: 'User tidak ditemukan.' };

    try {
      if (dbService.provider === 'supabase') {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { error } = await supabase.auth.updateUser({
          data: { display_name: newName }
        });

        if (error) return { error: error.message };
      }

      // Always save to localStorage as a fallback/mock sync
      localStorage.setItem(`flowfin_profile_name_${user.id}`, newName);
      setDisplayName(newName);
      return { error: null };
    } catch (e) {
      const err = e as Error;
      return { error: err.message || 'Gagal memperbarui profil.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, displayName, loading, signIn, signUp, signOut, resetPassword, updateProfileName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
