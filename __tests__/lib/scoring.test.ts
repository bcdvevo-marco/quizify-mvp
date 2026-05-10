import { describe, it, expect } from 'vitest'
import { calculatePoints, MAX_POINTS } from '@/lib/scoring/scoring'

describe('calculatePoints', () => {
  it('yanlış cevap 0 puan verir', () => {
    expect(calculatePoints(false, 5000, 20000)).toBe(0)
  })

  it('doğru cevap çok hızlı yanıtlanınca 1000\'e yakın puan verir', () => {
    const points = calculatePoints(true, 100, 20000)
    expect(points).toBeGreaterThanOrEqual(990)
    expect(points).toBeLessThanOrEqual(1000)
  })

  it('doğru cevap en geç tam zamanında 500 puan verir', () => {
    expect(calculatePoints(true, 20000, 20000)).toBe(500)
  })

  it('doğru cevap ortada ~750 puan verir', () => {
    const points = calculatePoints(true, 10000, 20000)
    expect(points).toBeGreaterThan(700)
    expect(points).toBeLessThan(800)
  })

  it('MAX_POINTS 1000 olmalı', () => {
    expect(MAX_POINTS).toBe(1000)
  })

  it('süre aşımı (answeredMs > timeLimitMs) 500 puan verir', () => {
    expect(calculatePoints(true, 99999, 20000)).toBe(500)
  })

  it('anlık cevap (0ms) maksimum puanı verir', () => {
    expect(calculatePoints(true, 0, 20000)).toBe(1000)
  })

  it('yanlış cevap hızlı bile olsa 0 puan verir', () => {
    expect(calculatePoints(false, 50, 20000)).toBe(0)
  })
})
