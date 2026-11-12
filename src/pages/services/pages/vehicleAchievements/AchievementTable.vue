<template>
  <section ref="table" class="achievement-table"
    :class="{ 'stacked-deltas': stackedDeltas, 'compact-toolbar': compactToolbar }">
    <div class="toolbar">
      <SearchLine v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters v-model="localFilters" grouping="tanks" :available-nations="availableNations"
        :show-thresholds="false" />
      <div class="settings">
        <label v-if="deltaPeriod !== 'none'" class="delta-sort">
          <input v-model="sortByDelta" type="checkbox">
          {{ compactToolbar ? 'По приросту' : 'Сортировать по приросту' }}
        </label>
        <OptionsSelect v-model="deltaPeriod" :options="displayedDeltaOptions" align="right" class="delta-period" />
        <VehicleTableSettings appearance-only v-model:show-value-bars="showValueBars"
          v-model:extended-palette="extendedPalette" v-model:pin-compared="pinCompared" />
      </div>
    </div>

    <ComposableTable v-model:expanded-rows="expandedRows" class="achievement-stats" :columns
      :rows="status === success ? displayedVehicles : []" :row-key="vehicle => vehicle.rowKey"
      :sort="sorting.sortOrders.value" :loading="status === loading" @sort="onSort" @cell-click="onCellClick">
      <template #header-compare>
        <VehicleCompareButton v-if="bulkComparisonTotal <= MAX_BULK_COMPARISON_LINES" class="compare-all"
          :disabled="status !== success || !comparisonCandidates.length"
          v-tooltip="'Добавить все танки к сравнению'" @click="compareAll" />
      </template>
      <template #header-expand><span></span></template>
      <template #header-tankLevel><span>Ур.</span></template>
      <template #header-tankType><VehicleType type="any" class="type-heading" /></template>
      <template #header-name><Icon icon="tank" class="heading-icon" /></template>
      <template #header="{ column }">
        <template v-if="column.metric">
          <Icon :icon="availableSlots[column.metric].icon" class="heading-icon" />
          <span class="metric-caption">
            {{ availableSlots[column.metric].headingLabel }}
          </span>
        </template>
      </template>

      <template #cell-compare="{ row }">
        <VehicleCompareButton :compared="isCompared(row)"
          @click.stop="emit('compare', row, selectionFor(row))" />
      </template>
      <template #cell-expand="{ expanded }">
        <DropdownArrow class="arrow" :expanded horizontal angle="large" />
      </template>
      <template #cell-tankLevel="{ row }">{{ row.tankLevel === null ? '—' : romanNumberProcessor(row.tankLevel) }}</template>
      <template #cell-tankType="{ row }">
        <VehicleType :type="row.tankType && isVehicleType(row.tankType) ? row.tankType : 'any'" class="vehicle-type" />
      </template>
      <template #cell-name="{ row }">
        <VehicleNameCell :vehicle="row" :search :show-image="showImage" :show-tooltip="false" />
      </template>
      <template #cell="{ row, column, value }">
        <span v-if="showValueBars && column.metric && Number.isFinite(row[column.metric])" class="value-bar"
          :style="valueBarStyle(row, column.metric)"></span>
        <span class="metric-content" :class="{ 'with-bar': showValueBars }">
          <span class="metric-value">{{ value ?? '—' }}</span>
          <AchievementDelta v-if="column.metric && deltaPeriod !== 'none'" class="metric-delta"
            :value="achievementDelta(row, column.metric, deltaPeriod)" />
        </span>
      </template>

      <template #expanded="{ row }">
        <AchievementHistory :kind :sources="[historySource(row)]" :filters :before-day compact
          v-model:step="historyStep" v-model:average-window="averageWindow">
          <template v-if="!showCompare" #actions>
            <VehicleCompareButton class="history-compare" :compared="isCompared(row)"
              @click.stop="emit('compare', row, selectionFor(row))" />
          </template>
        </AchievementHistory>
      </template>

      <template #loading>
        <div class="state">
          <Loader class="loader" />
          <span>Загрузка планок техники…</span>
        </div>
      </template>
      <template #empty>
        <div v-if="isErrorStatus(status)" class="state">
          <span>Не удалось загрузить планки техники</span>
          <button class="text-button" @click="emit('retry')">Попробовать ещё раз</button>
        </div>
        <div v-else class="state">{{ vehicles.length ? 'Танки не найдены' : 'В выбранном регионе пока нет данных' }}</div>
      </template>
      <template #footer>
        <button v-if="status === success && displayedVehicles.length < filteredVehicles.length"
          class="show-more text-button" @click="displayLimit += PAGE_SIZE">
          Показать ещё {{ Math.min(PAGE_SIZE, filteredVehicles.length - displayLimit) }}
        </button>
      </template>
    </ComposableTable>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useElementSize, useLocalStorage } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/components/vehicles/vehicleType/VehicleType.vue'
