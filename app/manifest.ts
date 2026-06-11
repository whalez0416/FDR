import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '맘편한 외식',
    short_name: '맘편한 외식',
    description: '아이와 함께하는 백화점·대형몰 식당 가이드 — 유모차·아기의자·수유실 정보',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FDF8F4',
    theme_color: '#FF8A5B',
    lang: 'ko',
    categories: ['food', 'lifestyle', 'travel'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
