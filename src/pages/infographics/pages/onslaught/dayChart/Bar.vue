<template>
  <button class="bar mt-font" :class="{
    'selected': props.selected,
    [`rank-${props.value.rank}`]: true,
    [props.value.timeline]: true,
  }" :style="{
    height: `${props.value.relativeRating * 100}%`
  }">
    <div class="shadow"></div>
    <div class="letter" v-if="props.value.divisionLetter && props.value.divisionLetter != '?'">
      {{ props.value.divisionLetter }}
    </div>
    <div class="leaderboard-pos" v-if="leaderboardPosition">
      {{ leaderboardPosition }}
    </div>
    <div class="day">
      День {{ value.dayIndex + 1 }}
    </div>
    <Transition name="fade">
      <div class="selection-box" v-if="props.selected">
        <div class="line left-line vertical"></div>
        <div class="line right-line vertical"></div>
        <div class="line bottom-line horizontal"></div>
        <div class="line top-line horizontal"></div>
      </div>
    </Transition>
  </button>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { DayChartData } from '../types'

const props = defineProps<{
  value: DayChartData
  selected?: boolean
}>()

const leaderboardPosition = computed(() => {
  if (!props.value.leaderboardPosition) return null
  if (props.value.leaderboardPosition >= 1e4) return Math.round(props.value.leaderboardPosition / 1e3) + 'k'
  return props.value.leaderboardPosition
})

</script>


