<template>
  <div class="chart nice-scrollbar-transparent">
    <div class="groups">
      <div class="rank-group" v-for="group in groups" :key="group.rank"
        :style="{ flexGrow: group.items.length, flexBasis: group.width, minWidth: group.width }">
        <div class="bars">
          <Bar v-for="item in group.items" :key="item.name" :item :maxValue :selected="isSelected(item)"
            :group-hovered="hoveredRank === group.rank" @select="selectItem(item, $event)" />
        </div>
        <button type="button" class="rank-name mt-font"
          :class="[`rank-${group.rank}`, { selected: isGroupSelected(group.items) }]"
          :aria-pressed="isGroupSelected(group.items)" @mouseenter="hoveredRank = group.rank"
          @mouseleave="hoveredRank = null" @click="selectGroup(group.items, $event)">
          {{ t(`rank:${group.rank}`) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'
import Bar from './Bar.vue'
import type { RankDistributionItem } from './types'

const { t } = useI18n(i18n)

const props = defineProps<{
  data: RankDistributionItem[]
}>()

const selectedItems = defineModel<RankDistributionItem[]>('selected', { default: () => [] })
const hoveredRank = ref<RankDistributionItem['rank'] | null>(null)

const rankOrder: RankDistributionItem['rank'][] = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']
const divisionRanks = new Set<RankDistributionItem['rank']>(['first', 'second', 'third', 'fourth'])
const divisionOrder = ['E', 'D', 'C', 'B', 'A'] as const
const barMinWidth = 15
const barGap = 2

const groups = computed(() => rankOrder.map(rank => {
  const items = divisionRanks.has(rank)
    ? divisionOrder.map(name => props.data.find(item => item.rank === rank && item.name === name) ?? {
      rank,
      name,
      value: 0,
    })
    : props.data
      .filter(item => item.rank === rank && typeof item.name === 'number')
      .sort((a, b) => Number(a.name) - Number(b.name))

  return {
    rank,
    items,
    width: `${items.length * barMinWidth + Math.max(0, items.length - 1) * barGap}px`,
  }
}).filter(group => group.items.length > 0))

const maxValue = computed(() => Math.max(1, ...groups.value.flatMap(group => group.items.map(item => item.value))))

const itemKey = (item: RankDistributionItem) => `${item.rank}:${item.name}`
const selectedKeys = computed(() => new Set(selectedItems.value.map(itemKey)))

function isSelected(item: RankDistributionItem) {
  return selectedKeys.value.has(itemKey(item))
}

function isGroupSelected(items: RankDistributionItem[]) {
  return items.every(isSelected)
}

function selectItem(item: RankDistributionItem, event: MouseEvent) {
  const key = itemKey(item)

  if (event.shiftKey) {
    selectedItems.value = selectedKeys.value.has(key)
      ? selectedItems.value.filter(selected => itemKey(selected) !== key)
      : [...selectedItems.value, item]
    return
  }

  selectedItems.value = selectedItems.value.length === 1 && selectedKeys.value.has(key) ? [] : [item]
}

function selectGroup(items: RankDistributionItem[], event: MouseEvent) {
  const groupKeys = new Set(items.map(itemKey))
  const allSelected = isGroupSelected(items)

  if (event.shiftKey) {
    if (allSelected) {
      selectedItems.value = selectedItems.value.filter(item => !groupKeys.has(itemKey(item)))
      return
    }

    const mergedItems = new Map(selectedItems.value.map(item => [itemKey(item), item]))
    items.forEach(item => mergedItems.set(itemKey(item), item))
    selectedItems.value = [...mergedItems.values()]
    return
  }

  selectedItems.value = allSelected && selectedItems.value.length === items.length ? [] : [...items]
}
</script>

<style lang="scss" scoped>
@use '../../shared/rankColors.scss' as *;

.chart {
  height: 300px;
  overflow-x: auto;
  padding-bottom: 10px;
  position: relative;

  &::-webkit-scrollbar-track {
    margin: 0 var(--content-page-margin, 0);
  }
}

.groups {
  display: flex;
  align-items: stretch;
  gap: 12px;
  height: 100%;
  min-width: 100%;
  width: max-content;
  padding: 30px var(--content-page-margin, 0) 10px;
  box-sizing: border-box;
}

.rank-group {
  display: flex;
  flex-direction: column;

  .bars {
    display: flex;
    flex: 1;
    align-items: stretch;
    gap: 2px;
    min-height: 0;
  }

  .rank-name {
    @include rank-color-scheme;

    width: 100%;
    padding: 6px 4px 4px;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: var(--text-color, var(--top-color));
    font-size: 13px;
    text-align: center;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.1s ease, color 0.1s ease;

    &:hover {
      background: color-mix(in srgb, var(--top-color) 8%, transparent);
    }

    &.selected {
      background: color-mix(in srgb, var(--top-color) 12%, transparent);
    }
  }
}
</style>
