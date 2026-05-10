import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { question_id } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: correctOption } = await supabase
    .from('options')
    .select('id')
    .eq('question_id', question_id)
    .eq('is_correct', true)
    .single()

  const { data: answers } = await supabase
    .from('player_answers')
    .select('option_id, player_id, points_earned')
    .eq('question_id', question_id)

  const stats: Record<string, number> = {}
  const playerPoints: Record<string, number> = {}
  answers?.forEach(a => {
    if (a.option_id) stats[a.option_id] = (stats[a.option_id] ?? 0) + 1
    playerPoints[a.player_id] = a.points_earned
  })

  await broadcastGameEvent(id, {
    type: 'QUESTION_END',
    correct_option_id: correctOption?.id ?? '',
    answer_stats: Object.entries(stats).map(([option_id, count]) => ({ option_id, count })),
    player_points: playerPoints,
  })

  const { data: sess } = await supabase
    .from('game_sessions')
    .select('current_question_index')
    .eq('id', id)
    .single()

  await supabase
    .from('game_sessions')
    .update({ current_question_index: (sess?.current_question_index ?? 0) + 1 })
    .eq('id', id)

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, team_id')
    .eq('game_session_id', id)

  const { data: allAnswers } = await supabase
    .from('player_answers')
    .select('player_id, points_earned')
    .in('player_id', (players ?? []).map(p => p.id))

  const totals: Record<string, number> = {}
  allAnswers?.forEach(a => {
    totals[a.player_id] = (totals[a.player_id] ?? 0) + a.points_earned
  })

  const rankings = (players ?? [])
    .map(p => ({ player_id: p.id, nickname: p.nickname, team_id: p.team_id, total_points: totals[p.id] ?? 0, rank: 0 }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((p, i) => ({ ...p, rank: i + 1 }))

  await broadcastGameEvent(id, { type: 'LEADERBOARD_UPDATE', rankings })

  return NextResponse.json({ ok: true })
}
