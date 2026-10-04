import { QUERY_CACHE_HEADER } from './cache'

// Используется и для ключа локального кеша, и для канонизации HTTP-параметров.
export function sortedEntries(entries: Iterable<readonly [string, string]>) {
  return [...entries].sort(([ak, av], [bk, bv]) => ak < bk ? -1 : ak > bk ? 1 : av < bv ? -1 : av > bv ? 1 : 0)
}

export async function proxyCacheFetch(input: RequestInfo | URL, init?: RequestInit, send: typeof fetch = fetch): Promise<Response> {
  const headers = new Headers(init?.headers)
  const ttl = headers.get(`${QUERY_CACHE_HEADER}TTL`)
  const until = headers.get(`${QUERY_CACHE_HEADER}Until`)
  if (ttl === null && until === null) return send(input, init)

  init?.signal?.throwIfAborted()
  if (init?.method !== 'POST' || typeof init.body !== 'string') throw new Error('Query proxy cache requires a POST with a SQL string body')

  const url = new URL(input instanceof Request ? input.url : input)
  const params = sortedEntries([...url.searchParams].filter(([key]) => key !== 'query_id' && key !== 'query_cache_ttl'))
  // Формат v1 фиксирован: сервер сможет проверить те же UTF-8 байты JSON-массива.
  // FORMAT уже добавлен SDK к телу. TTL в URL меняется каждую секунду и исключён.
  const canonical = JSON.stringify([
    'wotstat-query-cache-v1', 'POST', url.origin + url.pathname, params,
    headers.get('Authorization') ?? '',
    ttl !== null ? ['ttl', ttl] : ['until', until],
    init.body,
  ])
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  init.signal?.throwIfAborted()
  const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
  headers.set(`${QUERY_CACHE_HEADER}Key`, `v1:${hash}`)
  return send(input, { ...init, headers })
}
