<template>
  <div class="rating-progress">
    <div class="current-rating">
      <RankIcon :rank="[rating, eliteRating]" class="rank-icon" :size="'large'" />
      <p class="mt-font">{{ rating }}</p>
    </div>

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
      }
    }
  }

  .current-rating {
    display: flex;
    align-items: center;
    gap: 5px;

    .rank-icon {
      height: 65px;
      filter: drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.5));
      user-select: none;
      margin: -5px
    }

    p {
      font-size: 24px;
      color: #fffef7;
      font-weight: bold;
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