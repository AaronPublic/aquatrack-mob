import { Platform } from 'react-native';

// Pointing to host machine local IP address so both physical devices and emulators on the same Wi-Fi can connect
export const API_BASE_URL = Platform.select({
  android: 'http://192.168.254.101:3000',
  default: 'http://192.168.100.64:3000',
});

export const api = {
  get: async (endpoint) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API GET ${endpoint} failed:`, err);
      throw err;
    }
  },
  post: async (endpoint, body) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API POST ${endpoint} failed:`, err);
      throw err;
    }
  },
  put: async (endpoint, body) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API PUT ${endpoint} failed:`, err);
      throw err;
    }
  }
};
