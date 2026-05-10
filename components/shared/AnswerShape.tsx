import React from 'react'

type ShapeKind = 'bolt' | 'diamond' | 'star' | 'heart'

interface AnswerShapeProps {
  kind: ShapeKind
  size?: number
  color?: string
  className?: string
}

function Bolt({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="currentColor" />
    </svg>
  )
}

function Diamond({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="currentColor" />
    </svg>
  )
}

function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Heart({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill="currentColor"
      />
    </svg>
  )
}

export function AnswerShape({ kind, size = 24, color = 'currentColor', className = '' }: AnswerShapeProps) {
  const Component = { bolt: Bolt, diamond: Diamond, star: Star, heart: Heart }[kind]
  return (
    <span style={{ color }} className={`inline-flex items-center justify-center ${className}`}>
      <Component size={size} />
    </span>
  )
}

export const ANS_META = [
  { key: 'A', shape: 'bolt' as ShapeKind,    bg: 'var(--ans-red)',    bgDk: 'var(--ans-red-dk)',    label: 'Kırmızı' },
  { key: 'B', shape: 'diamond' as ShapeKind, bg: 'var(--ans-blue)',   bgDk: 'var(--ans-blue-dk)',   label: 'Mavi'    },
  { key: 'C', shape: 'star' as ShapeKind,    bg: 'var(--ans-yellow)', bgDk: 'var(--ans-yellow-dk)', label: 'Sarı'    },
  { key: 'D', shape: 'heart' as ShapeKind,   bg: 'var(--ans-green)',  bgDk: 'var(--ans-green-dk)',  label: 'Yeşil'   },
] as const
