import type { GameEvent } from '@/types/game'

export async function broadcastGameEvent(sessionId: string, event: GameEvent): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    body: JSON.stringify({
      messages: [{
        topic: `game:${sessionId}`,
        event: event.type,
        payload: event,
        private: false,
      }],
    }),
  })
  if (!res.ok) {
    console.error('Broadcast failed', res.status, await res.text().catch(() => ''))
  }
}
