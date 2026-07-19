<template>
  <div class="rank-distribution-tooltip">
    <div class="header">
      <RankIcon :rank="props.rank" :game="props.game" :season="props.season" size="medium" class="rank-icon" />
      <div class="rank-info">
        <div class="title">{{ props.title }}</div>
        <div class="rating mt-font">{{ formattedRatingInterval }} <span>очков</span></div>
      </div>
    </div>

    <div class="statistics">
      <div class="statistic">
        <span>Игроков</span>
        <strong class="mt-font">{{ formattedPlayers }}</strong>
      </div>
      <div class="statistic">
        <span>От всех игроков</span>
        <strong class="mt-font">{{ totalPercent }}</strong>
      </div>
      <div class="statistic">
        <span>От ранга</span>
        <strong class="mt-font">{{ groupPercent }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import type { RankDistributionTooltipProps } from '../types'

const props = defineProps<RankDistributionTooltipProps>()

const numberFormatter = new Intl.NumberFormat('ru-RU')
const percentFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formattedPlayers = computed(() => numberFormatter.format(props.players))
const formattedRatingInterval = computed(() => props.ratingInterval.map(numberFormatter.format).join(' – '))

function formatPercent(value: number, total: number) {
  const percent = total > 0 ? value / total * 100 : 0
  return `${percentFormatter.format(percent)}%`
}

const totalPercent = computed(() => formatPercent(props.players, props.totalPlayers))
const groupPercent = computed(() => formatPercent(props.players, props.groupPlayers))

</script>

<style scoped lang="scss">
.rank-distribution-tooltip {
  width: 220px;
  padding: 8px 10px 10px;
  box-sizing: border-box;
  font-size: 14px;
}

.header {
  display: flex;
  align-items: center;
  min-height: 58px;
}

.rank-icon {
  flex: 0 0 auto;
  width: 60px;
  height: 60px;
  margin-left: -5px;
  margin-right: 8px;
  margin-bottom: 5px;
  scale: 1;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
}

.rank-info {
  min-width: 0;
}

.title {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rating {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;

  span {
    color: rgba(255, 255, 255, 0.55);
    font-family: inherit;
    font-size: 14px;
  }
}

.statistics {
  display: grid;
  gap: 0px;
  padding-top: 7px;
  border-top: 1px solid var(--color-separator, #54545899);
  margin-bottom: -3px;
}

.statistic {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  color: rgba(255, 255, 255, 0.62);

  strong {
    color: rgba(255, 255, 255, 0.92);
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
  }
}
</style>
