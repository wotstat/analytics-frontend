<template>
  <h1>Общая статистика Натиска</h1>

  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:region="selectedRegion" v-model:seasons="seasons" />

    <section class="rank-distribution">
      <div class="header">
        <h3>Распределение игроков по рангам</h3>
      </div>
      <hr class="separator">

      <RankDistributionChart class="rank-distribution-chart" :data="rankDistributionData"
        v-model:selected="selectedRankDistributionItems" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Settings from '../shared/settings/Settings.vue'
import RankDistributionChart from './rankDistribution/RankDistributionChart.vue'
import type { RankDistributionItem } from './rankDistribution/types'

const seasons = ref<{ region: string, season: string, start: string }[]>([])
const selectedSeason = ref<string | null>(null)
const selectedRegion = ref<'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT'>('RU')
const selectedRankDistributionItems = ref<RankDistributionItem[]>([])

const randomValue = (min: number, max: number) => Math.round(min + Math.random() * (max - min))
const divisionLetters = ['E', 'D', 'C', 'B', 'A'] as const

const rankDistributionData: RankDistributionItem[] = [
  ...divisionLetters.map(name => ({ rank: 'first' as const, name, value: randomValue(700, 1500) })),
  ...divisionLetters.map(name => ({ rank: 'second' as const, name, value: randomValue(900, 1800) })),
  ...divisionLetters.map(name => ({ rank: 'third' as const, name, value: randomValue(800, 1600) })),
  ...divisionLetters.map(name => ({ rank: 'fourth' as const, name, value: randomValue(500, 1200) })),
  ...[2650, 2750, 2850, 2950, 3050, 3150, 3250, 3350].map(name => ({
    rank: 'fifth' as const,
    name,
    value: randomValue(200, 700),
  })),
  ...[3450, 3650, 3850, 4050, 4250, 4450, 4650, 4850, 5050, 5250, 5450, 5650].map(name => ({
    rank: 'sixth' as const,
    name,
    value: randomValue(50, 300),
  })),
]
</script>

<style lang="scss" scoped>
h1 {
  margin-top: 0;
}

.onslaught-page {
  margin-top: 1em;
}

.rank-distribution {
  margin-top: 45px;

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 22px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.87);
    }
  }

  .separator {
    margin: 5px 0;
    border: none;
    border-bottom: 1px solid var(--color-separator, #54545899);
  }

  .rank-distribution-chart {
    margin-right: calc(var(--content-page-margin, 0) * -1);
    margin-left: calc(var(--content-page-margin, 0) * -1);
  }
}
</style>
