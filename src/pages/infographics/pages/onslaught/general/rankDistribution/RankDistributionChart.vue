<template>
  <div class="chart nice-scrollbar-transparent">
    <div class="groups">
      <div class="rank-group" v-for="group in groups" :key="group.rank"
        :style="{ flexGrow: group.items.length, flexBasis: group.width, minWidth: group.width }">
        <div class="bars">
          <Bar v-for="item in group.items" :key="item.name" :item :maxValue />
        </div>
        <div class="rank-name mt-font">{{ t(`rank:${group.rank}`) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'
import Bar from './Bar.vue'
import type { RankDistributionItem } from './types'

const { t } = useI18n(i18n)

const props = defineProps<{
  data: RankDistributionItem[]
}>()

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
</script>

<style lang="scss" scoped>
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
    padding-top: 5px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
    font-size: 11px;
    text-align: center;
    white-space: nowrap;
  }
}
</style>
