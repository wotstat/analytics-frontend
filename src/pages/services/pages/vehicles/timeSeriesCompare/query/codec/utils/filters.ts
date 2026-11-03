import { Reader, Writer, compactMask, expandMask, invalid } from '@/shared/utils/encoding/compactBinary'
import { sameSet, uniqueSorted } from '@/shared/utils/collections'
import { battleModeCompactor } from '@/shared/game/encoding/battleModes/battleModes'
import type { TagCompactor } from '@/shared/game/encoding/utils/types'
import { unpackRegionalId } from '@/shared/game/encoding/utils/regionalIdPacking'
import { singleRegion } from '@/shared/game/domain/regions'
import { vehicleRegions, type VehicleFilters } from '../../../../filters/types'
import type { SavedComparisonFilters } from '../../state'
import { snapshotComparisonFilters } from '../../../utils/comparisonFilters'
import { binaryLimits, MAX_ITEMS, MAX_SOURCES } from './limits'

const platoons = ['any', 'solo', 'duo', 'trio', 'large'] as const
const results = ['any', 'win', 'loss', 'draw'] as const
const battleLevels = ['any', 'same', 'top', 'middle', 'bottom'] as const
// Биты 0..6 соответствуют постоянным коротким кодам режимов, а не порядку UI.
const maskedBattleModes = [0, 1, 2, 3, 4, 5, 6] as const

export type FilterTable = readonly SavedComparisonFilters[]

function filterMask(filters: SavedComparisonFilters, base: VehicleFilters) {
  return Number(!sameSet(filters.regions, base.regions))
    | Number(!sameSet(filters.battleModes, base.battleModes)) << 1
    | Number(!sameSet(filters.arenas, base.arenas)) << 2
    | Number(filters.platoon !== base.platoon) << 3
    | Number(filters.result !== base.result) << 4
    | Number(filters.battleLevel !== base.battleLevel) << 5
}

function writeBattleModes(output: Writer, values: SavedComparisonFilters['battleModes']) {
  const modes = uniqueSorted(values).map(value => battleModeCompactor.compact(value))
  if (modes.every(mode => typeof mode === 'number' && mode >= 0 && mode < maskedBattleModes.length)) {
    output.byte(compactMask(modes, maskedBattleModes))
    return
  }
  if (modes.length > MAX_ITEMS) return invalid()

  // 128..254 — список из 1..127 атомов; 255 — далее полная длина списка (128+).
  output.byte(127 + Math.min(modes.length, 128))
  if (modes.length >= 128) output.uint(modes.length)
  for (const mode of modes) output.atom(mode)
}

function readBattleModes(input: Reader): SavedComparisonFilters['battleModes'] {
  const descriptor = input.byte()
  let modes: (number | string)[]
  if (descriptor < 128) modes = expandMask(descriptor, maskedBattleModes)
  else {
    const length = descriptor === 255 ? input.uint(MAX_ITEMS) : descriptor - 127
    if (descriptor === 255 && length < 128) return invalid()
    modes = Array.from({ length }, () => input.atom())
  }

  return modes.map(mode => {
    const expanded = battleModeCompactor.expand(mode)
    if (expanded.status === 'ready') return expanded.value
    return invalid()
  })
}

function encodeFilters(filters: SavedComparisonFilters, base: VehicleFilters, arenaCompactor: TagCompactor): Uint8Array | undefined {
  const region = singleRegion(filters.regions)
  const normalized = {
    ...filters,
    arenas: filters.arenas.map(value => {
      const expanded = arenaCompactor.expand(value, region)
      return expanded.status === 'ready' ? expanded.value : value
    }),
  }
  const flags = filterMask(normalized, base)
  if (!flags) return undefined

  const output = new Writer(binaryLimits)
  output.uint(flags)
  if (flags & 1) output.uint(compactMask(normalized.regions, vehicleRegions))
  if (flags & 2) writeBattleModes(output, normalized.battleModes)
  if (flags & 4) output.list(uniqueSorted(normalized.arenas), arena => {
    output.atom(typeof arena === 'number' ? arena : arenaCompactor.compact(arena, region))
  }, MAX_ITEMS)
  if (flags & 8) output.uint(platoons.indexOf(normalized.platoon))
  if (flags & 16) output.uint(results.indexOf(normalized.result))
  if (flags & 32) output.uint(battleLevels.indexOf(normalized.battleLevel))
  return output.finish()
}

function readFilters(input: Reader, base: VehicleFilters, flags = input.uint(63)): SavedComparisonFilters {
  const filters: SavedComparisonFilters = snapshotComparisonFilters(base)
  if (flags & 1) filters.regions = expandMask(input.uint(), vehicleRegions)
  if (flags & 2) filters.battleModes = readBattleModes(input)
  if (flags & 4) filters.arenas = input.list(() => {
    const value = input.atom()
    if (typeof value === 'number' && !unpackRegionalId(value)) return invalid()
    if (typeof value === 'string' && !/^[\w-]+$/.test(value)) return invalid()
    return value
  }, MAX_ITEMS)
  if (flags & 8) filters.platoon = platoons[input.uint(platoons.length - 1)]
  if (flags & 16) filters.result = results[input.uint(results.length - 1)]
  if (flags & 32) filters.battleLevel = battleLevels[input.uint(battleLevels.length - 1)]
  return filters
}

export function writeFilterTable(output: Writer, filters: readonly SavedComparisonFilters[], base: VehicleFilters, arenaCompactor: TagCompactor) {
  const entries: Uint8Array[] = []
  const keys = new Map<string, number>()
  const references = filters.map(value => {
    const bytes = encodeFilters(value, base, arenaCompactor)
    if (!bytes) return 0

    const key = bytes.join(',')
    const cached = keys.get(key)
    if (cached !== undefined) return cached

    entries.push(bytes)
    keys.set(key, entries.length)
    return entries.length
  })

  const present = entries.length > 0
  const common = present && references.every(ref => ref === references[0])
  // 1..63 — маска единого набора; 65+ — число наборов для ссылок источников.
  if (present && !common) output.uint(64 + entries.length)
  for (const bytes of entries) output.raw(bytes)
  return { present, references: common ? references.map(() => 0) : references }
}

export function readFilterTable(input: Reader, base: VehicleFilters): FilterTable {
  const descriptor = input.uint(64 + MAX_SOURCES)
  if (!descriptor || descriptor === 64) return invalid()
  if (descriptor < 64) return [readFilters(input, base, descriptor)]

  const values: SavedComparisonFilters[] = [base]
  for (let i = 0; i < descriptor - 64; i++) values.push(readFilters(input, base))
  return values
}
