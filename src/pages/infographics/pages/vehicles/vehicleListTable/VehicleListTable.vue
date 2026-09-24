<template>
  <section class="vehicle-table" ref="table" :style="tableStyle">
    <div class="toolbar">
      <label class="grouping-selector">
        <select v-model="grouping">
          <option v-for="option in vehicleGroupings" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>

      <SearchLine v-if="showName" v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters v-model="localFilters" :show-vehicle-filters="showName" />
      <VehicleColumnSelector v-model="selectedSlots" :max-slots="maxSelectableSlots" />
      <VehicleTableSettings v-model="period" />
    </div>

    <div class="head mt-font">
      <span></span>
      <span></span>

      <SortableHeading v-if="showLevel" label="Уровень" v-bind="sorting.state('tankLevel')"
        @click="sorting.toggle('tankLevel', $event.altKey)">
        <span class="level-heading">Ур.</span>
      </SortableHeading>

      <SortableHeading v-if="showType" label="Тип техники" v-bind="sorting.state('tankType')"
        @click="sorting.toggle('tankType', $event.altKey)">
        <VehicleType type="any" class="type-heading" />
      </SortableHeading>

      <SortableHeading v-if="showName" label="Название танка" v-bind="sorting.state('name')"
        @click="sorting.toggle('name', $event.altKey)">
        <Icon icon="tank" class="icon" />
      </SortableHeading>

      <div class="values">
        <SortableHeading v-for="slot in visibleSlots" :key="slot" :label="availableSlots[slot].label"
          v-bind="sorting.state(slot)" @click="sorting.toggle(slot, $event.altKey)">
          <Icon :icon="availableSlots[slot].icon" class="icon" />
        </SortableHeading>
      </div>
    </div>

    <div v-if="status === loading" class="state">
      <Loader class="loader" />
      <span>Загружаем статистику техники…</span>
    </div>

    <div v-else-if="isErrorStatus(status)" class="state">
      <span>Не удалось загрузить статистику техники</span>
      <button class="text-button" @click="$emit('retry')">Попробовать ещё раз</button>
    </div>

    <div v-else-if="!filteredVehicles.length" class="state">
      <span>{{ emptyMessage }}</span>
      <span class="muted" v-if="!hasLocalFilters">История статистики ещё заполняется</span>
    </div>

    <div v-else class="body">
      <VehicleListRow v-for="vehicle in displayedVehicles" :key="vehicle.rowKey" :vehicle :latest-day="latestDay"
        v-model:active-slot="activeSlot" v-model:history-step="historyStep" v-model:average-window="averageWindow"
        :slots="visibleSlots" :filters :compared="comparedKeys.includes(vehicle.rowKey)"
        :selection="effectiveSelection" :min-battles="localFilters.minBattles" :min-players="localFilters.minPlayers"
        @compare="selection => $emit('compare', vehicle, selection)" />

      <button v-if="displayedVehicles.length < filteredVehicles.length" class="show-more text-button"
        @click="displayLimit += PAGE_SIZE">
        Показать ещё {{ Math.min(PAGE_SIZE, filteredVehicles.length - displayLimit) }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { isErrorStatus, loading, type Status } from '@/db'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { createVehicleNameFilter } from '@/shared/game/vehicles/vehicleSearch'
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import { availableSlots, orderSlots, type Slot } from '../shared/vehicleMetrics'
import type { VehicleStatistics } from '../shared/types'
import { DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS, DEFAULT_ONLY_ACTUAL, type LocalVehicleFilters } from './localFilters'
import { vehicleGroupings, type VehicleGrouping, type VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'
import VehicleColumnSelector from './VehicleColumnSelector.vue'
import VehicleTableSettings from './VehicleTableSettings.vue'
import VehicleListFilters from './VehicleListFilters.vue'
import VehicleListRow from './VehicleListRow.vue'
import SortableHeading from './SortableHeading.vue'
import { useVehicleSorting } from './useVehicleSorting'
import type { VehicleFilters } from '../filters/types'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/historyStep'
import type { VehicleStatisticsPeriod } from '../shared/vehicleStatisticsPeriod'

const props = defineProps<{
  slots: Slot[]
  vehicles: VehicleStatistics[]
  status: Status
  filters: VehicleFilters
  comparedKeys: string[]
}>()

defineEmits<{ retry: [], compare: [vehicle: VehicleStatistics, selection: VehicleSelection] }>()

const PAGE_SIZE = 50
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

const selectedSlots = ref<Slot[]>(orderSlots(props.slots))
const activeSlot = ref<Slot>(selectedSlots.value[0] ?? 'battles')
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)

const displayLimit = ref(PAGE_SIZE)
const sorting = useVehicleSorting(grouping, selectedSlots)

const { width } = useElementSize(useTemplateRef('table'))

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
  '--name-width': `${nameWidth.value}px`,
  '--metadata-width': `${METADATA_COLUMN_WIDTH}px`,
  '--metadata-columns': `repeat(${metadataColumnCount.value}, var(--metadata-width))`,
  '--name-column-end': metadataColumnCount.value + (showName.value ? 4 : 3),
  '--compare-width': `${COMPARE_COLUMN_WIDTH}px`,
  '--expand-width': `${EXPAND_COLUMN_WIDTH}px`,
  '--vehicle-columns': showName.value
    ? 'var(--compare-width) var(--expand-width) var(--metadata-columns) var(--name-width) minmax(0, 1fr)'
    : 'var(--compare-width) var(--expand-width) var(--metadata-columns) minmax(0, 1fr)',
  '--vehicle-name-columns': showName.value
    ? 'var(--expand-width) var(--metadata-columns) minmax(0, 1fr)'
    : 'var(--expand-width) var(--metadata-columns)',
  '--slot-count': visibleSlots.value.length,
}))

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

watch([search, localFilters, () => props.vehicles], () => displayLimit.value = PAGE_SIZE)

watch(grouping, () => search.value = '')

watch(maxSelectableSlots, limit => {
  if (width.value > 0 && selectedSlots.value.length > limit) selectedSlots.value = selectedSlots.value.slice(0, limit)
}, { immediate: true })

watch(visibleSlots, slots => {
  if (!slots.includes(activeSlot.value)) activeSlot.value = slots[0] ?? 'battles'
})
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

    .grouping-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      color: rgba(255, 255, 255, 0.6);

      select {
        min-width: 0;
        height: 30px;
        padding: 0 8px;
        border: none;
        border-radius: 5px;
        background: rgba(255, 255, 255, 0.08);
        color: white;
        color-scheme: dark;
        font: inherit;
        cursor: pointer;
      }
    }
  }

  .head {
    display: grid;
    grid-template-columns: var(--vehicle-columns);

    .values {
      display: grid;
      grid-template-columns: repeat(var(--slot-count), minmax(0, 1fr));
    }

    .heading {
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
    }
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

  .body {
    .show-more {
      display: block;
      width: 100%;
      padding: 18px;
      font-size: inherit;
    }
  }
}
</style>
