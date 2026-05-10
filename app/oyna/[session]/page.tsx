'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import { Avatar, QuizifyLockup } from '@/components/shared'

export default function WaitingPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const [players, setPlayers] = useState<{ id: string; nickname: string }[]>([])
  const router = useRouter()
  const { on } = useGameChannel(session)

  const nickname = typeof window !== 'undefined' ? sessionStorage.getItem('nickname') ?? '' : ''

  useEffect(() => {
    const playerId = sessionStorage.getItem('player_id')
    if (!playerId) return
    const handleUnload = () => {
      navigator.sendBeacon(`/api/oyuncu/ayril`, JSON.stringify({ game_session_id: session, player_id: playerId }))
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [session])

  useEffect(() => {
    const off1 = on('PLAYER_JOINED', (e) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === e.player_id)) return prev
        return [...prev, { id: e.player_id, nickname: e.nickname }]
      })
    })
    const off2 = on('PLAYER_LEFT', (e) => {
      setPlayers(prev => prev.filter(p => p.id !== e.player_id))
    })
    const off3 = on('GAME_STARTED', () => {
      router.push(`/oyna/${session}/soru`)
    })
    return () => { off1(); off2(); off3() }
  }, [on, session, router])

  return (
    <div className="min-h-screen flex flex-col qf-game-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <QuizifyLockup size={28} dark />
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {players.length} oyuncu hazır
        </div>
      </div>

      {/* Main avatar */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">
        <div className="relative">
          <Avatar
            name={nickname || '?'}
            size={88}
            className="ring-4 ring-white/30"
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{ animation: 'qf-pulse-ring 1.5s ease-out infinite' }}
          />
        </div>
        <div className="text-center">
          <p className="text-white/60 text-sm mb-1">Hoş geldin!</p>
          <h1 className="text-white text-2xl font-black">{nickname}</h1>
        </div>

        {/* Player bubbles */}
        {players.length > 0 && (
          <div className="qf-glass rounded-2xl p-4 w-full max-w-xs">
            <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto qf-scroll">
              {players.map(p => (
                <div
                  key={p.id}
                  className="qf-pop-in flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-white/90"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <Avatar name={p.nickname} size={20} />
                  {p.nickname}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer waiting dots */}
      <div className="flex justify-center gap-2 pb-10">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-white/40"
            style={{ animation: `qf-bounce-dots 1.2s ${i * 0.2}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
  )
}