import { isVehicleType } from '@/shared/game/components/vehicles/vehicleType/vehicleTypeToImage'
import { mtNations, wotNations, type Nation } from '@/shared/game/domain/vehicles/nations'
import { regionToGame } from '@/shared/game/domain/wot'
import { createVehicleNameFilter } from '@/shared/game/components/vehicles/vehicleSearch'
import SearchLine from '@/shared/game/components/selectors/components/searchLine/SearchLine.vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableCellEvent, ComposableTableColumn, ComposableTableKey } from '@/shared/ui/composableTable/types'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import OptionsSelect from '@/shared/ui/optionsSelect/OptionsSelect.vue'
import type { SelectOption } from '@/shared/ui/optionsSelect/types'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleFilters } from '../vehicles/filters/types'
import type { VehicleStatisticsRow } from '../vehicles/shared/types'
import { vehicleHistorySelection, type VehicleSelection, type VehicleGrouping } from '../vehicles/shared/vehicleGrouping'
import { vehicleName } from '../vehicles/shared/vehicleName'
import type { LocalVehicleFilters } from '../vehicles/vehicleListTable/filters/localFilters'
import VehicleListFilters from '../vehicles/vehicleListTable/filters/VehicleListFilters.vue'
import VehicleCompareButton from '../vehicles/vehicleListTable/comparison/VehicleCompareButton.vue'
import VehicleNameCell from '../vehicles/vehicleListTable/VehicleNameCell.vue'
import VehicleTableSettings from '../vehicles/vehicleListTable/settings/VehicleTableSettings.vue'
import { useVehicleValueBars } from '../vehicles/vehicleListTable/utils/useVehicleValueBars'
import { useVehicleTableAppearance } from '../vehicles/vehicleListTable/utils/useVehicleTableAppearance'
import { COMPARE_MIN_TABLE_WIDTH, EXPAND_MIN_TABLE_WIDTH, vehicleColumns, vehicleNameColumn } from '../vehicles/vehicleListTable/utils/columns'
import { useVehicleSorting, type SortKey, type SortOrder } from '../vehicles/vehicleListTable/utils/useVehicleSorting'
import { availableSlots, type Slot } from '../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { formatSlotValue } from '../vehicles/vehicleMetricSelector/utils/formatMetricValue'
import type { ComparisonCandidate, ComparisonSource } from '../vehicles/timeSeriesCompare/types'
import { comparisonRowKey } from '../vehicles/timeSeriesCompare/utils/comparisonRowKey'
import type { HistoryStep, HistoryAverageWindow } from '../vehicles/timeSeries/period/historyStep'
import AchievementHistory from './history/AchievementHistory.vue'
import AchievementDelta from './AchievementDelta.vue'
import { achievementDelta, achievements, type AchievementKind, type AchievementDeltaSelection, type AchievementStatisticsRow } from './utils/achievements'

