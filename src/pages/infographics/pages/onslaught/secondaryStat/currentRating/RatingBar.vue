<template>
  <div class="rating-progress">
    <div class="current-rating">
      <RankIcon :rank="[rating, eliteRating]" class="rank-icon" :size="'large'" :game :season />
      <p class="mt-font">{{ rating }}</p>
    </div>

    <div class="progress-bar mt-font">
      <div class="divisions">
        <div class="division" v-for="letter in divisionLetters" :key="letter">
          <div class="letter">{{ letter }}</div>
        </div>
      </div>

      <div class="bar" :style="{
        '--progress': `${progress}%`
      }">
        <div class="bar-progress"></div>
      </div>

      <div class="values">
        <div class="value" v-for="division in ratingValuesWithWidths" :style="{
          minWidth: typeof division === 'number' ? '' : `calc(${division[1] * 100}% - 1px)`
        }">
          <div class="num">
            {{ typeof division === 'number' ? division : division[0] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import { getDivisionsByRank, getNextDivision, getRankByRating, getRatingForDivision, getSeasonQualificationCount } from '@/shared/game/comp7/utils'
import { gameToRegion, GameVendor } from '@/shared/game/wot'
import { computed } from 'vue'


const props = defineProps<{
  rating: number
  qualIndex: number
  eliteRating: number
  top1: number
  top10: number
  top100: number
  game: GameVendor
  season: string
}>()

const rank = computed(() => getRankByRating(props.rating, props.game, props.eliteRating))
const divisions = computed(() => getDivisionsByRank(rank.value))

const divisionLetters = computed(() => {
  if (divisions.value.length == 0 || props.eliteRating == 0) return ['?']
  if (divisions.value.length == 1) {
    const division = divisions.value[0]
    if (division == 'qual') return ['Квалификация']
    if (division == 'fifth') return ['Чемпион']
    if (division == 'sixth') return ['Легенда']
  }
  return divisions.value.map(division => division.split('_')[1])
})

const ratingValues = computed(() => {
  if (!divisions.value) return []
  if (divisions.value.length == 1) {
    if (divisions.value[0] == 'qual') {
      const seasonQualificationCount = getSeasonQualificationCount(props.season, gameToRegion(props.game))
      return new Array(seasonQualificationCount + 1).fill(0).map((_, i) => i)
    }
  }

  const ratings = divisions.value.map(division => getRatingForDivision(division, props.game))

  const currentDivision = divisions.value[divisions.value.length - 1]
  if (currentDivision == 'sixth') return [props.eliteRating, props.top100, props.top10, props.top1]

  const nextDivision = getNextDivision(currentDivision)
  if (!nextDivision) return ratings

  if (nextDivision == 'sixth') return [...ratings, props.eliteRating]

  return [...ratings, getRatingForDivision(nextDivision, props.game)]
})

const ratingValuesWithWidths = computed(() => {
  const values = ratingValues.value
  if (values.length < 2) return values.map(v => [v, 1 / values.length] as [number, number])

  const result: [number, number][] = []
  const totalWidth = values.length > 1 ? values[values.length - 1] - values[0] : 1
  for (let i = 0; i < values.length - 1; i++) {
    const currentValue = values[i]
    const nextValue = values[i + 1]
    const width = nextValue - currentValue
    result.push([currentValue, width / totalWidth])
  }
  result.push([values[values.length - 1], 0])

  return result
})

const progress = computed(() => {
  const interval = ratingValues.value
  if (interval.length < 2) return 0
  const firstValue = interval[0]
  const lastValue = interval[interval.length - 1]
  const min = typeof firstValue === 'number' ? firstValue : firstValue[0]
  const max = typeof lastValue === 'number' ? lastValue : lastValue[0]

  if (divisions.value.length == 1 && divisions.value[0] == 'qual') {
    return ((1 + props.qualIndex - min) / (max - min)) * 100
  }

  return ((props.rating - min) / (max - min)) * 100
})

</script>


<style lang="scss" scoped>
.rating-progress {
  display: flex;
  flex: 1;
  gap: 10px;

  container-type: inline-size;

  .progress-bar {
    display: flex;
    flex: 1;
    flex-direction: column;
    margin: 20px 10px;

    .divisions {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);

      .division {
        flex: 1;
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        text-align: center;
        position: relative;
        height: 5px;

        &:last-child {
          border-right: 1px solid rgba(255, 255, 255, 0.3);
        }

        .letter {
          position: absolute;
          bottom: 2px;
          line-height: 1;
          width: 100%;
          font-size: 18px;
          color: #fffef7;
        }
      }
    }

    .values {
      display: flex;
      justify-content: space-between;
      margin-top: 5px;
      border-top: 1px solid rgba(255, 255, 255, 0.3);

      .value {
        flex: 1;
        border-left: 1px solid rgba(255, 255, 255, 0.3);
        text-align: center;
        position: relative;
        height: 5px;
        box-sizing: border-box;

        &:last-child {
          width: 0;
          max-width: 0;
        }

        .num {
          position: absolute;
          bottom: 0;
          transform: translate(-50%, 100%);
          font-size: 12px;
          color: #fffef7;
        }
      }
    }

    .bar {
      height: 12px;
      $color: rgba(108, 108, 108, 0.3);
      background: linear-gradient(to right, $color 0%, $color 50%, transparent 21%);
      background-size: calc(99.5% / 200);
      background-repeat: repeat;
      position: relative;

      .bar-progress {
        height: 100%;
        width: 100%;
        $color: rgb(181, 230, 255);
        $back-color: rgba(0, 77, 155, 0.739);
        background: linear-gradient(to right, $color 0%, $color 50%, $back-color 55%, $back-color 95%, $color 100%);
        background-size: calc(99.5% / 200);
        background-repeat: repeat;

        clip-path: inset(0 calc(100% - var(--progress)) 0 0);
        transition: clip-path 0.3s ease;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: var(--progress);
        width: 2px;
        height: 100%;
        background-color: #ffffff;
        filter: drop-shadow(0px 0px 5px rgb(11, 100, 255)) drop-shadow(0px 0px 2px rgb(255, 255, 255));
        transform: translate(-50%, 0);
        transition: left 0.3s ease;
      }
    }
  }

  .current-rating {
    display: flex;
    align-items: center;
    gap: 5px;

    .rank-icon {
      margin: -5px;
      height: 65px;
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

  @container (max-width: 400px) {
    .current-rating {
      .rank-icon {
        height: 40px;
      }
    }
  }

  @container content (max-width: 450px) {
    flex-direction: column;
    align-items: center;

    .progress-bar {
      width: 100%;

      .bar {
        height: 20px;
      }
    }

    .current-rating {
      flex-direction: column;

      .rank-icon {
        height: 150px;
      }

      p {
        text-align: center;
      }
    }
  }

  @container (max-width: 600px) {
    .progress-bar {
      .bar {
        background-size: calc(99.5% / 100);

        .bar-progress {
          background-size: calc(99.5% / 100);
        }
      }
    }
  }
}
</style>