<template>
  <div class="skills">
    <div class="latest" v-if="activeSkill">
      <img :src="getImage(activeSkill.skill)" :alt="activeSkill.skill">
      <div class="content">
        <h5>{{ getNameDescription(activeSkill.skill)[0] }}</h5>
        <p>{{ getNameDescription(activeSkill.skill)[1] }}</p>
      </div>
      <Tooltip :offset="0" :delay="0" class="main-time-tooltip">
        <template #default>
          <p class="time mt-font">{{ activeSkill.timeLabel }}м</p>
        </template>
        <template #tooltip>
          <p class="tooltip-time">
            {{ getHHMM(activeSkill.start) }} – {{ getHHMM(activeSkill.start + 3600) }}
          </p>
        </template>
      </Tooltip>
    </div>

    <div class="latest latest-empty" v-else>
      <img :src="Default" :alt="'default'">
      <div class="content">
        <h5>{{ getNameDescription('')[0] }}</h5>
        <p>{{ getNameDescription('')[1] }}</p>
      </div>
    </div>

    <div class="all">
      <div class="item" v-for="skill in todayHistory">
        <Tooltip :offset="0" :delay="0">
          <template #default>
            <img :src="getImage(skill.skill)" :alt="skill.skill">
            <p class="time mt-font">{{ ((60 + skill.timeLabel) / 60 - 1).toFixed(1) }}ч</p>
          </template>
          <template #tooltip>
            <p class="tooltip-content">{{ getNameDescription(skill.skill)[0] }} <span class="tooltip-time">{{
              getHHMM(skill.start) }} – {{ getHHMM(skill.start + 3600) }}</span></p>
          </template>
        </Tooltip>
      </div>
      <!-- <h5 :key="skill.skill">{{ getNameDescription(skill.skill)[0] }}</h5> -->
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';

import Default from './assets/default.png'
import BattleRush from './assets/battle_rush.png'
import MoraleBoost from './assets/morale_boost.png'
import Raid from './assets/raid.png'
import RiskyAttack from './assets/risky_attack.png'
import SavingBattle from './assets/saving_battle.png'
import TerritoryControl from './assets/territory_control.png'
import WarNeverChanges from './assets/war_never_changes.png'
import Tooltip from '@/components/Tooltip.vue';
import { useNow } from '@vueuse/core';


const props = defineProps<{
  skills: { skill: string, start: number }[]
}>()

const reverted = computed(() => props.skills.slice().reverse())

function getImage(skill: string) {
  switch (skill) {
    case 'battle_rush': return BattleRush
    case 'morale_boost': return MoraleBoost
    case 'raid': return Raid
    case 'risky_attack': return RiskyAttack
    case 'saving_battle': return SavingBattle
    case 'territory_control': return TerritoryControl
    case 'war_never_changes': return WarNeverChanges
    default: return Default
  }
}

const namesAndDescriptions = {
  'battle_rush': ['Стремительный бой', 'За 4 минуты'],
  'morale_boost': ['Воодушевление', 'Множитель'],
  'raid': ['Налёт', 'Макс. винрейта'],
  'risky_attack': ['Рискованная атака', 'Макс. очков'],
  'saving_battle': ['Сохранность матчасти', '5 живых'],
  'territory_control': ['Контроль территории', 'Захватить базу'],
  'war_never_changes': ['Решительное наступление', 'Уничтожить всех']
}

function getNameDescription(skill: string) {
  if (!(skill in namesAndDescriptions)) return ['Навык не активирован', '']
  return namesAndDescriptions[skill as keyof typeof namesAndDescriptions]
}

const now = useNow({ interval: 1000 })
const withTime = computed(() => reverted.value.map(skill => {
  const secondsAgo = Math.floor((now.value.getTime() / 1000 - skill.start))
  return { ...skill, timeLabel: Math.ceil((3600 - secondsAgo) / 60) }
}))

const activeSkill = computed(() => {
  if (!withTime.value.length) return null

  const skill = withTime.value[0]
  const time = skill.timeLabel
  if (time < 0) return null
  return skill
})

const todayHistory = computed(() => {
  if (!withTime.value.length) return []
  return withTime.value.slice(activeSkill.value ? 1 : 0).slice(0, 8)
    .filter(skill => skill.start > new Date(Date.now() - 60 * 60 * 8 * 1000).setHours(1, 0, 0, 0) / 1000)
})

function getHHMM(time: number) {
  const date = new Date(time * 1000)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
</script>


<style lang="scss" scoped>
.skills {
  .latest {
    display: flex;
    gap: 5px;
    border-radius: 5px;
    padding: 5px 5px;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(50px);
    max-width: 250px;
    margin: 0 auto;
    color: white;
    position: relative;

    h5 {
      margin: 0;
      font-size: 14px;
    }

    p {
      font-size: 14px;
      line-height: 1.1;
    }

    img {
      display: block;
      height: 35px;
      user-select: none;
      pointer-events: none;
    }

    .content {
      width: 100%;
    }

    .main-time-tooltip {
      position: absolute;
      bottom: 6px;
      right: 6px;
    }

    .time {
      line-height: 1;
      font-size: 11px;
      font-weight: bold;
      color: rgb(255, 247, 237);
      filter: drop-shadow(0 0 4px rgba(255, 132, 0, 0.7));
    }

    @media (max-width: 1100px) {
      width: fit-content;
      padding: 3px;

      .content {
        display: none;
      }

      .time {
        font-size: 14px;
        bottom: 2px;
        right: 2px;
      }
    }
  }

  .all {
    display: flex;
    gap: 3px;
    justify-content: center;
    margin-top: 10px;
    flex-wrap: wrap;
    height: 30px;

    @media screen and (max-width: 1110px) {
      visibility: hidden;
    }

    .item {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 5px;
      position: relative;

      img {
        display: block;
        height: 30px;
        width: auto;
        user-select: none;
        pointer-events: none;
      }

      .time {
        position: absolute;
        line-height: 1;
        bottom: 1px;
        right: 2px;
        font-size: 11px;
        font-weight: bold;
        pointer-events: none;
        color: rgb(255, 234, 206);
        filter: drop-shadow(0 0 1px rgb(255, 132, 0)) drop-shadow(0 0 1px black) drop-shadow(0 0 2px black);
      }
    }
  }

  .tooltip-content {
    line-height: 1;
    position: relative;
    padding-bottom: 9px;
    min-width: 70px;
    text-align: center;

    .tooltip-time {
      font-size: 10px;
      font-weight: bold;
      color: rgb(255, 234, 206);
      position: absolute;
      white-space: nowrap;
      right: 0;
      bottom: -5.5px;
      line-height: 1;
      filter: drop-shadow(0 0 1px rgba(255, 132, 0, 0.281));
    }
  }
}
</style>