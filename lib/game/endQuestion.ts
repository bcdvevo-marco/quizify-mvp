import { SupabaseClient } from '@supabase/supabase-js'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function endQuestion(supabase: SupabaseClient, sessionId: string, questionId: string) {
  // Atomically claim: sadece current_question_index beklenenden eşleşirse increment et.
  // Race condition durumunda ikinci istek 0 satır günceller ve erken çıkar.
  const { data: session } = await supabase
    .from('game_sessions')
    .select('current_question_index')
    .eq('id', sessionId)
    .single()

  if (!session) return

  const { data: claimed } = await supabase
    .from('game_sessions')
    .update({ current_question_index: session.current_question_index + 1 })
    .eq('id', sessionId)
    .eq('current_question_index', session.current_question_index)
    .select('id')

  if (!claimed?.length) return // başka bir istek zaten bitirdi

  const { data: correctOption } = await supabase
    .from('options')
    .select('id')
    .eq('question_id', questionId)
    .eq('is_correct', true)
    .single()

  const { data: answers } = await supabase
    .from('player_answers')
    .select('option_id, player_id, points_earned')
    .eq('question_id', questionId)

  const stats: Record<string, number> = {}
  const playerPoints: Record<string, number> = {}
  answers?.forEach(a => {
    if (a.option_id) stats[a.option_id] = (stats[a.option_id] ?? 0) + 1
    playerPoints[a.player_id] = a.points_earned
  })

  await broadcastGameEvent(sessionId, {
    type: 'QUESTION_END',
    correct_option_id: correctOption?.id ?? '',
    answer_stats: Object.entries(stats).map(([option_id, count]) => ({ option_id, count })),
    player_points: playerPoints,
  })

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, team_id')
    .eq('game_session_id', sessionId)

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

  await broadcastGameEvent(sessionId, { type: 'LEADERBOARD_UPDATE', rankings })
}
