'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameChannel } from '@/lib/realtime/useGameChannel'
import { Avatar, CountUp, Confetti } from '@/components/shared'
import type { GameEndEvent } from '@/types/game'

const PODIUM_ORDER = [1, 0, 2] // 2nd, 1st, 3rd index — visual podium order

export default function BitisPage({ params }: { params: Promise<{ session: string }> }) {
  const { session } = use(params)
  const [finalRankings, setFinalRankings] = useState<GameEndEvent['final_rankings']>([])
  const [totalQuestions, setTotalQuestions] = useState(0)
  const router = useRouter()
  const { on } = useGameChannel(session)
  const myNickname = typeof window !== 'undefined' ? sessionStorage.getItem('nickname') : ''

  useEffect(() => {
    const off = on('GAME_END', (e) => {
      setFinalRankings(e.final_rankings)
      setTotalQuestions(e.total_questions)
    })
    return off
  }, [on])

  // Mount'ta fetch — GAME_END broadcast kaçırıldıysa state recovery
  useEffect(() => {
    fetch(`/api/oyun/${session}/sonuclar`)
      .then(r => r.json())
      .then((data: Array<{ rank: number; total_points: number; correct_count: number; total_questions: number; players: { nickname: string } }>) => {
        if (!Array.isArray(data) || !data.length) return
        setFinalRankings(prev => prev.length ? prev : data.map(d => ({
          player_id: '',
          nickname: d.players.nickname,
          team_id: null,
          total_points: d.total_points,
          rank: d.rank,
          correct_count: d.correct_count,
        })))
        setTotalQuestions(prev => prev || data[0]?.total_questions || 0)
      })
      .catch(() => {})
  }, [session])

  const myResult = finalRankings.find(r => r.nickname === myNickname)
  const top3 = finalRankings.slice(0, 3)
  const rest = finalRankings.slice(3)
  const podiumHeights = [80, 110, 60] // 2nd, 1st, 3rd

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'radial-gradient(120% 140% at 80% 0%, #4c1d95 0%, #1e1b4b 55%, #0f0c29 100%)' }}>
      <Confetti count={50} />

      <div className="relative z-10 flex flex-col items-center px-4 py-10 min-h-screen">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-white text-3xl font-black mb-1">Oyun Bitti!</h1>
        <p className="text-white/60 text-sm mb-8">Harika oynadın!</p>

        {/* My score card */}
        {myResult && (
          <div
            className="w-full max-w-xs rounded-3xl p-6 mb-8 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.10))',
              border: '1px solid rgba(255,215,0,0.3)',
            }}
          >
            <div className="text-yellow-400 text-2xl mb-2">{'★'.repeat(Math.min(3, myResult.rank === 1 ? 3 : myResult.rank === 2 ? 2 : 1))}</div>
            <p className="text-white/70 text-sm mb-1">#{myResult.rank} Sıra</p>
            <CountUp to={myResult.total_points} className="text-4xl font-black text-white" />
            <p className="text-white/50 text-sm mt-1">toplam puan</p>
            <div className="flex justify-center gap-6 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-center">
                <p className="text-green-400 text-xl font-black">{myResult.correct_count}</p>
                <p className="text-white/40 text-xs">doğru</p>
              </div>
              <div className="text-center">
                <p className="text-white text-xl font-black">{totalQuestions > 0 ? Math.round((myResult.correct_count / totalQuestions) * 100) : 0}%</p>
                <p className="text-white/40 text-xs">isabet</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-400 text-xl font-black">#{myResult.rank}</p>
                <p className="text-white/40 text-xs">sıra</p>
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-2 w-full max-w-xs mb-8">
            {PODIUM_ORDER.map((rankIdx, podiumIdx) => {
              const player = top3[rankIdx]
              if (!player) return <div key={podiumIdx} className="w-24" />
              const height = podiumHeights[podiumIdx]
              const isFirst = rankIdx === 0
              return (
                <div key={podiumIdx} className="flex flex-col items-center gap-2 w-24">
                  <Avatar name={player.nickname} size={isFirst ? 52 : 40} />
                  <p className="text-white text-xs font-bold truncate w-full text-center">{player.nickname}</p>
                  <p className="text-white/70 text-xs tabular-nums">{player.total_points.toLocaleString('tr-TR')}</p>
                  <div
                    className="w-full rounded-t-xl flex items-center justify-center"
                    style={{
                      height,
                      background: isFirst
                        ? 'linear-gradient(180deg, #fbbf24, #d97706)'
                        : rankIdx === 1
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))'
                        : 'linear-gradient(180deg, rgba(205,127,50,0.6), rgba(205,127,50,0.3))',
                    }}
                  >
                    <span className="text-white font-black text-lg">#{rankIdx + 1}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 4+ sıradakiler */}
        {rest.length > 0 && (
          <div className="w-full max-w-xs mb-8">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 text-center">Diğer Sıralamalar</p>
            <div className="space-y-1.5">
              {rest.map(p => (
                <div
                  key={p.nickname + p.rank}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{
                    background: p.nickname === myNickname
                      ? 'rgba(99,102,241,0.25)'
                      : 'rgba(255,255,255,0.06)',
                    border: p.nickname === myNickname
                      ? '1px solid rgba(99,102,241,0.4)'
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="text-white/50 text-sm w-6 font-bold">#{p.rank}</span>
                  <Avatar name={p.nickname} size={28} />
                  <span className="flex-1 text-white text-sm font-semibold truncate">{p.nickname}</span>
                  <span className="text-white text-sm font-bold tabular-nums">{p.total_points.toLocaleString('tr-TR')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => router.push('/katil')}
          className="w-full max-w-xs h-14 rounded-2xl text-lg font-black text-indigo-700 transition-all active:scale-95"
          style={{ background: 'white' }}
        >
          Yeni Oyun →
        </button>
      </div>
    </div>
  )
}
