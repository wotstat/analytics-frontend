<template>
  <div class="qualification">
    <h3>Квалификация</h3>
    <div class="rating">
      <ArrowRight class="arrow-icon" />
      <RankIcon :rank="rating" class="rank-icon" />
      <p class="mt-font">{{ rating }}</p>
    </div>
    <div class="battles">
      <div class="battle" v-for="result in results" :class="{
        [`result-${result}`]: result
      }">
        <Icon :icon="'battles'" class="result-icon" v-if="result" />
        <p v-else class="unknown mt-font">?</p>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { computed } from 'vue'
import ArrowRight from './assets/arrow-right.svg'


const props = defineProps<{
  battles: { battleIndex: number, result: 'win' | 'loss' | 'draw' }[]
  rating: number
}>()

const results = computed(() => {
  const indexes = new Array(7).fill(0).map((_, i) => i)
  const battlesByIndex = new Map(props.battles.map(battle => [battle.battleIndex, battle.result]))

  return indexes.map(index => battlesByIndex.get(index) || null)
})

</script>


<style lang="scss" scoped>
.qualification {

  h3 {
    margin: 0;
    font-size: 22px;
  }

  .arrow-icon {
    width: 24px;
    height: 24px;
    fill: #fffef7;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 12px;

    .rank-icon {
      width: 30px;
      height: 30px;
      filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.5));
      user-select: none;
    }

    p {
      font-size: 24px;
      color: #fffef7;
      font-weight: bold;
    }
  }

  .battles {
    display: flex;
    gap: 8px;
    margin-top: 10px;

    .battle {
      display: flex;
      align-items: center;
      justify-content: center;

      .result-icon {
        width: 40px;
        height: 40px;
        margin: -8px;
      }

      &.result-win .result-icon {
        fill: #ffffff;
        filter: drop-shadow(0px 0px 4px rgb(83, 231, 102));
      }

      &.result-lose .result-icon {
        fill: #ffffff;
        filter: drop-shadow(0px 0px 4px rgb(255, 63, 63));
      }

      .unknown {
        color: #e6e6e6;
        filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.4));
        width: 24px;
        height: 24px;
        font-size: 20px;
        line-height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
      }
    }
  }
}
</style>