const props = defineProps<{
  kind: AchievementKind
  vehicles: AchievementStatisticsRow[]
  status: Status
  filters: VehicleFilters
  beforeDay: string
  comparedKeys: string[]
  comparisonCount: number
}>()
const emit = defineEmits<{
  compare: [vehicle: VehicleStatisticsRow, selection: VehicleSelection]
  compareAll: [candidates: ComparisonCandidate[]]
  retry: []
}>()
const search = defineModel<string>('search', { required: true })
const localFilters = defineModel<LocalVehicleFilters>('localFilters', { required: true })
const sort = defineModel<SortOrder[]>('sort', { required: true })
const deltaPeriod = defineModel<AchievementDeltaSelection>('deltaPeriod', { required: true })
const sortByDelta = defineModel<boolean>('sortByDelta', { required: true })

const deltaOptions: SelectOption<AchievementDeltaSelection>[] = [
  { value: 'none', label: 'Не показывать', selectedLabel: 'Без прироста' },
  { value: 'day', label: 'За день', selectedLabel: 'Прирост за день' },
  { value: 'week', label: 'За неделю', selectedLabel: 'Прирост за неделю' },
  { value: 'month', label: 'За месяц', selectedLabel: 'Прирост за месяц' },
  { value: 'quarter', label: 'За три месяца', selectedLabel: 'Прирост за три месяца' },
  { value: 'half-year', label: 'За полгода', selectedLabel: 'Прирост за полгода' },
  { value: 'year', label: 'За год', selectedLabel: 'Прирост за год' },
]
const compactDeltaLabels: Record<AchievementDeltaSelection, string> = {
  none: 'Без прироста',
  day: 'Прирост: день',
  week: 'Прирост: неделя',
  month: 'Прирост: месяц',
  quarter: 'Прирост: 3 мес.',
  'half-year': 'Прирост: 6 мес.',
  year: 'Прирост: год',
}

const PAGE_SIZE = 50
const MAX_BULK_COMPARISON_LINES = 100
const displayLimit = ref(PAGE_SIZE)
const expandedRows = ref<ComposableTableKey[]>([])
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const { showValueBars, extendedPalette } = useVehicleTableAppearance()
const pinCompared = useLocalStorage('vehicles-table-pin-compared', false)
const definition = computed(() => achievements[props.kind])
const slots = ref<Slot[]>([...definition.value.slots].reverse())
const sorting = useVehicleSorting<AchievementStatisticsRow>(ref<VehicleGrouping>('tanks'), slots, sort, (vehicle, slot) => {
  if (sortByDelta.value && deltaPeriod.value !== 'none') return achievementDelta(vehicle, slot, deltaPeriod.value)
  return vehicle[slot] ?? null
})
const table = useTemplateRef<HTMLElement>('table')
const { width } = useElementSize(table)
const compactToolbar = computed(() => width.value < 700)
const displayedDeltaOptions = computed(() => {
  if (!compactToolbar.value) return deltaOptions
  return deltaOptions.map(option => ({ ...option, selectedLabel: compactDeltaLabels[option.value] }))
})
const stackedDeltas = computed(() => width.value < 900)
const showExpand = computed(() => width.value >= EXPAND_MIN_TABLE_WIDTH)
const showCompare = computed(() => width.value >= COMPARE_MIN_TABLE_WIDTH)
const showMetadata = computed(() => width.value >= 700)
const showImage = computed(() => width.value >= 560)
const availableNations = computed<readonly Nation[]>(() => regionToGame(props.filters.regions[0]) === 'mt' ? mtNations : wotNations)
const metricMinWidth = computed(() => {
  if (deltaPeriod.value === 'none') return showValueBars.value ? 62 : 46
  if (stackedDeltas.value) {
    if (showValueBars.value) return 62
    return width.value < 360 ? 46 : 54
  }
  return 110
})

