import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, team_id')
    .eq('game_session_id', id)

  if (!players?.length) return NextResponse.json({ rankings: [] })

  const { data: answers } = await supabase
    .from('player_answers')
    .select('player_id, points_earned')
    .in('player_id', players.map(p => p.id))

  const totals: Record<string, number> = {}
  answers?.forEach(a => {
    totals[a.player_id] = (totals[a.player_id] ?? 0) + a.points_earned
  })

  const rankings = players
    .map(p => ({
      player_id: p.id,
      nickname: p.nickname,
      team_id: p.team_id,
      total_points: totals[p.id] ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  return NextResponse.json({ rankings })
}
