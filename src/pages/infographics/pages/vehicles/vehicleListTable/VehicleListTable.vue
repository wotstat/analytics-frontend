<template>
  <section class="vehicle-table" ref="table" :style="tableStyle">
    <div class="toolbar">
      <label class="grouping-selector">
        <select v-model="grouping">
          <option v-for="option in vehicleGroupings" :key="option.value" :value="option.value">{{ option.label }}
          </option>
        </select>
      </label>
      <SearchLine v-if="showName" v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters v-model="localFilters" :show-vehicle-filters="showName" />
      <VehicleColumnSelector v-model="selectedSlots" :max-slots="maxSelectableSlots" />
    </div>

    <div class="head line mt-font">
      <span></span>

      <button v-if="showLevel" class="heading"
        :class="{ 'order-by': sortPosition('tankLevel'), 'secondary-sort': sortPosition('tankLevel') > 1, asc: sortAscending('tankLevel') }"
        @click="sort($event, 'tankLevel')" v-tooltip.instant.top-float="'Уровень'">
        <span class="level-heading">Ур.</span>
        <span class="sort-arrow" v-if="sortPosition('tankLevel')"><span v-if="sortPosition('tankLevel') > 1"
            class="sort-number">{{ sortPosition('tankLevel') }}</span></span>
      </button>

      <button v-if="showType" class="heading"
        :class="{ 'order-by': sortPosition('tankType'), 'secondary-sort': sortPosition('tankType') > 1, asc: sortAscending('tankType') }"
        @click="sort($event, 'tankType')" v-tooltip.instant.top-float="'Тип техники'">
        <VehicleType type="any" class="type-heading" />
        <span class="sort-arrow" v-if="sortPosition('tankType')"><span v-if="sortPosition('tankType') > 1"
            class="sort-number">{{ sortPosition('tankType') }}</span></span>
      </button>

      <button v-if="grouping === 'tanks'" class="heading"
        :class="{ 'order-by': sortPosition('name'), 'secondary-sort': sortPosition('name') > 1, asc: sortAscending('name') }"
        v-tooltip.instant.top-float="'Название танка'"
        @click="sort($event, 'name')">
        <Icon icon="tank" class="icon" />
        <span class="sort-arrow" v-if="sortPosition('name')"><span v-if="sortPosition('name') > 1"
            class="sort-number">{{ sortPosition('name') }}</span></span>
      </button>

      <div class="values">
        <button v-for="slot in visibleSlots" :key="slot" class="heading"
          :class="{ 'order-by': sortPosition(slot), 'secondary-sort': sortPosition(slot) > 1, asc: sortAscending(slot) }"
          v-tooltip.instant.top-float="availableSlots[slot].label" @click="sort($event, slot)">
          <Icon :icon="availableSlots[slot].icon" class="icon" />
          <span class="sort-arrow" v-if="sortPosition(slot)"><span v-if="sortPosition(slot) > 1" class="sort-number">{{
            sortPosition(slot) }}</span></span>
        </button>
      </div>
    </div>

    <div v-if="status === loading" class="state" role="status">
      <Loader class="loader" />
      <span>Загружаем статистику техники…</span>
    </div>
    <div v-else-if="isErrorStatus(status)" class="state" role="alert">
      <span>Не удалось загрузить статистику техники</span>
      <button class="text-button" @click="$emit('retry')">Попробовать ещё раз</button>
    </div>
    <div v-else-if="!filteredVehicles.length" class="state" role="status">
      <span>{{ hasLocalFilters ?
        (grouping === 'tanks' ? 'Танки не найдены' : 'Категории не найдены') :
        'По выбранным фильтрам пока нет данных' }}</span>
      <span class="muted" v-if="!hasLocalFilters">История статистики ещё заполняется</span>
    </div>
    <div v-else class="body">
      <VehicleListRow v-for="vehicle in displayedVehicles" :key="vehicle.rowKey" :vehicle :latest-day="latestDay"
        v-model:active-slot="activeSlot" v-model:history-step="historyStep" :slots="visibleSlots" :filters
        :selection="effectiveSelection" :min-battles="localFilters.minBattles" :min-players="localFilters.minPlayers" />

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
import { vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import { createVehicleNameFilter } from '@/shared/game/vehicles/vehicleSearch'
import SearchLine from '@/shared/game/selectors/components/searchLine/SearchLine.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import { availableSlots, orderSlots, type Slot, type VehicleStatistics } from './helpers'
import { DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS, type LocalVehicleFilters } from './localFilters'
import { vehicleGroupings, type VehicleGrouping } from '../vehicleGrouping'
import { vehicleName } from './vehicleName'
import VehicleColumnSelector from './VehicleColumnSelector.vue'
import VehicleListFilters from './VehicleListFilters.vue'
import VehicleListRow from './VehicleListRow.vue'
import type { VehicleFilters } from '../filters/types'
import type { HistoryStep } from '../timeSeries/historyStep'
import type { VehicleSelection } from '../vehicleGrouping'

const props = defineProps<{
  slots: Slot[]
  vehicles: VehicleStatistics[]
  status: Status
  filters: VehicleFilters
}>()

defineEmits<{ retry: [] }>()

const PAGE_SIZE = 50
const MAX_TANK_SLOTS = 7
const MAX_CATEGORY_SLOTS = 12
const MIN_SLOT_WIDTH = 86
const METADATA_COLUMN_WIDTH = 40
const EXPAND_COLUMN_WIDTH = 20
type SortKey = Slot | 'name' | 'tankLevel' | 'tankType'
type SortOrder = { key: SortKey, ascending: boolean }
const typeOrder = new Map<string, number>(vehicleTypes.map((type, index) => [type, vehicleTypes.length - index]))

function compareDescending(left: number | null, right: number | null) {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  return right - left
}

const search = ref('')
const localFilters = defineModel<LocalVehicleFilters>('localFilters', { required: true })
const grouping = defineModel<VehicleGrouping>('grouping', { required: true })
const selectedSlots = ref<Slot[]>(orderSlots(props.slots))
const activeSlot = ref<Slot>(selectedSlots.value[0] ?? 'battles')
const historyStep = ref<HistoryStep>('day')
const displayLimit = ref(PAGE_SIZE)
const sortOrders = ref<SortOrder[]>([{ key: 'battles', ascending: false }])
const { width } = useElementSize(useTemplateRef('table'))
const showLevel = computed(() => grouping.value !== 'classes')
const showType = computed(() => grouping.value !== 'levels')
const showName = computed(() => grouping.value === 'tanks')
const effectiveSelection = computed<VehicleSelection>(() => showName.value ? localFilters.value : {
  levels: [], types: [], nations: []
})
const metadataColumnCount = computed(() => Number(showLevel.value) + Number(showType.value))
const nameWidth = computed(() => Math.max(140, width.value * 0.25))
const maxSelectableSlots = computed(() => Math.min(showName.value ? MAX_TANK_SLOTS : MAX_CATEGORY_SLOTS,
  Math.max(1, Math.floor((width.value - (showName.value ? nameWidth.value : 0) - METADATA_COLUMN_WIDTH * metadataColumnCount.value - EXPAND_COLUMN_WIDTH) / MIN_SLOT_WIDTH))))
const visibleSlots = computed(() => selectedSlots.value)
const tableStyle = computed(() => ({
  '--name-width': `${nameWidth.value}px`,
  '--metadata-width': `${METADATA_COLUMN_WIDTH}px`,
  '--metadata-columns': `repeat(${metadataColumnCount.value}, var(--metadata-width))`,
  '--name-column-end': metadataColumnCount.value + (showName.value ? 3 : 2),
  '--expand-width': `${EXPAND_COLUMN_WIDTH}px`,
  '--vehicle-columns': showName.value
    ? 'var(--expand-width) var(--metadata-columns) var(--name-width) minmax(0, 1fr)'
    : 'var(--expand-width) var(--metadata-columns) minmax(0, 1fr)',
  '--vehicle-name-columns': showName.value
    ? 'var(--expand-width) var(--metadata-columns) minmax(0, 1fr)'
    : 'var(--expand-width) var(--metadata-columns)',
  '--slot-count': visibleSlots.value.length,
}))

const latestDay = computed(() => props.vehicles.reduce((latest, vehicle) =>
  vehicle.day > latest ? vehicle.day : latest, ''))
const hasLocalFilters = computed(() => (showName.value && (search.value.trim().length > 0 ||
  localFilters.value.levels.length > 0 || localFilters.value.types.length > 0 ||
  localFilters.value.nations.length > 0 || localFilters.value.onlyActual)) ||
  localFilters.value.minBattles !== DEFAULT_MIN_BATTLES ||
  localFilters.value.minPlayers !== DEFAULT_MIN_PLAYERS)

const filteredVehicles = computed(() => {
  const matchVehicle = createVehicleNameFilter(showName.value ? search.value : '')
  const filters = localFilters.value
  return props.vehicles.filter(vehicle =>
    matchVehicle(vehicleName(vehicle)) !== null &&
    (vehicle.tankTag === null || (
      (!filters.levels.length || filters.levels.some(level => level === vehicle.tankLevel)) &&
      (!filters.types.length || filters.types.some(type => type === vehicle.tankType)) &&
      (!filters.nations.length || filters.nations.some(nation => nation === vehicle.tankTag?.split(':')[0]))
    )) &&
    (!showName.value || !filters.onlyActual || vehicle.day === latestDay.value) &&
    (vehicle.battles ?? 0) > filters.minBattles &&
    (vehicle.playerCount ?? 0) > filters.minPlayers
  )
    .sort((a, b) => {
      for (const { key, ascending } of sortOrders.value) {
        if (key === 'name') {
          const comparison = vehicleName(a).localeCompare(vehicleName(b), 'ru')
          if (comparison) return ascending ? comparison : -comparison
          continue
        }
        const left = key === 'tankType' ? typeOrder.get(a.tankType ?? '') ?? null : a[key]
        const right = key === 'tankType' ? typeOrder.get(b.tankType ?? '') ?? null : b[key]
        // Отсутствующие значения всегда идут последними, в том числе при сортировке по возрастанию.
        if (left === null && right !== null) return 1
        if (right === null && left !== null) return -1
        const comparison = (left ?? 0) - (right ?? 0)
        if (comparison) return ascending ? comparison : -comparison
      }
      if (sortOrders.value.some(({ key }) => key !== 'name' && key !== 'tankLevel' && key !== 'tankType')) {
        const secondary = compareDescending(a.battles, b.battles) || compareDescending(a.damage, b.damage)
        if (secondary) return secondary
      }
      return a.rowKey.localeCompare(b.rowKey)
    })
})
const displayedVehicles = computed(() => filteredVehicles.value.slice(0, displayLimit.value))

function defaultAscending(key: SortKey) {
  return key === 'name'
}

function sortPosition(key: SortKey) {
  return sortOrders.value.findIndex(order => order.key === key) + 1
}

function sortAscending(key: SortKey) {
  return sortOrders.value.find(order => order.key === key)?.ascending ?? false
}

function sort(event: MouseEvent, key: SortKey) {
  const index = sortPosition(key) - 1
  if (!event.altKey) {
    const ascending = sortOrders.value.length === 1 && index === 0
      ? !sortOrders.value[0].ascending : defaultAscending(key)
    sortOrders.value = [{ key, ascending }]
    return
  }

  if (index < 0) sortOrders.value.push({ key, ascending: defaultAscending(key) })
  else if (sortOrders.value[index].ascending === defaultAscending(key)) {
    sortOrders.value[index].ascending = !defaultAscending(key)
  } else sortOrders.value.splice(index, 1)
}

function sortLabel(key: SortKey, label: string) {
  const position = sortPosition(key)
  if (!position) return `${label}. Alt+клик: добавить в сортировку`
  return `${label}. Порядок ${position}, ${sortAscending(key) ? 'по возрастанию' : 'по убыванию'}. Alt+клик: ${sortAscending(key) === defaultAscending(key) ? 'сменить направление' : 'убрать из сортировки'}`
}

watch([search, localFilters, () => props.vehicles], () => displayLimit.value = PAGE_SIZE)
watch(grouping, () => {
  search.value = ''
  sortOrders.value = sortOrders.value.filter(({ key }) =>
    (key !== 'tankLevel' || showLevel.value) && (key !== 'tankType' || showType.value) &&
    (key !== 'name' || showName.value))
  if (!sortOrders.value.length) sortOrders.value = [{ key: 'battles', ascending: false }]
})
watch(maxSelectableSlots, limit => {
  if (width.value > 0 && selectedSlots.value.length > limit) selectedSlots.value = selectedSlots.value.slice(0, limit)
}, { immediate: true })
watch(visibleSlots, slots => {
  sortOrders.value = sortOrders.value.filter(({ key }) => key === 'name' || key === 'tankLevel' || key === 'tankType' || slots.includes(key))
  if (!slots.includes(activeSlot.value)) activeSlot.value = slots[0] ?? 'battles'
})
</script>

<style lang="scss" scoped>
.vehicle-table {
  min-width: 0;
  font-size: 14px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

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

.line {
  display: grid;
  grid-template-columns: var(--vehicle-columns);
}

.values {
  display: grid;
  grid-template-columns: repeat(var(--slot-count), minmax(0, 1fr));
}

.heading {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 42px;
  padding: 1px;
  color: #fff;
  transition: background-color 0.1s;

  @media (hover: hover) {
    &:hover {
      background-color: rgba(255, 255, 255, 0.025);

      &.order-by {
        background-color: rgba(255, 255, 255, 0.04);
      }
    }
  }

  &.order-by {
    background-color: rgba(255, 255, 255, 0.025);
  }

  &.secondary-sort .sort-arrow {
    opacity: 0.55;
  }

  &.asc .sort-arrow::after {
    top: auto;
    bottom: 0;
    transform: translate(-50%, 0) rotate(180deg);
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

.sort-arrow {
  position: absolute;
  height: 1px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: currentColor;
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    transform: translate(-50%, 0);
    width: 13px;
    height: 5px;
    background-color: currentColor;
    clip-path: polygon(0 0, 100% 0, 50% 100%);
  }
}

.sort-number {
  position: absolute;
  left: calc(50% + 9px);
  bottom: 2px;
  font-size: 9px;
  font-weight: bold;
  line-height: 1;
  font-variant-numeric: tabular-nums;
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
</style>
