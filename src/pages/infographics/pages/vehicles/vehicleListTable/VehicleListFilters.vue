<template>
  <button ref="trigger" class="filter-trigger" :class="{ active: activeCount > 0 }" type="button"
    :aria-expanded="open" @click="open = !open">
    Фильтры<span v-if="activeCount"> · {{ activeCount }}</span>
  </button>

  <PopoverAutoClose v-model="open" :target="trigger" :placement="['bottom-start', 'bottom-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <div class="vehicle-list-filters">
      <div class="title">
        <span>Техника</span>
        <button v-if="activeCount" type="button" @click="filters = createLocalVehicleFilters()">Сбросить</button>
      </div>

      <div class="group">
        <span class="group-label">Уровень</span>
        <div class="levels mt-font">
          <button v-for="level in levels" :key="level" type="button" class="option"
            :class="{ active: filters.levels.includes(level) }" :aria-pressed="filters.levels.includes(level)"
            @click="filters = { ...filters, levels: selectOption(filters.levels, level, levels, $event) }">
            {{ romanNumberProcessor(level) }}
          </button>
        </div>
      </div>

      <div class="group">
        <span class="group-label">Нация</span>
        <div class="nations">
          <button v-for="nation in nations" :key="nation" type="button" class="option nation"
            :class="{ active: filters.nations.includes(nation) }" :aria-pressed="filters.nations.includes(nation)"
            :aria-label="nation" :title="nation"
            @click="filters = { ...filters, nations: selectOption(filters.nations, nation, nations, $event) }">
            <Nation :nation="nation" class="flag" />
          </button>
        </div>
      </div>

      <div class="group">
        <span class="group-label">Тип техники</span>
        <div class="types">
          <button v-for="type in vehicleTypes" :key="type" type="button" class="option type"
            :class="{ active: filters.types.includes(type) }" :aria-pressed="filters.types.includes(type)"
            :aria-label="type" :title="type"
            @click="filters = { ...filters, types: selectOption(filters.types, type, vehicleTypes, $event) }">
            <VehicleType :type="type" class="type-icon" />
          </button>
        </div>
      </div>

      <label class="only-actual" title="Техника с данными за последний доступный день текущей выборки">
        <input type="checkbox" :checked="filters.onlyActual"
          @change="filters = { ...filters, onlyActual: !filters.onlyActual }">
        Только актуальные
      </label>

      <div class="group">
        <span class="group-label">Боёв больше</span>
        <div class="thresholds mt-font">
          <button v-for="threshold in battleThresholds" :key="threshold" type="button" class="option"
            :class="{ active: filters.minBattles === threshold }" :aria-pressed="filters.minBattles === threshold"
            @click="filters = { ...filters, minBattles: threshold }">{{ threshold }}</button>
        </div>
      </div>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import Nation from '@/shared/game/vehicles/nations/Nation.vue'
import { nations } from '@/shared/game/vehicles/nations/nations'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { createLocalVehicleFilters, type BattleThreshold, type LocalVehicleFilters } from './localFilters'

const filters = defineModel<LocalVehicleFilters>({ required: true })
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const levels = Array.from({ length: 11 }, (_, index) => index + 1)
const battleThresholds: BattleThreshold[] = [0, 20, 50, 100, 500]

const activeCount = computed(() => filters.value.levels.length + filters.value.nations.length +
  filters.value.types.length + Number(filters.value.onlyActual) + Number(filters.value.minBattles > 0))

function selectOption<T>(selected: readonly T[], option: T, options: readonly T[], event: MouseEvent): T[] {
  if (selected.includes(option)) return selected.filter(item => item !== option)
  if (event.shiftKey && selected.length) {
    const indices = selected.map(item => options.indexOf(item))
    const from = Math.min(options.indexOf(option), ...indices)
    const to = Math.max(options.indexOf(option), ...indices)
    return options.slice(from, to + 1)
  }
  if (event.ctrlKey || event.metaKey) return [...selected, option]
  return [option]
}
</script>

<style scoped lang="scss">
.filter-trigger {
  flex: none;
  height: 30px;
  padding: 0 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;

  &:hover,
  &.active {
    background: rgba(255, 255, 255, 0.1);
  }
}

.vehicle-list-filters {
  box-sizing: border-box;
  width: min(360px, calc(100vw - 20px));
  padding: 14px;
  font-size: 14px;
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-weight: 600;

  button {
    color: var(--blue-thin-color);
    font-size: 12px;
  }
}

.group + .group,
.only-actual + .group {
  margin-top: 14px;
}

.group-label {
  display: block;
  margin-bottom: 7px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.levels,
.nations,
.types,
.thresholds {
  display: flex;
  gap: 4px;
}

.option {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 26px;
  padding: 0 3px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);

  &:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  &.active {
    background: var(--blue-color);
  }
}

.nation {
  background: transparent;
  padding: 2px;

  .flag {
    width: 100%;
    min-width: 0;
    border-radius: 2px;
    pointer-events: none;
  }
}

.type-icon {
  width: 18px;
  height: 18px;
}

.only-actual {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  cursor: pointer;

  input {
    margin: 0;
    accent-color: var(--blue-color);
  }
}
</style>
