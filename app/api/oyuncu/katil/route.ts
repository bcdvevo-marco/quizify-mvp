import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { windowMs: 60_000, max: 10, prefix: 'oyuncu-katil' })
  if (limited) return limited

  const { game_session_id, nickname, team_id } = await request.json()
  const supabase = await createClient()

  if (!nickname?.trim()) return NextResponse.json({ error: 'Takmaadı gerekli' }, { status: 400 })

  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('game_session_id', game_session_id)
    .eq('nickname', nickname.trim())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Bu takmaadı zaten kullanılıyor' }, { status: 409 })

  const { data: player, error } = await supabase
    .from('players')
    .insert({ game_session_id, nickname: nickname.trim(), team_id: team_id ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await broadcastGameEvent(game_session_id, {
    type: 'PLAYER_JOINED',
    player_id: player.id,
    nickname: player.nickname,
    team_id: player.team_id,
  })

  return NextResponse.json({ player_id: player.id })
}
