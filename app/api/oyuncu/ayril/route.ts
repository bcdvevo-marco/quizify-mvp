import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(request: NextRequest) {
  const { game_session_id, player_id } = await request.json()
  if (!game_session_id || !player_id) return NextResponse.json({ ok: true })

  const supabase = await createClient()
  await supabase.from('players').delete().eq('id', player_id).eq('game_session_id', game_session_id)

  await broadcastGameEvent(game_session_id, { type: 'PLAYER_LEFT', player_id })

  return NextResponse.json({ ok: true })
}
