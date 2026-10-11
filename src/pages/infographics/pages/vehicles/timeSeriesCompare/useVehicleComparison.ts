import { computed, type Ref } from 'vue'
import { useQueryStorage, type QueryParam, type QueryValues } from '@/shared/uiKit/queryStorage/useQueryStorage'
import type { VehicleFilters } from '../filters/types'
import { vehicleQueryParams } from '../filters/useVehicleQueryStorage'
import type { VehicleStatistics } from '../shared/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'
import type { ComparisonCandidate, ComparisonSource } from './types'
import { comparisonFiltersKey, snapshotComparisonFilters } from './utils/comparisonFilters'
import { categoryRowKey, comparisonRowKey } from './utils/comparisonRowKey'
import type { ComparisonTarget, SavedComparisonSource } from './query/state'
import { comparisonSettingsParams, type ComparisonSettings } from './query/settings'
import { deserializeComparison, serializeComparison } from './query/codec/codec'
import { comparisonAnnotationsParam, comparisonAnnotationState, comparisonAnnotationKeys } from './query/annotations'
import { comparisonColor, comparisonPalette } from './query/palette'
import { vehicleCompactor, vehicleCompactLabel } from '@/shared/game/encoding/vehicles'
import { arenaCompactor } from '@/shared/game/encoding/arenas'
import { singleRegion } from '@/shared/game/domain/regions'
import type { VehicleType } from '@/shared/game/domain/vehicles/types'

function sourceTag(source: SavedComparisonSource) {
  const target = source.target
  const filtersKey = comparisonFiltersKey(source.filters)
  if ('tank' in target) return JSON.stringify([target.tank, filtersKey])
  return JSON.stringify([comparisonRowKey(categoryRowKey(target.category), target.selection), filtersKey])
}

function createTarget(vehicle: VehicleStatistics, selection: VehicleSelection): ComparisonTarget {
  if (selection.tankTag) return { tank: selection.tankTag }
  return {
    category: { level: vehicle.tankLevel ?? undefined, type: (vehicle.tankType ?? undefined) as VehicleType | undefined },
    selection: {
      levels: [...selection.levels].sort((a, b) => a - b),
      types: [...selection.types].sort(),
      nations: [...selection.nations].sort(),
    },
  }
}

type ComparisonContext = Pick<QueryValues<typeof vehicleQueryParams>, keyof VehicleFilters>

function comparisonContext(context?: ComparisonContext): VehicleFilters | undefined {
  if (!context) return undefined
  return { ...context, regions: [...context.regions], arenas: [...context.arenas] }
}

const compareParam = {
  key: 'vehicles.compare',
  priority: -10,
  default: [] as SavedComparisonSource[],
  serialize: (sources: SavedComparisonSource[], context?: ComparisonContext) => serializeComparison(sources, comparisonContext(context)),
  deserialize: (raw: string, context?: ComparisonContext) => deserializeComparison(raw, comparisonContext(context)),
  context: {
    regions: vehicleQueryParams.regions,
    battleModes: vehicleQueryParams.battleModes,
    arenas: vehicleQueryParams.arenas,
    platoon: vehicleQueryParams.platoon,
    result: vehicleQueryParams.result,
    battleLevel: vehicleQueryParams.battleLevel,
  },
  history: 'replace',
  debounce: 150,
} satisfies QueryParam<SavedComparisonSource[], ComparisonContext>

