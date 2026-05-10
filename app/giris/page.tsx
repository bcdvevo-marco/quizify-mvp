'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QuizifyLockup, Btn } from '@/components/shared'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'giris' | 'kayit'>('giris')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'giris') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(140deg, #4338ca 0%, #6d28d9 60%, #312e81 100%)' }}
    >
      {/* Card */}
      <div
        className="w-full max-w-md bg-white rounded-3xl p-8"
        style={{ boxShadow: '0 32px 80px rgba(15,12,41,.28)' }}
      >
        <div className="flex justify-center mb-6">
          <QuizifyLockup size={40} />
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          {(['giris', 'kayit'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#4338ca' : '#94a3b8',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              }}
            >
              {m === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm"
            style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
          >
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'kayit' && (
            <input
              type="text"
              placeholder="Adın Soyadın"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors text-sm font-medium"
              required
            />
          )}
          <input
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors text-sm font-medium"
            required
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors text-sm font-medium"
            required
          />
          <Btn type="submit" kind="primary" size="lg" full loading={loading}>
            {mode === 'giris' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </Btn>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-400 text-xs">veya</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/></svg>
          Google ile devam et
        </button>
      </div>
    </div>
  )
}
