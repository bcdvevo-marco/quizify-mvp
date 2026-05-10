import { NextRequest, NextResponse } from 'next/server'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export interface RateLimitOptions {
  /** Pencere uzunluğu (ms) */
  windowMs: number
  /** Pencere içinde izin verilen maksimum istek */
  max: number
  /** Anahtar prefix'i (endpoint başına ayrı bucket için) */
  prefix: string
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): NextResponse | null {
  const ip = getClientIp(req)
  const key = `${opts.prefix}:${ip}`
  const now = Date.now()

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + opts.windowMs }
    buckets.set(key, bucket)
  }

  bucket.count++

  if (bucket.count > opts.max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Çok fazla istek, lütfen bekle' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(opts.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(bucket.resetAt / 1000)),
        },
      }
    )
  }

  if (buckets.size > 10000) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k)
    }
  }

  return null
}
