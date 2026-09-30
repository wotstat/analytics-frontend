<template>
  <div class="chart-toolbar" :class="{ compact: density === 'compact', 'has-left': $slots.left }">
    <div v-if="$slots.left" class="chart-toolbar__left">
      <slot name="left" />
    </div>
    <div class="chart-toolbar__controls">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ density?: 'standard' | 'compact' }>(), { density: 'standard' })
</script>

<style scoped lang="scss">
.chart-toolbar {
  --toolbar-control-color: rgba(255, 255, 255, 0.45);
  --toolbar-control-padding: 3px 0;
  --toolbar-group-wrap: wrap;
  --toolbar-divider-color: rgba(255, 255, 255, 0.2);
  --toolbar-divider-margin: 0 3px;

  display: flex;
  align-items: center;
  flex-wrap: var(--toolbar-group-wrap);
  min-width: 0;

  &__left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    min-width: 0;
  }

  &__controls {
    display: flex;
    align-items: center;
    flex-wrap: var(--toolbar-group-wrap);
    gap: 8px;
    min-width: 0;
  }

  &.has-left .chart-toolbar__controls {
    margin-left: auto;
  }

  .chart-toolbar__controls > :deep(.toolbar-group + .toolbar-group)::before {
    content: '';
    flex: none;
    height: 14px;
    border-left: 1px solid var(--toolbar-divider-color);
    margin: var(--toolbar-divider-margin);
  }

  &.compact {
    --toolbar-control-color: rgba(197, 197, 197, 0.6);
    --toolbar-control-padding: 0;
    --toolbar-group-wrap: nowrap;
    --toolbar-divider-color: rgba(255, 255, 255, 0.25);
    --toolbar-divider-margin: 0 2px;
  }

  @media (max-width: 600px) {
    &.has-left .chart-toolbar__controls {
      margin-left: 0;
    }
  }
}
</style>
