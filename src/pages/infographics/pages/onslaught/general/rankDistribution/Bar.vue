<template>
  <div class="distribution-bar mt-font" :class="`rank-${props.item.rank}`"
    :aria-label="`${props.item.name}: ${formattedValue} игроков`">
    <div class="bar" :style="{ height: `${height}%` }">
      <div class="shadow"></div>
    </div>
    <div class="name">{{ props.item.name }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RankDistributionItem } from './types'

const props = defineProps<{
  item: RankDistributionItem
  maxValue: number
}>()

const height = computed(() => {
  if (props.maxValue <= 0) return 0
  return Math.max(0, Math.min(100, props.item.value / props.maxValue * 100))
})

const formattedValue = computed(() => props.item.value.toLocaleString('ru-RU'))
</script>

<style lang="scss" scoped>
@use '../../shared/rankColors.scss' as *;

.distribution-bar {
  @include rank-color-scheme;

  position: relative;
  display: flex;
  flex: 1;
  align-items: flex-end;
  height: 100%;
  min-width: 15px;
  max-width: 36px;
  padding-bottom: 20px;
  box-sizing: border-box;
  user-select: none;

  .bar {
    position: relative;
    width: 100%;
    min-height: 1px;
    border-top: 1px solid var(--top-color);
    background: var(--background);
    transition: height 0.5s ease, background 0.1s ease;

    &:hover {
      background: var(--hover-background);
    }
  }

  .shadow {
    position: absolute;
    left: 0;
    right: 0;
    top: -30px;
    height: 30px;
    background: var(--shadow-color);
    pointer-events: none;
  }

  .name {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    color: var(--text-color, var(--top-color));
    z-index: 1;
  }

  .name {
    bottom: 0;
    font-size: 11px;
  }
}
</style>
