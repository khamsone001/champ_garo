import { create } from 'zustand';
import { supabase, signIn, signUp, signOut } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  username: string | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, username: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  username: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      set({ user, username: profile?.username ?? null, loading: false, initialized: true });
    } else {
      set({ loading: false, initialized: true });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();
        set({ user: session.user, username: profile?.username ?? null });
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, username: null });
      }
    });
  },

  login: async (email, password) => {
    const { user, error } = await signIn(email, password);
    if (error) return error.message;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      set({ user, username: profile?.username ?? null });
    }
    return null;
  },

  register: async (email, password, username) => {
    const { error } = await signUp(email, password, username);
    if (error) return error.message;
    return null;
  },

  logout: async () => {
    await signOut();
    set({ user: null, username: null });
  },
}));
