import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '맘편한 외식 | 아이와 함께하는 백화점 맛집 가이드',
  description: '부모님들이 직접 검증한 아이와 가기 좋은 몰별 식당 정보를 확인하세요.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="max-w-[480px] mx-auto bg-white shadow-2xl min-h-screen relative">
        {children}
      </body>
    </html>
  )
}
