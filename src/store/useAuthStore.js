import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { supabase } from '../config/supabase';
import { api } from '../config/api';

const authStorage = new MMKV({ id: 'auth-store' });

const customStorage = {
  getItem: (name) => {
    return authStorage.getString(name) ?? null;
  },
  setItem: (name, value) => {
    authStorage.set(name, value);
  },
  removeItem: (name) => {
    authStorage.delete(name);
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      session: null,
      profile: null,
      loading: false,
      error: null,

      setSession: (session) => {
        set({ session });
      },

      fetchProfile: async (userId) => {
        set({ loading: true, error: null });
        try {
          const profile = await api.post('/api/auth/profile', { userId });
          if (profile) {
            set({ profile, loading: false });
            return profile;
          } else {
            set({ profile: null, loading: false, error: 'Could not fetch profile' });
            return null;
          }
        } catch (err) {
          console.error("fetchProfile store error:", err);
          set({ profile: null, loading: false, error: err.message });
          return null;
        }
      },

      signOut: async () => {
        set({ loading: true, error: null });
        try {
          await supabase.auth.signOut();
          set({ session: null, profile: null, loading: false });
        } catch (err) {
          console.error("signOut store error:", err);
          set({ session: null, profile: null, loading: false, error: err.message });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({ session: state.session, profile: state.profile }),
    }
  )
);
