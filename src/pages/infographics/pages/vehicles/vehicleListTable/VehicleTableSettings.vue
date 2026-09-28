<template>
  <button ref="trigger" class="settings-trigger" title="Настройки таблицы" aria-label="Настройки таблицы"
    :aria-expanded="open" @click="open = !open">
    <SettingsIcon />
  </button>

  <PanelPopover v-model="open" :target="trigger" title="Настройки таблицы" :width="250"
    :placement="['bottom-end', 'bottom-float', 'top-end']">
    <template #content>
      <div class="options panel-section">
        <h3>Показывать значения</h3>
        <label v-for="option in vehicleStatisticsPeriods" :key="option.value" class="period-option">
          <input v-model="period" type="radio" name="vehicle-table-period" :value="option.value">
          {{ option.label }}
        </label>
      </div>
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import SettingsIcon from '@/assets/icons/settings.svg'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import { vehicleStatisticsPeriods, type VehicleStatisticsPeriod } from '../shared/vehicleStatisticsPeriod'

const period = defineModel<VehicleStatisticsPeriod>({ required: true })
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
</script>

<style scoped lang="scss">
.settings-trigger {
  display: grid;
  flex: none;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 17px;
    height: 17px;
    fill: currentColor;
  }
}

.options {
  .period-option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;

    input {
      margin: 0;
      accent-color: var(--blue-thin-color);
    }
  }
}
</style>
