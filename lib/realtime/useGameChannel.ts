'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameEvent, GameEventType } from '@/types/game'

type EventHandler = (event: GameEvent) => void

const EVENT_TYPES: GameEventType[] = [
  'PLAYER_JOINED', 'PLAYER_LEFT', 'GAME_STARTED', 'QUESTION_START',
  'ANSWER_COUNT', 'QUESTION_END', 'LEADERBOARD_UPDATE', 'GAME_END',
]

export function useGameChannel(sessionId: string | null) {
  const handlersRef = useRef<Map<GameEventType, EventHandler>>(new Map())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()

    function subscribe() {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)

      const channel = supabase.channel(`game:${sessionId}`)

      EVENT_TYPES.forEach(type => {
        channel.on('broadcast', { event: type }, ({ payload }) => {
          handlersRef.current.get(type)?.(payload as GameEvent)
        })
      })

      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          reconnectTimerRef.current = setTimeout(subscribe, 3000)
        }
      })

      channelRef.current = channel
    }

    subscribe()

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [sessionId])

  const on = useCallback(<T extends GameEventType>(
    type: T,
    handler: (event: Extract<GameEvent, { type: T }>) => void
  ) => {
    handlersRef.current.set(type, handler as EventHandler)
    return () => { handlersRef.current.delete(type) }
  }, [])

  return { on }
}
