<template>
  <section ref="table" class="achievement-table">
    <div class="toolbar">
      <SearchLine v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters v-model="localFilters" grouping="tanks" :available-nations="availableNations"
        :show-thresholds="false" />
      <div class="settings">
        <VehicleTableSettings appearance-only v-model:show-value-bars="showValueBars"
          v-model:extended-palette="extendedPalette" v-model:pin-compared="pinCompared" />
      </div>
    </div>

    <ComposableTable v-model:expanded-rows="expandedRows" class="achievement-stats" :columns
      :rows="status === success ? displayedVehicles : []" :row-key="vehicle => vehicle.rowKey"
      :sort="sorting.sortOrders.value" :loading="status === loading" @sort="onSort" @cell-click="onCellClick">
      <template #header-compare>
        <button v-if="bulkComparisonTotal <= MAX_BULK_COMPARISON_LINES" class="compare-all" type="button"
          :disabled="status !== success || !comparisonCandidates.length"
          v-tooltip="'Добавить все танки к сравнению'" @click="compareAll">
          <PlusIcon />
        </button>
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
        <span class="metric-value" :class="{ 'with-bar': showValueBars }">{{ value ?? '—' }}</span>
      </template>

      <template #expanded="{ row }">
        <AchievementHistory :kind :sources="[historySource(row)]" :filters :before-day compact
          v-model:step="historyStep" v-model:average-window="averageWindow" />
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
import PlusIcon from '../vehicles/vehicleListTable/assets/plus-bold.svg'
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
import { useVehicleSorting, type SortKey, type SortOrder } from '../vehicles/vehicleListTable/utils/useVehicleSorting'
import { availableSlots, type Slot } from '../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { formatSlotValue } from '../vehicles/vehicleMetricSelector/utils/formatMetricValue'
import type { ComparisonCandidate, ComparisonSource } from '../vehicles/timeSeriesCompare/types'
import { comparisonRowKey } from '../vehicles/timeSeriesCompare/utils/comparisonRowKey'
import type { HistoryStep, HistoryAverageWindow } from '../vehicles/timeSeries/period/historyStep'
import AchievementHistory from './history/AchievementHistory.vue'
import { achievements, type AchievementKind } from './utils/achievements'

const props = defineProps<{
  kind: AchievementKind
  vehicles: VehicleStatisticsRow[]
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
const sorting = useVehicleSorting(ref<VehicleGrouping>('tanks'), slots, sort)
const table = useTemplateRef<HTMLElement>('table')
const { width } = useElementSize(table)
const showMetadata = computed(() => width.value >= 700)
const showImage = computed(() => width.value >= 560)
const availableNations = computed<readonly Nation[]>(() => regionToGame(props.filters.regions[0]) === 'mt' ? mtNations : wotNations)

type AchievementColumn = ComposableTableColumn<VehicleStatisticsRow, SortKey | 'compare' | 'expand'> & { metric?: Slot }
const columns = computed<AchievementColumn[]>(() => {
  const columns: AchievementColumn[] = [
    { key: 'compare', width: 32 },
    { key: 'expand', width: 18, interactive: true },
  ]

  if (showMetadata.value) columns.push(
    { key: 'tankLevel', label: 'Уровень', width: 40, sortable: true, interactive: true },
    { key: 'tankType', label: 'Тип техники', width: 40, sortable: true, interactive: true },
  )

  columns.push(
    { key: 'name', label: 'Название танка', width: '2fr', minWidth: showImage.value ? 200 : 110, align: 'left', sortable: true, interactive: true },
    ...slots.value.map(metric => ({
      key: metric, metric, label: availableSlots[metric].label, minWidth: showValueBars.value ? 62 : 46,
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

  const compared: VehicleStatisticsRow[] = []
  const remaining: VehicleStatisticsRow[] = []
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
</script>

<style scoped lang="scss">
@use '../vehicles/vehicleListTable/utils/vehicleValueBars.scss' as *;

.achievement-table {
  @include vehicle-value-bars;

  min-width: 0;
  font-size: 14px;

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .search {
      flex: 0 1 240px;
      min-width: 0;
      width: 240px;
    }

    .settings {
      flex: none;
      margin-left: auto;
    }
  }

  .achievement-stats {
    --composable-table-cell-padding: 0 3px;

    :deep(.composable-table-head .heading) {
      container-type: inline-size;
      container-name: achievement-heading;
    }

    :deep(.composable-table-cell:first-child) {
      padding: 0;
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
