import { KeyValueStore } from '@/ports/storage';

export const localStorageStore: KeyValueStore = {
  async get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.get failed', error);
      return null;
    }
  },
  async set(key, val) {
    try {
      window.localStorage.setItem(key, val);
    } catch (error) {
      console.warn('localStorage.set failed', error);
    }
  },
  async remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage.remove failed', error);
    }
  },
};
