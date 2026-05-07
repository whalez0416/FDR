import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mall Gourmet & Kids | 아이와 함께하는 맛집 찾기',
  description: '백화점, 아울렛 내 아이와 가기 좋은 식당 정보를 확인하세요.',
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
