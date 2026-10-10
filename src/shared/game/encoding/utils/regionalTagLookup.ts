import { isErrorStatus, loading, type Status } from '@/db'
import type { Expansion } from './types'

type RegionalTagRow = { tag: string, region: string }

export function indexRegionalTags(rows: readonly RegionalTagRow[], identify: (tag: string) => number | undefined) {
  const index = new Map<number, RegionalTagRow[]>()
  for (const row of rows) {
    const id = identify(row.tag)
    if (id === undefined) continue

    const group = index.get(id)
    if (group) group.push(row)
    else index.set(id, [row])
  }

  return index
}

export function resolveRegionalTag(index: ReadonlyMap<number, readonly RegionalTagRow[]>, status: Status, id: number, region?: string): Expansion {
  const tags = [...new Set((index.get(id) ?? [])
    .filter(row => region === undefined || row.region === region).map(row => row.tag))]

  if (!tags.length) {
    if (status === loading) return { status: 'loading' }
    return { status: 'unresolved', reason: isErrorStatus(status) ? 'error' : 'missing' }
  }

  const sorted = tags.sort((a, b) => a.length - b.length || a.localeCompare(b))
  const base = sorted[0]

  if (sorted.every(tag => tag === base || tag.startsWith(base + '_'))) return { status: 'ready', value: base }
  return { status: 'unresolved', reason: 'ambiguous' }
}