type AchievementColumn = ComposableTableColumn<AchievementStatisticsRow, SortKey | 'compare' | 'expand'> & { metric?: Slot }
const columns = computed<AchievementColumn[]>(() => {
  const columns: AchievementColumn[] = [
    ...(showCompare.value ? [vehicleColumns.compare] : []),
    ...(showExpand.value ? [vehicleColumns.expand] : []),
  ]

  if (showMetadata.value) columns.push(
    vehicleColumns.tankLevel,
    vehicleColumns.tankType,
  )

  columns.push(
    {
      ...vehicleNameColumn(width.value),
      ...(width.value < 440 ? { width: Math.max(100, width.value * 0.28) } : {}),
    },
    ...slots.value.map(metric => ({
      key: metric, metric,
      label: availableSlots[metric].label,
      minWidth: metricMinWidth.value,
      sortable: true, interactive: true, value: (vehicle: VehicleStatisticsRow) => formatSlotValue(metric, vehicle[metric]),
    })),
  )

  return columns
})
const filteredVehicles = computed(() => {
  const matchVehicle = createVehicleNameFilter(search.value)
  const { levels, types, nations, onlyActual } = localFilters.value

  const vehicles = props.vehicles.filter(vehicle => {
    if (onlyActual && !vehicle.isActual) return false
    if (matchVehicle(vehicleName(vehicle)) === null) return false
    if (levels.length && !levels.some(level => level === vehicle.tankLevel)) return false
    if (types.length && !types.some(type => type === vehicle.tankType)) return false
    return !nations.length || nations.some(nation => nation === vehicle.tankTag?.split(':')[0])
  })

  vehicles.sort(sorting.compare)
  if (!pinCompared.value) return vehicles

  const compared: AchievementStatisticsRow[] = []
  const remaining: AchievementStatisticsRow[] = []
  for (const vehicle of vehicles) {
    if (isCompared(vehicle)) compared.push(vehicle)
    else remaining.push(vehicle)
  }
  return [...compared, ...remaining]
})
const displayedVehicles = computed(() => filteredVehicles.value.slice(0, displayLimit.value))
const valueBarStyle = useVehicleValueBars(filteredVehicles, slots, { enabled: showValueBars, extendedPalette })
const comparisonCandidates = computed<ComparisonCandidate[]>(() => filteredVehicles.value
  .filter(vehicle => !isCompared(vehicle))
  .map(vehicle => ({ vehicle, selection: selectionFor(vehicle) })))
const bulkComparisonTotal = computed(() =>
  (props.comparisonCount + comparisonCandidates.value.length) * definition.value.slots.length)

function selectionFor(vehicle: VehicleStatisticsRow) {
  return vehicleHistorySelection(vehicle, { levels: [], types: [], nations: [] })
}

function isCompared(vehicle: VehicleStatisticsRow) {
  return props.comparedKeys.includes(comparisonRowKey(vehicle.rowKey, selectionFor(vehicle)))
}

function compareAll() {
  if (props.status !== success || !comparisonCandidates.value.length
    || bulkComparisonTotal.value > MAX_BULK_COMPARISON_LINES) return
  emit('compareAll', comparisonCandidates.value)
}

function historySource(vehicle: VehicleStatisticsRow): ComparisonSource {
  return {
    tag: vehicle.rowKey,
    rowKey: vehicle.rowKey,
    name: vehicleName(vehicle),
    color: availableSlots[definition.value.slots[0]].color ?? '#52ddc6',
    selection: selectionFor(vehicle),
    enabled: true,
    filters: props.filters,
    sampleNumber: 1,
  }
}

function onSort(key: AchievementColumn['key'], event: MouseEvent) {
  if (key !== 'compare' && key !== 'expand') sorting.toggle(key, event.altKey)
}

function onCellClick({ rowKey, column }: ComposableTableCellEvent<VehicleStatisticsRow, AchievementColumn>) {
  if (column.key === 'compare') return

  if (expandedRows.value.includes(rowKey)) {
    expandedRows.value = expandedRows.value.filter(key => key !== rowKey)
    return
  }

  expandedRows.value = [...expandedRows.value, rowKey]
}

