import { KeyValueStore } from '@/ports/storage';

export const localStorageStore: KeyValueStore = {
  async get(key) {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  async set(key, val) {
    try { window.localStorage.setItem(key, val); } catch {}
  },
  async remove(key) {
    try { window.localStorage.removeItem(key); } catch {}
  },
};

