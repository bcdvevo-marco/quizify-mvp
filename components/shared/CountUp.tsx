'use client'
import React, { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  to: number
  from?: number
  dur?: number  // ms
  className?: string
  format?: (n: number) => string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function CountUp({ to, from = 0, dur = 1200, className = '', format }: CountUpProps) {
  const [value, setValue] = useState(from)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    const start = from
    const end = to

    function tick(now: number) {
      if (!startRef.current) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / dur, 1)
      const eased = easeOutCubic(progress)
      setValue(Math.round(start + (end - start) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to, from, dur])

  const display = format ? format(value) : value.toLocaleString('tr-TR')
  return <span className={className}>{display}</span>
}
