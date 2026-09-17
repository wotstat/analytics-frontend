<template>
  <section class="vehicle-table" ref="table" :style="tableStyle" :aria-busy="status === loading"
    aria-label="Статистика техники">
    <div class="toolbar">
      <SearchLine v-model="search" class="search" placeholder="Найти танк" />
      <VehicleListFilters v-model="localFilters" />
      <VehicleColumnSelector v-model="selectedSlots" :max-slots="maxSelectableSlots" />
    </div>

    <div class="head line mt-font">
      <span aria-hidden="true"></span>
      <button class="heading"
        :class="{ 'order-by': sortPosition('tankLevel'), 'secondary-sort': sortPosition('tankLevel') > 1, asc: sortAscending('tankLevel') }"
        @click="sort($event, 'tankLevel')" :aria-label="sortLabel('tankLevel', 'Уровень')"
        v-tooltip.instant.top-float="'Уровень'">
        <span class="level-heading">Ур.</span>
        <span class="sort-arrow" v-if="sortPosition('tankLevel')" aria-hidden="true"><span
            v-if="sortPosition('tankLevel') > 1" class="sort-number">{{ sortPosition('tankLevel') }}</span></span>
      </button>
      <button class="heading"
        :class="{ 'order-by': sortPosition('tankType'), 'secondary-sort': sortPosition('tankType') > 1, asc: sortAscending('tankType') }"
        @click="sort($event, 'tankType')" :aria-label="sortLabel('tankType', 'Тип техники')"
        v-tooltip.instant.top-float="'Тип техники'">
        <VehicleType type="any" class="type-heading" />
        <span class="sort-arrow" v-if="sortPosition('tankType')" aria-hidden="true"><span
            v-if="sortPosition('tankType') > 1" class="sort-number">{{ sortPosition('tankType') }}</span></span>
      </button>
      <button class="heading"
        :class="{ 'order-by': sortPosition('name'), 'secondary-sort': sortPosition('name') > 1, asc: sortAscending('name') }"
        @click="sort($event, 'name')" :aria-label="sortLabel('name', 'Танк')">
        <Icon icon="tank" class="icon" />
        <span class="sort-arrow" v-if="sortPosition('name')" aria-hidden="true"><span v-if="sortPosition('name') > 1"
            class="sort-number">{{ sortPosition('name') }}</span></span>
      </button>
      <div class="values">
        <button v-for="slot in visibleSlots" :key="slot" class="heading"
          :class="{ 'order-by': sortPosition(slot), 'secondary-sort': sortPosition(slot) > 1, asc: sortAscending(slot) }"
          :aria-label="sortLabel(slot, availableSlots[slot].label)"
          v-tooltip.instant.top-float="availableSlots[slot].label" @click="sort($event, slot)">
          <Icon :icon="availableSlots[slot].icon" class="icon" />
          <span class="sort-arrow" v-if="sortPosition(slot)" aria-hidden="true"><span v-if="sortPosition(slot) > 1"
              class="sort-number">{{ sortPosition(slot) }}</span></span>
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
      <span>{{ hasLocalFilters ? 'Танки не найдены' : 'По выбранным фильтрам пока нет данных' }}</span>
      <span class="muted" v-if="!hasLocalFilters">История статистики ещё заполняется</span>
    </div>
    <div v-else class="body">
      <VehicleListRow v-for="vehicle in displayedVehicles" :key="vehicle.tankTag" :vehicle :latest-day="latestDay"
        :slots="visibleSlots" :filters :min-battles="localFilters.minBattles" :min-players="localFilters.minPlayers" />
      <button v-if="displayedVehicles.length < filteredVehicles.length" class="show-more text-button"
        @click="displayLimit += PAGE_SIZE">Показать ещё {{ Math.min(PAGE_SIZE, filteredVehicles.length - displayLimit)
        }}</button>
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
import { getTankName } from '@/shared/i18n/i18n'
import { availableSlots, orderSlots, type Slot, type VehicleStatistics } from './helpers'
import { createLocalVehicleFilters, DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS } from './localFilters'
import VehicleColumnSelector from './VehicleColumnSelector.vue'
import VehicleListFilters from './VehicleListFilters.vue'
import VehicleListRow from './VehicleListRow.vue'
import type { VehicleFilters } from '../filters/types'

