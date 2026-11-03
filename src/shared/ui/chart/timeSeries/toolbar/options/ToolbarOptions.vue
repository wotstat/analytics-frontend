<template>
  <ToolbarGroup v-if="options.length" class="toolbar-options">
    <button v-for="option in options" :key="option.value" type="button" class="toolbar-option"
      :class="{ active: isSelected(option.value) }" :disabled="disabled || option.disabled"
      v-tooltip:toolbarOption.top-float="{ text: option.tooltip ?? '', disabled: !option.tooltip }"
      @click="select(option.value)">{{ option.label }}</button>
  </ToolbarGroup>
</template>

<script setup lang="ts" generic="TValue extends string | number, TClearable extends boolean = false, TMultiple extends boolean = false">
import ToolbarGroup from '../layout/ToolbarGroup.vue'
import type { ToolbarOption } from './toolbarOptions'

const props = defineProps<{
  options: readonly ToolbarOption<TValue>[]
  clearable?: TClearable & boolean
  multiple?: TMultiple & boolean
  disabled?: boolean
}>()

type ModelValue = TMultiple extends true ? TValue[] : TClearable extends true ? TValue | null : TValue
const model = defineModel<ModelValue>({ required: true })

function isSelected(value: TValue) {
  return Array.isArray(model.value) ? model.value.includes(value) : model.value === value
}

function select(value: TValue) {
  if (!props.multiple || !Array.isArray(model.value)) {
    model.value = (props.clearable && model.value === value ? null : value) as ModelValue
    return
  }

  const selected = model.value
  if (selected.includes(value)) {
    model.value = selected.filter(item => item !== value) as ModelValue
    return
  }

  model.value = [...selected, value] as ModelValue
}
</script>

<style scoped lang="scss">
.toolbar-option {
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
