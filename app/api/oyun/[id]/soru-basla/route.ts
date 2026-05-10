import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { broadcastGameEvent } from '@/lib/realtime/serverBroadcast'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: session } = await supabase
    .from('game_sessions')
    .select('current_question_index, quiz_id')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })

  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', session.quiz_id)
    .order('position')

  if (!questions) return NextResponse.json({ error: 'Sorular bulunamadı' }, { status: 404 })

  const idx = session.current_question_index
  const question = questions[idx]
  if (!question) return NextResponse.json({ error: 'Soru yok' }, { status: 400 })

  const startedAt = new Date()
  await supabase
    .from('game_sessions')
    .update({ current_question_started_at: startedAt.toISOString() })
    .eq('id', id)

  await broadcastGameEvent(id, {
    type: 'QUESTION_START',
    question_id: question.id,
    text: question.text,
    image_url: question.image_url,
    options: question.options.map((o: { id: string; text: string; position: number }) => ({ id: o.id, text: o.text, position: o.position })),
    time_limit: question.time_limit,
    start_timestamp: startedAt.getTime(),
    question_number: idx + 1,
    total_questions: questions.length,
  })

  return NextResponse.json({ ok: true, question_number: idx + 1, total_questions: questions.length })
}
