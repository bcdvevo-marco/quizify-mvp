import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quizzes')
    .select('*, questions(*, options(*))')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'Quiz bulunamadı' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { title, description, status, questions } = await request.json()

  const { error: quizError } = await supabase
    .from('quizzes')
    .update({ title, description, status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 })

  if (questions) {
    const { error: deleteError } = await supabase.from('questions').delete().eq('quiz_id', id)
    if (deleteError) {
      return NextResponse.json({ error: `Eski sorular silinemedi: ${deleteError.message}` }, { status: 500 })
    }
    for (const q of questions) {
      const { data: question } = await supabase
        .from('questions')
        .insert({ quiz_id: id, text: q.text, image_url: q.image_url, time_limit: q.time_limit ?? 20, position: q.position })
        .select()
        .single()
      if (question && q.options?.length) {
        await supabase.from('options').insert(
          q.options.map((o: { text: string; is_correct: boolean }, i: number) => ({
            question_id: question.id,
            text: o.text,
            is_correct: o.is_correct,
            position: i,
          }))
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { error } = await supabase.from('quizzes').delete().eq('id', id).eq('host_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
