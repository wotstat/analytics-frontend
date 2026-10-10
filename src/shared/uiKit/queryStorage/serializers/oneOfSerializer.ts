import type { Serializer } from './types'

export function oneOfSerializer<const T extends string | number>(options: readonly T[]): Serializer<T> {
  if (!options.length) throw new Error('Empty serializer options')

  const byRaw = new Map<string, T>()
  for (const value of new Set(options)) {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid serializer option')
    const raw = String(value)
    if (byRaw.has(raw)) throw new Error('Ambiguous serializer options')
    byRaw.set(raw, value)
  }

  return {
    serialize: value => {
      const raw = String(value)
      if (!byRaw.has(raw) || byRaw.get(raw) !== value) throw new Error('Unknown serializer option')
      return raw
    },

    deserialize: raw => {
      const value = byRaw.get(raw)
      if (value === undefined) throw new Error('Unknown serializer option')
      return value
    }
  }
}
