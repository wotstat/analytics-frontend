import type { Query } from '@/db/client'
import type { MetaContextDefinition, MetaContexts } from './utils/types'

type Entry = {
  definition: MetaContextDefinition
  value: unknown
  ready: Promise<void>
  release: () => void
  controller: AbortController
  waitTimer?: ReturnType<typeof setTimeout>
  refreshTimer?: ReturnType<typeof setTimeout>
}

export function createMetaContexts(definitions: Iterable<MetaContextDefinition>, query: Query, onUpdate?: () => void) {
  const entries = new Map<string, Entry>()
  let closed = false

  // Проверяем весь реестр до запуска загрузок и таймеров.
  for (const definition of definitions) {
    const existing = entries.get(definition.id)
    if (existing) {
      if (existing.definition !== definition) throw new Error(`Duplicate meta context ID: ${definition.id}`)
      continue
    }
    if (!definition.id.trim()) throw new Error('Meta context ID must not be empty')

    if (!Number.isSafeInteger(definition.initialWaitMs) || definition.initialWaitMs < 0)
      throw new Error(`Invalid initial wait for meta context: ${definition.id}`)

    if (!Number.isSafeInteger(definition.refreshIntervalMs) || definition.refreshIntervalMs <= 0 || definition.refreshIntervalMs > 2_147_483_647)
      throw new Error(`Invalid refresh interval for meta context: ${definition.id}`)

    if (definition.initialWaitMs > 2_147_483_647) throw new Error(`Initial wait is too long: ${definition.id}`)

    let release = () => { }
    const ready = new Promise<void>(resolve => { release = resolve })
    entries.set(definition.id, { definition, value: undefined, ready, release, controller: new AbortController() })
  }

  for (const entry of entries.values()) {
    if (entry.definition.initialWaitMs === 0) entry.release()
    else entry.waitTimer = setTimeout(entry.release, entry.definition.initialWaitMs)
    void refresh(entry)
  }

  async function refresh(entry: Entry) {
    try {
      const value = await entry.definition.load({ query, signal: entry.controller.signal })
      if (closed) return
      entry.value = value
      onUpdate?.()
    } catch (error) {
      if (!closed) console.error(`Meta context loading failed (${entry.definition.id}):`, error)
    } finally {
      clearTimeout(entry.waitTimer)
      entry.release()
      if (!closed) entry.refreshTimer = setTimeout(() => void refresh(entry), entry.definition.refreshIntervalMs)
    }
  }

  return {
    read: (contexts: MetaContexts) => Object.fromEntries(
      Object.entries(contexts).map(([name, definition]) => [name, entries.get(definition.id)?.value])
    ),
    wait: async (contexts: MetaContexts) => {
      await Promise.all(Object.values(contexts).map(definition => entries.get(definition.id)?.ready))
    },
    close: () => {
      closed = true
      for (const entry of entries.values()) {
        clearTimeout(entry.waitTimer)
        clearTimeout(entry.refreshTimer)
        entry.release()
        entry.controller.abort(new Error('Meta contexts closed'))
      }
    },
  }
}
