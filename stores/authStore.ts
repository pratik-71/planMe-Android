import {create} from 'zustand';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {GoogleSignin} = require('@react-native-google-signin/google-signin');

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

const SUPABASE_URL = 'https://lmookidxihtttfzodbvf.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtb29raWR4aWh0dHRmem9kYnZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzUxMDAsImV4cCI6MjA3MjgxMTEwMH0.1pFnwEKQDwDmHEKrBMYUilYDOlzR1eo5Vdn2p-wI-Ro';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: AsyncStorage,
    debug: false,
  },
});

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  isLoading: true,
  setUser: user => set({user}),
  setLoading: isLoading => set({isLoading}),
  init: async () => {
    try {
      const {data, error} = await supabase.auth.getUser();
      if (error || !data?.user) {
        set({user: null});
      } else {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || '',
            name: undefined,
            avatar_url: data.user.user_metadata?.avatar_url,
          },
        });
      }
    } finally {
      set({isLoading: false});
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            name: undefined,
            avatar_url: session.user.user_metadata?.avatar_url,
          },
        });
      } else {
        set({user: null});
      }
      set({isLoading: false});
    });

    // Optional: return unsubscribe function via store method if needed
    // listener.subscription.unsubscribe();
  },
  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {}
    await supabase.auth.signOut();
    set({user: null});
  },
}));
