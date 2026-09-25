import { computed, type ComputedRef } from 'vue'
import { LONG_CACHE_SETTINGS, queryComputed } from '@/db'
import type { VehicleRegion } from '../filters/types'
import { DAY } from './timeLabels'
import { historyDayStart } from './historyStep'
import type { VersionAnnotationVisibility } from './useHistoryAnnotationSettings'

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
  visibility: ComputedRef<VersionAnnotationVisibility>, regions: ComputedRef<readonly VehicleRegion[]>,
  { includeTooltipVersion = false }: { includeTooltipVersion?: boolean } = {}) {
  const versions = queryComputed<GameVersionRow>(() =>
    includeTooltipVersion || Object.values(visibility.value).some(Boolean) ? versionsQuery : null,
    { settings: LONG_CACHE_SETTINGS })
  const selectedRegions = computed(() => regions.value.length ? regions.value : allRegions)

  const annotations = computed<HistoryAnnotation[]>(() => {
    const selected = new Set(selectedRegions.value)
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

  function versionForPeriod(periodEnd: string): string | null {
    const endExclusive = historyDayStart(periodEnd) + DAY
    const selected = new Set(selectedRegions.value)
    const latest = new Map<VehicleRegion, GameVersionRow>()

    for (const row of versions.value.data) {
      if (!selected.has(row.region) || row.timestamp >= endExclusive) continue

      const previous = latest.get(row.region)
      if (!previous || row.timestamp >= previous.timestamp) latest.set(row.region, row)
    }

    const labels = selectedRegions.value.flatMap(region => {
      const row = latest.get(region)
      if (!row) return []

      const version = row.gameVersionFull.replace(/^v\./, '')
      const label = version.endsWith('#0000') ? version.replace(/\.\d+\s+#0000$/, '') : version
      return [selected.size > 1 ? `[${region}] ${label}` : label]
    })

    return labels.length ? labels.join(' · ') : null
  }

  return { annotations, versionForPeriod }
}
