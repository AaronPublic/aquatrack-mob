import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'supabase-storage' });

export const supabaseStorage = {
  getItem: (key) => {
    try {
      return storage.getString(key) ?? null;
    } catch (err) {
      console.error("MMKV getItem error:", err);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      storage.set(key, value);
    } catch (err) {
      console.error("MMKV setItem error:", err);
    }
  },
  removeItem: (key) => {
    try {
      storage.delete(key);
    } catch (err) {
      console.error("MMKV removeItem error:", err);
    }
  }
};
