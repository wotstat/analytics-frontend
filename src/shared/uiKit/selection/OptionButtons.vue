<template>
  <div class="option-buttons">
    <button v-for="option in options"
      :key="option"
      class="option"
      type="button"
      :disabled
      :class="{ active: selected ? selected.includes(option) : modelValue === option }"
      @click="select(option, $event)">
      <slot :option>{{ option }}</slot>
    </button>
  </div>
</template>

<script setup lang="ts" generic="Option extends string | number">
import { selectOptionWithModifiers } from './selectOptionWithModifiers'

const props = withDefaults(defineProps<{
  options: readonly Option[]
  modelValue?: Option | null
  selected?: readonly Option[]
  disabled?: boolean
  fillRange?: boolean
  allowEmpty?: boolean
}>(), { allowEmpty: true })
const emit = defineEmits<{ 'update:modelValue': [Option], 'update:selected': [Option[]] }>()

function select(option: Option, event: MouseEvent) {
  const selected = props.selected
  if (!selected) {
    emit('update:modelValue', option)
    return
  }
  const selection = selectOptionWithModifiers(selected, option, props.options, event, props.fillRange)
  if (props.allowEmpty || selection.length) emit('update:selected', selection)
}
</script>

<style scoped lang="scss">
.option-buttons {
  display: flex;
  flex-wrap: var(--option-buttons-wrap, wrap);
  align-items: center;
  gap: var(--option-buttons-gap, 5px);
  min-width: 0;

  .option {
    display: flex;
    flex: var(--option-button-flex, 0 0 auto);
    align-items: center;
    justify-content: center;
    min-width: var(--option-button-min-width, 0);
    height: var(--option-button-height, 22px);
    padding: var(--option-button-padding, 0 10px);
    border: none;
    border-radius: var(--option-button-radius, 5px);
    background: rgba(255, 255, 255, 0.08);
    line-height: 1;
    font-size: var(--option-button-font-size, 14px);
    white-space: nowrap;
    user-select: none;

    @media (hover: hover) and (pointer: fine) {
      &:not(.active, :disabled):hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.active {
      background: var(--blue-color);
    }
  }
}
</style>
