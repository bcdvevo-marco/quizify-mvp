'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function YeniQuizPage() {
  const router = useRouter()

  useEffect(() => {
    async function createAndRedirect() {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Yeni Quiz' }),
      })
      const data = await res.json()
      if (data.id) {
        router.replace(`/quiz/${data.id}/duzenle`)
      } else {
        router.replace('/dashboard')
      }
    }
    createAndRedirect()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 animate-pulse">Quiz oluşturuluyor...</p>
    </div>
  )
}
