import { computed } from 'vue'
import { vehicleCatalog } from '../domain/vehicles/catalog'
import { nations, type Nation } from '../domain/vehicles/nations'
import { indexRegionalTags, resolveRegionalTag } from './utils/regionalTagLookup'
import { packRegionalId, unpackRegionalId } from './utils/regionalIdPacking'
import type { CompactValue, Expansion } from './utils/types'
import { gameRegions } from '../domain/regions'

// Постоянные префиксы наций. Новая нация требует явного префикса.
const nationPrefixes = {
  ussr: 'R',
  germany: 'G',
  usa: 'A',
  china: 'Ch',
  france: 'F',
  uk: 'GB',
  japan: 'J',
  czech: 'Cz',
  sweden: 'S',
  poland: 'Pl',
  italy: 'It',
  intunion: 'Un',
} satisfies Record<Nation, string>

if (nations.length > 16) throw new Error('Compact vehicle nation ID range exhausted')

function identify(tag: string): number | undefined {
  const match = /^([^:]+):([A-Za-z]+)(\d+)_/.exec(tag)
  if (!match) return

  const nation = nations.indexOf(match[1] as Nation)
  if (nation < 0 || nationPrefixes[nations[nation]] !== match[2]) return

  const number = Number(match[3])
  if (!Number.isSafeInteger(number) || number > 0xffffff) return
  return number * 16 + nation
}

const byId = computed(() => indexRegionalTags(vehicleCatalog.value.data, identify))
const warnings = new Set<string>()

export const vehicleCompactor = {
  compact: (tag: string, contextRegion?: string): CompactValue => {
    const id = identify(tag)
    if (id === undefined) return tag

    if (contextRegion !== undefined) {
      const expanded = resolveRegionalTag(byId.value, vehicleCatalog.value.status, id, contextRegion)
      if (expanded.status !== 'ready' || expanded.value !== tag) return tag
      return packRegionalId(id) ?? tag
    }

    for (const candidate of gameRegions) {
      const expanded = resolveRegionalTag(byId.value, vehicleCatalog.value.status, id, candidate)
      if (expanded.status === 'ready' && expanded.value === tag) return packRegionalId(id, candidate) ?? tag
    }

    return tag
  },

  expand: (value: CompactValue, contextRegion?: string): Expansion => {
    if (typeof value === 'string') {
      if (/^[a-z]+:[\w-]+$/.test(value)) return { status: 'ready', value }
      return { status: 'unresolved', reason: 'invalid' }
    }

    const id = unpackRegionalId(value, contextRegion)
    if (!id) return { status: 'unresolved', reason: 'invalid' }

    const result = resolveRegionalTag(byId.value, vehicleCatalog.value.status, id.id, id.region)
    if (result.status !== 'unresolved' || result.reason !== 'ambiguous') return result

    const key = JSON.stringify([value, contextRegion])
    if (warnings.has(key)) return result

    warnings.add(key)
    console.warn('Ambiguous compact ID', value, contextRegion)
    return result
  }
}

export function vehicleCompactLabel(value: number | string): string {
  if (typeof value === 'string') return value

  const packed = unpackRegionalId(value)
  if (!packed) return String(value)

  const nation = nations[packed.id % 16]
  if (nation === undefined) return String(value)

  return `${packed.region ? packed.region + ':' : ''}${nationPrefixes[nation]}${Math.floor(packed.id / 16)}`
}
