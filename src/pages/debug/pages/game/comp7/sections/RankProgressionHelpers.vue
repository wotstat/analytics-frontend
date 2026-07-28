<template>
  <DebugSection title="Хелперы: энергия и рейтинг" id="rank-progression"
    description="getEnergyPerBattle/getRatingInactiveDecreasePerDay считают прогресс сезона; isComp7SkillChangeSupported переключает набор навыков по региону+сезону."
    source="src/shared/game/comp7/utils.ts">

    <div class="debug-row">
      <GameSelect v-model="game" />
      <span class="debug-hint">getMaxEnergyLimit: <span class="debug-value">{{ getMaxEnergyLimit(game) }}</span></span>
    </div>

    <div class="debug-row">
      <RankSelect v-model="rankBefore" label="rankBeforeBattle" />
      <RankSelect v-model="rankAfter" label="rankAfterBattle" />
      <RankSelect v-model="lastMaxRank" label="lastMaxRank" />
      <span class="debug-hint">
        getEnergyPerBattle: <span class="debug-value">{{ energy }}</span>
      </span>
    </div>

    <table class="debug-table">
      <thead>
        <tr>
          <th>rank</th>
          <th>getRatingInactiveDecreasePerDay (mt)</th>
          <th>то же (wot)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in RANKS" :key="r">
          <th>{{ r }}</th>
          <td>{{ getRatingInactiveDecreasePerDay(r, 'mt') }}</td>
          <td>{{ getRatingInactiveDecreasePerDay(r, 'wot') }}</td>
        </tr>
      </tbody>
    </table>

    <div class="table-wrap">
      <table class="debug-table">
        <thead>
          <tr>
            <th>регион \ сезон</th>
            <th v-for="s in SEASONS" :key="s">{{ s }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="region in REGIONS" :key="region">
            <th>{{ region }}</th>
            <td v-for="s in SEASONS" :key="s"
              :class="isComp7SkillChangeSupported(region, s) ? 'true' : 'false'">
              {{ isComp7SkillChangeSupported(region, s) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="debug-hint">isComp7SkillChangeSupported — по коду сейчас единственная true-комбинация: ru + comp7_5_4.</p>
  </DebugSection>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import {
  Rank, getMaxEnergyLimit, getEnergyPerBattle, getRatingInactiveDecreasePerDay, isComp7SkillChangeSupported
} from '@/shared/game/comp7/utils'
import { GameVendor } from '@/shared/game/wot'
import GameSelect from '../shared/GameSelect.vue'
import RankSelect from '../shared/RankSelect.vue'

const game = ref<GameVendor>('mt')
const rankBefore = ref<Rank>('second')
const rankAfter = ref<Rank>('third')
const lastMaxRank = ref<Rank>('second')

const energy = computed(() => getEnergyPerBattle(lastMaxRank.value, rankBefore.value, rankAfter.value, game.value))

const RANKS: Rank[] = ['qual', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
const REGIONS = ['RU', 'EU', 'ASIA', 'NA']
const SEASONS = ['comp7_5_2', 'comp7_5_3', 'comp7_5_4']
</script>


<style scoped lang="scss">
.table-wrap {
  overflow-x: auto;
}
</style>
