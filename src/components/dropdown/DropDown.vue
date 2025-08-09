<template>
  <div class="dropdown" :class="{ 'open': isOpen }" ref="dropDown">
    <div class="current" @pointerdown="pointerDown">
      <slot name="current" v-if="slots.current" :currentValue></slot>
      <p v-else>{{ valueToLabel(currentValue) }}</p>
      <ArrowDown />
    </div>

    <div class="lines">
      <div class="line" v-for="variant in variants" @click="select(variant.value)"
        @pointerup="pointerUp(variant.value)">
        <slot name="line" v-if="slots.line" :variant="variant"></slot>
        <p>{{ valueToLabel(variant.value) }}</p>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts" generic="T">
import ArrowDown from '@/assets/icons/arrow-down.svg'
import { onClickOutside, useEventListener } from '@vueuse/core'
import { readonly, ref, useSlots } from 'vue'

const props = defineProps<{
  variants: readonly { value: T, label?: string }[]
  valueToLabel?: (value: T | undefined) => string
}>()

const isOpen = ref(false)
const dropDown = ref<HTMLElement | null>(null)

const slots = useSlots()
const currentValue = defineModel<T>()

onClickOutside(dropDown, () => isOpen.value = false)

function valueToLabel(value: T | undefined) {
  if (props.valueToLabel) return props.valueToLabel(value)
  const variant = props.variants.find(v => v.value === value)
  return variant?.label || value
}

let allowPointerUp = false
function pointerDown() {
  if (isOpen.value) {
    isOpen.value = false
    return
  }

  allowPointerUp = true
  isOpen.value = true
  useEventListener('pointerup', () => allowPointerUp = false, { once: true })
}

function pointerUp(value: T) {
  if (!allowPointerUp) return
  currentValue.value = value
  isOpen.value = false
}

function select(value: T) {
  currentValue.value = value
  isOpen.value = false
}

</script>


<style lang="scss" scoped>
.dropdown {
  background: #2c2c2cb2;
  font-size: 14px;
  color: white;
  white-space: nowrap;

  border-radius: 5px;
  border: 1px solid #91919152;
  backdrop-filter: blur(80px) saturate(50%);
  line-height: 1.6;
  overflow: hidden;
  user-select: none;
  height: 1.6em;

  transition: height 0.15s;
  will-change: height;
  position: relative;
  z-index: 1;

  &.open {
    height: auto;
    z-index: 2;
    box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);

    @supports (height: calc-size(auto, size)) {
      height: calc-size(auto, size);
    }
  }

  &:not(.open) {
    .lines {
      pointer-events: none;
    }
  }


  .current {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 1.6em;
    padding: 0px 0.4em;

    svg {
      height: auto;
      width: 0.7em;
      fill: currentColor;
      margin-left: 0.4em;
      margin-right: -0.1em;
    }
  }

  .lines {
    padding-bottom: 3px;

    .line {
      padding: 1px 0.4em;
      padding-right: calc(0.4em + 0.7em + 0.4em - 0.1em);
      position: relative;
      cursor: pointer;
      white-space: nowrap;

      &::before {
        content: '';
        inset: 1px 3px;
        display: block;
        position: absolute;
        border-radius: 4px;
        background: var(--blue-color);
        opacity: 0;
        pointer-events: none;
        z-index: -1;
      }

      &:hover {
        &::before {
          opacity: 1;
        }
      }
    }
  }
}
</style>