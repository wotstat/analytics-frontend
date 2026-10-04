import type { ClickHouseSettings } from '@clickhouse/client-web'

export type CachePolicy =
  | { ttl: number, until?: never, expiresAt?: never }
  | { until: 'hour' | 'day' | 'month', ttl?: never, expiresAt?: never }
  | { expiresAt: Date, ttl?: never, until?: never }

export const SUPER_SHORT_CACHE = { ttl: 5 } as const satisfies CachePolicy
export const SHORT_CACHE = { ttl: 10 } as const satisfies CachePolicy
export const DEFAULT_CACHE = { ttl: 60 } as const satisfies CachePolicy
export const MEDIUM_CACHE = { ttl: 300 } as const satisfies CachePolicy
export const LONG_CACHE = { ttl: 600 } as const satisfies CachePolicy
export const DAILY_CACHE = { until: 'day' } as const satisfies CachePolicy
export const MONTHLY_CACHE = { until: 'month' } as const satisfies CachePolicy

export type ResolvedCachePolicy = {
  key: string
  ttl: number
  expiresAt: number
  headers: Record<string, string>
}

export const QUERY_CACHE_HEADER = 'X-Wotstat-Query-Cache-'

export function resolveCachePolicy(policy?: CachePolicy, now = Date.now()): ResolvedCachePolicy | undefined {
  if (!policy) return undefined

  if (policy.ttl !== undefined) {
    if (!Number.isSafeInteger(policy.ttl) || policy.ttl < 0) throw new RangeError('Cache TTL must be a non-negative integer')
    return {
      key: `ttl:${policy.ttl}`,
      ttl: policy.ttl,
      expiresAt: now + policy.ttl * 1000,
      headers: { [`${QUERY_CACHE_HEADER}TTL`]: String(policy.ttl) },
    }
  }

  const end = policy.expiresAt ? new Date(policy.expiresAt) : new Date(now)
  if (policy.until === 'hour') end.setUTCHours(end.getUTCHours() + 1, 0, 0, 0)
  if (policy.until === 'day') end.setUTCHours(24, 0, 0, 0)
  if (policy.until === 'month') {
    end.setUTCMonth(end.getUTCMonth() + 1, 1)
    end.setUTCHours(0, 0, 0, 0)
  }
  if (!Number.isFinite(end.getTime())) throw new RangeError('Cache expiration must be a valid date')
  return {
    key: `${policy.until ?? 'expiresAt'}:${end.toISOString()}`,
    ttl: Math.max(0, Math.floor((end.getTime() - now) / 1000)),
    expiresAt: end.getTime(),
    headers: { [`${QUERY_CACHE_HEADER}Until`]: end.toISOString() },
  }
}

export function cacheClickHouseSettings(cache: ResolvedCachePolicy | undefined, settings: ClickHouseSettings): ClickHouseSettings {
  if (!cache) return settings
  return {
    ...settings,
    use_query_cache: cache.ttl > 0 ? (settings.use_query_cache ?? 1) : 0,
    query_cache_ttl: cache.ttl,
    // Разные сроки и календарные периоды не должны читать один старый результат.
    query_cache_tag: JSON.stringify([settings.query_cache_tag ?? '', cache.key]),
  }
}

export function responseCacheExpiresAt(cache: ResolvedCachePolicy | undefined, headers: Record<string, string | string[] | undefined>, now = Date.now()) {
  const control = String(headers['cache-control'] ?? '')
  if (/\b(no-store|no-cache)\b/i.test(control)) return now

  let expiresAt = cache?.expiresAt ?? Infinity
  const age = Math.max(0, Number(headers.age) || 0)
  const date = Date.parse(String(headers.date))
  const apparentAge = Number.isFinite(date) ? Math.max(0, (now - date) / 1000) : 0
  const maxAge = control.match(/\bs-maxage\s*=\s*"?(\d+)/i) ?? control.match(/\bmax-age\s*=\s*"?(\d+)/i)
  if (maxAge) expiresAt = Math.min(expiresAt, now + Math.max(0, Number(maxAge[1]) - Math.max(age, apparentAge)) * 1000)
  else if (headers.expires !== undefined) {
    const expires = Date.parse(String(headers.expires))
    expiresAt = Math.min(expiresAt, Number.isFinite(expires) ? expires : now)
  } else if (cache && age) expiresAt = Math.min(expiresAt, now + Math.max(0, cache.ttl - age) * 1000)
  return expiresAt
}

// Общий срок сохраняется и при переносе ответа в кеш конкретного компонента.
export function createQueryCache<T>() {
  const entries = new Map<string, { value: T, expiresAt: number }>()
  function get(key: string): T | undefined {
    const entry = entries.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      entries.delete(key)
      return undefined
    }
    return entry.value
  }
  return {
    get,
    has: (key: string) => get(key) !== undefined,
    set(key: string, value: T, expiresAt: number) {
      if (expiresAt > Date.now()) entries.set(key, { value, expiresAt })
      else entries.delete(key)
    },
  }
}
