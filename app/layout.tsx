import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'storebook - 가계부 아님',
  description: '나만의 데이터를 안전하게 보관하는 다크 테마 로컬 & 클라우드 가계부였던것',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
