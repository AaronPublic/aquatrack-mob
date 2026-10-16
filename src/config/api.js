const rawUrl =
  process.env.EXPO_PUBLIC_API_URL || 'https://aquatrack-web-gilt.vercel.app';

export const API_BASE_URL = (rawUrl || '').replace(/\/+$/, '');

export const api = {
  get: async (endpoint) => {
    try {
      const sep = endpoint.includes('?') ? '&' : '?';
      const url = `${API_BASE_URL}${endpoint}${sep}t=${Date.now()}`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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
  },
  postFormData: async (endpoint, formData) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API postFormData ${endpoint} failed:`, err);
      throw err;
    }
  },
  delete: async (endpoint, body) => {
    try {
      const options = {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      };
      if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`API DELETE ${endpoint} failed:`, err);
      throw err;
    }
  }
};