<style lang="scss" scoped>
.bar {

  --top-color: #ffb86c;
  --background: linear-gradient(-45deg, #ffb86c7e 0%, #ff8c0071 100%);
  --hover-background: linear-gradient(-45deg, #ffb86c9e 0%, #ff8c0091 100%);
  --selected-background: linear-gradient(-45deg, #fff0df 0%, #ff8c0091 100%);
  --shadow-color: linear-gradient(0deg, #ffb86c12 0%, #ffb86c00 100%);
  --selected-line: #ffd6a4;
  --selected-line-shadow: #ffac46;
  touch-action: manipulation;

  &.rank-qual {
    --top-color: #7275b1;
    --text-color: #b2b6ff;
    --background: linear-gradient(-10deg, #13141f25 0%, #353858 100%);
    --hover-background: linear-gradient(-10deg, #3f468331 0%, #353858 100%);
    --selected-background: linear-gradient(-45deg, #d9dcff 0%, #353858 100%);
    --shadow-color: linear-gradient(0deg, #454b8e16 0%, #35385800 100%);
    --selected-line: #ffffff;
    --selected-line-shadow: #454b8e;
  }

  &.rank-first {
    --top-color: #b3b3b3;
    --background: linear-gradient(-10deg, #69696925 0%, #595959 100%);
    --hover-background: linear-gradient(-10deg, #85858531 0%, #858585 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #858585 100%);
    --shadow-color: linear-gradient(0deg, #85858516 0%, #85858500 100%);
    --selected-line: #ffffff;
    --selected-line-shadow: #858585;
  }

  &.rank-second {
    --top-color: #ffd5ac;
    --background: linear-gradient(-10deg, #cd803225 0%, #c4711e 100%);
    --hover-background: linear-gradient(-10deg, #dc985448 0%, #cd7f32 100%);
    --selected-background: linear-gradient(-45deg, #fff6ed 0%, #cd7f32 100%);
    --shadow-color: linear-gradient(0deg, #cd7f3216 0%, #cd7f3200 100%);
    --selected-line: #ffffff;
    --selected-line-shadow: #cd7f32;
  }

  &.rank-third {
    --top-color: #ffffff;
    --background: linear-gradient(-10deg, #d2d2d223 0%, #d2d2d2 100%);
    --hover-background: linear-gradient(-10deg, #a4a4a45d 0%, #d2d2d2 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #d2d2d2 100%);
    --shadow-color: linear-gradient(0deg, #d2d2d216 0%, #d2d2d200 100%);
    --selected-line: #ffffff;
    --selected-line-shadow: #d2d2d2;
  }

  &.rank-fourth {
    --top-color: #fff2b4;
    --background: linear-gradient(-10deg, #ffe88a37 0%, #FFD700c7 100%);
    --hover-background: linear-gradient(-10deg, #fff3b965 0%, #FFD700c7 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #ffd738 100%);
    --shadow-color: linear-gradient(0deg, #ffd70016 0%, #ffd90000 100%);
    --selected-line: #ffffff;
    --selected-line-shadow: #ffbc04;
  }

  &.rank-fifth {
    --top-color: #dcfff8;
    --background: linear-gradient(-10deg, #41ffd937 0%, #41ffd9 100%);
    --hover-background: linear-gradient(-10deg, #9effec62 0%, #41ffd9 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #41ffd9 100%);
    --shadow-color: linear-gradient(0deg, #41ffd923 0%, #41ffd900 100%);
    --selected-line: #dffff9;
    --selected-line-shadow: #41ffd9;
  }

  &.rank-sixth {
    --top-color: #f0baff;
    --background: linear-gradient(-10deg, #b357cd37 0%, #be25e9 100%);
    --hover-background: linear-gradient(-10deg, #bf6bd676 0%, #be25e9 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #cd47f1 100%);
    --shadow-color: linear-gradient(0deg, #be1dea23 0%, #be25e900 100%);
    --selected-line: #f5d2ff;
    --selected-line-shadow: #c50bf9;
  }
}

.bar {
  max-width: 30px;
  min-width: 15px;
  position: relative;
  flex: 1;
  user-select: none;
  transition: height 0.5s ease;

  .day {
    position: absolute;
    left: 50%;
    bottom: -20px;
    transform: translateX(-50%);
    font-size: 12px;
    color: var(--text-color, var(--top-color));
    z-index: 3;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  &.selected .day {
    opacity: 1;
  }

  .letter,
  .leaderboard-pos {
    position: absolute;
    left: 50%;
    top: -20px;
    transform: translateX(-50%);
    font-size: 12px;
    color: var(--top-color, var(--text-color));
    z-index: 3;
  }

  .leaderboard-pos {
    font-size: 10px;
    z-index: 3;
  }

  &:has(.leaderboard-pos) .letter {
    top: -37px;
  }

  &.played {
    cursor: pointer;

    &:hover {
      background: var(--hover-background);
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--selected-background);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 4;
    }

    &.selected {
      &::after {
        opacity: 1;
      }
    }

    .selection-box {
      .line {
        position: absolute;
        background: var(--selected-line);
        box-shadow: 0 0 5px var(--selected-line-shadow);
        opacity: 1;
        z-index: 5;
      }

      .horizontal {
        left: -40%;
        right: -40%;
        height: 1px;
        border-radius: 100%;
      }

      .vertical {
        top: -20px;
        bottom: 0;
        width: 1px;
        border-top-left-radius: 100%;
        border-top-right-radius: 100%;
      }

      .top-line {
        top: -1px;
      }

      .bottom-line {
        bottom: 0;
        transform: translateY(50%);
      }

      .left-line {
        left: 0;
        transform: translateX(-50%);
      }

      .right-line {
        right: 0;
        transform: translateX(50%);
      }


      &.fade-enter-active,
      &.fade-leave-active {
        transition: opacity 0.5s ease;

        .vertical {
          transition: top 0.2s ease;
        }

        .horizontal {
          transition: opacity 0.2s ease, left 0.2s ease, right 0.2s ease;
        }

      }

      &.fade-enter-active {
        .top-line {
          transition-delay: 0.1s;
        }
      }

      &.fade-enter-from,
      &.fade-leave-to {
        .vertical {
          top: 100%;
        }

        .horizontal {
          opacity: 0;
          left: 50%;
          right: 50%;
        }
      }

    }
  }

  &.played,
  &.active {
    border-top: 1px solid var(--top-color);
    background: var(--background);

    .shadow {
      position: absolute;
      left: 0;
      right: 0;
      top: -30px;
      height: 30px;
      background: var(--shadow-color);
    }
  }

  &.active {

    &::after {
      --line-color: #ffffff;
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to left top, transparent 50%, var(--line-color) 52%, var(--line-color) 65%, transparent 68%),
        linear-gradient(to left top, var(--line-color) 16%, transparent 18%);
      background-size: calc(100% + 2px) 8px;
      background-repeat: repeat;
      background-position: bottom;
      mask: linear-gradient(to top, #fff 0, rgba(255, 255, 255, 0.8) 100%);
      opacity: 0.3;
      mix-blend-mode: hard-light;
    }
  }

  &.future {
    background: linear-gradient(0deg, #9898981c 0%, #98989800 100%);

    .letter {
      display: none;
    }
  }

  &.past {

    background: #9898981c;

    .shadow {
      position: absolute;
      left: 0;
      right: 0;
      top: -80px;
      height: 80px;
      background: linear-gradient(0deg, #9898981c 0%, #98989800 100%);

      &::after {
        content: '?';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        font-size: 14px;
        color: #989898;
        text-align: center;
      }
    }
  }

  &.active {
    opacity: 0.5;
  }
}
</style>