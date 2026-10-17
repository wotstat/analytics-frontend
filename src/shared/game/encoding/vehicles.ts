import { computed } from 'vue'
import { vehicleCatalog } from '../domain/vehicles/catalog'
import { vehicleId } from './utils/entityIds'
import { isErrorStatus, loading } from '@/db'
import { indexRegionalTags, resolveRegionalTag } from './utils/regionalTagLookup'
import { packRegionalId, unpackRegionalId } from './utils/regionalIdPacking'
import type { CompactValue, Expansion } from './utils/types'
import { gameRegions } from '../domain/regions'

const byId = computed(() => indexRegionalTags(vehicleCatalog.value.data, vehicleId))
const warnings = new Set<string>()

export const vehicleCompactor = {
  compact: (tag: string, contextRegion?: string): CompactValue => {
    const id = vehicleId(tag)
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
      if (/^[a-z]+:[\w-]+$/.test(value)) return { status: 'ready', value }
      return { status: 'unresolved', reason: 'invalid' }
    }

    const id = unpackRegionalId(value, contextRegion)
    if (!id) return { status: 'unresolved', reason: 'invalid' }

    const result = resolveRegionalTag(byId.value, id.id, id.region)
    if (result.status === 'unresolved' && result.reason === 'missing') {
      if (vehicleCatalog.value.status === loading) return { status: 'loading' }
      if (isErrorStatus(vehicleCatalog.value.status)) return { status: 'unresolved', reason: 'error' }
    }
    if (result.status !== 'unresolved' || result.reason !== 'ambiguous') return result

    const key = JSON.stringify([value, contextRegion])
    if (warnings.has(key)) return result

    warnings.add(key)
    console.warn('Ambiguous compact ID', value, contextRegion)
    return result
  }
}

export { vehicleCompactLabel } from './utils/entityIds'