const props = defineProps<{
  slots: Slot[]
  vehicles: VehicleStatistics[]
  status: Status
  filters: VehicleFilters
}>()

defineEmits<{ retry: [] }>()

const PAGE_SIZE = 50
const MAX_SLOTS = 7
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
const localFilters = ref(createLocalVehicleFilters())
const selectedSlots = ref<Slot[]>(orderSlots(props.slots))
const displayLimit = ref(PAGE_SIZE)
const sortOrders = ref<SortOrder[]>([{ key: 'battles', ascending: false }])
const { width } = useElementSize(useTemplateRef('table'))
const nameWidth = computed(() => Math.max(140, width.value * 0.25))
const maxSelectableSlots = computed(() => Math.min(MAX_SLOTS,
  Math.max(1, Math.floor((width.value - nameWidth.value - METADATA_COLUMN_WIDTH * 2 - EXPAND_COLUMN_WIDTH) / MIN_SLOT_WIDTH))))
const visibleSlots = computed(() => selectedSlots.value)
const tableStyle = computed(() => ({
  '--name-width': `${nameWidth.value}px`,
  '--metadata-width': `${METADATA_COLUMN_WIDTH}px`,
  '--expand-width': `${EXPAND_COLUMN_WIDTH}px`,
  '--vehicle-columns': 'var(--expand-width) repeat(2, var(--metadata-width)) var(--name-width) minmax(0, 1fr)',
  '--slot-count': visibleSlots.value.length,
}))

const latestDay = computed(() => props.vehicles.reduce((latest, vehicle) =>
  vehicle.day > latest ? vehicle.day : latest, ''))
const hasLocalFilters = computed(() => search.value.trim().length > 0 || localFilters.value.levels.length > 0 ||
  localFilters.value.types.length > 0 || localFilters.value.nations.length > 0 ||
  localFilters.value.onlyActual || localFilters.value.minBattles !== DEFAULT_MIN_BATTLES ||
  localFilters.value.minPlayers !== DEFAULT_MIN_PLAYERS)

const filteredVehicles = computed(() => {
  const matchVehicle = createVehicleNameFilter(search.value)
  const filters = localFilters.value
  return props.vehicles.filter(vehicle =>
    matchVehicle(getTankName(vehicle.tankTag, true)) !== null &&
    (!filters.levels.length || filters.levels.includes(vehicle.tankLevel)) &&
    (!filters.types.length || filters.types.some(type => type === vehicle.tankType)) &&
    (!filters.nations.length || filters.nations.some(nation => nation === vehicle.tankTag.split(':')[0])) &&
    (!filters.onlyActual || vehicle.day === latestDay.value) &&
    (vehicle.battles ?? 0) > filters.minBattles &&
    (vehicle.playerCount ?? 0) > filters.minPlayers
  )
    .sort((a, b) => {
      for (const { key, ascending } of sortOrders.value) {
        if (key === 'name') {
          const comparison = getTankName(a.tankTag, true).localeCompare(getTankName(b.tankTag, true), 'ru')
          if (comparison) return ascending ? comparison : -comparison
          continue
        }
        const left = key === 'tankType' ? typeOrder.get(a.tankType) ?? null : a[key]
        const right = key === 'tankType' ? typeOrder.get(b.tankType) ?? null : b[key]
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
      return a.tankTag.localeCompare(b.tankTag)
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
watch(maxSelectableSlots, limit => {
  if (width.value > 0 && selectedSlots.value.length > limit) selectedSlots.value = selectedSlots.value.slice(0, limit)
}, { immediate: true })
watch(visibleSlots, slots => {
  sortOrders.value = sortOrders.value.filter(({ key }) => key === 'name' || key === 'tankLevel' || key === 'tankType' || slots.includes(key))
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

button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--blue-thin-color);
  outline-offset: -2px;
}
</style>
