<template>
  <div class="meta-metrics" :class="{ compact: hideLabels }">
    <div v-for="item in items" :key="item.label" class="metric">
      <component v-if="item.icon" :is="item.icon" class="metric-icon" />
      <div class="metric-content">
        <p class="value">{{ item.value }}</p>
        <p v-if="!hideLabels" class="label">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  items: { label: string, value: string, icon?: Component }[]
  hideLabels?: boolean
}>()
</script>

<style scoped lang="scss">
.meta-metrics {
  display: flex;
  gap: 32px;

  .metric {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    & + .metric {
      padding-left: 32px;
      border-left: 1px solid #ffffff1c;
    }
  }

  .metric-icon {
    flex: none;
    width: 88px;
    height: 88px;
    margin-left: -12px;
    color: var(--meta-card-muted);
  }

  .metric-content {
    min-width: 0;
  }

  &.compact .metric-icon {
    margin-block: -12px;
  }

  .value {
    margin: 0;
    font-size: 40px;
    font-weight: 700;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .label {
    margin: 9px 0 0;
    color: var(--meta-card-muted);
    font-size: 19px;
    line-height: 1.2;
  }
}
</style>
