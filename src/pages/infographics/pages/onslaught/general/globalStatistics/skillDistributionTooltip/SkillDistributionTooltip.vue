<template>
  <div class="skill-distribution-tooltip">
    <div class="title">Распределение навыков</div>

    <div class="skills">
      <div v-for="[skill, share] in props.skills" :key="skill" class="skill">
        <div class="icon">
          <SkillIcon :skill :game="props.game" :season="props.season" />
        </div>
        <span class="name">{{ getComp7SkillName(skill) }}</span>
        <strong>{{ formatPercent(share) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkillIcon from '@/shared/game/comp7/skill/SkillIcon.vue'
import { getComp7SkillName } from '@/shared/game/comp7/utils'
import type { SkillDistributionTooltipProps } from '../types'

const props = defineProps<SkillDistributionTooltipProps>()

const percentFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  style: 'percent',
})

function formatPercent(value: number) {
  return percentFormatter.format(value)
}
</script>

<style scoped lang="scss">
.skill-distribution-tooltip {
  width: 270px;
  padding: 11px 13px 12px;
  box-sizing: border-box;
}

.title {
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
}

.skills {
  display: grid;
  gap: 4px;
}

.skill {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 32px;

  .icon {
    width: 30px;
    height: 30px;
  }

  .name {
    overflow: hidden;
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: rgba(255, 255, 255, 0.92);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }
}
</style>
