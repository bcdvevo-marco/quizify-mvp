import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  await supabase
    .from('game_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)

  const { data: session } = await supabase
    .from('game_sessions')
    .select('quiz_id')
    .eq('id', id)
    .single()

  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', session!.quiz_id)

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, team_id')
    .eq('game_session_id', id)

  const { data: answers } = await supabase
    .from('player_answers')
    .select('player_id, points_earned, option_id')
    .in('player_id', (players ?? []).map(p => p.id))

  const statsMap: Record<string, { points: number; correct: number }> = {}
  answers?.forEach(a => {
    if (!statsMap[a.player_id]) statsMap[a.player_id] = { points: 0, correct: 0 }
    statsMap[a.player_id].points += a.points_earned
    if (a.option_id && a.points_earned > 0) statsMap[a.player_id].correct++
  })

  const finalRankings = (players ?? [])
    .map(p => ({ player_id: p.id, nickname: p.nickname, total_points: statsMap[p.id]?.points ?? 0, correct_count: statsMap[p.id]?.correct ?? 0, rank: 0 }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  if (finalRankings.length > 0) {
    await supabase.from('game_results').insert(
      finalRankings.map(r => ({
        game_session_id: id,
        player_id: r.player_id,
        total_points: r.total_points,
        rank: r.rank,
        correct_count: r.correct_count,
        total_questions: totalQuestions ?? 0,
      }))
    )
  }

  await broadcastGameEvent(id, {
    type: 'GAME_END',
    final_rankings: finalRankings,
    session_id: id,
  })

  return NextResponse.json({ ok: true })
}
