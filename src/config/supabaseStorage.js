import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabaseStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.error("AsyncStorage getItem error:", err);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.error("AsyncStorage setItem error:", err);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.error("AsyncStorage removeItem error:", err);
    }
  }
};
