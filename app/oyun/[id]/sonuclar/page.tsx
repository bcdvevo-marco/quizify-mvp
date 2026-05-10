'use client'
import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Confetti, Btn, Icon } from '@/components/shared'

interface GameResult {
  rank: number
  total_points: number
  correct_count: number
  total_questions: number
  players: { nickname: string; teams: { name: string } | null }
}

const PODIUM_ORDER = [1, 0, 2]
const PODIUM_HEIGHTS = [80, 110, 60]

export default function SonuclarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [results, setResults] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/oyun/${id}/sonuclar`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleNewGame() {
    const res = await fetch(`/api/oyun/${id}`)
    const session = await res.json()
    if (session.quiz_id) {
      const newRes = await fetch('/api/oyun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: session.quiz_id }),
      })
      const { id: newId } = await newRes.json()
      router.push(`/oyun/${newId}/lobi`)
    }
  }

  const top3 = results.slice(0, 3)

  return (
    <div className="min-h-screen flex qf-game-bg relative overflow-hidden">
      <Confetti count={60} />

      {/* Left: podium */}
      <div className="w-80 flex-none flex flex-col items-center justify-center p-8 relative z-10">
        <h1 className="text-white text-3xl font-black mb-2">🏆 Sonuçlar</h1>
        <p className="text-white/60 text-sm mb-8">Tebrikler!</p>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 w-full">
          {PODIUM_ORDER.map((rankIdx, podiumIdx) => {
            const player = top3[rankIdx]
            if (!player) return <div key={podiumIdx} className="w-20" />
            const height = PODIUM_HEIGHTS[podiumIdx]
            const isFirst = rankIdx === 0
            return (
              <div key={podiumIdx} className="flex flex-col items-center gap-2 w-20">
                <Avatar name={player.players?.nickname ?? '?'} size={isFirst ? 52 : 40} />
                <p className="text-white text-xs font-bold truncate w-full text-center">{player.players?.nickname}</p>
                <p className="text-white/60 text-xs">{player.total_points.toLocaleString('tr-TR')} pts</p>
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

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full mt-8">
          <a
            href={`/api/oyun/${id}/export`}
            download
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white transition-all hover:brightness-110"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <Icon name="download" size={18} />
            CSV İndir
          </a>
          <Btn kind="primary" size="md" full onClick={handleNewGame} icon="play">
            Yeni Oyun Başlat
          </Btn>
        </div>
      </div>

      {/* Right: leaderboard table */}
      <div className="flex-1 p-8 relative z-10">
        <div className="qf-glass rounded-3xl h-full overflow-hidden flex flex-col">
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-white font-bold text-lg">Tüm Sıralama</h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/40 animate-pulse">Yükleniyor...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto qf-scroll px-6 py-4 space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-[32px_1fr_80px_80px_80px] gap-4 text-white/40 text-xs font-bold uppercase tracking-wider px-3 mb-3">
                <span>#</span>
                <span>Oyuncu</span>
                <span>Takım</span>
                <span className="text-right">Doğru</span>
                <span className="text-right">Puan</span>
              </div>

              {results.map((r) => (
                <div
                  key={r.rank}
                  className="grid grid-cols-[32px_1fr_80px_80px_80px] gap-4 items-center px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <span className="text-white/50 text-sm font-bold">#{r.rank}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={r.players?.nickname ?? '?'} size={28} />
                    <span className="text-white text-sm font-semibold truncate">{r.players?.nickname}</span>
                  </div>
                  <span className="text-white/60 text-xs truncate">{r.players?.teams?.name ?? '-'}</span>
                  <span className="text-white text-sm text-right">{r.correct_count}/{r.total_questions}</span>
                  <span className="text-white font-bold text-sm text-right tabular-nums">{r.total_points.toLocaleString('tr-TR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
