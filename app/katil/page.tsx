'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuizifyLockup } from '@/components/shared'

export default function KatilPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 6) { setError('PIN 6 haneli olmalı'); return }
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/katil/${pin}`)
    if (!res.ok) {
      const { error: err } = await res.json()
      setError(err)
      setLoading(false)
      return
    }
    router.push(`/katil/${pin}`)
  }

  function handleNumpad(digit: string) {
    if (digit === '←') { setPin(p => p.slice(0, -1)); return }
    if (pin.length < 6) setPin(p => p + digit)
  }

  const numpadKeys = ['1','2','3','4','5','6','7','8','9','','0','←']

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between py-10 px-4"
      style={{ background: 'linear-gradient(160deg, #7c3aed 0%, #6366f1 50%, #4338ca 100%)' }}
    >
      {/* Logo */}
      <QuizifyLockup size={36} dark />

      {/* PIN display */}
      <div className="w-full max-w-xs text-center">
        <p className="text-white/70 text-sm font-medium mb-4 tracking-wider uppercase">Oyun PIN'i</p>
        <div className="flex gap-2 justify-center mb-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="w-11 h-14 rounded-xl flex items-center justify-center text-2xl font-black text-white transition-all"
              style={{
                background: pin[i] ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)',
                border: i === pin.length ? '2px solid rgba(255,255,255,0.8)' : '2px solid rgba(255,255,255,0.15)',
              }}
            >
              {pin[i] ?? ''}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-300 text-sm mt-2 bg-red-500/20 rounded-lg px-3 py-1.5">{error}</p>
        )}
      </div>

      {/* Numpad */}
      <div className="w-full max-w-xs">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {numpadKeys.map((k, i) => (
            k === '' ? <div key={i} /> : (
              <button
                key={i}
                onClick={() => handleNumpad(k)}
                className="h-14 rounded-2xl text-xl font-bold text-white transition-all active:scale-95"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                {k}
              </button>
            )
          ))}
        </div>

        <form onSubmit={handleJoin}>
          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="w-full h-14 rounded-2xl text-lg font-black text-indigo-700 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            {loading ? 'Kontrol ediliyor...' : 'Katıl →'}
          </button>
        </form>
      </div>
    </div>
  )
}
