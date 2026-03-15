<template>
  <div class="bar" :class="{
    'selected': props.selected,
    [`rank-${props.value.rank}`]: true,
    [props.value.timeline]: true,
  }" :style="{
    height: `${props.value.relativeRating * 100}%`
  }">
    <div class="shadow"></div>
    <Transition name="fade">
      <div class="selection-box" v-if="props.selected">
        <div class="line left-line vertical"></div>
        <div class="line right-line vertical"></div>
        <div class="line bottom-line horizontal"></div>
        <div class="line top-line horizontal"></div>
      </div>
    </Transition>


  </div>
</template>


<script setup lang="ts">
import { DayChartData } from '../types'

const props = defineProps<{
  value: DayChartData
  selected?: boolean
}>()
</script>


<style lang="scss" scoped>
.bar {

  --top-color: #ffb86c;
  --background: linear-gradient(-45deg, #ffb86c7e 0%, #ff8c0071 100%);
  --hover-background: linear-gradient(-45deg, #ffb86c9e 0%, #ff8c0091 100%);
  --selected-background: linear-gradient(-45deg, #fff0df 0%, #ff8c0091 100%);
  --shadow-color: linear-gradient(0deg, #ffb86c20 0%, #ffb86c00 100%);
  --selected-line: #ffd6a4;
  --selected-line-shadow: #ffac46;


  &.rank-fourth {
    --top-color: #ffea81;
    --background: linear-gradient(-10deg, #ffec8a37 0%, #ffd500c7 100%);
    --hover-background: linear-gradient(-10deg, #fff3b965 0%, #ffd500c7 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #ffde38 100%);
    --shadow-color: linear-gradient(0deg, #ffd50022 0%, #ffd50000 100%);
    --selected-line: #ffffff;
    --selected-line-shadow: #ffbc04;
  }

  &.rank-fifth {
    --top-color: #eba2ff;
    --background: linear-gradient(-10deg, #b357cd37 0%, #9b04c5 100%);
    --hover-background: linear-gradient(-10deg, #bf6bd676 0%, #9b04c5 100%);
    --selected-background: linear-gradient(-45deg, #ffffff 0%, #9b04c5 100%);
    --shadow-color: linear-gradient(0deg, #9b04c522 0%, #9b04c500 100%);
    --selected-line: #f5d2ff;
    --selected-line-shadow: #c50bf9;
  }
}

.bar {
  max-width: 22px;
  min-width: 15px;
  position: relative;
  flex: 1;

  &.played {
    cursor: pointer;

    &:hover {
      background: var(--hover-background);
    }

    &.selected {
      background: var(--selected-background);
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

  &.future {
    background: linear-gradient(0deg, #9898981c 0%, #98989800 100%);
  }

  &.past {

    // background: linear-gradient(0deg, #9898983d 0%, #98989800 100%);
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