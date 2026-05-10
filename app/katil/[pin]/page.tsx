'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QuizifyLockup, AnswerShape, ANS_META } from '@/components/shared'

interface Team { id: string; name: string; color: string }
interface SessionInfo { id: string; teams: Team[]; quizzes: { title: string } }

export default function NicknamePage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [nickname, setNickname] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/katil/${pin}`)
      .then(async r => {
        const data = await r.json()
        if (!r.ok) { setFetchError(data.error ?? 'Bir hata oluştu'); setFetching(false); return }
        setSession(data)
        setFetching(false)
      })
      .catch(() => { setFetchError('Bağlantı hatası'); setFetching(false) })
  }, [pin])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim() || !session) return
    setLoading(true)

    const res = await fetch('/api/oyuncu/katil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_session_id: session.id, nickname: nickname.trim(), team_id: selectedTeam }),
    })
    const data = await res.json()
    if (!res.ok) { setJoinError(data.error ?? 'Katılım başarısız'); setLoading(false); return }
    sessionStorage.setItem('player_id', data.player_id)
    sessionStorage.setItem('nickname', nickname.trim())
    router.push(`/oyna/${session.id}`)
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #7c3aed, #4338ca)' }}>
        <div className="text-white/60 text-sm animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  if (fetchError) {
    const isStarted = fetchError === 'Oyun zaten başladı'
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
        style={{ background: 'linear-gradient(160deg, #7c3aed, #4338ca)' }}>
        <div className="text-6xl">{isStarted ? '🏃' : '❌'}</div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-black mb-2">{fetchError}</h1>
          <p className="text-white/60 text-sm">
            {isStarted ? 'Bu oyuna artık katılamazsın.' : 'PIN yanlış veya oyun sona ermiş.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/katil')}
          className="px-6 py-3 rounded-2xl font-bold text-indigo-700 active:scale-95"
          style={{ background: 'white' }}
        >
          Farklı PIN Dene
        </button>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between py-10 px-4"
      style={{ background: 'linear-gradient(160deg, #7c3aed 0%, #6366f1 50%, #4338ca 100%)' }}
    >
      <div className="flex items-center gap-3 w-full max-w-xs">
        <button onClick={() => router.back()} className="text-white/60 hover:text-white transition-colors">
          ←
        </button>
        <QuizifyLockup size={28} dark />
      </div>

      <div className="w-full max-w-xs">
        <p className="text-white/60 text-sm text-center mb-1">{session?.quizzes?.title}</p>
        <h1 className="text-white text-2xl font-black text-center mb-6">Takmaadını gir</h1>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            placeholder="Takmaadın"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={20}
            autoFocus
            className="w-full text-center text-xl font-bold rounded-2xl px-5 py-4 text-white placeholder-white/40 focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.25)',
            }}
          />

          {session?.teams && session.teams.length > 0 && (
            <div>
              <p className="text-white/60 text-center text-sm mb-3">Takım seç</p>
              <div className="grid grid-cols-2 gap-3">
                {session.teams.map((team, i) => {
                  const meta = ANS_META[i % 4]
                  const isSelected = selectedTeam === team.id
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeam(isSelected ? null : team.id)}
                      className="rounded-xl py-3 px-4 font-bold text-white flex items-center gap-2 transition-all active:scale-95"
                      style={{
                        background: meta.bg,
                        outline: isSelected ? '3px solid white' : 'none',
                        outlineOffset: 2,
                        transform: isSelected ? 'scale(1.05)' : undefined,
                      }}
                    >
                      <AnswerShape kind={meta.shape} size={18} color="white" />
                      {team.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {joinError && <p className="text-red-300 text-sm text-center -mt-2">{joinError}</p>}

          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="w-full h-14 rounded-2xl text-lg font-black text-indigo-700 transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            {loading ? 'Katılınıyor...' : 'Oyuna Gir →'}
          </button>
        </form>
      </div>

      <div />
    </div>
  )
}
