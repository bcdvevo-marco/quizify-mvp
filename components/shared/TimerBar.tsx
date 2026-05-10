'use client'
import React from 'react'

interface TimerBarProps {
  progress: number   // 0–100
  height?: number
  dark?: boolean
  animated?: boolean
}

function getBarColor(progress: number): string {
  if (progress < 25) return 'var(--ans-red)'
  if (progress < 50) return 'var(--ans-yellow)'
  return 'var(--ans-green)'
}

export function TimerBar({ progress, height = 8, dark = false, animated = true }: TimerBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const color = getBarColor(clampedProgress)

  return (
    <div
      style={{
        width: '100%',
        height,
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        borderRadius: 99,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clampedProgress}%`,
          background: color,
          borderRadius: 99,
          transition: animated ? 'width 0.1s linear, background 0.3s ease' : undefined,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  )
}
