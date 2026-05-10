'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import { Avatar, CountUp } from '@/components/shared'
import type { LeaderboardUpdateEvent } from '@/types/game'

export default function SkorPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const [rankings, setRankings] = useState<LeaderboardUpdateEvent['rankings']>([])
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()
  const { on } = useGameChannel(session)
  const myNickname = typeof window !== 'undefined' ? sessionStorage.getItem('nickname') : ''

  useEffect(() => {
    const off1 = on('LEADERBOARD_UPDATE', (e) => {
      setRankings(e.rankings)
      setCountdown(5)
    })
    const off2 = on('QUESTION_START', () => {
      router.push(`/oyna/${session}/soru`)
    })
    const off3 = on('GAME_END', () => {
      router.push(`/oyna/${session}/bitis`)
    })
    return () => { off1(); off2(); off3() }
  }, [on, session, router])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const myRank = rankings.find(r => r.nickname === myNickname)
  const top5 = rankings.slice(0, 5)

  return (
    <div className="min-h-screen flex flex-col qf-game-bg px-4 py-8">
      {/* My rank card */}
      {myRank && (
        <div
          className="rounded-2xl p-4 mb-6 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))',
            border: '1px solid rgba(16,185,129,0.35)',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}
          >
            #{myRank.rank}
          </div>
          <div className="flex-1">
            <p className="text-white/70 text-xs">Sırandan</p>
            <p className="text-white font-bold text-lg">{myRank.nickname}</p>
          </div>
          <div className="text-right">
            <CountUp to={myRank.total_points} className="text-2xl font-black text-green-400" />
            <p className="text-white/50 text-xs">puan</p>
          </div>
        </div>
      )}

      {/* Top 5 */}
      <h2 className="text-white/60 text-sm font-semibold mb-3 tracking-wider uppercase">Sıralama</h2>
      <div className="space-y-2 flex-1">
        {top5.map((r, i) => (
          <div
            key={r.player_id}
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: r.nickname === myNickname
                ? 'rgba(99,102,241,0.3)'
                : 'rgba(255,255,255,0.07)',
              border: r.nickname === myNickname
                ? '1px solid rgba(99,102,241,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span className="text-white/50 text-sm w-6 font-bold">#{i + 1}</span>
            <Avatar name={r.nickname} size={32} />
            <span className="flex-1 text-white font-semibold truncate">{r.nickname}</span>
            <span className="text-white font-bold tabular-nums">{r.total_points.toLocaleString('tr-TR')}</span>
          </div>
        ))}
      </div>

      {/* Countdown */}
      <div className="text-center mt-8">
        <p className="text-white/50 text-sm mb-1">Sonraki soru</p>
        <p
          className="text-5xl font-black"
          style={{
            background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {countdown}
        </p>
      </div>
    </div>
  )
}
