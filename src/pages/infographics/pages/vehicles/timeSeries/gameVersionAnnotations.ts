import { computed, type ComputedRef } from 'vue'
import { LONG_CACHE_SETTINGS, queryComputed } from '@/db'
import type { VehicleRegion } from '../filters/types'
import { DAY } from './timeLabels'
import type { VersionAnnotationVisibility } from './useHistoryAnnotationMenu'

export type HistoryAnnotation = {
  timestamp: number
  label: string
  kind: 'version' | 'patch' | 'micropatch'
}

type GameVersionRow = {
  region: VehicleRegion
  gameVersionFull: string
  timestamp: number
}

const allRegions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const satisfies readonly VehicleRegion[]

const versionsQuery = `
  select region, gameVersionFull, toUnixTimestamp(min(datetime)) as timestamp
  from GameVersions
  where region in ('RU', 'EU', 'NA', 'ASIA', 'CN')
  group by region, gameVersionFull
  order by region, timestamp, gameVersionFull
  limit 1000
`

export function useGameVersionAnnotations(
  visibility: ComputedRef<VersionAnnotationVisibility>, regions: ComputedRef<readonly VehicleRegion[]>) {
  const versions = queryComputed<GameVersionRow>(() =>
    Object.values(visibility.value).some(Boolean) ? versionsQuery : null,
    { settings: LONG_CACHE_SETTINGS })

  return computed<HistoryAnnotation[]>(() => {
    const selected = new Set(regions.value.length ? regions.value : allRegions)
    const seenVersions = new Set<string>()
    const seenPatches = new Set<string>()
    const show = visibility.value
    const multipleRegions = selected.size > 1
    const annotations: HistoryAnnotation[] = []

    for (const row of versions.value.data) {
      if (!selected.has(row.region)) continue

      const match = row.gameVersionFull.match(/^v\.(\d+)\.(\d+)\.(\d+)\.(\d+)\s+#(\d+)$/)
      if (!match) continue

      const version = `${match[1]}.${match[2]}`
      const patch = `${version}.${match[3]}`
      const versionKey = `${row.region}:${version}`
      const patchKey = `${row.region}:${patch}`
      const firstVersion = !seenVersions.has(versionKey)
      const firstPatch = !seenPatches.has(patchKey)
      seenVersions.add(versionKey)
      seenPatches.add(patchKey)
      const hasKnownHash = match[5] !== '0000'

      const kind = show.versions && firstVersion ? 'version'
        : show.patches && firstPatch ? 'patch'
          : show.micropatches && hasKnownHash ? 'micropatch' : null
      if (!kind) continue

      const name = kind === 'version' ? version : kind === 'patch' ? patch : `${patch}.${match[4]} #${match[5]}`
      const label = multipleRegions ? `[${row.region}] ${name}` : name
      annotations.push({
        timestamp: kind === 'micropatch' ? row.timestamp : Math.floor(row.timestamp / DAY) * DAY,
        label,
        kind,
      })
    }

    return annotations.sort((a, b) => a.timestamp - b.timestamp)
  })
}
