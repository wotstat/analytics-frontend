<template>
  <section class="vehicle-table" ref="table" :style="tableStyle">
    <div class="toolbar">
      <OptionsSelect v-model="grouping" :options="vehicleGroupings" />

      <SearchLine v-if="showName" v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters v-model="localFilters" :show-vehicle-filters="showName" />
      <VehicleColumnSelector v-model="selectedSlots" v-model:open="columnsOpen" :max-slots="maxSelectableSlots" />
      <VehicleTableSettings v-model="period" />
    </div>

    <ComposableTable v-model:expanded-rows="expandedRows" class="vehicle-stats" :columns
      :rows="status === success ? displayedVehicles : []" :row-key="vehicle => vehicle.rowKey"
      :sort="sorting.sortOrders.value" :loading="status === loading" :cell-class="cellClass" @sort="onSort"
      @cell-click="onCellClick">

      <template #header-compare>
        <button v-if="bulkComparisonTotal <= MAX_BULK_COMPARISON_LINES" class="compare-all" type="button"
          :disabled="status !== success || !comparisonCandidates.length" @click="compareAll">
          <PlusIcon />
        </button>
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
          <span v-if="slotHeadingLabel(column.metric)" class="aggregation-label"
            :class="{ derived: !!availableSlots[column.metric].formula }">
            {{ slotHeadingLabel(column.metric) }}
          </span>
        </template>
      </template>


      <template #cell-compare="{ row }">
        <VehicleCompareButton :compared="comparedKeys.includes(row.rowKey)"
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
        <VehicleNameCell :vehicle="row" :latest-day="latestDay" :search />
      </template>

      <template #expanded="{ row }">
        <VehicleTimeSeries v-model:slot="activeSlot" v-model:step="historyStep" v-model:average-window="averageWindow"
          :selection="vehicleHistorySelection(row, effectiveSelection)" :name="vehicleName(row)" :filters
          :min-battles="localFilters.minBattles" :min-players="localFilters.minPlayers"
          :skip-incomplete-days="localFilters.skipIncompleteDays" />
      </template>


      <template #loading>
        <div class="state">
          <Loader class="loader" /><span>Загружаем статистику техники…</span>
        </div>
      </template>
      <template #empty>
        <div v-if="isErrorStatus(status)" class="state">
          <span>Не удалось загрузить статистику техники</span>
          <button class="text-button" @click="$emit('retry')">Попробовать ещё раз</button>
        </div>
        <div v-else class="state">
          <span>{{ emptyMessage }}</span>
          <span class="muted" v-if="!hasLocalFilters">История статистики ещё заполняется</span>
        </div>
      </template>
      <template #footer>
        <button v-if="status === success && displayedVehicles.length < filteredVehicles.length"
          class="show-more text-button" @click="displayLimit += PAGE_SIZE">
          Показать ещё {{ Math.min(PAGE_SIZE, filteredVehicles.length - displayLimit) }}
        </button>
      </template>
    </ComposableTable>

    <Teleport to="body">
      <ModalWindowContent v-if="pendingComparison" title="Слишком много линий" class="bulk-comparison-confirmation"
        role="dialog" aria-modal="true" aria-label="Слишком много линий" aria-describedby="bulk-comparison-warning"
        @close="pendingComparison = null">
        <div id="bulk-comparison-warning" class="comparison-warning">
          <p>
            Вы пытаетесь добавить <b>{{ pendingComparison.candidates.length }}</b> {{ comparisonLineLabel }} в
            сравнение.
          </p>
          <ul>
            <li>Линии перекроют друг друга — сравнивать их будет сложно.</li>
            <li>График и страница могут тормозить.</li>
          </ul>
        </div>
        <template #footer-content>
          <div class="confirmation-actions">
            <button type="button" class="confirmation-button" @click="pendingComparison = null">Отмена</button>
            <button type="button" class="confirmation-button" @click="confirmComparison">
              Всё равно добавить
            </button>
          </div>
        </template>
      </ModalWindowContent>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import ModalWindowContent from '@/shared/ui/modalWindow/ModalWindowContent.vue'
