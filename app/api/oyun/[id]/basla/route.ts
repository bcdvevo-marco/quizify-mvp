import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: session, error } = await supabase
    .from('game_sessions')
    .update({ status: 'active', started_at: new Date().toISOString(), current_question_index: 0 })
    .eq('id', id)
    .eq('host_id', user.id)
    .eq('status', 'lobby')
    .select('*, quizzes(title, questions(count))')
    .single()

  if (error || !session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  await broadcastGameEvent(id, {
    type: 'GAME_STARTED',
    quiz_title: (session.quizzes as any).title,
    question_count: (session.quizzes as any).questions[0].count,
  })

  return NextResponse.json({ ok: true })
}
