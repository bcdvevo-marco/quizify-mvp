'use client'
import { useEffect } from 'react'
import { Btn } from '@/components/shared'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      style={{ background: 'linear-gradient(140deg, #1e1b4b 0%, #0f0c29 100%)' }}>
      <div className="text-6xl">⚠️</div>
      <div className="text-center">
        <h1 className="text-white text-2xl font-black mb-2">Bir hata oluştu</h1>
        <p className="text-white/50 text-sm max-w-xs">{error.message || 'Beklenmeyen bir hata meydana geldi.'}</p>
      </div>
      <div className="flex gap-3">
        <Btn kind="primary" onClick={reset}>Tekrar Dene</Btn>
        <Btn kind="glass" onClick={() => window.location.href = '/'}>Ana Sayfa</Btn>
      </div>
    </div>
  )
}