import PlusIcon from './assets/plus-bold.svg'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { createVehicleNameFilter } from '@/shared/game/vehicles/vehicleSearch'
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import { availableSlots, baseSlot, orderSlots, slotHeadingLabel, type Slot } from '../vehicleMetricSelector/vehicleMetrics.ts'
import type { VehicleStatistics } from '../shared/types'
import { DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS, DEFAULT_ONLY_ACTUAL, type LocalVehicleFilters } from './filters/localFilters'
import { vehicleGroupings, vehicleHistorySelection, type VehicleGrouping, type VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'
import VehicleColumnSelector from './settings/VehicleColumnSelector.vue'
import VehicleTableSettings from './settings/VehicleTableSettings.vue'
import VehicleListFilters from './filters/VehicleListFilters.vue'
import OptionsSelect from '@/shared/ui/optionsSelect/OptionsSelect.vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableCellEvent, ComposableTableColumn, ComposableTableKey } from '@/shared/ui/composableTable/types'
import VehicleCompareButton from './comparison/VehicleCompareButton.vue'
import VehicleNameCell from './VehicleNameCell.vue'
import VehicleTimeSeries from '../timeSeries/VehicleTimeSeries.vue'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { formatSlotValue } from '../vehicleMetricSelector/formatMetricValue.ts'
import { useVehicleSorting, type SortKey } from './useVehicleSorting'
import type { VehicleFilters } from '../filters/types'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/period/historyStep'
import type { VehicleStatisticsPeriod } from '../shared/vehicleStatisticsPeriod'
import type { ComparisonCandidate } from '../timeSeriesCompare/types'

const props = defineProps<{
  vehicles: VehicleStatistics[]
  status: Status
  filters: VehicleFilters
  comparedKeys: string[]
  comparisonCount: number
}>()

const emit = defineEmits<{
  retry: []
  compare: [vehicle: VehicleStatistics, selection: VehicleSelection]
  compareAll: [candidates: ComparisonCandidate[]]
}>()

const PAGE_SIZE = 50
const MAX_BULK_COMPARISON_LINES = 100
const MAX_TANK_SLOTS = 7
const MAX_CATEGORY_SLOTS = 12
const MIN_SLOT_WIDTH = 86
const METADATA_COLUMN_WIDTH = 40
const EXPAND_COLUMN_WIDTH = 20
const COMPARE_COLUMN_WIDTH = 36

const search = ref('')
const localFilters = defineModel<LocalVehicleFilters>('localFilters', { required: true })
const grouping = defineModel<VehicleGrouping>('grouping', { required: true })
const period = defineModel<VehicleStatisticsPeriod>('period', { required: true })

const selectedSlots = defineModel<Slot[]>('slots', { required: true })
const activeSlot = ref<Slot>(selectedSlots.value[0] ?? 'battles')
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)

const displayLimit = ref(PAGE_SIZE)
const sorting = useVehicleSorting(grouping, selectedSlots)

const table = useTemplateRef<HTMLElement>('table')
const { width } = useElementSize(table)
const columnsOpen = ref(false)
const columnSelectionHeight = ref(0)

// Перезагрузка данных не должна сдвигать кнопку и закрывать открытый селектор.
watch(columnsOpen, open => {
  columnSelectionHeight.value = open ? table.value?.getBoundingClientRect().height ?? 0 : 0
}, { flush: 'sync' })

const showLevel = computed(() => grouping.value !== 'classes')
const showType = computed(() => grouping.value !== 'levels')
const showName = computed(() => grouping.value === 'tanks')
const effectiveSelection = computed<VehicleSelection>(() => {
  if (showName.value) return localFilters.value
  return { levels: [], types: [], nations: [] }
})

const metadataColumnCount = computed(() => Number(showLevel.value) + Number(showType.value))
const nameWidth = computed(() => Math.max(140, width.value * 0.25))
const maxSelectableSlots = computed(() => {
  const maxSlots = showName.value ? MAX_TANK_SLOTS : MAX_CATEGORY_SLOTS
  const nameColumnWidth = showName.value ? nameWidth.value : 0
  const metadataWidth = METADATA_COLUMN_WIDTH * metadataColumnCount.value
  const availableWidth = width.value - nameColumnWidth - metadataWidth - EXPAND_COLUMN_WIDTH - COMPARE_COLUMN_WIDTH
  const fittedSlots = Math.max(1, Math.floor(availableWidth / MIN_SLOT_WIDTH))

  return Math.min(maxSlots, fittedSlots)
})

const visibleSlots = computed(() => selectedSlots.value)

const tableStyle = computed(() => ({
  minHeight: columnsOpen.value ? `${columnSelectionHeight.value}px` : undefined,
}))

