<template>
  <ToolbarButton ref="trigger" :icon="SettingsIcon" variant="surface" size="large" @click="open = !open" />

  <PanelPopover v-model="open" :target="target" title="Настройки таблицы" :width="250" density="compact"
    :placement="['bottom-end', 'bottom-float', 'top-end']">
    <template #content>
      <div class="options panel-section">
        <h3>Показывать значения</h3>
        <label v-for="option in vehicleStatisticsPeriods" :key="option.value" class="option">
          <input v-model="period" type="radio" name="vehicle-table-period" :value="option.value">
          {{ option.label }}
        </label>
      </div>
      <div class="options panel-section">
        <h3>Оформление</h3>
        <label class="option">
          <input v-model="showValueBars" type="checkbox">
          Индикаторы значений
        </label>
        <label v-if="showValueBars" class="option palette-option">
          <input v-model="extendedPalette" type="checkbox">
          Расширенная палитра
        </label>
      </div>
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import SettingsIcon from '@/assets/icons/settings.svg'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import { vehicleStatisticsPeriods, type VehicleStatisticsPeriod } from '../../shared/vehicleStatisticsPeriod'

const period = defineModel<VehicleStatisticsPeriod>({ required: true })
const showValueBars = defineModel<boolean>('showValueBars', { required: true })
const extendedPalette = defineModel<boolean>('extendedPalette', { required: true })
const open = ref(false)
const trigger = useTemplateRef<InstanceType<typeof ToolbarButton>>('trigger')
const target = computed(() => trigger.value?.element ?? null)
</script>

<style scoped lang="scss">
.options {
  .option + .option {
    margin-top: 3px;
  }

  .palette-option {
    margin-top: 6px;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: inherit;
    cursor: pointer;

    input {
      margin: 0;
      accent-color: var(--blue-thin-color);
    }
  }
}
</style>
