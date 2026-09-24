<template>
  <button ref="trigger" class="settings-trigger" title="Настройки таблицы" aria-label="Настройки таблицы"
    :aria-expanded="open" @click="open = !open">
    <SettingsIcon />
  </button>

  <PopoverAutoClose v-model="open" :target="trigger" :placement="['bottom-end', 'bottom-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <div class="table-settings">
      <header class="popover-heading">
        <h2>Настройки таблицы</h2>
      </header>

      <div class="options">
        <h3>Показывать значения</h3>
        <label v-for="option in vehicleStatisticsPeriods" :key="option.value" class="period-option">
          <input v-model="period" type="radio" name="vehicle-table-period" :value="option.value">
          {{ option.label }}
        </label>
      </div>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import SettingsIcon from '@/assets/icons/settings.svg'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
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

.table-settings {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(250px, calc(100vw - 20px));

  .popover-heading {
    padding: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .options {
    padding: 14px;

    h3 {
      margin: 0 0 8px;
      color: #fff;
      font-size: 14px;
      font-weight: 500;
    }

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
}
</style>
