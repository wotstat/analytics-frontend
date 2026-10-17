import { computed } from 'vue'
import { isErrorStatus, loading } from '@/db'
import { arenaId } from './utils/entityIds'
import { arenaCatalog } from '../domain/arenas/catalog'
import { indexRegionalTags, resolveRegionalTag } from './utils/regionalTagLookup'
import { packRegionalId, unpackRegionalId } from './utils/regionalIdPacking'
import type { CompactValue, Expansion } from './utils/types'
import { gameRegions } from '../domain/regions'

const byId = computed(() => indexRegionalTags(arenaCatalog.value.data, arenaId))
const warnings = new Set<string>()

export const arenaCompactor = {
  compact: (tag: string, contextRegion?: string): CompactValue => {
    const id = arenaId(tag)
    if (id === undefined) return tag

    if (contextRegion !== undefined) {
      const expanded = resolveRegionalTag(byId.value, id, contextRegion)
      if (expanded.status !== 'ready' || expanded.value !== tag) return tag
      return packRegionalId(id) ?? tag
    }

    for (const candidate of gameRegions) {
      const expanded = resolveRegionalTag(byId.value, id, candidate)
      if (expanded.status === 'ready' && expanded.value === tag) return packRegionalId(id, candidate) ?? tag
    }

    return tag
  },

  expand: (value: CompactValue, contextRegion?: string): Expansion => {
    if (typeof value === 'string') {
      if (/^[\w-]+$/.test(value)) return { status: 'ready', value }
      return { status: 'unresolved', reason: 'invalid' }
    }

    const id = unpackRegionalId(value, contextRegion)
    if (!id) return { status: 'unresolved', reason: 'invalid' }

    const result = resolveRegionalTag(byId.value, id.id, id.region)
    if (result.status === 'unresolved' && result.reason === 'missing') {
      if (arenaCatalog.value.status === loading) return { status: 'loading' }
      if (isErrorStatus(arenaCatalog.value.status)) return { status: 'unresolved', reason: 'error' }
    }
    if (result.status !== 'unresolved' || result.reason !== 'ambiguous') return result

    const key = JSON.stringify([value, contextRegion])
    if (warnings.has(key)) return result

    warnings.add(key)
    console.warn('Ambiguous compact ID', value, contextRegion)
    return result
  },

  expandMany: (values: readonly CompactValue[], contextRegion?: string): Expansion<string[]> => {
    const expanded = values.map(value => arenaCompactor.expand(value, contextRegion))
    const unavailable = expanded.find(value => value.status === 'unresolved') ?? expanded.find(value => value.status === 'loading')
    if (unavailable) return unavailable
    return { status: 'ready', value: expanded.flatMap(value => value.status === 'ready' ? [value.value] : []) }
  }
}
