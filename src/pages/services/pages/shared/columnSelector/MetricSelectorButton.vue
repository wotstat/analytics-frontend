<template>
  <button
    ref="element"
    class="metric-trigger"
    type="button"
    v-tooltip="{
      text: tooltip ?? label,
      disabled: open || (!tooltip && !labelOverflow),
      placement: ['top-float', 'bottom-float']
    }">
    <Icon :icon class="metric-icon" />
    <MetricLabel :text="label" @overflow="labelOverflow = $event" />
    <slot name="label-suffix" />
    <DropdownArrow class="metric-arrow" :expanded="open" />
  </button>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import type { IconType } from '@/shared/game/components/efficiencyIcon/utils'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import MetricLabel from './MetricLabel.vue'

defineProps<{ icon: IconType, label: string, open: boolean, tooltip?: string }>()

const element = useTemplateRef<HTMLButtonElement>('element')
const labelOverflow = ref(false)

defineExpose({ element })
</script>

<style scoped lang="scss">
.metric-trigger {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  height: 30px;
  padding: 0 8px 0 1px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .metric-icon {
    flex: none;
    width: 30px;
    height: 30px;
  }

  .metric-label {
    margin-right: 5px;
  }

  .metric-arrow {
    width: 10px;
    height: 10px;
    margin-left: auto;
    opacity: 0.6;
  }
}
</style>
