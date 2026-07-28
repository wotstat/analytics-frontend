<template>
  <DebugSection title="Размеры и фон" id="sizes-backgrounds"
    description="Ранги и навыки — растровые картинки с реальными цветами, а не currentColor: проверяем, что читаются на светлом фоне так же хорошо, как на тёмном."
    source="src/shared/game/comp7/">

    <div class="debug-row">
      <GameSelect v-model="game" />
      <SeasonSelect v-model="season" />
    </div>

    <div class="debug-row">
      <div class="bg-card" :class="bg" v-for="bg in ['dark', 'light'] as const" :key="bg">
        <span class="debug-label">{{ bg === 'dark' ? 'тёмный фон' : 'светлый фон' }}</span>

        <div class="row">
          <RankIcon rank="sixth" size="small" :game :season class="rank small" />
          <RankIcon rank="sixth" size="large" :game :season class="rank large" />
          <SkillIcon :skill="SKILL_TAGS[0]" :game :season style="width: 28px" />
          <SkillIcon :skill="SKILL_TAGS[0]" :game :season style="width: 64px" />
        </div>
      </div>
    </div>

    <div class="debug-col">
      <span class="debug-label">сетка: все дивизионы, маленький размер, в ряд</span>
      <div class="debug-grid" style="--debug-grid-min: 56px">
        <RankIcon v-for="division in allDivisions" :key="division" :rank="division" size="small" :game :season
          class="rank small" />
      </div>
    </div>
  </DebugSection>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import SkillIcon from '@/shared/game/comp7/skill/SkillIcon.vue'
import { Division, Rank, SKILL_TAGS, getDivisionsByRank } from '@/shared/game/comp7/utils'
import { GameVendor } from '@/shared/game/wot'
import GameSelect from '../shared/GameSelect.vue'
import SeasonSelect from '../shared/SeasonSelect.vue'

const game = ref<GameVendor>('mt')
const season = ref('latest')

const TIERS: Rank[] = ['qual', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth']
const allDivisions = computed<Division[]>(() => TIERS.flatMap(getDivisionsByRank))
</script>


<style scoped lang="scss">
.bg-card {
  display: flex;
  flex-direction: column;
  gap: 0.5em;
  border-radius: 6px;
  padding: 0.75em;

  &.dark {
    background: #14161a;
  }

  &.light {
    background: #eef0f3;

    .debug-label {
      color: #14161a99;
    }
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75em;
}

.rank {
  &.small {
    height: 28px;
  }

  &.large {
    height: 56px;
  }
}
</style>
