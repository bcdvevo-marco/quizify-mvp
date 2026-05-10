'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QuizifyLockup, Btn, useToast } from '@/components/shared'

export default function SifreSifirlaPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setError('Geçersiz veya süresi dolmuş sıfırlama bağlantısı')
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return }

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    toast.show('Şifren güncellendi', 'success')
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(140deg, #1e1b4b 0%, #0f0c29 100%)' }}
    >
      <div className="mb-8">
        <QuizifyLockup size={36} dark />
      </div>

      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h1 className="text-white text-2xl font-black mb-2">Yeni şifre belirle</h1>
        <p className="text-white/60 text-sm mb-6">Hesabın için yeni bir şifre gir</p>

        {!ready && error ? (
          <>
            <p className="text-red-300 text-sm text-center mb-6">{error}</p>
            <Btn kind="primary" full onClick={() => router.push('/giris')}>
              Giriş sayfasına dön
            </Btn>
          </>
        ) : !ready ? (
          <p className="text-white/60 text-sm text-center animate-pulse">Bağlantı doğrulanıyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Yeni şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              minLength={6}
              required
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <input
              type="password"
              placeholder="Yeni şifre (tekrar)"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              minLength={6}
              required
              className="w-full rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />

            {error && <p className="text-red-300 text-sm text-center">{error}</p>}

            <Btn kind="primary" full type="submit" disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </Btn>
          </form>
        )}
      </div>
    </div>
  )
}
