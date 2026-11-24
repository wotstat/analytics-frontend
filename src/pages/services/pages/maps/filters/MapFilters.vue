<template>
  <section class="map-filters">
    <div class="row">
      <RegionSelector v-model:selected="regions" class="region-select" />

      <div class="field mode">
        <span class="label">Режим</span>
        <BattleModeSelector v-model="battleModes" :regions />
      </div>

      <div class="actions">
        <AdvancedFiltersButton v-model="expanded" :count="advancedCount" />
        <ToolbarButton :icon="ResetIcon" :disabled="!canReset" @click="reset" />
      </div>
    </div>

    <div v-show="expanded" class="advanced-filters">
      <div class="field tank-selection">
        <span class="label">Танки</span>
        <VehicleSelectorBadges v-model="selectedTanks" :game="tankGame" class="tank-badges" />
      </div>

      <div class="row">
        <div class="field" :class="{ disabled: hasSelectedTanks }">
          <span class="label">Тип</span>
          <OptionButtons
            v-model:selected="tankTypes"
            :options="vehicleTypes"
            :disabled="hasSelectedTanks"
            class="tank-options">
            <template #default="{ option }">
              <VehicleTypeIcon :type="option" class="type-icon" />
            </template>
          </OptionButtons>
        </div>

        <div class="field level-select" :class="{ disabled: hasSelectedTanks }">
          <span class="label">Уровень</span>
          <OptionButtons
            v-model:selected="tankLevels"
            :options="vehicleLevels"
            :disabled="hasSelectedTanks"
            class="tank-options levels mt-font">
            <template #default="{ option }">{{ romanNumberProcessor(option) }}</template>
          </OptionButtons>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ResetIcon from '@/assets/icons/reset.svg'
import BattleModeSelector from '@/shared/game/components/selectors/battleMode/BattleModeSelector.vue'
import RegionSelector from '@/shared/game/components/selectors/region/RegionSelector.vue'
import VehicleSelectorBadges from '@/shared/game/components/selectors/vehicleSelector/VehicleSelectorBadges.vue'
import VehicleTypeIcon from '@/shared/game/components/vehicles/vehicleType/VehicleType.vue'
import { vehicleLevels, vehicleTypes } from '@/shared/game/domain/vehicles/types'
import { regionToGame } from '@/shared/game/domain/wot'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import OptionButtons from '@/shared/uiKit/selection/OptionButtons.vue'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import AdvancedFiltersButton from '../../shared/filters/AdvancedFiltersButton.vue'
import { useBadgeSelection } from '../../shared/filters/useBadgeSelection'
import { createMapFilters, type MapFilters } from './mapFilters'

const filters = defineModel<MapFilters>({ required: true })
const expanded = ref(false)
const defaultMode = createMapFilters().battleModes[0]

function field<Key extends keyof MapFilters>(key: Key) {
  return computed({
    get: () => filters.value[key],
    set: (value: MapFilters[Key]) => filters.value = { ...filters.value, [key]: value },
  })
}

const regions = field('regions')
const battleModes = field('battleModes')
const selectedTanks = useBadgeSelection(field('tankTags'))
const tankTypes = field('tankTypes')
const tankLevels = field('tankLevels')

const tankGame = computed(() => {
  const games = new Set(regions.value.map(regionToGame))
  return games.size === 1 ? games.values().next().value : undefined
})

const hasSelectedTanks = computed(() => selectedTanks.value.size > 0)
const advancedCount = computed(() => {
  if (hasSelectedTanks.value) return 1
  return Number(tankTypes.value.length > 0) + Number(tankLevels.value.length > 0)
})
const canReset = computed(() => advancedCount.value > 0
  || battleModes.value.length !== 1 || battleModes.value[0] !== defaultMode)

function reset() {
  filters.value = { ...createMapFilters(), regions: regions.value }
}
</script>

<style scoped lang="scss">
.map-filters {
  --map-filter-height: 24px;

  margin: 12px 0 24px;
  font-size: 15px;

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }

  .advanced-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    &.disabled {
      opacity: 0.45;
    }
  }

  .label {
    flex: none;
    color: rgba(255, 255, 255, 0.6);
  }

  .tank-selection {
    align-items: flex-start;

    .label {
      line-height: var(--map-filter-height);
    }

    .tank-badges {
      min-width: 0;

      :deep(:is(.badge, .select, .add, .close)) {
        height: var(--map-filter-height);
      }

      :deep(.add) {
        width: var(--map-filter-height);
      }
    }
  }

  .tank-options {
    --option-buttons-gap: 4px;
    --option-button-min-width: 26px;
    --option-button-height: var(--map-filter-height);
    --option-button-padding: 0 4px;
  }

  .type-icon {
    width: 14px;
    height: 14px;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }

  @container content (max-width: 600px) {
    --map-filter-height: 30px;

    .region-select {
      --option-button-flex: 1;
      --option-button-height: 25px;
      flex-basis: 100%;
    }

    .mode {
      flex: 1 1 auto;

      :deep(.mode-trigger) {
        flex: 1;
        height: 30px;
      }
    }

    .actions {
      flex: 1 0 auto;
      margin-left: 0;

      .toolbar-button {
        --toolbar-button-size: 30px;
      }
    }
  }

  @container content (max-width: 420px) {
    .mode {
      flex-basis: 100%;
    }

    .level-select {
      align-items: flex-start;

      .label {
        line-height: var(--map-filter-height);
      }

      .levels {
        display: grid;
        grid-template-columns: repeat(6, minmax(28px, 1fr));
      }
    }
  }
}
</style>
