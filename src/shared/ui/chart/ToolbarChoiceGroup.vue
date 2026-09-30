<template>
  <ToolbarGroup v-if="options.length" class="toolbar-choice-group">
    <button v-for="option in options" :key="option.value" type="button" class="toolbar-choice"
      :class="{ active: model === option.value }" :disabled="disabled || option.disabled"
      v-tooltip:toolbarChoice.top-float="{ text: option.tooltip ?? '', disabled: !option.tooltip }"
      @click="select(option.value)">{{ option.label }}</button>
  </ToolbarGroup>
</template>

<script setup lang="ts" generic="TValue extends string | number, TClearable extends boolean = false">
import ToolbarGroup from './ToolbarGroup.vue'
import type { ToolbarChoiceOption } from './toolbarChoiceGroup'

const props = defineProps<{
  options: readonly ToolbarChoiceOption<TValue>[]
  clearable?: TClearable & boolean
  disabled?: boolean
}>()

type ModelValue = TClearable extends true ? TValue | null : TValue
const model = defineModel<ModelValue>({ required: true })

function select(value: TValue) {
  model.value = (props.clearable && model.value === value ? null : value) as ModelValue
}
</script>

<style scoped lang="scss">
.toolbar-choice {
  padding: var(--toolbar-control-padding, 3px 0);
  color: var(--toolbar-control-color, rgba(255, 255, 255, 0.45));
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;

  @media (hover: hover) and (pointer: fine) {
    &:hover:not(:disabled):not(.active) {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &.active {
    color: white;
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
}
</style>
