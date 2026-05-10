import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(req: NextRequest, { params }: { params: Promise<{ pin: string }> }) {
  const limited = rateLimit(req, { windowMs: 60_000, max: 30, prefix: 'pin-lookup' })
  if (limited) return limited

  const { pin } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_sessions')
    .select('id, status, allow_anonymous, quiz_id, quizzes(title), teams(id, name, color)')
    .eq('pin', pin)
    .neq('status', 'ended')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Geçersiz PIN' }, { status: 404 })
  if (data.status !== 'lobby') return NextResponse.json({ error: 'Oyun zaten başladı' }, { status: 400 })

  return NextResponse.json(data)
}
