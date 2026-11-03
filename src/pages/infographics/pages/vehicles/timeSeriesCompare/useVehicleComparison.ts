import { computed, type Ref } from 'vue'
import { useQueryStorage, type QueryParam, type QueryValues } from '@/shared/uiKit/queryStorage/useQueryStorage'
import type { VehicleFilters } from '../filters/types'
import { vehicleQueryParams } from '../filters/useVehicleQueryStorage'
import type { SavedComparisonSource } from './query/state'
import { comparisonSettingsParams, type ComparisonSettings } from './query/settings'
import { deserializeComparison } from './query/codec/codec'
import { serializeComparison } from './query/codec/serialize'
import { comparisonAnnotationsParam, comparisonAnnotationState, comparisonAnnotationKeys } from './query/annotations'
import { useComparisonSources } from './utils/useComparisonSources'

type ComparisonContext = Pick<QueryValues<typeof vehicleQueryParams>, keyof VehicleFilters>

function comparisonContext(context?: ComparisonContext): VehicleFilters | undefined {
  if (!context) return undefined
  return { ...context, regions: [...context.regions], arenas: [...context.arenas] }
}

const compareParam = {
  label: 'compare',
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

const comparisonSettingsAvailability = {
  context: { compare: compareParam },
  enabled: ({ compare }: { compare: SavedComparisonSource[] }) => compare.length > 0,
}

export function useVehicleComparison(filters: Ref<VehicleFilters>) {
  const storage = useQueryStorage({
    slot: { ...comparisonSettingsParams.slot, ...comparisonSettingsAvailability },
    step: { ...comparisonSettingsParams.step, ...comparisonSettingsAvailability },
    averageWindow: { ...comparisonSettingsParams.averageWindow, ...comparisonSettingsAvailability },
    annotations: { ...comparisonAnnotationsParam, ...comparisonSettingsAvailability },
    compare: compareParam,
  }, { history: 'replace', debounce: 150 })
  const { compare: savedSources, annotations: annotationKeys, slot, step, averageWindow } = storage.params
  const annotations = computed({
    get: () => comparisonAnnotationState(annotationKeys.value),
    set: value => { annotationKeys.value = comparisonAnnotationKeys(value) },
  })

  const settings = computed<ComparisonSettings>({
    get: () => ({
      slot: slot.value,
      step: step.value,
      averageWindow: averageWindow.value,
    }),
    set: value => storage.patch(value),
  })

  return { ...useComparisonSources(filters, savedSources), settings, annotations }
}
