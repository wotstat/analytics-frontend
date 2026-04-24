<template>
  <div class="rating-progress">
    <div class="progress-bar mt-font">
      <div class="divisions">
        <div class="division" v-for="division in ['E', 'D', 'C', 'B', 'A']" :key="division">
          <div class="letter">{{ division }}</div>
        </div>
      </div>

      <div class="bar" :style="{
        '--progress': '30%'
      }">
        <div class="bar-progress"></div>
      </div>

      <div class="values">
        <div class="value" v-for="division in ['500', '600', '700', '800', '900', '1000']" :key="division">
          <div class="num">
            {{ division }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'


const props = defineProps<{
  rating: number
  eliteRating: number
}>()
</script>


<style lang="scss" scoped>
.rating-progress {
  flex: 1;

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
      height: 23px;
      $color: rgba(108, 108, 108, 0.3);
      background: linear-gradient(to right, $color 0%, $color 50%, transparent 21%);
      background-size: calc(99.5% / 100);
      background-repeat: repeat;
      position: relative;

      .bar-progress {
        height: 100%;
        width: 100%;
        $color: rgb(181, 230, 255);
        $back-color: rgba(0, 77, 155, 0.739);
        background: linear-gradient(to right, $color 0%, $color 50%, $back-color 55%, $back-color 95%, $color 100%);
        background-size: calc(99.5% / 100);
        background-repeat: repeat;

        clip-path: inset(0 calc(100% - var(--progress)) 0 0);
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: var(--progress);
        width: 2px;
        height: 100%;
        background-color: #ffffff;
        // filter: drop-shadow(0px 0px 5px rgb(2, 162, 255));
        filter: drop-shadow(0px 0px 5px rgb(11, 100, 255)) drop-shadow(0px 0px 2px rgb(255, 255, 255));
        transform: translate(-50%, 0);
      }
    }
  }
}
</style>