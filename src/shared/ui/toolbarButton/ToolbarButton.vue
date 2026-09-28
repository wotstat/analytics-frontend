<template>
  <button ref="element" class="toolbar-button" :class="[`variant-${variant}`, `size-${size}`, { active }]"
    type="button" :disabled @click="emit('click', $event)">
    <component :is="icon" v-if="icon" />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { useTemplateRef, type Component } from 'vue'

withDefaults(defineProps<{
  icon?: Component | string
  variant?: 'surface' | 'accent' | 'plain' | 'round'
  size?: 'small' | 'medium' | 'large'
  active?: boolean
  disabled?: boolean
}>(), { variant: 'plain', size: 'medium' })

const emit = defineEmits<{ click: [event: MouseEvent] }>()
const element = useTemplateRef<HTMLButtonElement>('element')

defineExpose({ element })
</script>

<style scoped lang="scss">
.toolbar-button {
  box-sizing: border-box;
  display: grid;
  flex: none;
  place-items: center;
  width: var(--toolbar-button-width, var(--toolbar-button-size));
  height: var(--toolbar-button-height, var(--toolbar-button-size));
  padding: 0;
  border-radius: 5px;
  color: inherit;

  &.size-small {
    --toolbar-button-size: 18px;
    --toolbar-icon-size: 12px;
  }

  &.size-medium {
    --toolbar-button-size: 24px;
    --toolbar-icon-size: 16px;
  }

  &.size-large {
    --toolbar-button-size: 30px;
    --toolbar-icon-size: 17px;
  }

  &.variant-surface {
    background: rgba(255, 255, 255, 0.05);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      background: rgba(10, 132, 255, 0.12);
    }
  }

  &.variant-accent {
    --toolbar-icon-size: 18px;

    color: rgba(197, 197, 197, 0.6);

    &:hover:not(:disabled) {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.08);
    }

    &.active {
      color: var(--blue-thin-color);
      background: rgba(10, 132, 255, 0.12);
    }
  }

  &.variant-plain {
    color: rgba(255, 255, 255, 0.65);
    transition: color 0.15s;

    &:hover:not(:disabled) {
      color: white;
    }

    &.active {
      color: var(--blue-thin-color);
    }
  }

  &.variant-round {
    --toolbar-button-size: 23px;
    --toolbar-icon-size: 15px;

    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.active {
      background: rgba(10, 132, 255, 0.12);
      color: var(--blue-thin-color);
    }
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid var(--blue-thin-color);
    outline-offset: -2px;
  }

  :deep(svg) {
    display: block;
    width: var(--toolbar-icon-size);
    height: var(--toolbar-icon-size);
    fill: currentColor;
  }
}
</style>