export function useVehicleComparison(filters: Ref<VehicleFilters>) {
  const storage = useQueryStorage({
    compare: compareParam,
    ...comparisonSettingsParams,
    annotations: comparisonAnnotationsParam,
  }, { history: 'replace', debounce: 150 })
  const { compare: savedSources, annotations: annotationKeys, slot, step, averageWindow } = storage.params
  const annotations = computed({
    get: () => comparisonAnnotationState(annotationKeys.value),
    set: value => { annotationKeys.value = comparisonAnnotationKeys(value) },
  })

  function createResolver(source: SavedComparisonSource) {
    const region = () => singleRegion(source.filters.regions)
    return {
      arenas: computed(() => arenaCompactor.expandMany(source.filters.arenas, region())),
      tank: computed(() => vehicleCompactor.expand('tank' in source.target ? source.target.tank : '', region())),
    }
  }

  const resolvers = new WeakMap<SavedComparisonSource, ReturnType<typeof createResolver>>()
  function resolver(source: SavedComparisonSource) {
    const cached = resolvers.get(source)
    if (cached) return cached
    const result = createResolver(source)
    resolvers.set(source, result)
    return result
  }

  const sources = computed<readonly ComparisonSource[]>(() => {
    const sampleNumbers = new Map<string, number>()

    return savedSources.value.map(source => {
      const resolved = resolver(source)
      const arenas = resolved.arenas.value
      const sourceFilters: VehicleFilters = {
        ...source.filters,
        arenas: arenas.status === 'ready' ? arenas.value : source.filters.arenas.map(String),
      }

      const filtersKey = comparisonFiltersKey(sourceFilters)
      const sampleNumber = sampleNumbers.get(filtersKey) ?? sampleNumbers.size + 1
      sampleNumbers.set(filtersKey, sampleNumber)

      const base = {
        tag: sourceTag(source),
        filters: sourceFilters,
        color: comparisonColor(source.color),
        enabled: source.enabled,
        sampleNumber,
      }

      const tank = 'tank' in source.target ? resolved.tank.value : null
      const unavailable = [arenas, tank].find(value => value?.status === 'unresolved') ?? [arenas, tank].find(value => value?.status === 'loading')

      if (unavailable) {
        let name = 'Загрузка…'
        let resolution: ComparisonSource['resolution'] = 'loading'
        if (unavailable.status === 'unresolved') {
          name = 'Источник из ссылки'
          if ('tank' in source.target) name = `Танк ${vehicleCompactLabel(source.target.tank)}`
          resolution = unavailable.reason === 'error' ? 'error' : 'missing'
        }

        return {
          ...base,
          rowKey: 'tank' in source.target ? `vehicle:${source.target.tank}` : categoryRowKey(source.target.category),
          selection: null,
          name,
          resolution,
        }
      }

      if (tank?.status === 'ready') {
        const tag = tank.value
        return {
          ...base,
          rowKey: tag,
          selection: { tankTag: tag, levels: [], types: [], nations: [] },
          name: vehicleName({ tankTag: tag, tankLevel: null, tankType: null }),
        }
      }

      if ('tank' in source.target) throw new Error('Comparison vehicle has not been resolved')
      const { category, selection } = source.target

      return {
        ...base,
        rowKey: categoryRowKey(category),
        selection,
        name: vehicleName({ tankTag: null, tankLevel: category.level ?? null, tankType: category.type ?? null }),
      }
    })
  })

  const settings = computed<ComparisonSettings>({
    get: () => ({
      slot: slot.value,
      step: step.value,
      averageWindow: averageWindow.value,
    }),
    set: value => storage.patch(value),
  })

  const currentFiltersKey = computed(() => comparisonFiltersKey(filters.value))
  const comparedKeys = computed(() => sources.value
    .filter(source => source.selection && comparisonFiltersKey(source.filters) === currentFiltersKey.value)
    .map(source => comparisonRowKey(source.rowKey, source.selection!)))

  function candidateKey(vehicle: VehicleStatistics, selection: VehicleSelection) {
    return comparisonRowKey(vehicle.rowKey, selection)
  }

  function toggle(vehicle: VehicleStatistics, selection: VehicleSelection) {
    const key = candidateKey(vehicle, selection)
    const existing = sources.value.find(source => source.selection
      && comparisonRowKey(source.rowKey, source.selection) === key
      && comparisonFiltersKey(source.filters) === currentFiltersKey.value)

    if (existing) return remove(existing.tag)
    addMany([{ vehicle, selection }])
  }

  function addMany(candidates: readonly ComparisonCandidate[]) {
    const keys = new Set(comparedKeys.value)
    const colors = new Set(sources.value.map(source => source.color))
    const additions: SavedComparisonSource[] = []

    for (const { vehicle, selection } of candidates) {
      const key = candidateKey(vehicle, selection)
      if (keys.has(key)) continue
      keys.add(key)

      const unused = comparisonPalette.findIndex(color => !colors.has(color))
      const color = unused >= 0 ? unused : savedSources.value.length + additions.length
      colors.add(comparisonColor(color))

      additions.push({
        target: createTarget(vehicle, selection),
        color,
        enabled: true,
        filters: snapshotComparisonFilters(filters.value),
      })
    }

    if (additions.length) savedSources.value.push(...additions)
  }

  function remove(tag: string) {
    savedSources.value = savedSources.value.filter(source => sourceTag(source) !== tag)
  }

  function setColor(tag: string, color: string) {
    const source = savedSources.value.find(source => sourceTag(source) === tag)
    if (!source || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(color)) return
    source.color = color.toLowerCase()
  }

  function setDisabled(tags: readonly string[]) {
    const disabled = new Set(tags)
    for (const source of savedSources.value) source.enabled = !disabled.has(sourceTag(source))
  }

  function clear() { savedSources.value = [] }

  return { sources, settings, annotations, comparedKeys, toggle, addMany, remove, setColor, setDisabled, clear }
}
