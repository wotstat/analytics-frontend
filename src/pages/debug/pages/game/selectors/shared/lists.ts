import { computed } from 'vue'
import { LONG_CACHE, MEDIUM_CACHE, queryAsync, type Status } from '@/db'
import { arenaToHash } from '@/shared/game/components/selectors/arena/utils'
import { vehicleCatalog, selectableVehicles, type SelectableVehicle } from '@/shared/game/domain/vehicles/catalog'
import type { OptionalRegionVersion } from '@/shared/game/components/selectors/gameVersionSelector/utils.ts'
import { versionToKey } from '@/shared/game/components/selectors/gameVersionSelector/utils.ts'

export type VehicleRow = Omit<SelectableVehicle, 'id' | 'role'>

export type ArenaRow = {
  region: string, battleMode: string, battleGameplay: string,
  tag: string, gameVersion: string
}

export type VersionRow = { region: string, version: string }


const arenas = queryAsync<ArenaRow>(`
select region, battleMode, battleGameplay, splitByChar('/', arenaTag)[2] as tag, argMax(gameVersion, dateTime) as gameVersion
from Event_OnBattleStart
where region in ('RU', 'EU')
group by arenaTag, region, battleGameplay, battleMode
`, { cache: LONG_CACHE, proxyCache: true })

const versions = queryAsync<VersionRow>(`
  select region, gameVersionFull as version
  from GameVersions
  group by region, gameVersionFull
`, { cache: MEDIUM_CACHE, proxyCache: true })

export const listStatuses = computed<{ title: string, status: Status, count: number }[]>(() => [
  { title: 'техника', status: vehicleCatalog.value.status, count: selectableVehicles.value.length },
  { title: 'карты', status: arenas.value.status, count: arenas.value.data.length },
  { title: 'версии', status: versions.value.status, count: versions.value.data.length },
])

// Регион техники и карт: попапы показывают RU для Lesta и EU для WG.
export function regionForGame(game: string) {
  return game == 'mt' ? 'RU' : 'EU'
}

export const vehicleRows = computed(() => selectableVehicles.value)

export const vehicleTags = computed(() => [...new Set(selectableVehicles.value.map(v => v.tag))])

export const vehicleNames = computed(() => selectableVehicles.value
  .filter(v => v.region == 'RU' && v.name)
  .map(v => ({ tag: v.tag, name: v.name, short: v.short })))

export const arenaRows = computed(() => arenas.value.data)

export const arenaHashes = computed(() => [...new Set(arenas.value.data.map(a => a.tag))]
  .map(tag => arenaToHash({ tag, team: 'any' })))

export const versionRows = computed(() => versions.value.data)

// Тот же разбор, что в GameVersionPopup: 'v.1.44.0.1 #1580' → уровни версии / патча / микропатча.
export function parseGameVersion(version: string) {
  const parts = version.match(/v\.(\d+)\.(\d+)\.(\d+)\.(\d+).*#(\d+)/)
  if (!parts) return null

  const [, major, minor, patch, micro, hash] = parts
  return {
    version: `${major}.${minor}`,
    patch: `${major}.${minor}.${patch}`,
    micro: `${major}.${minor}.${patch}.${micro} #${hash}`,
  }
}

export const versionTags = computed(() => {
  const result = { versions: new Set<string>(), patches: new Set<string>(), micro: new Set<string>() }

  for (const row of versions.value.data) {
    const parsed = parseGameVersion(row.version)
    if (!parsed) continue
    result.versions.add(parsed.version)
    result.patches.add(parsed.patch)
    result.micro.add(parsed.micro)
  }

  return { versions: [...result.versions], patches: [...result.patches], micro: [...result.micro] }
})

export const versionSelections = computed(() => {
  const result: Record<'versions' | 'patches' | 'micro', OptionalRegionVersion[]> = {
    versions: [],
    patches: [],
    micro: [],
  }
  const seen: Record<'versions' | 'patches' | 'micro', Set<string>> = {
    versions: new Set(),
    patches: new Set(),
    micro: new Set(),
  }

  function add(kind: keyof typeof result, value: OptionalRegionVersion) {
    const key = versionToKey(value)
    if (seen[kind].has(key)) return

    seen[kind].add(key)
    result[kind].push(value)
  }

  for (const row of versions.value.data) {
    const parsed = parseGameVersion(row.version)
    if (!parsed) continue

    add('versions', { region: row.region, version: parsed.version })
    add('patches', { region: row.region, version: parsed.patch })
    add('micro', { region: row.region, version: parsed.micro })
  }

  return result
})

// Детерминированная выборка: на дебаг-странице нужен повторяемый набор, а не случайный.
export function take<T>(list: readonly T[], count: number) {
  return list.slice(0, count)
}
