import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_sessions')
    .select('id, pin, status, quizzes(title), teams(id, name, color)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 404 })
  return NextResponse.json(data)
}
