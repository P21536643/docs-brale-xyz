/**
 * Simple in-memory rate limiting for payments
 * In production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000)

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000, // 1 minute
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (entry.count < limit) {
    entry.count++
    return true
  }

  return false
}

export function getRemainingRequests(
  identifier: string,
  limit: number = 10,
): number {
  const entry = rateLimitStore.get(identifier)
  if (!entry || entry.resetTime < Date.now()) {
    return limit
  }
  return Math.max(0, limit - entry.count)
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}
