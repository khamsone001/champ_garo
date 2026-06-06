import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, error };
};

export const signUp = async (email: string, password: string, username: string) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return { user: null, error: authError };

  if (authData.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username,
      rating: 1200,
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    });
    if (profileError) console.error('Profile creation error:', profileError);
  }
  return { user: authData.user, error: null };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
