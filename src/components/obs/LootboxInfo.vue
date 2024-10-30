<template>
  <div class="flex">
    <div class="card flex-1" :style="{ backgroundColor: `#${props.backgroundColor}` }">
      <div class="main gap-0" :style="style">
        <p class="flex-1">
          <span class="small">Открыто контейнеров: </span>
          <span class="big bold num right">{{ infosTween[0] }}</span>
        </p>

        <div class="flex currencies">
          <div class="flex-1 num">
            <p class="line">
              <img src="/big-icons/gold.png">
              {{ logProcessor(infosTween[1]) }}
            </p>
            <p class="line">
              <img src="/big-icons/credits.png">
              {{ logProcessor(infosTween[2]) }}
            </p>
          </div>

          <div class="flex-1 num">
            <p class="line">
              <img src="/big-icons/freeXP.png">
              {{ logProcessor(infosTween[3]) }}
            </p>
            <p class="line">
              <img src="/big-icons/premium-icon-wot.png">
              {{ logProcessor(infosTween[4]) }}
            </p>
          </div>
        </div>

        <div class="tanks">
          <div class="left flex-1">
            <div v-for="tank in evenTanks" :key="tank.name" class="flex">
              <p class="flex-1">{{ getTankName(tank.name, true) }}</p>
              <p class="right bold num">{{ tank.count }}</p>
            </div>
          </div>
          <div class="vr"></div>
          <div class="right flex-1">
            <div v-for="tank in oddTanks" :key="tank.name" class="flex">
              <p class="flex-1">{{ getTankName(tank.name, true) }}</p>
              <p class="right bold num">{{ tank.count }}</p>
            </div>
          </div>
        </div>
        <!-- <div class="sum flex-1">
          <p class="header center grey">Сумма ({{ battleCount }})</p>
          <p class="num green bold center" :style="{ color: `#${props.color}` }">{{ processor(sumDamageTween) }}</p>
        </div>
        <div class="last flex-1 ">
          <p class="header center grey">Посл. бой</p>
          <p class="num center white">{{ processor(lastDamageTween) }}</p>
        </div> -->
        <!-- <p>Местоf: <span class="green bold num" :style="style">{{ processor(placeTween) }}</span></p> -->
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor, useLogProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { getTankName } from '@/utils/i18n';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  count: number
  premium: number
  gold: number
  credits: number
  freeXp: number
  tanks: { name: string, count: number }[]
  color?: string;
  backgroundColor?: string;
}>();

const accentColor = computed(() => `#${props.color ?? '7ee927'}`)
const style = computed(() => ({
  '--accent-color': accentColor.value
}))

const processor = useFixedSpaceProcessor(0)
const logProcessor = useLogProcessor()

const infos = computed(() => ([props.count, props.gold, props.credits, props.freeXp, props.premium]))
const infosTween = useTweenCounter(infos, { duration: 1 })

const route = useRoute();

const sortedTanks = computed(() => props.tanks.sort((a, b) => b.count - a.count))
const evenTanks = computed(() => sortedTanks.value.filter((_, i) => i < sortedTanks.value.length / 2))
const oddTanks = computed(() => sortedTanks.value.filter((_, i) => i >= sortedTanks.value.length / 2))



onMounted(() => {
  if (route.meta.clearPage)
    document.body.style.backgroundColor = 'transparent';
})

</script>

<style lang="scss" scoped>
.card {
  font-size: 1.3vw;
  padding: 1em 4em;
  border-radius: 3em;
  background-color: #292929;
  position: relative;


  .main {

    .currencies {
      font-size: 6em;
      margin-top: 0.5em;

      img {
        width: 1.5em;
        margin-right: 0.5em;
      }

      .line {
        display: flex;
        align-items: center;
      }
    }

    p {
      font-size: 0.9em;
    }

    .tanks {
      display: flex;
      gap: 1em;
      margin-top: 1em;
      font-size: 4em;
      line-height: 1;
      white-space: nowrap;

      .left,
      .right {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
      }

      .right {
        // font-weight: bold;
      }

      .flex {
        display: flex;
        gap: 0.5em;
      }

      .vr {
        width: 1px;
        background-color: #5a5a5a;
        margin: 0 1em;
      }
    }

    .small {
      font-size: 4em;
    }

    .big {
      font-size: 8em;
    }

    .header {
      font-size: 4em;
      color: #c4c4c4;
    }

    .center {
      text-align: center;
    }

    .bold {
      font-weight: bold;
    }

    .num {
      font-variant-numeric: tabular-nums;
      text-wrap: nowrap;
      white-space: nowrap;
    }

    .num {
      line-height: 1.2;
    }

    .white {
      color: white;
    }

    .grey {
      color: #c4c4c4;
    }
  }

  $grey: #c4c4c4;

  .green {
    color: #7ee927;
  }

  .accent {
    color: var(--accent-color)
  }
}
</style>
