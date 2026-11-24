<template>
  <section
    ref="table"
    class="achievement-table"
    :class="{ 'stacked-deltas': stackedDeltas, 'compact-toolbar': compactToolbar }">
    <div class="toolbar">
      <SearchLine v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters
        v-model="localFilters"
        grouping="tanks"
        :available-nations="availableNations"
        :show-thresholds="false" />
      <div class="settings">
        <label v-if="deltaPeriod !== 'none'" class="delta-sort">
          <input v-model="sortByDelta" type="checkbox">
          {{ compactToolbar ? 'По приросту' : 'Сортировать по приросту' }}
        </label>
        <OptionsSelect
          v-model="deltaPeriod"
          :options="displayedDeltaOptions"
          :align="'right'"
          class="delta-period" />
        <TableSettings />
      </div>
    </div>

    <ComposableTable
      v-model:expanded-rows="expandedRows"
      class="achievement-stats"
      :columns
      :rows="status === success ? displayedVehicles : []"
      :row-key="vehicle => vehicle.rowKey"
      :sort="sorting.sortOrders.value"
      :loading="status === loading"
      @sort="onSort"
      @cell-click="onCellClick">
      <template #header-compare>
        <BulkCompareButton
          :candidates="comparisonCandidates"
          :comparison-count
          :filters
          :lines-per-candidate="definition.slots.length"
          :disabled="status !== success"
          tooltip="Добавить все танки к сравнению"
          @compare="emit('compareAll', $event)" />
      </template>
      <template #header-expand><span></span></template>
      <template #header-tankLevel><span>Ур.</span></template>
      <template #header-tankType>
        <VehicleType type="any" class="type-heading" />
      </template>
      <template #header-name>
        <Icon icon="tank" class="heading-icon" />
      </template>
      <template #header="{ column }">
        <Icon v-if="column.metric" :icon="availableSlots[column.metric].icon" class="heading-icon" />
      </template>

      <template #cell-compare="{ row }">
        <CompareButton
          :compared="isCompared(row)"
          @click.stop="emit('compare', row, selectionFor(row))" />
      </template>
      <template #cell-expand="{ expanded }">
        <DropdownArrow class="arrow" :expanded horizontal angle="large" />
      </template>
      <template #cell-tankLevel="{ row }">{{ row.tankLevel === null ? '—' : romanNumberProcessor(row.tankLevel)
        }}</template>
      <template #cell-tankType="{ row }">
        <VehicleType :type="row.tankType && isVehicleType(row.tankType) ? row.tankType : 'any'" class="vehicle-type" />
      </template>
      <template #cell-name="{ row }">
        <VehicleNameCell :vehicle="row" :search :show-image="showImage" />
      </template>
      <template #cell="{ row, column, value }">
        <span v-if="showValueBars && column.metric && Number.isFinite(row[column.metric])"
          class="value-bar"
          :style="valueBarStyle(row, column.metric)"></span>
        <span class="metric-content" :class="{ 'with-bar': showValueBars }">
          <span class="metric-value">{{ value ?? '—' }}</span>
          <AchievementDelta v-if="column.metric && deltaPeriod !== 'none'"
            class="metric-delta"
            :value="achievementDelta(row, column.metric, deltaPeriod)">
            <template #empty="{ value }">
              <span v-tooltip="value === null ? 'Нет данных за дату сравнения' : 'Без изменений'">–</span>
            </template>
          </AchievementDelta>
        </span>
      </template>

      <template #expanded="{ row }">
        <AchievementHistory
          :kind
          :sources="[historySource(row)]"
          :filters
          :before-day
          compact
          v-model:step="historyStep"
          v-model:average-window="averageWindow">
          <template v-if="!showCompare" #actions>
            <CompareButton
              class="history-compare"
              :compared="isCompared(row)"
              @click.stop="emit('compare', row, selectionFor(row))" />
          </template>
        </AchievementHistory>
      </template>

      <template #loading>
        <TableState :status message="Загрузка планок техники…" />
      </template>
      <template #empty>
        <TableState :status :message="emptyMessage" :retry="() => emit('retry')" />
      </template>
      <template #footer>
        <button v-if="status === success && displayedVehicles.length < filteredVehicles.length"
          class="show-more text-button"
          @click="displayLimit += PAGE_SIZE">
          Показать ещё {{ Math.min(PAGE_SIZE, filteredVehicles.length - displayLimit) }}
        </button>
      </template>
    </ComposableTable>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/components/vehicles/vehicleType/VehicleType.vue'
