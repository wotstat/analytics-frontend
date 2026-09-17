<template>
  <section class="vehicle-filters">
    <div class="toolbar">
      <div class="region-select" title="Shift + клик — выбрать несколько регионов">
        <button v-for="region in regionOptions" :key="region" class="variant mt-font"
          :class="{ active: regions.includes(region) }" @click="selectRegion(region, $event)">{{ region }}</button>
      </div>

      <div class="primary-filter">
        <span class="label">Режим</span>
        <FilterSelectorBadges v-model="modes" all-label="Все режимы" :options="modeOptions" />
      </div>
      <div class="primary-filter">
        <span class="label">Карта</span>
        <ArenaSelectorBadges v-model="arenas" :game="arenaGame" />
      </div>

      <div class="actions">
        <button class="expand" :class="{ enabled: advancedCount > 0 }" @click="expanded = !expanded">
          Ещё фильтры<span v-if="advancedCount"> · {{ advancedCount }}</span>
          <ArrowDown class="arrow" :class="{ expanded }" />
        </button>
        <button class="reset" :disabled="!canReset" title="Сбросить фильтры" @click="reset">
          <ResetIcon />
        </button>
      </div>
    </div>

    <div v-show="expanded" class="advanced-filters">
      <div class="advanced-row">
        <span class="label" title="Для карт без отдельно выбранного респа">Респ</span>
        <div class="variants">
          <button v-for="option in teamOptions" :key="option.value" class="variant "
            :class="{ active: team === option.value, neutral: option.value === 'any' }" @click="team = option.value">{{
              option.label }}</button>
        </div>
      </div>
      <div class="advanced-row">
        <span class="label">Взвод</span>
        <div class="variants">
          <button v-for="option in platoonOptions" :key="option.value" class="variant "
            :class="{ active: platoon === option.value, neutral: option.value === 'any' }"
            @click="platoon = option.value">{{ option.label }}</button>
        </div>
      </div>
      <div class="advanced-row">
        <span class="label">Результат</span>
        <div class="variants">
          <button v-for="option in resultOptions" :key="option.value" class="variant "
            :class="{ active: result === option.value, neutral: option.value === 'any' }"
            @click="result = option.value">{{ option.label }}</button>
        </div>
      </div>
      <div class="advanced-row">
        <span class="label">Уровни боя</span>
        <div class="variants">
          <button v-for="option in battleLevelOptions" :key="option.value" class="variant "
            :class="{ active: battleLevel === option.value, neutral: option.value === 'any' }"
            v-tooltip:battleLevel.bottom-float="battleLevelDescriptions[option.value]"
            @click="battleLevel = option.value">{{ option.label
            }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import ResetIcon from '@/assets/icons/reset.svg'
import ArenaSelectorBadges from '@/shared/game/selectors/arena/ArenaSelectorBadges.vue'
import { customBattleModes, customBattleModesKeys, regionToGame } from '@/shared/game/wot'
import FilterSelectorBadges from './FilterSelectorBadges.vue'
import { createVehicleFilters, type VehicleFilters, type VehicleRegion } from './types'
import { useBadgeSelection } from './useBadgeSelection'

const filters = defineModel<VehicleFilters>({ required: true })
const expanded = ref(false)
const regionOptions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const
const modeOptions = customBattleModesKeys.map(value => ({ value, label: customBattleModes[value].title }))
const teamOptions = [
  { value: 'any', label: 'Любой' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
] as const
const platoonOptions = [
  { value: 'any', label: 'Любой' },
  { value: 'solo', label: 'Без взвода' },
  { value: 'duo', label: '2 игрока' },
  { value: 'trio', label: '3 игрока' },
  { value: 'large', label: '4 и более' },
] as const
const resultOptions = [
  { value: 'any', label: 'Любой' },
  { value: 'win', label: 'Победа' },
  { value: 'loss', label: 'Поражение' },
  { value: 'draw', label: 'Ничья' },
] as const
const battleLevelOptions = [
  { value: 'any', label: 'Любые' },
  { value: 'same', label: 'Одноуровневый' },
  { value: 'top', label: 'В топе' },
  { value: 'middle', label: 'В середине' },
  { value: 'bottom', label: 'Внизу списка' },
] as const
const battleLevelDescriptions: Record<VehicleFilters['battleLevel'], string> = {
  any: 'Без ограничения по уровням участников боя',
  same: 'Все участники боя на технике того же уровня',
  top: 'Есть техника ниже уровнем, выше — нет',
  middle: 'Есть техника и ниже, и выше уровнем',
  bottom: 'Есть техника выше уровнем, ниже — нет',
}

function field<K extends keyof VehicleFilters>(key: K) {
  return computed({
    get: () => filters.value[key],
    set: (value: VehicleFilters[K]) => filters.value = { ...filters.value, [key]: value }
  })
}

const regions = field('regions')
const modes = useBadgeSelection(field('battleModes'))
const arenas = useBadgeSelection(field('arenas'))
const team = field('team')
const platoon = field('platoon')
const result = field('result')
const battleLevel = field('battleLevel')

function selectRegion(region: VehicleRegion, event: MouseEvent) {
  if (!event.shiftKey) {
    regions.value = [region]
  } else if (!regions.value.includes(region)) {
    regions.value = [...regions.value, region]
  } else if (regions.value.length > 1) {
    regions.value = regions.value.filter(value => value !== region)
  }
}

const arenaGame = computed(() => {
  const games = new Set(filters.value.regions.map(regionToGame))
  return games.size === 1 ? [...games][0] : undefined
})

const advancedCount = computed(() => [team.value, platoon.value, result.value, battleLevel.value]
  .filter(value => value !== 'any').length)

const canReset = computed(() => {
  const defaults = createVehicleFilters()
  return advancedCount.value > 0 || filters.value.arenas.length > 0 ||
    filters.value.battleModes.length !== 1 || filters.value.battleModes[0] !== defaults.battleModes[0]
})

function reset() {
  filters.value = { ...createVehicleFilters(), regions: filters.value.regions }
}
</script>

<style scoped lang="scss">
.vehicle-filters {
  margin: 12px 0 24px;
  font-size: 15px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 20px;
}

.region-select,
.variants {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 24px;
  gap: 5px;
}

.region-select {
  flex-shrink: 0;
}

.primary-filter {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  max-width: 100%;

  > :deep(div) {
    min-width: 0;
  }
}

.label {
  display: flex;
  align-items: center;
  min-height: 24px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.variant {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  padding: 0 10px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  line-height: 1;
  font-size: 14px;
  white-space: nowrap;
  user-select: none;
  transition: background-color 0.07s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.active {
    background: var(--blue-color);

    &.neutral {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 24px;
    color: rgba(255, 255, 255, 0.65);
    font-size: inherit;
    white-space: nowrap;
    transition: color 0.15s;

    &:hover:not(:disabled) {
      color: white;
    }

    &.enabled {
      color: var(--blue-thin-color);
    }
  }

  .reset {
    width: 24px;

    svg {
      width: 16px;
      height: 16px;
    }

    &:disabled {
      opacity: 0.25;
      cursor: default;
    }
  }
}

.arrow {
  margin-left: 5px;
  width: 12px;
  height: 12px;
  fill: currentColor;
  transition: transform 0.15s;

  &.expanded {
    transform: rotate(180deg);
  }
}

.advanced-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.advanced-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;

  .label {
    flex-basis: 88px;
  }
}

@media (max-width: 550px) {
  .toolbar {
    gap: 12px 16px;
  }

  .region-select {
    flex-basis: 100%;
  }

  .actions {
    margin-left: 0;
  }

  .advanced-row {
    gap: 8px;

    .label {
      flex-basis: 78px;
    }
  }
}
</style>