watch(availableNations, available => {
  const nations = localFilters.value.nations.filter(nation => available.includes(nation))
  if (nations.length !== localFilters.value.nations.length) localFilters.value = { ...localFilters.value, nations }
}, { immediate: true })
watch([search, localFilters, () => props.vehicles], () => displayLimit.value = PAGE_SIZE)
watch(sortByDelta, enabled => {
  if (enabled && !sort.value.some(({ key }) => slots.value.includes(key as Slot))) {
    sort.value = [{ key: definition.value.slots[0], ascending: false }]
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '../vehicles/vehicleListTable/utils/vehicleValueBars.scss' as *;

.achievement-table {
  @include vehicle-value-bars;

  min-width: 0;
  font-size: 14px;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .search {
      flex: 0 1 240px;
      min-width: 0;
      width: 240px;
    }

    .settings {
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      margin-left: auto;
    }

    .delta-period {
      flex: none;
    }
  }

  &.compact-toolbar .toolbar {
    --toolbar-button-width: 36px;
    --toolbar-button-height: 36px;
    --options-select-height: 36px;
    --options-select-font-size: 13px;

    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;

    .search {
      width: 100%;
      height: 36px;
    }

    .settings {
      grid-column: 1 / -1;
      width: 100%;
      min-width: 0;
      gap: 6px;
    }

    .delta-sort {
      min-height: 36px;
      font-size: 13px;
      white-space: nowrap;
    }

    .delta-period {
      flex: 0 1 auto;
      min-width: 0;
      margin-left: auto;
    }
  }

  .achievement-stats {
    --composable-table-cell-padding: 0 3px;

    :deep(.composable-table-head .heading) {
      container-type: inline-size;
      container-name: achievement-heading;
    }

    :deep(.composable-table-cell.interactive:hover) {
      background: none;
    }

    @media (hover: hover) and (pointer: fine) {
      :deep(.composable-table-line:hover) {
        background: rgba(255, 255, 255, 0.04);
      }
    }
  }

  .delta-sort {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;
    color: rgba(255, 255, 255, 0.8);

    input {
      flex: none;
      margin: 0;
      accent-color: var(--blue-thin-color);
    }
  }

  .metric-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    &.with-bar {
      padding: 0 8px;
    }

    .metric-delta {
      flex: none;
      min-width: 4ch;
      text-align: left;
    }
  }

  &.stacked-deltas .metric-content {
    flex-direction: column;
    gap: 2px;

    .metric-delta {
      min-width: 0;
      font-size: 12px;
      text-align: center;
    }
  }

  .heading-icon {
    display: block;
    width: 40px;
    height: 40px;
  }

  .metric-caption {
    position: absolute;
    right: 3px;
    bottom: 9px;
    padding: 1px 4px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.1;

    @container achievement-heading (width < 110px) {
      background-color: #1b1f23;
      border-radius: 3px;
    }
  }

  .type-heading {
    width: 24px;
    height: 24px;
  }

  .vehicle-type {
    display: block;
    width: 16px;
    height: 18px;
    margin: auto;
  }

  .arrow {
    display: block;
    width: 12px;
    height: 12px;
    margin: auto;
    color: rgba(255, 255, 255, 0.55);
  }

  .history-compare {
    margin: 0;
    background: rgba(255, 255, 255, 0.05);
  }

  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 220px;
    text-align: center;
    color: rgba(255, 255, 255, 0.55);
  }

  .loader {
    font-size: 4px;
    margin-bottom: 20px;
  }

  .text-button {
    color: var(--blue-thin-color);

    &:hover {
      color: var(--blue-thin-color-hover);
    }
  }

  .show-more {
    display: block;
    width: 100%;
    padding: 18px;
    font-size: inherit;
  }
}
</style>
