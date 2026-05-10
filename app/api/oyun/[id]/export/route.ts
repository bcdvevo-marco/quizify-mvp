import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: results } = await supabase
    .from('game_results')
    .select('rank, total_points, correct_count, total_questions, players(nickname, teams(name))')
    .eq('game_session_id', id)
    .order('rank')

  if (!results) return NextResponse.json({ error: 'Sonuç bulunamadı' }, { status: 404 })

  const headers = ['Sıra', 'Takmaad', 'Takım', 'Puan', 'Doğru', 'Toplam Soru']
  const rows = results.map(r => [
    r.rank,
    (r.players as any)?.nickname ?? '',
    (r.players as any)?.teams?.name ?? '-',
    r.total_points,
    r.correct_count,
    r.total_questions,
  ])

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const bom = '﻿'

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sonuclar-${id.slice(0, 8)}.csv"`,
    },
  })
}
