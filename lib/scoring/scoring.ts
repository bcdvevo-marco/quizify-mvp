export const MAX_POINTS = 1000
const MIN_POINTS = 500

export function calculatePoints(isCorrect: boolean, answeredMs: number, timeLimitMs: number): number {
  if (!isCorrect) return 0
  const clampedMs = Math.min(answeredMs, timeLimitMs)
  const timeRatio = 1 - clampedMs / timeLimitMs
  return Math.floor(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * timeRatio)
}
