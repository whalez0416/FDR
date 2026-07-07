import './globals.css'
import type { Metadata, Viewport } from 'next'

const SITE_TITLE = '맘편한 외식 | 아이와 함께하는 백화점 맛집 가이드'
const SITE_DESCRIPTION =
  '부모님들이 직접 검증한 아이와 가기 좋은 몰별 식당 정보를 확인하세요. 유모차 진입·아기의자·수유실 정보를 한눈에.'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
  // 카카오톡·맘카페 등에 링크 공유 시 미리보기로 노출됨
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '맘편한 외식',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
  // 게시자 ID는 공개 정보(HTML에 그대로 노출됨)라 env 없이 하드코딩.
  const adsenseClient = 'ca-pub-1771198613739815'
  return (
    <html lang="ko">
      <head>
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="bg-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
