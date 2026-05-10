import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('game_sessions')
    .select('current_question_index, current_question_started_at, quiz_id, status')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
  if (session.status !== 'active') return NextResponse.json({ active: false })

  const { data: questions } = await supabase
    .from('questions')
    .select('*, options(*)')
    .eq('quiz_id', session.quiz_id)
    .order('position')

  const idx = session.current_question_index
  const question = questions?.[idx]
  if (!question) return NextResponse.json({ active: false })

  const startTimestamp = session.current_question_started_at
    ? new Date(session.current_question_started_at).getTime()
    : Date.now()

  return NextResponse.json({
    active: true,
    question_id: question.id,
    text: question.text,
    image_url: question.image_url,
    options: question.options.map((o: { id: string; text: string; position: number }) => ({
      id: o.id, text: o.text, position: o.position,
    })),
    time_limit: question.time_limit,
    start_timestamp: startTimestamp,
    question_number: idx + 1,
    total_questions: questions!.length,
  })
}
