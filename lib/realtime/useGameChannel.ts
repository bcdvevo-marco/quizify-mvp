'use client'
import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameEvent, GameEventType } from '@/types/game'

type EventHandler = (event: GameEvent) => void

export function useGameChannel(sessionId: string | null) {
  const handlersRef = useRef<Map<GameEventType, EventHandler>>(new Map())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()
    const channel = supabase.channel(`game:${sessionId}`)

    const eventTypes: GameEventType[] = [
      'PLAYER_JOINED', 'PLAYER_LEFT', 'GAME_STARTED', 'QUESTION_START',
      'ANSWER_COUNT', 'QUESTION_END', 'LEADERBOARD_UPDATE', 'GAME_END',
    ]

    eventTypes.forEach(type => {
      channel.on('broadcast', { event: type }, ({ payload }) => {
        handlersRef.current.get(type)?.(payload as GameEvent)
      })
    })

    channel.subscribe()
    channelRef.current = channel

    return () => { supabase.removeChannel(channel) }
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
