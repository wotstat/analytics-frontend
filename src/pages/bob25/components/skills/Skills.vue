<template>
  <div class="skills">
    <div class="latest" v-if="reverted.length">
      <img :src="getImage(reverted[0].skill)" :alt="reverted[0].skill">
      <div class="content">
        <h5>{{ getNameDescription(reverted[0].skill)[0] }}</h5>
        <p>{{ getNameDescription(reverted[0].skill)[1] }}</p>
        <p class="time mt-font">45м</p>
      </div>
    </div>

    <div class="all">
      <div class="item" v-for="skill in reverted">
        <Tooltip :text="getNameDescription(skill.skill)[0]" :offset="0" :delay="0">
          <img :src="getImage(skill.skill)" :alt="skill.skill">
          <p class="time mt-font">-1.2ч</p>
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
  'battle_rush': ['Стремительный бой', 'Победа за 4 минуты'],
  'morale_boost': ['Воодушевление', 'Множитель'],
  'raid': ['Налёт', 'Макс. винрейта'],
  'risky_attack': ['Рискованная атака', 'Макс. очков за час'],
  'saving_battle': ['Сохранность матчасти', 'Победа не более двух убитых'],
  'territory_control': ['Контроль территории', 'Захватить базу'],
  'war_never_changes': ['Решительное наступление', 'Уничтожить всех противников']
}

function getNameDescription(skill: string) {
  if (!(skill in namesAndDescriptions)) return ['Навык не активирован', '']
  return namesAndDescriptions[skill as keyof typeof namesAndDescriptions]
}
</script>


<style lang="scss" scoped>
.skills {
  .latest {
    display: flex;
    gap: 5px;
    border-radius: 5px;
    padding: 2px 5px;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(50px);
    max-width: 200px;
    margin: 0 auto;
    color: white;

    h5 {
      margin: 0;
      font-size: 16px;
    }

    p {
      font-size: 14px;
      line-height: 1.1;
    }

    img {
      display: block;
      height: 45px;
      user-select: none;
      pointer-events: none;
    }

    .content {
      position: relative;
      width: 100%;

      .time {
        position: absolute;
        line-height: 1;
        top: 1px;
        right: 0px;
        font-size: 11px;
        font-weight: bold;
        color: rgb(255, 247, 237);
        filter: drop-shadow(0 0 4px rgba(255, 162, 0, 0.5));
      }
    }
  }

  .all {
    display: flex;
    gap: 3px;
    justify-content: center;
    margin-top: 10px;
    flex-wrap: wrap;

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
        color: rgb(255, 234, 206);
        filter: drop-shadow(0 0 2px rgb(255, 162, 0))drop-shadow(0 0 1px black) drop-shadow(0 0 2px black);
      }
    }
  }
}
</style>