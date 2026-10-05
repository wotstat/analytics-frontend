<template>
  <div class="options-select" :class="{ open, disabled: isDisabled }">
    <button v-if="isDesktop" class="options-trigger" type="button" :disabled="isDisabled" @pointerdown="toggleMenu">
      <span class="options-label">{{ label }}</span>
      <DropdownArrow class="options-arrow" :expanded="open" />
    </button>
    <template v-else>
      <div class="options-trigger">
        <span class="options-label">{{ label }}</span>
        <DropdownArrow class="options-arrow" />
      </div>
      <select v-model="value" class="native-select" :disabled="isDisabled">
        <option v-if="!selectedOption" disabled :value="value">{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
          {{ option.label }}
        </option>
      </select>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T extends string | number">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { closeContextMenu, isContextMenuOpen } from '@/shared/uiKit/contextMenu/createContextMenu'
import { simpleContextMenu } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import type { SelectOption } from './types'

const props = withDefaults(defineProps<{
  options: readonly SelectOption<T>[]
  disabled?: boolean
  placeholder?: string
}>(), { placeholder: 'Выбрать' })

const value = defineModel<T>({ required: true })
const isDesktop = useMediaQuery('(hover: hover) and (pointer: fine)')
const menuId = ref(-1)
const open = computed(() => isContextMenuOpen(menuId.value))
const selectedOption = computed(() => props.options.find(option => option.value === value.value))
const label = computed(() => selectedOption.value?.label ?? props.placeholder)
const isDisabled = computed(() => props.disabled || !props.options.some(option => !option.disabled))

function toggleMenu(event: PointerEvent) {
  if (event.button !== 0 || isDisabled.value) return

  if (open.value) {
    closeContextMenu(menuId.value)
    return
  }
  const target = event.currentTarget as HTMLButtonElement
  const { id } = simpleContextMenu({
    position: target.getBoundingClientRect(),
    alignY: 'bottom',
    closeOnScroll: true,
    actionOnPointerUp: true,
  }, props.options.map(option => ({
    label: option.label,
    disabled: option.disabled,
    checkbox: computed(() => value.value === option.value),
    action: () => value.value = option.value,
  })))

  menuId.value = id
}

watch([isDesktop, isDisabled, () => props.options], () => closeContextMenu(menuId.value), { deep: true })
onBeforeUnmount(() => closeContextMenu(menuId.value))
</script>

<style scoped lang="scss">
.options-select {
  position: relative;
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  font-size: var(--options-select-font-size, 14px);

  &.disabled {
    opacity: 0.4;
  }

  &.open .options-trigger {
    background: var(--options-select-active-background, rgba(255, 255, 255, 0.1));
  }

  @media (hover: hover) and (pointer: fine) {
    &:not(.disabled):hover .options-trigger {
      background: var(--options-select-active-background, rgba(255, 255, 255, 0.1));
    }
  }
}

.options-trigger {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  min-width: 0;
  height: var(--options-select-height, 30px);
  padding: 0 8px;
  border-radius: 5px;
  background: var(--options-select-background, rgba(255, 255, 255, 0.05));
  color: inherit;
  font: inherit;
  transition: background 0.15s;
}

.options-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.options-arrow {
  flex: none;
  width: 0.75em;
  height: 0.75em;
  margin-left: auto;
  opacity: 0.7;
}

.native-select {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  font: inherit;
}
</style>
