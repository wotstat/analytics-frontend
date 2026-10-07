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
        <VehicleTableSettings v-model="period" v-model:show-value-bars="showValueBars"
          v-model:extended-palette="extendedPalette" />
      </div>
    </div>

    <ComposableTable v-model:expanded-rows="expandedRows" class="vehicle-stats" :class="{ 'with-compare': showCompare }" :columns
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
        <VehicleNameCell :vehicle="row" :search :show-image="showImage" />
      </template>

      <template #cell="{ row, column, value }">
        <span v-if="showValueBars && column.metric && Number.isFinite(row[column.metric])" class="value-bar"
          :style="valueBarStyle(row, column.metric)"></span>
        <span class="metric-value" :class="{ 'with-bar': showValueBars }">{{ value ?? '—' }}</span>
      </template>

      <template #expanded="{ row }">
        <VehicleTimeSeries v-model:slot="activeSlot" v-model:step="historyStep" v-model:average-window="averageWindow"
          :selection="vehicleHistorySelection(row, effectiveSelection)" :name="vehicleName(row)" :filters
          :min-battles="localFilters.minBattles" :min-players="localFilters.minPlayers">
          <template v-if="!showCompare" #header-before>
            <VehicleCompareButton class="history-compare" :compared="comparedKeys.includes(row.rowKey)"
              @click.stop="$emit('compare', row, vehicleHistorySelection(row, effectiveSelection))" />
          </template>
        </VehicleTimeSeries>
      </template>


      <template #loading>
        <div class="state">
          <Loader class="loader" />
          <span>Загружаем статистику техники…</span>
          <span class="progress">{{ progress.completed + 1 }} из {{ progress.total }}</span>
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
import { useElementSize, useLocalStorage } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import ModalWindowContent from '@/shared/ui/modalWindow/ModalWindowContent.vue'
import PlusIcon from './assets/plus-bold.svg'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { mtNations, wotNations, type Nation } from '@/shared/game/vehicles/nations/nations'
import { regionToGame } from '@/shared/game/wot'
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
  progress: { completed: number, total: number }
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
const EXPAND_MIN_TABLE_WIDTH = 720
const METADATA_MIN_TABLE_WIDTH = 520
const COMPARE_MIN_TABLE_WIDTH = 440
const IMAGE_MIN_TABLE_WIDTH = 320

// Apple System Colors (Default dark): red, orange, yellow, green, cyan, purple.
// https://developer.apple.com/design/human-interface-guidelines/color#Specifications
const VALUE_BAR_COLORS = ['#ff4245', '#ffd600', '#30d158']
const EXTENDED_VALUE_BAR_COLORS = ['#ff4245', '#ff9230', '#ffd600', '#30d158', '#3cd3fe', '#db34f2']

const search = ref('')
const localFilters = defineModel<LocalVehicleFilters>('localFilters', { required: true })
const grouping = defineModel<VehicleGrouping>('grouping', { required: true })
const period = defineModel<VehicleStatisticsPeriod>('period', { required: true })

const selectedSlots = defineModel<Slot[]>('slots', { required: true })
const configuredSlots = ref<Slot[]>([...selectedSlots.value])
const activeSlot = ref<Slot>(selectedSlots.value[0] ?? 'battles')
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const showValueBars = useLocalStorage('vehicles-table-show-value-bars', false)
const extendedPalette = useLocalStorage('vehicles-table-extended-value-bar-palette', false)

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

const effectiveSelection = computed<VehicleSelection>(() => {
  const { levels, types, nations } = localFilters.value
  return {
    levels: grouping.value !== 'classes' ? levels : [],
    types: grouping.value !== 'levels' ? types : [],
    nations: showName.value ? nations : [],
  }
})

const metadataColumnCount = computed(() => Number(showLevel.value) + Number(showType.value))
const nameWidth = computed(() => Math.max(140, width.value * 0.25))
const maxSelectableSlots = computed(() => {
  const maxSlots = showName.value ? MAX_TANK_SLOTS : MAX_CATEGORY_SLOTS
  const nameColumnWidth = showName.value ? nameWidth.value : 0
  const metadataWidth = METADATA_COLUMN_WIDTH * metadataColumnCount.value
  const expandWidth = showExpand.value ? EXPAND_COLUMN_WIDTH : 0
  const compareWidth = showCompare.value ? COMPARE_COLUMN_WIDTH : 0
  const availableWidth = width.value - nameColumnWidth - metadataWidth - expandWidth - compareWidth
  const fittedSlots = Math.max(1, Math.floor(availableWidth / MIN_SLOT_WIDTH))

  return Math.min(maxSlots, fittedSlots)
})

