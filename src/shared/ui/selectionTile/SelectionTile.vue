<template>
  <div class="selection-tile" :class="{ selected, disabled, compact: density === 'compact' }"
    :style="{ '--selection-tile-accent': accentColor }">
    <button class="selection-tile__main" type="button" :disabled @click="emit('select', $event)">
      <slot />
    </button>
    <button v-if="action" class="selection-tile__action" type="button" :disabled
      :class="{ active: actionActive, open: actionOpen }"
      @click="emit('action', $event)">
      <slot name="action" />
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  selected?: boolean
  disabled?: boolean
  density?: 'standard' | 'compact'
  accentColor?: string
  action?: boolean
  actionActive?: boolean
  actionOpen?: boolean
}>(), { density: 'standard' })

const emit = defineEmits<{
  select: [event: MouseEvent]
  action: [event: MouseEvent]
}>()
</script>

<style scoped lang="scss">
.selection-tile {
  --selection-tile-min-height: 34px;
  --selection-tile-main-padding: 8px 12px;
  --selection-tile-font-size: 14px;

  position: relative;
  display: flex;
  align-items: stretch;
  min-width: 0;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;

  &.compact {
    --selection-tile-min-height: 26px;
    --selection-tile-main-padding: 5px 8px;
    --selection-tile-font-size: 12px;
  }

  &.disabled {
    opacity: 0.45;
  }

  &.selected {
    background: rgba(255, 255, 255, 0.1);

    &::before {
      content: '';
      position: absolute;
      top: var(--selection-tile-accent-inset, 7px);
      bottom: var(--selection-tile-accent-inset, 7px);
      left: 0;
      width: 3px;
      border-radius: 3px;
      background: var(--selection-tile-accent, var(--blue-thin-color));
      pointer-events: none;
    }

    &.compact::before {
      top: var(--selection-tile-accent-inset, 5px);
      bottom: var(--selection-tile-accent-inset, 5px);
    }
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover:not(.disabled) {
      background: rgba(255, 255, 255, 0.12);
    }
  }
}

.selection-tile__main {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: var(--selection-tile-justify-content, flex-start);
  gap: var(--selection-tile-gap, 0px);
  min-width: 0;
  min-height: var(--selection-tile-min-height);
  padding: var(--selection-tile-main-padding);
  background: transparent;
  color: inherit;
  text-align: left;
  font-size: var(--selection-tile-font-size);
  line-height: 1.2;
  user-select: none;
}

.selection-tile__action {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: var(--selection-tile-action-width, 30px);
  padding: 0;
  background: transparent;
  color: rgba(197, 197, 197, 0.6);

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 24px;
    height: 24px;
    border-radius: 5px;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  &:hover:not(:disabled),
  &.open {
    color: rgba(255, 255, 255, 0.8);

    &::before {
      background: rgba(255, 255, 255, 0.08);
    }
  }

  &.active {
    color: var(--selection-tile-accent, var(--blue-thin-color));

    &::before {
      background: color-mix(in srgb, var(--selection-tile-accent, var(--blue-thin-color)) 12%, transparent);
    }

    &:hover:not(:disabled)::before {
      background: color-mix(in srgb, var(--selection-tile-accent, var(--blue-thin-color)) 22%, transparent);
    }
  }
}
</style>
