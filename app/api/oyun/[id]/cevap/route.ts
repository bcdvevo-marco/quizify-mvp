import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'
import { calculatePoints } from '@/lib/scoring/scoring'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { player_id, question_id, option_id, answered_ms } = await request.json()
  const supabase = await createClient()

  const { data: correctOption } = await supabase
    .from('options')
    .select('id')
    .eq('question_id', question_id)
    .eq('is_correct', true)
    .single()

  const { data: question } = await supabase
    .from('questions')
    .select('time_limit')
    .eq('id', question_id)
    .single()

  const isCorrect = correctOption?.id === option_id
  const timeLimitMs = (question?.time_limit ?? 20) * 1000
  const points = calculatePoints(isCorrect, answered_ms, timeLimitMs)

  const { error } = await supabase
    .from('player_answers')
    .upsert({ player_id, question_id, option_id, answered_ms, points_earned: points })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count: answeredCount } = await supabase
    .from('player_answers')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', question_id)

  const { count: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .eq('game_session_id', id)

  await broadcastGameEvent(id, {
    type: 'ANSWER_COUNT',
    answered: answeredCount ?? 0,
    total: totalPlayers ?? 0,
  })

  return NextResponse.json({ points_earned: points })
}
