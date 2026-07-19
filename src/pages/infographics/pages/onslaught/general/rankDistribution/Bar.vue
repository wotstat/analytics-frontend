<template>
  <button type="button" class="distribution-bar mt-font" @click="emit('select', $event)" :class="{
    selected: props.selected,
    [`rank-${props.item.rank}`]: true,
    'group-hovered': props.groupHovered,
    'numeric-name': typeof props.item.name === 'number'
  }" v-rank-distribution-tooltip:rank-bar-distribution.instant.top-float="tooltip">
    <div class="bar" :style="{ height: `${height}%` }" ref="bar">
      <div class="shadow"></div>
      <Transition name="selection-lines" :duration="{ enter: 300, leave: 200 }">
        <div class="selection-box" v-if="props.selected">
          <div class="line left-line vertical"></div>
          <div class="line right-line vertical"></div>
          <div class="line bottom-line horizontal"></div>
          <div class="line top-line horizontal"></div>
        </div>
      </Transition>
    </div>
    <div class="name mt-font">{{ label }}</div>
  </button>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { Division, RankImageDefinition } from '@/shared/game/comp7/utils'
import type { GameVendor } from '@/shared/game/wot'
import type { RankDistributionItem, RankDistributionTooltipProps } from './types'
import { vRankDistributionTooltip } from './rankDistributionTooltip/useRankDistributionTooltip'

const bar = useTemplateRef('bar')

const props = defineProps<{
  item: RankDistributionItem
  maxValue: number
  groupValue: number
  totalValue: number
  ratingInterval: [from: number, to: number]
  rankName: string
  game?: GameVendor
  season?: string
  selected?: boolean
  groupHovered?: boolean
}>()

const emit = defineEmits<{
  'select': [MouseEvent]
}>()

const label = computed(() => props.item.label ?? props.item.name)

const height = computed(() => {
  if (props.maxValue <= 0) return 0
  return Math.max(0, Math.min(100, props.item.value / props.maxValue * 100))
})

const rankIcon = computed<RankImageDefinition>(() => {
  if (typeof props.item.name !== 'string' || props.item.name === '') return props.item.rank
  return `${props.item.rank}_${props.item.name}` as Division
})

const tooltip = computed<RankDistributionTooltipProps>(() => ({
  rank: rankIcon.value,
  title: typeof props.item.name === 'string' && props.item.name !== ''
    ? `${props.rankName} ${props.item.name}`
    : props.rankName,
  ratingInterval: props.ratingInterval,
  players: props.item.value,
  totalPlayers: props.totalValue,
  groupPlayers: props.groupValue,
  game: props.game,
  season: props.season,
  target: bar.value,
}))
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
  padding: 0 0 22px;
  box-sizing: border-box;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  user-select: none;
  container-type: inline-size;

  .bar {
    position: relative;
    margin: 0 1px;
    width: 100%;
    min-height: 1px;
    border-top: 1px solid var(--top-color);
    background: var(--background);
    transition: height 0.5s ease, background 0.1s ease;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--selected-background);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1;
    }
  }

  &:hover:not(.selected) .bar,
  &.group-hovered:not(.selected) .bar {
    background: var(--hover-background);
  }

  &.selected .bar {
    &::after {
      opacity: 1;
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

  .selection-box {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;

    .line {
      position: absolute;
      background: var(--selected-line);
      box-shadow: 0 0 5px var(--selected-line-shadow);
    }

    .horizontal {
      right: 0;
      left: 0;
      height: 1px;
    }

    .vertical {
      top: 0;
      bottom: 0;
      width: 1px;
    }

    .left-line {
      left: 0;
    }

    .right-line {
      right: 0;
    }

    .top-line {
      top: -1px;
    }

    .bottom-line {
      bottom: 0;
    }
  }

  .selection-lines-enter-active,
  .selection-lines-leave-active {
    .vertical {
      transition: top 0.2s ease;
    }

    .horizontal {
      transition: right 0.2s ease, left 0.2s ease, opacity 0.2s ease;
    }
  }

  .selection-lines-enter-active {
    .top-line {
      transition-delay: 0.1s;
    }
  }

  .selection-lines-enter-from,
  .selection-lines-leave-to {
    .vertical {
      top: 100%;
    }

    .horizontal {
      right: 50%;
      left: 50%;
      opacity: 0;
    }
  }

  .name {
    position: absolute;
    bottom: 1px;
    left: 50%;
    font-size: 12px;
    transform: translateX(-50%);
    white-space: nowrap;
    color: var(--text-color, var(--top-color));
    z-index: 1;
  }
}

@container (max-width: 30px) {

  // Counting from the end keeps the final "> X" label visible.
  .distribution-bar.numeric-name:nth-last-child(even) .name {
    visibility: hidden;
  }
}
</style>
