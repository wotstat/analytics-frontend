import { Reader, Writer, invalid } from '@/shared/utils/encoding/compactBinary'
import { sameSet, uniqueSorted } from '@/shared/utils/collections'
import { vehicleCompactor } from '@/shared/game/encoding/vehicles'
import { vehicleCategoryCompactor, type VehicleCategory } from '@/shared/game/encoding/vehicleCategories'
import { nationMask, vehicleLevelMask, vehicleTypeMask } from '@/shared/game/encoding/masks'
import { singleRegion } from '@/shared/game/domain/regions'
import type { ComparisonTarget, SavedComparisonSource } from '../state'
import { comparisonFiltersKey, snapshotComparisonFilters } from '../../utils/comparisonFilters'
import type { FilterTable } from './filters'
import { compactColor, writeColor, readColor } from './colors'
import { MAX_SOURCES } from './limits'

// Первые три выключенные линии: биты 2, 3 и 0 заголовка.
const INLINE_DISABLED_FLAGS = [4, 8, 1] as const
const DISABLED_MASK_FLAG = 16

// До 152 — категории техники, 152/153 — строка/категория с дополнительными полями.
// Начиная со 154 идут танки: (компактный ID + 77) * 2 + признак дополнительных полей.
const TAG_WITH_EXTRAS = 152
const CATEGORY_WITH_EXTRAS = 153
const TANK_OFFSET = 77

function categorySelection({ level, type }: VehicleCategory) {
  return { levels: level === undefined ? [] : [level], types: type === undefined ? [] : [type], nations: [] }
}

function selectionFlags(target: ComparisonTarget) {
  if ('tank' in target) return 0
  const base = categorySelection(target.category)
  return Number(!sameSet(target.selection.levels, base.levels)) << 1
    | Number(!sameSet(target.selection.types, base.types)) << 2
    | Number(!sameSet(target.selection.nations, base.nations)) << 3
}

function writeTarget(output: Writer, target: ComparisonTarget, extras: boolean, region?: string) {
  if ('tank' in target) {
    let tank = target.tank
    if (typeof tank === 'number') {
      const expanded = vehicleCompactor.expand(tank, region)
      if (expanded.status === 'ready') tank = expanded.value
    }

    if (typeof tank === 'string') tank = vehicleCompactor.compact(tank, region)
    if (typeof tank === 'number') return output.uint((tank + TANK_OFFSET) * 2 + Number(extras))
    output.uint(extras ? TAG_WITH_EXTRAS : 0)
    output.string(tank)
    return
  }

  if (extras) output.uint(CATEGORY_WITH_EXTRAS)
  output.uint(vehicleCategoryCompactor.compact(target.category))
}

function readTarget(input: Reader): { target: ComparisonTarget, extras: boolean } {
  const token = input.uint()
  if (token > CATEGORY_WITH_EXTRAS) {
    const tank = Math.floor(token / 2) - TANK_OFFSET
    return { target: { tank }, extras: !!(token & 1) }
  }

  if (token === 0 || token === TAG_WITH_EXTRAS) {
    return { target: { tank: input.string(/^[a-z]+:[\w-]+$/) }, extras: token === TAG_WITH_EXTRAS }
  }

  const extras = token === CATEGORY_WITH_EXTRAS
  const category = vehicleCategoryCompactor.expand(extras ? input.uint(151) : token)
  return { target: { category, selection: categorySelection(category) }, extras }
}

export function writeSources(output: Writer, sources: readonly SavedComparisonSource[], references: readonly number[]): number {
  let flags = 0
  sources.slice(0, INLINE_DISABLED_FLAGS.length).forEach((source, index) => {
    if (!source.enabled) flags |= INLINE_DISABLED_FLAGS[index]
  })
  const disabled = sources.slice(INLINE_DISABLED_FLAGS.length).map(source => !source.enabled)
  if (disabled.some(Boolean)) {
    flags |= DISABLED_MASK_FLAG
    output.bitset(disabled)
  }

  sources.forEach((source, index) => {
    const filter = references[index]
    const color = compactColor(source.color, index)
    const isTank = 'tank' in source.target
    const fields = isTank ? color.kind : Number(!!color.kind) | selectionFlags(source.target)
    const extras = filter * 16 | fields
    writeTarget(output, source.target, !!extras, singleRegion(source.filters.regions))
    if (!extras) return

    output.uint(extras)
    writeColor(output, color, isTank)
    if (!('selection' in source.target)) return

    const selection = source.target.selection
    if (extras & 2) output.uint(vehicleLevelMask.compact(selection.levels))
    if (extras & 4) output.uint(vehicleTypeMask.compact(selection.types))
    if (extras & 8) output.uint(nationMask.compact(selection.nations))
  })

  return flags
}

export function readSources(input: Reader, filters: FilterTable, flags: number): SavedComparisonSource[] {
  const sources: SavedComparisonSource[] = []
  let disabled: boolean[] = []
  if (flags & DISABLED_MASK_FLAG) {
    disabled = input.bitset(MAX_SOURCES - INLINE_DISABLED_FLAGS.length)
    if (!disabled.some(Boolean)) return invalid()
  }

  while (!input.done) {
    if (sources.length === MAX_SOURCES) return invalid()
    const index = sources.length
    const { target, extras: hasExtras } = readTarget(input)

    let filter = 0
    let color: number | string = index
    if (hasExtras) {
      const extras = input.uint((filters.length - 1) * 16 + 15)
      const fields = extras & 15
      if (!extras || ('tank' in target && fields > 3)) return invalid()
      filter = Math.floor(extras / 16)
      if ('tank' in target && fields) color = readColor(input, fields)
      if ('selection' in target) {
        if (extras & 1) color = readColor(input)
        if (extras & 2) target.selection.levels = vehicleLevelMask.expand(input.uint())
        if (extras & 4) target.selection.types = vehicleTypeMask.expand(input.uint())
        if (extras & 8) target.selection.nations = nationMask.expand(input.uint())
      }
    }

    const isDisabled = index < INLINE_DISABLED_FLAGS.length
      ? !!(flags & INLINE_DISABLED_FLAGS[index]) : !!disabled[index - INLINE_DISABLED_FLAGS.length]
    const sourceFilters = snapshotComparisonFilters(filters[filter])
    if ('tank' in target) {
      const expanded = vehicleCompactor.expand(target.tank, singleRegion(sourceFilters.regions))
      if (expanded.status === 'unresolved' && expanded.reason === 'invalid') return invalid()
    }
    sources.push({ target, color, filters: sourceFilters, enabled: !isDisabled })
  }

  if (INLINE_DISABLED_FLAGS.slice(sources.length).some(flag => flags & flag)) return invalid()
  const tailSources = Math.max(0, sources.length - INLINE_DISABLED_FLAGS.length)
  if (disabled.slice(tailSources).some(Boolean)) return invalid()

  const keys = sources.map(({ target, filters }) => {
    const key = 'tank' in target ? target.tank : [
      vehicleCategoryCompactor.compact(target.category),
      uniqueSorted(target.selection.levels), uniqueSorted(target.selection.types), uniqueSorted(target.selection.nations),
    ]
    return JSON.stringify([key, comparisonFiltersKey(filters)])
  })
  if (new Set(keys).size !== keys.length) return invalid()

  return sources
}
