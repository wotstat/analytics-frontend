<template>
  <button ref="trigger" class="filter-trigger" :class="{ active: activeCount > 0 }" type="button"
    :aria-expanded="open" @click="open = !open">
    Фильтры<span v-if="activeCount"> · {{ activeCount }}</span>
  </button>

  <PopoverAutoClose v-model="open" :target="trigger" :placement="['bottom-start', 'bottom-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <div class="vehicle-list-filters">
      <div class="title">
        <span>Фильтр таблицы</span>
        <button v-if="activeCount" type="button" class="reset" aria-label="Сбросить фильтры"
          title="Сбросить фильтры" @click="filters = createLocalVehicleFilters()">
          <Reload />
        </button>
      </div>

      <section class="group">
        <h3 class="group-label">Техника</h3>
        <div class="vehicle-options">
          <div class="types" role="group" aria-label="Тип техники">
            <button v-for="type in vehicleTypes" :key="type" type="button" class="option type"
              :class="{ active: filters.types.includes(type) }" :aria-pressed="filters.types.includes(type)"
              :aria-label="type" :title="type"
              @click="filters = { ...filters, types: selectOption(filters.types, type, vehicleTypes, $event) }">
              <VehicleType :type="type" class="type-icon" />
            </button>
          </div>
          <div class="nations" role="group" aria-label="Нация">
            <button v-for="nation in nations" :key="nation" type="button" class="option nation"
              :class="{ active: filters.nations.includes(nation) }" :aria-pressed="filters.nations.includes(nation)"
              :aria-label="nation" :title="nation"
              @click="filters = { ...filters, nations: selectOption(filters.nations, nation, nations, $event) }">
              <Nation :nation="nation" class="flag" />
            </button>
          </div>
          <div class="levels mt-font" role="group" aria-label="Уровень">
            <button v-for="level in levels" :key="level" type="button" class="option"
              :class="{ active: filters.levels.includes(level) }" :aria-pressed="filters.levels.includes(level)"
              @click="filters = { ...filters, levels: selectOption(filters.levels, level, levels, $event) }">
              {{ romanNumberProcessor(level) }}
            </button>
          </div>
          <label class="only-actual" title="Техника с данными за последний доступный день текущей выборки">
            <input type="checkbox" :checked="filters.onlyActual"
              @change="filters = { ...filters, onlyActual: !filters.onlyActual }">
            Только актуальные
          </label>
        </div>
      </section>

      <div class="group">
        <span class="group-label">Боёв больше</span>
        <div class="thresholds mt-font">
          <button v-for="threshold in battleThresholds" :key="threshold" type="button" class="option"
            :class="{ active: filters.minBattles === threshold }" :aria-pressed="filters.minBattles === threshold"
            @click="filters = { ...filters, minBattles: threshold }">{{ threshold }}</button>
        </div>
      </div>

      <div class="group">
        <span class="group-label">Игроков больше</span>
        <div class="thresholds mt-font">
          <button v-for="threshold in playerThresholds" :key="threshold" type="button" class="option"
            :class="{ active: filters.minPlayers === threshold }" :aria-pressed="filters.minPlayers === threshold"
            @click="filters = { ...filters, minPlayers: threshold }">{{ threshold }}</button>
        </div>
      </div>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import Reload from '@/assets/icons/reset.svg'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import Nation from '@/shared/game/vehicles/nations/Nation.vue'
import { nations } from '@/shared/game/vehicles/nations/nations'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { createLocalVehicleFilters, DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS,
  type BattleThreshold, type LocalVehicleFilters, type PlayerThreshold } from './localFilters'

const filters = defineModel<LocalVehicleFilters>({ required: true })
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const levels = Array.from({ length: 11 }, (_, index) => index + 1)
const battleThresholds: BattleThreshold[] = [0, 20, 50, 100, 500]
const playerThresholds: PlayerThreshold[] = [0, 10, 30, 50, 100]

const activeCount = computed(() => filters.value.levels.length + filters.value.nations.length +
  filters.value.types.length + Number(filters.value.onlyActual) +
  Number(filters.value.minBattles !== DEFAULT_MIN_BATTLES) +
  Number(filters.value.minPlayers !== DEFAULT_MIN_PLAYERS))

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
  min-height: 23px;
  margin: -14px -14px 14px;
  padding: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 600;

  .reset {
    box-sizing: border-box;
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 23px;
    height: 23px;
    padding: 4px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    svg {
      width: 100%;
      height: 100%;
    }
  }
}

.group + .group {
  margin-top: 20px;
}

.group-label {
  display: block;
  margin: 0 0 7px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.vehicle-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.levels,
.types,
.thresholds {
  display: flex;
  gap: 4px;
}

.nations {
  display: flex;
  justify-content: center;
  gap: 1px;
}

.levels .option {
  font-size: 14px;
}

.thresholds .option {
  font-size: 14px;
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

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.18);
    }
  }

  &.active {
    background: var(--blue-color);
  }
}

.nation {
  box-sizing: border-box;
  flex: 1;
  height: 20px;
  border-radius: 5px;
  background: transparent;
  padding: 2px;

  .flag {
    flex: 1;
    width: 10px;
    min-width: auto;
    border-radius: 3px;
    pointer-events: none;
    user-select: none;
    filter: brightness(1.1);
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: transparent;

      .flag {
        filter: brightness(1.8);
      }
    }
  }

  &.active {
    background: var(--blue-thin-color);

    .flag {
      filter: brightness(1.8);
    }
  }
}

.type-icon {
  width: 14px;
  height: 14px;
}

.only-actual {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input {
    margin: 0;
    accent-color: var(--blue-color);
  }
}
</style>
