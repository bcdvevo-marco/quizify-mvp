import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePin, generateSlug } from '@/lib/game/pinGenerator'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { quiz_id, allow_anonymous = true } = await request.json()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, options(id, is_correct)')
    .eq('quiz_id', quiz_id)

  if (!questions || questions.length === 0)
    return NextResponse.json({ error: 'Quizde en az 1 soru olmalı' }, { status: 422 })

  const missingCorrect = (questions as Array<{ id: string; options: Array<{ is_correct: boolean }> }>)
    .some(q => !q.options?.some(o => o.is_correct))
  if (missingCorrect)
    return NextResponse.json({ error: 'Her sorunun en az 1 doğru şıkkı olmalı' }, { status: 422 })

  await supabase
    .from('game_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('quiz_id', quiz_id)
    .eq('host_id', user.id)
    .eq('status', 'lobby')

  let pin = generatePin()
  let slug = generateSlug()
  let attempts = 0

  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('pin', pin)
      .neq('status', 'ended')
      .maybeSingle()

    if (!existing) break
    pin = generatePin()
    slug = generateSlug()
    attempts++
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({ quiz_id, host_id: user.id, pin, join_slug: slug, allow_anonymous })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
