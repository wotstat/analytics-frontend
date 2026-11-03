<template>
  <div class="chart-toolbar" :class="{ compact: density === 'compact', 'has-left': $slots.left }">
    <div v-if="$slots.left" class="left">
      <slot name="left" />
    </div>
    <div class="controls">
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
  --toolbar-divider-color: rgba(255, 255, 255, 0.2);
  --toolbar-divider-margin: 0 3px;

  container: chart-toolbar / inline-size;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-width: 0;

  .left {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    max-width: 100%;

    > :deep(.toolbar-group + .toolbar-group)::before {
      content: '';
      flex: none;
      height: 14px;
      border-left: 1px solid var(--toolbar-divider-color);
      margin: var(--toolbar-divider-margin);
    }
  }

  &.has-left .controls {
    margin-left: auto;
  }

  &.compact {
    --toolbar-control-color: rgba(197, 197, 197, 0.6);
    --toolbar-control-padding: 0;
    --toolbar-divider-color: rgba(255, 255, 255, 0.25);
    --toolbar-divider-margin: 0 2px;
  }

  @container chart-toolbar (max-width: 600px) {
    .left,
    .controls {
      flex: 1 1 100%;
    }

    &.has-left .controls {
      margin-left: 0;
    }

    .controls {
      --toolbar-control-padding: 4px 3px;
      --toolbar-button-width: 30px;
      --toolbar-button-height: 30px;
      gap: 6px;

      > :deep(.toolbar-group + .toolbar-group)::before {
        display: none;
      }

      > :deep(.actions) {
        margin-left: auto;

        .toolbar-button.variant-accent:not(.active) {
          background: rgba(255, 255, 255, 0.05);
        }
      }

      > :deep(.toolbar-options) {
        flex-grow: 1;
        gap: 3px;
        padding: 0 2px;
        border-radius: 5px;
        background: rgba(255, 255, 255, 0.05);

        .toolbar-option {
          flex: 1 0 auto;
          min-width: 0;
          max-width: 100%;
          min-height: 30px;
          white-space: normal;
          overflow-wrap: anywhere;
        }
      }
    }
  }
}
</style>
