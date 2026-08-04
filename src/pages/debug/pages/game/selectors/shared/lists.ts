import { computed } from 'vue'
import { CACHE_SETTINGS, LONG_CACHE_SETTINGS, queryAsync, type Status } from '@/db'
import { selectTagArenasLocalization, selectTagVehiclesLocalization } from '@/shared/i18n/i18n'
import { arenaToHash } from '@/shared/game/selectors/arena/utils'
import type { Nation } from '@/shared/game/vehicles/nations/nations'
import type { OptionalRegionVersion } from '@/shared/game/selectors/gameVersionSelector/utils.ts'
import { versionToKey } from '@/shared/game/selectors/gameVersionSelector/utils.ts'

export type VehicleRow = {
  type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG',
  tag: string, level: number, short: string, name: string, region: string, nation: Nation
}

export type ArenaRow = {
  region: string, battleMode: string, battleGameplay: string,
  tag: string, name: string, gameVersion: string, season: string
}

export type VersionRow = { region: string, version: string }


const vehicles = queryAsync<VehicleRow>(`
with
    tanks as (select tag, type, level, role, nation, region, from LatestBattleVehicleInfo final),
    locals as (${selectTagVehiclesLocalization})
select tag, type, role, level, short, name, region, nation
from tanks
left any join locals using tag;
`, { settings: CACHE_SETTINGS })

const arenas = queryAsync<ArenaRow>(`
with
    arenas as (
      select region, battleMode, battleGameplay, splitByChar('/', arenaTag)[2] as tag, argMax(gameVersion, dateTime) as gameVersion
      from Event_OnBattleStart
      where region in ('RU', 'EU')
      group by arenaTag, region, battleGameplay, battleMode
    ),
    locals as (${selectTagArenasLocalization}),
    seasons as (select tag, season from ArenasLatest)
select region, battleMode, battleGameplay, tag, gameVersion, name, season
from arenas
left any join locals using tag
left any join seasons using tag
`, { settings: LONG_CACHE_SETTINGS })

const versions = queryAsync<VersionRow>(`
  select region, gameVersionFull as version
  from GameVersions
  group by region, gameVersionFull
`, { settings: CACHE_SETTINGS })

export const listStatuses = computed<{ title: string, status: Status, count: number }[]>(() => [
  { title: 'техника', status: vehicles.value.status, count: vehicles.value.data.length },
  { title: 'карты', status: arenas.value.status, count: arenas.value.data.length },
  { title: 'версии', status: versions.value.status, count: versions.value.data.length },
])

// Регион техники и карт: попапы показывают RU для Lesta и EU для WG.
export function regionForGame(game: string) {
  return game == 'mt' ? 'RU' : 'EU'
}

export const vehicleRows = computed(() => vehicles.value.data)

export const vehicleTags = computed(() => [...new Set(vehicles.value.data.map(v => v.tag))])

export const vehicleNames = computed(() => vehicles.value.data
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