type VehicleColumn = ComposableTableColumn<VehicleStatistics, SortKey | 'compare' | 'expand'> & { metric?: Slot }
const columns = computed<VehicleColumn[]>(() => [
  { key: 'compare', width: COMPARE_COLUMN_WIDTH },
  { key: 'expand', width: EXPAND_COLUMN_WIDTH, interactive: true },
  ...(showLevel.value ? [{ key: 'tankLevel', label: 'Уровень', width: METADATA_COLUMN_WIDTH, sortable: true, interactive: true } as const] : []),
  ...(showType.value ? [{ key: 'tankType', label: 'Тип техники', width: METADATA_COLUMN_WIDTH, sortable: true, interactive: true } as const] : []),
  ...(showName.value ? [{ key: 'name', label: 'Название танка', width: nameWidth.value, align: 'left', sortable: true, interactive: true } as const] : []),
  ...visibleSlots.value.map(metric => ({
    key: metric, metric, label: availableSlots[metric].label, tooltip: availableSlots[metric].label,
    sortable: true, interactive: true, value: (vehicle: VehicleStatistics) => formatSlotValue(metric, vehicle[metric]),
  })),
])
const expandedRows = ref<ComposableTableKey[]>([])

function onSort(key: VehicleColumn['key'], event: MouseEvent) {
  if (key !== 'compare' && key !== 'expand') sorting.toggle(key, event.altKey)
}

function cellClass(vehicle: VehicleStatistics, column: VehicleColumn) {
  if (column.key === 'compare') return 'compare-cell'
  if (!column.metric) return 'row-toggle'
  return expandedRows.value.includes(vehicle.rowKey) && activeSlot.value === column.metric ? 'active-value' : undefined
}

function onCellClick({ rowKey, column }: ComposableTableCellEvent<VehicleStatistics, VehicleColumn>) {
  if (column.key === 'compare') return
  const expanded = expandedRows.value.includes(rowKey)
  if (expanded && (!column.metric || activeSlot.value === column.metric)) {
    expandedRows.value = expandedRows.value.filter(key => key !== rowKey)
    return
  }
  if (column.metric) activeSlot.value = column.metric
  if (!expanded) expandedRows.value = [...expandedRows.value, rowKey]
}

const latestDay = computed(() => props.vehicles.reduce((latest, vehicle) =>
  vehicle.day > latest ? vehicle.day : latest, ''))

const hasLocalFilters = computed(() => {
  const { levels, types, nations, onlyActual, minBattles, minPlayers } = localFilters.value
  if (minBattles !== DEFAULT_MIN_BATTLES || minPlayers !== DEFAULT_MIN_PLAYERS) return true
  if (!showName.value) return false

  return search.value.trim().length > 0 || levels.length > 0 || types.length > 0 || nations.length > 0 || onlyActual !== DEFAULT_ONLY_ACTUAL
})

const emptyMessage = computed(() => {
  if (!hasLocalFilters.value) return 'По выбранным фильтрам пока нет данных'
  if (showName.value) return 'Танки не найдены'
  return 'Категории не найдены'
})

const filteredVehicles = computed(() => {
  const matchVehicle = createVehicleNameFilter(showName.value ? search.value : '')
  const filters = localFilters.value

  const vehicles = props.vehicles.filter(vehicle => {
    if (matchVehicle(vehicleName(vehicle)) === null) return false

    if (vehicle.tankTag !== null) {
      if (filters.levels.length && !filters.levels.some(level => level === vehicle.tankLevel)) return false
      if (filters.types.length && !filters.types.some(type => type === vehicle.tankType)) return false
      if (filters.nations.length && !filters.nations.some(nation => nation === vehicle.tankTag?.split(':')[0])) return false
    }

    if (showName.value && filters.onlyActual && vehicle.day !== latestDay.value) return false

    return (vehicle.battles ?? 0) > filters.minBattles && (vehicle.playerCount ?? 0) > filters.minPlayers
  })

  return vehicles.sort(sorting.compare)
})

const displayedVehicles = computed(() => filteredVehicles.value.slice(0, displayLimit.value))

const comparisonCandidates = computed<ComparisonCandidate[]>(() => {
  const compared = new Set(props.comparedKeys)
  return filteredVehicles.value
    .filter(vehicle => !compared.has(vehicle.rowKey))
    .map(vehicle => ({ vehicle, selection: vehicleHistorySelection(vehicle, effectiveSelection.value) }))
})
const bulkComparisonTotal = computed(() => props.comparisonCount + comparisonCandidates.value.length)

