<template>
  <DebugSection title="Все ранги" id="ranks"
    description="Полный набор дивизионов от квалификации до легенды. Подпись — тир из i18n.json + буква дивизиона, под ней сырое значение Division."
    source="src/shared/game/comp7/rank/RankIcon.vue">

    <div class="debug-row">
      <GameSelect v-model="game" />
      <SeasonSelect v-model="season" />
      <label class="debug-control">
        <span class="debug-label">size</span>
        <select v-model="size">
          <option value="small">small</option>
          <option value="medium">medium</option>
          <option value="large">large</option>
        </select>
      </label>
    </div>

    <div class="debug-grid" style="--debug-grid-min: 110px">
      <div class="card" v-for="division in allDivisions" :key="division">
        <div class="debug-stage center">
          <RankIcon :rank="division" :game :season :size class="icon" :class="`size-${size}`" />
        </div>
        <div class="caption">
          <span class="debug-hint">{{ rankLabel(division) }}</span>
          <span class="debug-value">{{ division }}</span>
        </div>
      </div>
    </div>

    <p class="debug-note">
      Для <span class="debug-value">qual</span> подпись берётся по ключу <span class="debug-value">rank:qual</span>,
      которого нет в <span class="debug-value">comp7/i18n.json</span> (там есть только first..sixth) — виден фолбэк
      useI18n на сам ключ вместо текста.
    </p>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import { Division, Rank, getDivisionsByRank } from '@/shared/game/comp7/utils'
import { GameVendor } from '@/shared/game/wot'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'
import GameSelect from '../shared/GameSelect.vue'
import SeasonSelect from '../shared/SeasonSelect.vue'

const { t } = useI18n(i18n)

const game = ref<GameVendor>('mt')
const season = ref('latest')
const size = ref<'small' | 'medium' | 'large'>('medium')

const TIERS: Rank[] = ['qual', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
const allDivisions = computed<Division[]>(() => TIERS.flatMap(rank => getDivisionsByRank(rank, game.value, season.value)))

function rankLabel(division: Division) {
  if (division === 'fifth' || division === 'sixth' || division === 'qual') return t(`rank:${division}`)
  const [rank, letter] = division.split('_')
  return `${t(`rank:${rank}`)} ${letter}`
}
</script>


<style scoped lang="scss">
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  border: 1px solid var(--debug-border);
  border-radius: 6px;
  padding: 0.5em;
  background: var(--debug-surface);
}

.caption {
  display: flex;
  flex-direction: column;
  gap: 0.1em;
  font-size: 12px;
}

.icon {
  &.size-small {
    height: 32px;
  }

  &.size-medium {
    height: 56px;
  }

  &.size-large {
    height: 96px;
  }
}
</style>
