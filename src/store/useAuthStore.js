import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { api } from '../config/api';

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ session: state.session, profile: state.profile }),
    }
  )
);
