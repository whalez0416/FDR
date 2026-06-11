import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '맘편한 외식 | 아이와 함께하는 백화점 맛집 가이드',
  description: '부모님들이 직접 검증한 아이와 가기 좋은 몰별 식당 정보를 확인하세요.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '맘편한 외식',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF8A5B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
