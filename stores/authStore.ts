import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
const {GoogleSignin} = require('@react-native-google-signin/google-signin');

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

const AUTH_STORAGE_KEY = '@planme_auth_user';

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
  setUser: async (user: AuthUser | null) => {
    set({user});
    if (user) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },
  setLoading: isLoading => set({isLoading}),
  init: async () => {
    try {
      // Load user from AsyncStorage
      const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        set({user: JSON.parse(storedUser)});
      } else {
        set({user: null});
      }
    } catch (error) {
      set({user: null});
    } finally {
      set({isLoading: false});
    }
  },
  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {}
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({user: null});
  },
}));