const pendingComparison = ref<{ candidates: ComparisonCandidate[] } | null>(null)
const comparisonLineLabel = computed(() => {
  const category = new Intl.PluralRules('ru').select(pendingComparison.value?.candidates.length ?? 0)
  return category === 'one' ? 'линию' : category === 'few' ? 'линии' : 'линий'
})

function compareAll() {
  if (props.status !== success || !comparisonCandidates.value.length
    || bulkComparisonTotal.value > MAX_BULK_COMPARISON_LINES) return

  const candidates = comparisonCandidates.value
  if (bulkComparisonTotal.value > 20) {
    pendingComparison.value = { candidates }
    return
  }

  emit('compareAll', candidates)
}

function confirmComparison() {
  if (!pendingComparison.value) return
  const { candidates } = pendingComparison.value
  pendingComparison.value = null
  emit('compareAll', candidates)
}

watch([() => props.filters, localFilters],
  () => pendingComparison.value = null, { deep: true })
watch([() => props.vehicles, () => props.comparedKeys, () => props.comparisonCount, grouping, search],
  () => pendingComparison.value = null)

watch([search, localFilters, () => props.vehicles], () => displayLimit.value = PAGE_SIZE)

watch(grouping, () => search.value = '')

watch(selectedSlots, slots => {
  if (slots.includes(activeSlot.value)) return
  activeSlot.value = slots.find(slot => baseSlot(slot) === baseSlot(activeSlot.value)) ?? slots[0] ?? 'battles'
})

watch([maxSelectableSlots, width], ([limit, tableWidth]) => {
  if (tableWidth > 0 && selectedSlots.value.length > limit) selectedSlots.value = orderSlots(selectedSlots.value.slice(0, limit))
}, { immediate: true })
</script>

<style lang="scss" scoped>
.vehicle-table {
  min-width: 0;
  font-size: 14px;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .search {
      width: 240px;
      max-width: 100%;
    }
  }

  .vehicle-stats {
    --composable-table-cell-padding: 0 3px;

    :deep(.compare-cell),
    :deep(.row-toggle) {
      padding: 0;
    }

    :deep(.heading:first-child) {
      justify-content: flex-start;
      padding: 0;
    }

    :deep(.composable-table-cell.row-toggle:hover) {
      background: none;
    }

    @media (hover: hover) and (pointer: fine) {
      :deep(.composable-table-line:has(.row-toggle:hover)) {
        background: rgba(255, 255, 255, 0.04);
      }
    }

    :deep(.active-value) {
      color: white;

      &::before {
        content: '';
        position: absolute;
        bottom: 3px;
        left: 10px;
        right: 10px;
        height: 2px;
        background: var(--blue-thin-color);
        border-radius: 2px;
      }
    }
  }

  .compare-all {
    display: grid;
    place-items: center;
    margin-left: 6px;
    width: 28px;
    height: 30px;
    padding: 0;
    border-radius: 5px;
    color: rgba(255, 255, 255, 0.55);

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover:not(:disabled) {
      color: white;
      background: rgba(255, 255, 255, 0.08);
    }

    &:disabled {
      opacity: 0.3;
      cursor: default;
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

    &.derived {
      color: #bd8de8;
    }
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

  .arrow {
    width: 12px;
    height: 12px;
    display: block;
    margin: auto;
    color: rgba(255, 255, 255, 0.55);
  }

  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 220px;
    text-align: center;

    .loader {
      font-size: 4px;
      margin-bottom: 20px;
    }

    .muted {
      color: rgba(255, 255, 255, 0.45);
    }
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

.bulk-comparison-confirmation {
  :deep(.modal) {
    width: 480px;
    height: auto;
    max-width: calc(100vw - 30px);
    margin: auto;
    border-radius: 15px;
  }

  .comparison-warning {
    margin: 10px 0;
    line-height: 1.5;

    p {
      margin: 0 0 12px;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li+li {
        margin-top: 6px;
      }
    }
  }

  .confirmation-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 15px;

    .confirmation-button {
      min-height: 36px;
      padding: 7px 14px;
      border: 0;
      border-radius: 7px;
      background: rgba(255, 255, 255, 0.08);
      color: white;
      font: inherit;
      font-size: 14px;

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }

      &:focus-visible {
        outline: 2px solid rgba(255, 255, 255, 0.5);
        outline-offset: 2px;
      }

      @media (max-width: 450px) {
        flex: 1;
      }
    }
  }
}
</style>
