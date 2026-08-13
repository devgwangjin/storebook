import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'storebook - 프리미엄 가계부',
  description: '나만의 데이터를 안전하게 보관하는 프리미엄 다크 테마 로컬 & 클라우드 가계부',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