// Лимит меняет только видимую часть; ручной выбор заменяет весь сохранённый набор.
const visibleSlots = computed({
  get: () => orderSlots(configuredSlots.value.slice(0, maxSelectableSlots.value)),
  set: (slots: Slot[]) => configuredSlots.value = slots,
})
const sorting = useVehicleSorting(grouping, visibleSlots)

const tableStyle = computed(() => ({
  minHeight: columnsOpen.value ? `${columnSelectionHeight.value}px` : undefined,
}))

type VehicleColumn = ComposableTableColumn<VehicleStatistics, SortKey | 'compare' | 'expand'> & { metric?: Slot }
const columns = computed<VehicleColumn[]>(() => [
  ...(showCompare.value ? [{ key: 'compare', width: COMPARE_COLUMN_WIDTH } as const] : []),
  ...(showExpand.value ? [{ key: 'expand', width: EXPAND_COLUMN_WIDTH, interactive: true } as const] : []),
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
    if (matchVehicle(vehicleName(vehicle)) === null) return false

    if (selection.levels.length && !selection.levels.some(level => level === vehicle.tankLevel)) return false
    if (selection.types.length && !selection.types.some(type => type === vehicle.tankType)) return false
    if (selection.nations.length && !selection.nations.some(nation => nation === vehicle.tankTag?.split(':')[0])) return false

    return (vehicle.battles ?? 0) > filters.minBattles && (vehicle.playerCount ?? 0) > filters.minPlayers
  })

  return vehicles.sort(sorting.compare)
})

const displayedVehicles = computed(() => filteredVehicles.value.slice(0, displayLimit.value))

const metricRanges = computed(() => {
  const ranges = new Map<Slot, { min: number, max: number }>()
  if (!showValueBars.value) return ranges

  // Диапазон охватывает все отфильтрованные строки, включая ещё не показанные.
  for (const metric of visibleSlots.value) {
    let min = Infinity
    let max = -Infinity

    for (const vehicle of filteredVehicles.value) {
      const value = vehicle[metric]
      if (value == null || !Number.isFinite(value)) continue
      min = Math.min(min, value)
      max = Math.max(max, value)
    }

    if (min !== Infinity) ranges.set(metric, { min, max })
  }

  return ranges
})

function valueBarStyle(vehicle: VehicleStatistics, metric: Slot) {
  const range = metricRanges.value.get(metric)
  const value = vehicle[metric]
  if (!range || value == null || !Number.isFinite(value)) return

  // При одинаковых значениях выделять минимум или максимум не нужно.
  const progress = range.max === range.min ? 0.5 : (value - range.min) / (range.max - range.min)
  const colors = extendedPalette.value ? EXTENDED_VALUE_BAR_COLORS : VALUE_BAR_COLORS
  const colorPosition = progress * (colors.length - 1)
  const colorIndex = Math.min(Math.floor(colorPosition), colors.length - 2)
  const colorMix = (colorPosition - colorIndex) * 100

  return {
    '--value-bar-height': `${progress * 100}%`,
    '--value-bar-color': `color-mix(in oklab, ${colors[colorIndex]}, ${colors[colorIndex + 1]} ${colorMix}%)`,
  }
}

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

watch([visibleSlots, width], ([slots, tableWidth]) => {
  if (tableWidth > 0) selectedSlots.value = slots
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

    :deep(.compare-cell),
    :deep(.row-toggle) {
      padding: 0;
    }

    &.with-compare :deep(.heading:first-child) {
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

  .history-compare {
    flex: none;
    margin-left: 0;
    background: rgba(255, 255, 255, 0.05);

    &:not(.added) {
      color: inherit;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
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

  .metric-value {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;

    &.with-bar {
      padding: 0 8px;
    }
  }

  .value-bar {
    position: absolute;
    left: 4px;
    top: 50%;
    width: 3px;
    height: 24px;
    transform: translateY(-50%);
    overflow: hidden;
    border-radius: 2px;
    background: color-mix(in srgb, var(--value-bar-color) 10%, transparent);
    pointer-events: none;
    opacity: 0.8;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: var(--value-bar-height);
      min-height: 2px;
      border-radius: inherit;
      background: var(--value-bar-color);
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

    .progress {
      color: rgba(255, 255, 255, 0.55);
      font-variant-numeric: tabular-nums;
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

      @media (max-width: 450px) {
        flex: 1;
      }
    }
  }
}
</style>
