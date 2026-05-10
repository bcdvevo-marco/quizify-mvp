import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ToastProvider, OfflineBanner } from '@/components/shared'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Quizify — Gerçek Zamanlı Quiz Platformu',
  description: 'Kahoot gibi canlı quiz deneyimi. Host quiz oluştur, oyuncular PIN ile katılsın.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ fontFamily: 'var(--font-jakarta, var(--font-body))' }}>
        <ToastProvider>
          <OfflineBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
