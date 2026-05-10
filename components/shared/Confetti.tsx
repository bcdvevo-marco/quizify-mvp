'use client'
import React, { useMemo } from 'react'

const COLORS = ['#6366f1', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#ffffff']

interface ConfettiPiece {
  id: number
  color: string
  left: number
  width: number
  height: number
  delay: number
  duration: number
  rotate: number
}

interface ConfettiProps {
  count?: number
}

export function Confetti({ count = 40 }: ConfettiProps) {
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: (i * 2.5) % 100,
      width: 6 + (i % 4) * 2,
      height: 8 + (i % 3) * 3,
      delay: (i * 0.11) % 2.5,
      duration: 2.2 + (i % 5) * 0.4,
      rotate: (i * 37) % 360,
    }))
  }, [count])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: -20,
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `qf-confetti-fall ${p.duration}s ${p.delay}s ease-in infinite`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  )
}
