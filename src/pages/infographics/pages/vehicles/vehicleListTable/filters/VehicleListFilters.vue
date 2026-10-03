<template>
  <ToolbarButton ref="trigger" class="filter-trigger" variant="surface" size="large" :active="activeCount > 0"
    @click="open = !open">
    <FilterIcon class="filter-icon" />
    <span v-if="activeCount" class="active-count">{{ activeCount }}</span>
  </ToolbarButton>

  <PanelPopover v-model="open" :target="target" title="Фильтр таблицы" :width="360"
    :placement="['bottom-start', 'bottom-float', 'top-start']">
    <template #toolbar>
      <ToolbarButton class="reset-button" :icon="Reload" variant="round" :disabled="!activeCount" @click="resetFilters" />
    </template>

    <template #content>
      <div class="filters-content">
        <section v-if="showVehicleFilters" class="group panel-section">
          <h3 class="group-label">Техника</h3>
          <div class="vehicle-options">
            <div class="types">
              <button v-for="type in vehicleTypes" :key="type" class="option type"
                :class="{ active: filters.types.includes(type) }" :title="type"
                @click="filters = { ...filters, types: selectOption(filters.types, type, vehicleTypes, $event) }">
                <VehicleType :type="type" class="type-icon" />
              </button>
            </div>
            <div class="nations">
              <button v-for="nation in nations" :key="nation" class="option nation"
                :class="{ active: filters.nations.includes(nation) }" :title="nation"
                @click="filters = { ...filters, nations: selectOption(filters.nations, nation, nations, $event) }">
                <Nation :nation="nation" class="flag" />
              </button>
            </div>
            <div class="levels mt-font">
              <button v-for="level in levels" :key="level" class="option"
                :class="{ active: filters.levels.includes(level) }"
                @click="filters = { ...filters, levels: selectOption(filters.levels, level, levels, $event) }">
                {{ romanNumberProcessor(level) }}
              </button>
            </div>
            <label class="checkbox-option">
              <input type="checkbox" :checked="filters.onlyActual"
                @change="filters = { ...filters, onlyActual: !filters.onlyActual }">
              Только актуальные
            </label>
          </div>
        </section>

        <div class="group panel-section">
          <h3 class="group-label">Боёв больше</h3>
          <div class="thresholds mt-font">
            <button v-for="threshold in battleThresholds" :key="threshold" class="option"
              :class="{ active: filters.minBattles === threshold }"
              @click="filters = { ...filters, minBattles: threshold }">{{ threshold }}</button>
          </div>
        </div>

        <div class="group panel-section">
          <h3 class="group-label">Игроков больше</h3>
          <div class="thresholds mt-font">
            <button v-for="threshold in playerThresholds" :key="threshold" class="option"
              :class="{ active: filters.minPlayers === threshold }"
              @click="filters = { ...filters, minPlayers: threshold }">{{ threshold }}</button>
          </div>
        </div>

        <div class="group panel-section">
          <h3 class="group-label">График</h3>
          <label class="checkbox-option" title="Не показывать дневную точку, если wotstat был недоступен более 3 часов в этот день">
            <input type="checkbox" :checked="filters.skipIncompleteDays"
              @change="filters = { ...filters, skipIncompleteDays: !filters.skipIncompleteDays }">
            Пропускать неполные дни
          </label>
        </div>
      </div>
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import Reload from '@/assets/icons/reset.svg'
import FilterIcon from './filter.svg'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import Nation from '@/shared/game/vehicles/nations/Nation.vue'
import { nations } from '@/shared/game/vehicles/nations/nations'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import {
  createLocalVehicleFilters, DEFAULT_MIN_BATTLES, DEFAULT_MIN_PLAYERS, DEFAULT_ONLY_ACTUAL, DEFAULT_SKIP_INCOMPLETE_DAYS,
  type BattleThreshold, type LocalVehicleFilters, type PlayerThreshold
} from './localFilters'

const filters = defineModel<LocalVehicleFilters>({ required: true })
const { showVehicleFilters } = defineProps<{ showVehicleFilters: boolean }>()

const open = ref(false)
const trigger = useTemplateRef<InstanceType<typeof ToolbarButton>>('trigger')
const target = computed(() => trigger.value?.element ?? null)

const levels = Array.from({ length: 11 }, (_, index) => index + 1)
const battleThresholds: BattleThreshold[] = [0, 20, 50, 100, 500, 1000]
const playerThresholds: PlayerThreshold[] = [0, 10, 30, 50, 100, 500]

const activeCount = computed(() => {
  const { levels, nations, types, onlyActual, skipIncompleteDays, minBattles, minPlayers } = filters.value
  let count = Number(minBattles !== DEFAULT_MIN_BATTLES) + Number(minPlayers !== DEFAULT_MIN_PLAYERS)
    + Number(skipIncompleteDays !== DEFAULT_SKIP_INCOMPLETE_DAYS)

  if (showVehicleFilters) count += levels.length + nations.length + types.length + Number(onlyActual !== DEFAULT_ONLY_ACTUAL)

  return count
})

function resetFilters() {
  const defaults = createLocalVehicleFilters()

  if (showVehicleFilters) {
    filters.value = defaults
    return
  }

  filters.value = {
    ...filters.value,
    minBattles: defaults.minBattles,
    minPlayers: defaults.minPlayers,
    skipIncompleteDays: defaults.skipIncompleteDays,
  }
}

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
.reset-button:disabled {
  visibility: hidden;
}

.filter-trigger {
  position: relative;

  .filter-icon {
    width: 14px;
    height: 14px;
  }

  .active-count {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 14px;
    height: 14px;
    padding: 0 2px;
    border-radius: 10px;
    background: var(--blue-color);
    color: white;
    font-size: 10px;
    line-height: 14px;
  }
}

.filters-content {
  .checkbox-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    input {
      margin: 0;
      accent-color: var(--blue-color);
    }
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

  .levels,
  .types,
  .thresholds {
    display: flex;
    gap: 4px;
  }

  .levels,
  .thresholds {
    .option {
      font-size: 14px;
    }
  }

  .group {
    .vehicle-options {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .types {
        .type-icon {
          width: 14px;
          height: 14px;
        }
      }

      .nations {
        display: flex;
        justify-content: center;
        gap: 1px;

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
      }
    }
  }
}
</style>