import { isVehicleType } from '@/shared/game/components/vehicles/vehicleType/vehicleTypeToImage'
import { mtNations, wotNations, type Nation } from '@/shared/game/domain/vehicles/nations'
import { regionToGame } from '@/shared/game/domain/wot'
import SearchLine from '@/shared/game/components/selectors/components/searchLine/SearchLine.vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableCellEvent, ComposableTableColumn, ComposableTableKey } from '@/shared/ui/composableTable/types'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import OptionsSelect from '@/shared/ui/optionsSelect/OptionsSelect.vue'
import type { SelectOption } from '@/shared/ui/optionsSelect/types'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleFilters } from '../vehicles/filters/types'
import type { VehicleStatisticsRow } from '../vehicles/shared/types'
import { vehicleHistorySelection, type VehicleSelection } from '../vehicles/shared/vehicleGrouping'
import { vehicleName } from '../vehicles/shared/vehicleName'
import type { LocalVehicleFilters } from '../vehicles/table/filters/localFilters'
import VehicleListFilters from '../vehicles/table/filters/VehicleListFilters.vue'
import CompareButton from '../shared/table/comparison/CompareButton.vue'
import BulkCompareButton from '../shared/table/comparison/BulkCompareButton.vue'
import VehicleNameCell from '../vehicles/table/VehicleNameCell.vue'
import TableSettings from '../shared/table/TableSettings.vue'
import { useVehicleValueBars } from '../vehicles/table/utils/useVehicleValueBars'
import TableState from '../shared/table/TableState.vue'
import { useTablePreferences } from '../shared/table/useTablePreferences'
import { COMPARE_MIN_TABLE_WIDTH, vehicleColumns, vehicleNameColumn } from '../vehicles/table/utils/columns'
import { EXPAND_MIN_TABLE_WIDTH } from '../shared/table/utils/rowColumns'
import type { SortKey, SortOrder } from '../vehicles/table/utils/useVehicleSorting'
import { availableSlots, type Slot } from '../vehicles/metrics/catalog/vehicleMetrics'
import { formatSlotValue } from '../vehicles/metrics/utils/formatMetricValue'
import type { ComparisonCandidate, ComparisonSource } from '../vehicles/comparison/types'
import { comparisonRowKey } from '../vehicles/comparison/utils/comparisonRowKey'
import type { HistoryStep, HistoryAverageWindow } from '../shared/history/period/historyStep'
import AchievementHistory from './history/AchievementHistory.vue'
import AchievementDelta from './AchievementDelta.vue'
import { useAchievementTableRows } from './utils/useAchievementTableRows'
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
  compareAll: [candidates: readonly ComparisonCandidate[]]
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
const displayLimit = ref(PAGE_SIZE)
const expandedRows = ref<ComposableTableKey[]>([])
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const { showValueBars, extendedPalette, pinCompared } = useTablePreferences()
const definition = computed(() => achievements[props.kind])
const { rows, slots, sorting } = useAchievementTableRows(props.kind, () => props.vehicles, sort, () => ({
  ...localFilters.value, search: search.value, deltaPeriod: deltaPeriod.value, sortByDelta: sortByDelta.value,
}))
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
    ...slots.map(metric => ({
      key: metric, metric,
      label: availableSlots[metric].label,
      minWidth: metricMinWidth.value,
      sortable: true, interactive: true, value: (vehicle: VehicleStatisticsRow) => formatSlotValue(metric, vehicle[metric]),
    })),
  )

  return columns
})
const filteredVehicles = computed(() => {
  const vehicles = rows.value
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
const emptyMessage = computed(() => {
  if (isErrorStatus(props.status)) return 'Не удалось загрузить планки техники'
  return props.vehicles.length ? 'Танки не найдены' : 'В выбранном регионе пока нет данных'
})
const valueBarStyle = useVehicleValueBars(filteredVehicles, slots, { enabled: showValueBars, extendedPalette })
const comparisonCandidates = computed<ComparisonCandidate[]>(() => filteredVehicles.value
  .filter(vehicle => !isCompared(vehicle))
  .map(vehicle => ({ vehicle, selection: selectionFor(vehicle) })))

function selectionFor(vehicle: VehicleStatisticsRow) {
  return vehicleHistorySelection(vehicle, { levels: [], types: [], nations: [] })
}

function isCompared(vehicle: VehicleStatisticsRow) {
  return props.comparedKeys.includes(comparisonRowKey(vehicle.rowKey, selectionFor(vehicle)))
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
</script>

<style scoped lang="scss">
@use '../vehicles/table/utils/vehicleValueBars.scss' as *;

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
