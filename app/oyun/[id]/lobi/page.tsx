'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import { Avatar, Btn, Icon, QuizifyLockup } from '@/components/shared'

interface SessionInfo {
  id: string
  pin: string
  status: string
  quizzes: { title: string }
  players: { id: string; nickname: string }[]
}

function PseudoQR({ value: _value }: { value: string }) {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const row = Math.floor(i / 21)
    const col = i % 21
    if (row < 7 && col < 7) return true
    if (row < 7 && col > 13) return true
    if (row > 13 && col < 7) return true
    return (i + row * col) % 3 === 0
  })
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(21, 1fr)',
        gap: 1,
        width: 120,
        height: 120,
        padding: 8,
        background: 'white',
        borderRadius: 12,
      }}
    >
      {cells.map((filled, i) => (
        <div key={i} style={{ background: filled ? '#0f0c29' : 'transparent', borderRadius: 1 }} />
      ))}
    </div>
  )
}

export default function LobiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [players, setPlayers] = useState<{ id: string; nickname: string }[]>([])
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { on } = useGameChannel(id)

  useEffect(() => {
    fetch(`/api/oyun/${id}`)
      .then(r => r.json())
      .then((data: SessionInfo) => {
        if (data.status === 'active') { router.replace(`/oyun/${id}/kontrol`); return }
        if (data.status === 'ended') { router.replace('/dashboard'); return }
        setSession(data)
        if (data.players?.length) setPlayers(data.players)
      })
      .catch(() => {})
  }, [id, router])

  useEffect(() => {
    const off = on('PLAYER_JOINED', (e) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === e.player_id)) return prev
        return [...prev, { id: e.player_id, nickname: e.nickname }]
      })
    })
    return off
  }, [on])

  async function handleStart() {
    await fetch(`/api/oyun/${id}/basla`, { method: 'POST' })
    await fetch(`/api/oyun/${id}/soru-basla`, { method: 'POST' })
    router.push(`/oyun/${id}/kontrol`)
  }

  function copyPin() {
    if (session?.pin) {
      navigator.clipboard.writeText(session.pin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen flex qf-game-bg">
      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* Logo */}
        <QuizifyLockup size={36} dark />

        {/* PIN display */}
        <div className="text-center">
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase mb-3">Oyun PIN'i</p>
          <div className="flex items-center gap-4">
            <span
              className="font-black text-white tracking-widest"
              style={{ fontSize: 96, lineHeight: 1, letterSpacing: '0.08em' }}
            >
              {session?.pin ?? '······'}
            </span>
            <button
              onClick={copyPin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/70 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={16} color={copied ? '#10b981' : 'currentColor'} />
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        </div>

        {/* Player grid */}
        <div className="w-full max-w-2xl">
          {players.length === 0 ? (
            <p className="text-white/40 text-center text-sm animate-pulse">Oyuncular katılmayı bekliyor...</p>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {players.map(p => (
                <div key={p.id} className="qf-pop-in flex flex-col items-center gap-1.5">
                  <Avatar name={p.nickname} size={44} />
                  <span className="text-white/80 text-xs font-semibold truncate w-full text-center">{p.nickname}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start button */}
        <Btn
          kind="success"
          size="xl"
          onClick={handleStart}
          disabled={players.length === 0}
        >
          Oyunu Başlat ({players.length} oyuncu)
        </Btn>
      </div>

      {/* QR sidebar */}
      <aside
        className="w-52 flex-none flex flex-col items-center justify-center gap-6 p-6"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}
      >
        <PseudoQR value={session?.pin ?? ''} />
        <div className="text-center">
          <p className="text-white/60 text-xs">quizify.app/katil</p>
          <p className="text-white/40 text-xs mt-1">veya PIN girin</p>
        </div>
      </aside>
    </div>
  )
}
