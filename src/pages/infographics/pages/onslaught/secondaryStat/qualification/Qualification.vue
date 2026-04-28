<template>
  <div class="qualification" :class="`game-${game}`">
    <div class="battles">
      <div class="battle" v-for="(result, i) in results" :class="{
        [`result-${result}`]: result,
        [`item-${i}`]: true,
      }">
        <Transition name="fade">
          <div class=" container icon" v-if="result" :key="`${version ?? Math.random()}`">
            <Icon :icon="'battles'" class="result-icon" />
          </div>
          <div class="container text" v-else>
            <p class="unknown mt-font">?</p>
          </div>
        </Transition>
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
import { gameToRegion, GameVendor } from '@/shared/game/wot'
import { getSeasonQualificationCount } from '@/shared/game/comp7/utils'

const props = defineProps<{
  battles: { battleIndex: number, result: 'win' | 'loss' | 'draw' }[]
  rating: number
  season: string
  game: GameVendor
  version?: string
}>()

const seasonQualificationCount = computed(() => getSeasonQualificationCount(props.season, gameToRegion(props.game)))

const results = computed(() => {
  const indexes = new Array(seasonQualificationCount.value).fill(0).map((_, i) => i)
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

      .container {
        svg {
          display: block;
        }
      }

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

  &.game-mt {
    @container (min-width: 751px) and (max-width: 780px) {
      .battles {
        .battle {
          .result-icon {
            height: 40px;
            margin: -8px;
          }

          .unknown {
            width: 24px;
            height: 24px;
            font-size: 18px;
          }
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
            margin: -6px;
          }

          .unknown {
            width: 22px;
            height: 22px;
            font-size: 16px;
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

  &.game-wot {
    @container (min-width: 801px) and (max-width: 1000px) {
      .battles {
        .battle {
          .result-icon {
            height: 40px;
            margin: -8px;
          }

          .unknown {
            width: 24px;
            height: 24px;
            font-size: 18px;
          }
        }
      }
    }

    @container (max-width: 550px) {
      .battles {
        gap: 0px;
        flex: 1;
        justify-content: space-between;
      }
    }

    @container (max-width: 450px) {
      .battles {
        .battle {
          .result-icon {
            height: 34px;
            margin: -6px;
          }

          .unknown {
            width: 22px;
            height: 22px;
            font-size: 16px;
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
          min-width: 37px;
        }
      }
    }
  }

  .battles {

    @for $i from 1 through 10 {
      .item-#{$i} {

        .fade-enter-active,
        .fade-leave-active {
          transition-delay: ($i * 0.025s);
        }
      }
    }

    .fade-enter-active,
    .fade-leave-active {
      transition: filter 0.2s, opacity 0.2s, transform 0.2s;
    }

    .fade-leave-active {
      &.icon {
        svg {
          transition: filter 1000s;
        }
      }
    }

    .fade-enter-from,
    .fade-leave-to {
      position: absolute;
      opacity: 0;
      transform: scale(0.5);
      filter: blur(5px);

      &.icon {
        filter: blur(2px);
      }
    }
  }
}
</style>