<template>
  <div class="qualification">
    <div class="battles">
      <div class="battle" v-for="result in results" :class="{
        [`result-${result}`]: result
      }">
        <Icon :icon="'battles'" class="result-icon" v-if="result" />
        <p v-else class="unknown mt-font">?</p>
      </div>
    </div>
    <div class="rating">
      <ArrowRight class="arrow-icon" />
      <RankIcon :rank="rating" class="rank-icon" :game="game" :season="season" />
      <p class="mt-font">{{ rating || '?' }}</p>
    </div>
  </div>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { computed } from 'vue'
import ArrowRight from './assets/arrow-right.svg'
import { GameVendor } from '@/shared/game/wot'


const props = defineProps<{
  battles: { battleIndex: number, result: 'win' | 'loss' | 'draw' }[]
  rating: number
  season: string
  game: GameVendor
}>()

const results = computed(() => {
  const indexes = new Array(7).fill(0).map((_, i) => i)
  const battlesByIndex = new Map(props.battles.map(battle => [battle.battleIndex, battle.result]))

  return indexes.map(index => battlesByIndex.get(index) || null)
})

</script>


<style lang="scss" scoped>
.qualification {
  display: flex;

  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 10px;

  .arrow-icon {
    height: 24px;
    fill: #fffef7;
  }

  .rating {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .rank-icon {
      height: 34px;
      filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.5));
      user-select: none;
      pointer-events: none;
    }

    p {
      font-size: 24px;
      color: #fffef7;
      font-weight: bold;
      min-width: 52px;
    }
  }

  .battles {
    display: flex;
    gap: 8px;
    justify-content: center;

    .battle {
      display: flex;
      align-items: center;
      justify-content: center;

      .result-icon {
        height: 44px;
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
        width: 28px;
        height: 28px;
        font-size: 20px;
        line-height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
      }
    }
  }

  @container (max-width: 450px) {
    .battles {
      gap: 0px;
      flex: 1;
      justify-content: space-between;
    }
  }

  @container (max-width: 330px) {
    .battles {
      .battle {
        .result-icon {
          height: 34px;
        }
      }
    }

    .arrow-icon {
      height: 20px;
    }

    .rating {
      gap: 4px;

      .rank-icon {
        height: 28px;
      }

      p {
        font-size: 18px;
      }
    }
  }
}
</style>