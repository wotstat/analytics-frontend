<template>
  <section class="vehicle-table" ref="table" :style="tableStyle">
    <div class="toolbar" ref="toolbar" :class="{ wrapped: toolbarWrapped }">
      <div class="toolbar-left" :class="{ 'with-search': showName }">
        <OptionsSelect v-model="grouping" :options="vehicleGroupings" class="grouping" />
        <SearchLine v-if="showName" v-model="search" class="search" placeholder="Найти танк" />
        <VehicleListFilters v-model="localFilters" :grouping :available-nations="availableNations" />
      </div>
      <div class="toolbar-right" ref="toolbarRight">
        <VehicleColumnSelector v-model="visibleSlots" v-model:open="columnsOpen" :max-slots="maxSelectableSlots" />
        <TableSettings
          v-model="period"
          v-model:from-beginning="fromBeginning" />
      </div>
    </div>

    <ComposableTable
      v-model:expanded-rows="expandedRows"
      class="vehicle-stats"
      :columns
      :expand-on-row-click="visibleSlots.length === 0"
      :rows="status === success ? displayedVehicles : []"
      :row-key="vehicle => vehicle.rowKey"
      :sort="sorting.sortOrders.value"
      :loading="status === loading"
      :cell-class="cellClass"
      @sort="onSort"
      @cell-click="onCellClick">

      <template #header-compare>
        <BulkCompareButton
          :candidates="comparisonCandidates"
          :comparison-count
          :filters
          :disabled="status !== success"
          @compare="emit('compareAll', $event)" />
      </template>
      <template #header-expand><span></span></template>
      <template #header-tankLevel><span class="level-heading">Ур.</span></template>

      <template #header-tankType>
        <VehicleType type="any" class="type-heading" />
      </template>

      <template #header-name>
        <Icon icon="tank" class="icon" />
      </template>

      <template #header="{ column }">
        <template v-if="column.metric">
          <Icon :icon="availableSlots[column.metric].icon" class="icon" />
          <span v-if="slotHeadingLabel(column.metric)"
            class="aggregation-label"
            :style="{ color: availableSlots[column.metric].headingColor }">
            {{ slotHeadingLabel(column.metric) }}
          </span>
        </template>
      </template>


      <template #cell-compare="{ row }">
        <CompareButton
          :compared="isCompared(row)"
          @click.stop="$emit('compare', row, vehicleHistorySelection(row, effectiveSelection))" />
      </template>

      <template #cell-expand="{ expanded }">
        <DropdownArrow class="arrow" :expanded horizontal angle="large" />
      </template>

      <template #cell-tankLevel="{ row }">
        {{ romanNumberProcessor(row.tankLevel!) }}
      </template>

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
        <span class="metric-value" :class="{ 'with-bar': showValueBars }">{{ value ?? '—' }}</span>
      </template>

      <template #expanded="{ row }">
        <VehicleTimeSeries
          v-model:slot="activeSlot"
          v-model:step="historyStep"
          v-model:average-window="averageWindow"
          :selection="vehicleHistorySelection(row, effectiveSelection)"
          :name="vehicleName(row)"
          :filters
          :before-day="beforeDay"
          :from-day="fromDay"
          :min-battles="localFilters.minBattles"
          :min-players="localFilters.minPlayers">
          <template v-if="!showCompare" #header-before>
            <CompareButton
              class="history-compare"
              :compared="isCompared(row)"
              @click.stop="$emit('compare', row, vehicleHistorySelection(row, effectiveSelection))" />
          </template>
        </VehicleTimeSeries>
      </template>


      <template #loading>
        <TableState :status message="Загрузка статистики техники…" :progress />
      </template>
      <template #empty>
        <TableState
          :status
          :message="isErrorStatus(status) ? 'Не удалось загрузить статистику техники' : emptyMessage"
          :retry="() => emit('retry')">
          <span class="muted" v-if="status === success && !hasLocalFilters">История статистики ещё заполняется</span>
        </TableState>
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
import { mtNations, wotNations, type Nation } from '@/shared/game/domain/vehicles/nations'
import { regionToGame } from '@/shared/game/domain/wot'
import { createVehicleNameFilter } from '@/shared/game/components/vehicles/vehicleSearch'
import SearchLine from '@/shared/game/components/selectors/components/searchLine/SearchLine.vue'
import { availableSlots, metricTileFor, defaultSlots, defaultSlotsForLimit, orderSlots, slotHeadingLabel, type Slot } from '../metrics/catalog/vehicleMetrics.ts'
import type { VehicleStatistics } from '../shared/types'
import { DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS, DEFAULT_ONLY_ACTUAL, type LocalVehicleFilters } from './filters/localFilters'
import { comparisonRowKey } from '../comparison/utils/comparisonRowKey'
import { vehicleGroupings, vehicleHistorySelection, type VehicleGrouping, type VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'
import VehicleColumnSelector from './settings/VehicleColumnSelector.vue'
import TableSettings from '../../shared/table/TableSettings.vue'
import VehicleListFilters from './filters/VehicleListFilters.vue'
import OptionsSelect from '@/shared/ui/optionsSelect/OptionsSelect.vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableCellEvent, ComposableTableColumn } from '@/shared/ui/composableTable/types'
import CompareButton from '../../shared/table/comparison/CompareButton.vue'
import BulkCompareButton from '../../shared/table/comparison/BulkCompareButton.vue'
import VehicleNameCell from './VehicleNameCell.vue'
import VehicleTimeSeries from '../history/VehicleTimeSeries.vue'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import { isVehicleType } from '@/shared/game/components/vehicles/vehicleType/vehicleTypeToImage'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { formatSlotValue } from '../metrics/utils/formatMetricValue.ts'
import { useVehicleSorting, type SortKey, type SortOrder } from './utils/useVehicleSorting'
import type { VehicleFilters } from '../filters/types'
import type { HistoryAverageWindow, HistoryStep } from '../../shared/history/period/historyStep'
import type { TableStatisticsPeriod } from '../../shared/table/statisticsPeriods'
import type { ComparisonCandidate } from '../comparison/types'
import { useVehicleValueBars } from './utils/useVehicleValueBars'
import TableState from '../../shared/table/TableState.vue'
import { useTablePreferences } from '../../shared/table/useTablePreferences'
import { COMPARE_MIN_TABLE_WIDTH, vehicleColumns, vehicleNameColumn } from './utils/columns'
import { EXPAND_MIN_TABLE_WIDTH } from '../../shared/table/utils/rowColumns'
import { useMetricRowExpansion } from '../../shared/table/utils/useMetricRowExpansion'

const props = defineProps<{
  vehicles: VehicleStatistics[]
  status: Status
  progress: { completed: number, total: number }
  filters: VehicleFilters
  beforeDay: string
  fromDay: string | null
  comparedKeys: string[]
  comparisonCount: number
}>()

const emit = defineEmits<{
  retry: []
  compare: [vehicle: VehicleStatistics, selection: VehicleSelection]
  compareAll: [candidates: readonly ComparisonCandidate[]]
}>()

const PAGE_SIZE = 50
const MAX_TANK_SLOTS = 7
const MAX_CATEGORY_SLOTS = 12
const MIN_SLOT_WIDTH = 86
const METADATA_MIN_TABLE_WIDTH = 520
const IMAGE_MIN_TABLE_WIDTH = 320

const search = defineModel<string>('search', { required: true })
const localFilters = defineModel<LocalVehicleFilters>('localFilters', { required: true })
const grouping = defineModel<VehicleGrouping>('grouping', { required: true })
const period = defineModel<TableStatisticsPeriod>('period', { required: true })
const fromBeginning = defineModel<boolean>('fromBeginning', { required: true })

const configuredSlots = defineModel<Slot[]>('slots', { required: true })
const requestedSlots = defineModel<Slot[]>('visibleSlots', { required: true })
const sortOrders = defineModel<SortOrder[]>('sort', { required: true })
const activeSlot = ref<Slot>(configuredSlots.value[0] ?? 'battles')
const { expandedRows, expansionCellClass, toggleRow } = useMetricRowExpansion(activeSlot)
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const { showValueBars, extendedPalette, pinCompared } = useTablePreferences()

const displayLimit = ref(PAGE_SIZE)

const table = useTemplateRef<HTMLElement>('table')
const { width } = useElementSize(table)
const toolbar = useTemplateRef<HTMLElement>('toolbar')
const toolbarRight = useTemplateRef<HTMLElement>('toolbarRight')
const { height: toolbarHeight } = useElementSize(toolbar)
const { height: toolbarGroupHeight } = useElementSize(toolbarRight)
const toolbarWrapped = computed(() => toolbarHeight.value > toolbarGroupHeight.value)
const columnsOpen = ref(false)
const columnSelectionHeight = ref(0)

// Перезагрузка данных не должна сдвигать кнопку и закрывать открытый селектор.
watch(columnsOpen, open => {
  columnSelectionHeight.value = open ? table.value?.getBoundingClientRect().height ?? 0 : 0
}, { flush: 'sync' })

const showName = computed(() => grouping.value === 'tanks')
const showExpand = computed(() => !showName.value || width.value >= EXPAND_MIN_TABLE_WIDTH)
const showImage = computed(() => width.value >= IMAGE_MIN_TABLE_WIDTH)
const showMetadata = computed(() => !showName.value || width.value >= METADATA_MIN_TABLE_WIDTH)
const showLevel = computed(() => grouping.value !== 'classes' && showMetadata.value)
const showType = computed(() => grouping.value !== 'levels' && showMetadata.value)
const showCompare = computed(() => width.value >= COMPARE_MIN_TABLE_WIDTH)
const availableNations = computed<readonly Nation[]>(() =>
  props.filters.regions.length === 0 || props.filters.regions.some(region => regionToGame(region) === 'mt')
    ? mtNations : wotNations)

watch(availableNations, options => {
  const nations = localFilters.value.nations.filter(nation => options.includes(nation))
  if (nations.length !== localFilters.value.nations.length) localFilters.value = { ...localFilters.value, nations }
}, { immediate: true })

function isCompared(vehicle: VehicleStatistics) {
  return props.comparedKeys.includes(comparisonRowKey(vehicle.rowKey, vehicleHistorySelection(vehicle, effectiveSelection.value)))
}

const effectiveSelection = computed<VehicleSelection>(() => {
  const { levels, types, nations } = localFilters.value
  return {
    levels: grouping.value !== 'classes' ? levels : [],
    types: grouping.value !== 'levels' ? types : [],
    nations: showName.value ? nations : [],
  }
})

const nameColumn = computed(() => vehicleNameColumn(width.value))
const maxSelectableSlots = computed(() => {
  const maxSlots = showName.value ? MAX_TANK_SLOTS : MAX_CATEGORY_SLOTS
  const nameColumnWidth = showName.value ? nameColumn.value.width : 0
  const metadataWidth = (showLevel.value ? vehicleColumns.tankLevel.width : 0) +
    (showType.value ? vehicleColumns.tankType.width : 0)
  const expandWidth = showExpand.value ? vehicleColumns.expand.width : 0
  const compareWidth = showCompare.value ? vehicleColumns.compare.width : 0
  const availableWidth = width.value - nameColumnWidth - metadataWidth - expandWidth - compareWidth
  const fittedSlots = Math.max(1, Math.floor(availableWidth / MIN_SLOT_WIDTH))

  return Math.min(maxSlots, fittedSlots)
})

function normalizeColumnSelection(slots: Slot[]) {
  const defaults = defaultSlotsForLimit(maxSelectableSlots.value)
  const selected = orderSlots(slots)
  if (selected.length !== defaults.length) return slots
  if (!selected.every((slot, index) => slot === defaults[index])) return slots
  return [...defaultSlots]
}

// Видимый дефолтный набор восстанавливает полный список с исходным порядком приоритета.
const visibleSlots = computed({
  get: () => orderSlots(configuredSlots.value.slice(0, maxSelectableSlots.value)),
  set: (slots: Slot[]) => configuredSlots.value = normalizeColumnSelection(slots),
})

watch([configuredSlots, maxSelectableSlots], ([slots]) => {
  const normalized = normalizeColumnSelection(slots)
  if (normalized !== slots) configuredSlots.value = normalized
}, { immediate: true })

const sorting = useVehicleSorting(grouping, configuredSlots, sortOrders)

const tableStyle = computed(() => ({
  minHeight: columnsOpen.value ? `${columnSelectionHeight.value}px` : undefined,
}))

type VehicleColumn = ComposableTableColumn<VehicleStatistics, SortKey | 'compare' | 'expand'> & { metric?: Slot }
const columns = computed<VehicleColumn[]>(() => [
  ...(showCompare.value ? [vehicleColumns.compare] : []),
  ...(showExpand.value ? [vehicleColumns.expand] : []),
  ...(showLevel.value ? [vehicleColumns.tankLevel] : []),
  ...(showType.value ? [vehicleColumns.tankType] : []),
  ...(showName.value ? [nameColumn.value] : []),
  ...visibleSlots.value.map(metric => ({
    key: metric, metric, label: availableSlots[metric].label,
    sortable: true, interactive: true, value: (vehicle: VehicleStatistics) => formatSlotValue(metric, vehicle[metric]),
  })),
])

function onSort(key: VehicleColumn['key'], event: MouseEvent) {
  if (key !== 'compare' && key !== 'expand') sorting.toggle(key, event.altKey)
}

function cellClass(vehicle: VehicleStatistics, column: VehicleColumn) {
  if (column.key === 'compare') return
  return expansionCellClass(vehicle.rowKey, column.metric)
}

function onCellClick({ rowKey, column }: ComposableTableCellEvent<VehicleStatistics, VehicleColumn>) {
  if (column.key === 'compare') return
  toggleRow(rowKey, column.metric)
}

const hasLocalFilters = computed(() => {
  const { onlyActual, minBattles, minPlayers } = localFilters.value
  const { levels, types, nations } = effectiveSelection.value
  if (minBattles !== DEFAULT_MIN_BATTLES || minPlayers !== DEFAULT_MIN_PLAYERS) return true

  return levels.length > 0 || types.length > 0 || nations.length > 0
    || (showName.value && (search.value.trim().length > 0 || onlyActual !== DEFAULT_ONLY_ACTUAL))
})

const emptyMessage = computed(() => {
  if (!hasLocalFilters.value) return 'По выбранным фильтрам пока нет данных'
  if (showName.value) return 'Танки не найдены'
  return 'Категории не найдены'
})

const filteredVehicles = computed(() => {
  const matchVehicle = createVehicleNameFilter(showName.value ? search.value : '')
  const filters = localFilters.value
  const selection = effectiveSelection.value

  const vehicles = props.vehicles.filter(vehicle => {
    if (props.fromDay !== null && vehicle.day < props.fromDay) return false
    if (matchVehicle(vehicleName(vehicle)) === null) return false

    if (selection.levels.length && !selection.levels.some(level => level === vehicle.tankLevel)) return false
    if (selection.types.length && !selection.types.some(type => type === vehicle.tankType)) return false
    if (selection.nations.length && !selection.nations.some(nation => nation === vehicle.tankTag?.split(':')[0])) return false

    return (vehicle.battles ?? 0) > filters.minBattles && (vehicle.playerCount ?? 0) > filters.minPlayers
  })

  vehicles.sort(sorting.compare)
  if (!pinCompared.value) return vehicles

  const compared: VehicleStatistics[] = []
  const remaining: VehicleStatistics[] = []
  for (const vehicle of vehicles) {
    if (isCompared(vehicle)) compared.push(vehicle)
    else remaining.push(vehicle)
  }
  return [...compared, ...remaining]
})

const displayedVehicles = computed(() => filteredVehicles.value.slice(0, displayLimit.value))

const valueBarStyle = useVehicleValueBars(filteredVehicles, visibleSlots, { enabled: showValueBars, extendedPalette })

const comparisonCandidates = computed<ComparisonCandidate[]>(() => {
  return filteredVehicles.value
    .filter(vehicle => !isCompared(vehicle))
    .map(vehicle => ({ vehicle, selection: vehicleHistorySelection(vehicle, effectiveSelection.value) }))
})

watch([search, localFilters, () => props.vehicles, () => props.fromDay], () => displayLimit.value = PAGE_SIZE)

watch(visibleSlots, slots => {
  if (slots.includes(activeSlot.value)) return
  activeSlot.value = slots.find(slot => metricTileFor(slot).id === metricTileFor(activeSlot.value).id) ?? slots[0] ?? 'battles'
})

watch([visibleSlots, width], ([slots, tableWidth]) => {
  if (tableWidth > 0) requestedSlots.value = slots
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use './utils/vehicleValueBars.scss' as *;
@use '../../shared/table/utils/metricTableRows.scss' as *;

.vehicle-table {
  @include vehicle-value-bars;

  min-width: 0;
  font-size: 14px;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-left {
      flex: 1 1 auto;
      min-width: 0;

      .grouping {
        flex: none;
      }

      .search {
        flex: none;
        width: 240px;
        min-width: 240px;
      }
    }

    .toolbar-right {
      flex: none;
      margin-left: auto;
    }

    &.wrapped .toolbar-left .search {
      flex: 1;
    }

    @container content (max-width: 420px) {
      .toolbar-left {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 30px;
        grid-template-areas: 'grouping filters';
        flex-basis: 100%;

        &.with-search {
          grid-template-areas: 'grouping filters' 'search search';
        }

        .grouping {
          grid-area: grouping;
          width: 100%;
        }

        .search {
          grid-area: search;
          width: 100%;
          min-width: 0;
        }

        :deep(.filter-trigger) {
          grid-area: filters;
        }
      }

      .toolbar-right {
        flex-basis: 100%;

        :deep(.column-trigger) {
          flex: 1;
        }
      }
    }
  }

  .vehicle-stats {
    --composable-table-cell-padding: 0 3px;

    @include metric-table-rows;
  }

  .history-compare {
    flex: none;
    margin: 0;
    background: rgba(255, 255, 255, 0.05);

    &:not(.added) {
      color: inherit;
    }

    &:active:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .aggregation-label {
    position: absolute;
    right: 3px;
    bottom: 9px;
    padding: 1px 4px;
    color: #f6f6f6;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.1;
    white-space: nowrap;
  }

  .icon {
    width: 40px;
    height: 40px;
    display: block;
  }

  .level-heading {
    font-size: 14px;
  }

  .type-heading {
    width: 24px;
    height: 24px;
  }

  .vehicle-type {
    width: 16px;
    height: 18px;
    display: block;
    margin: auto;
  }

  .muted {
    color: rgba(255, 255, 255, 0.45);
  }

  .text-button {
    color: var(--blue-thin-color);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: var(--blue-thin-color-hover);
      }
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
