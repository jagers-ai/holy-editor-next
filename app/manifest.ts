import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => ({
  name: '홀리해빗',
  short_name: '홀리해빗',
  description: '나만의 AI 신앙생활 파트너 : 홀리해빗',
  start_url: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#ffcc00',
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/favicon.ico',
      sizes: '16x16 32x32 48x48 64x64',
      type: 'image/x-icon',
    },
  ],
});

export default manifest;
