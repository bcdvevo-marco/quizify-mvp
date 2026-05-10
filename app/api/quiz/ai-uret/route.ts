import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQuestions } from '@/lib/ai/questionGenerator'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI özelliği yapılandırılmamış (ANTHROPIC_API_KEY eksik)' },
      { status: 503 }
    )
  }

  const { topic, count = 5 } = await request.json()
  if (!topic?.trim()) return NextResponse.json({ error: 'Konu gerekli' }, { status: 400 })

  try {
    const questions = await generateQuestions(topic.trim(), Math.min(count, 10))
    return NextResponse.json({ questions })
  } catch (err) {
    console.error('AI üretim hatası:', err)
    return NextResponse.json({ error: 'Soru üretilemedi, tekrar dene' }, { status: 500 })
  }
}
