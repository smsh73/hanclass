import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '한국어학당 - AI 인터랙티브 학습',
  description: '말레이시아인을 위한 한국어 학습 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 서버 사이드에서 환경 변수 확인 (빌드 타임에 로깅)
  if (typeof window === 'undefined') {
    console.log('🔍 Server-side NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
  }

  return (
    <html lang="ko">
      <head>
        {/* 클라이언트 사이드에서 환경 변수 확인 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🔍 Client-side NEXT_PUBLIC_API_URL:', '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}');
              window.__API_URL__ = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}';
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

