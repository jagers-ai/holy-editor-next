import { SharePort } from '@/ports/share';

export const webShare: SharePort = {
  async share({ title, url, text }) {
    try {
      if (navigator.share) {
        await navigator.share({ title, url, text });
        return;
      }
      if (url) {
        await navigator.clipboard.writeText(url);
        return;
      }
      if (text) {
        await navigator.clipboard.writeText(text);
      }
    } catch (error) {
      console.warn('webShare failed', error);
    }
  },
};
