<template>
  <div class="flex">
    <div class="card">
      <div class="main" :style="style">
        <div class="flex l1">
          <p class="flex-1">
            <span class="small grey">Боёв:</span><span class="big num">&nbsp;{{ totalBattles }}</span>
          </p>
          <p class="flex-1 right"><span class="small grey">Место:</span>
            <span class="big bold green num">&nbsp;{{ placeTween }}</span>
          </p>
        </div>

        <div class="l2" v-if="battles.length && !medium">
          <div class="flex gap-0">
            <div class="flex-1">
              <table>
                <tr v-for="(battle, i) in battles.slice(0, 7)"
                  :class="new Date(battle.dateTime).getTime() >= sessionStart ? 'today' : ''">
                  <td class="grey num">{{ i + 1 }}.</td>
                  <td class="grey">{{ getTankName(battle.tankTag, true) }}</td>
                  <td class="bold right num">{{ battle.xp }}</td>
                </tr>
              </table>
            </div>
            <div class="sep"></div>
            <div class="flex-1">

              <table>
                <tr v-for="(battle, i) in battles.slice(7, 14)"
                  :class="new Date(battle.dateTime).getTime() >= sessionStart ? 'today' : ''">
                  <td class="grey num">{{ i + 8 }}.</td>
                  <td class="grey">{{ getTankName(battle.tankTag, true) }}</td>
                  <td class="bold right num">{{ battle.xp }}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>

        <div class="l3" v-if="battles.length && lastSession.length">
          <div class="flex gap-0">
            <div>
              <p class="">
                <span class="small grey">
                  Худший • {{ getTankName(badBattle.tankTag, true) }} •
                </span>
                <span class="small num bold">{{ badBattle.xp }}</span>
              </p>
              <p class="">
                <span class="small grey">
                  Прошлый • {{ getTankName(lastBattle.tankTag, true) }} •
                </span>
                <span class="small num bold">{{ lastBattle.xp }}</span>
              </p>
            </div>
            <div class="chart-container">
              <Bar :data="chartData" :options="options" />
            </div>
          </div>
        </div>

      </div>


      <div class="record abs-full">
        <canvas ref="confettiCanvasRef"></canvas>
      </div>
    </div>
  </div>

  <!-- <button @click="showRecordScreen()">Show Best</button> -->
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import confetti from 'canvas-confetti'
import { getTankName } from '@/utils/i18n';
import { Bar, ChartProps } from 'vue-chartjs';

const accentColor = computed(() => `#${props.color ?? '7ee927'}`)


const confettiCanvasRef = ref<HTMLCanvasElement | null>(null);
let confettiCanvas: confetti.CreateTypes | null = null

const props = defineProps<{
  color?: string;
  medium?: boolean;
  place: number;
  totalBattles: number;
  battles: Array<{ dateTime: string; tankTag: string; xp: string }>
  lastSession: Array<{ dateTime: string; tankTag: string; xp: string }>
}>();



const style = computed(() => ({
  '--accent-color': accentColor.value
}))

const badBattle = computed(() => props.battles[props.battles.length - 1])
const lastBattle = computed(() => props.lastSession[0])

const sessionStart = computed(() => new Date(props.lastSession[props.lastSession.length - 1]?.dateTime).getTime())


const chartData = computed<ChartProps<'bar'>['data']>(() => ({
  labels: ['1', '2', '3', '4', '5', '6', '7', '8'],
  datasets: [
    {
      data: props.lastSession.map(b => +b.xp),
      backgroundColor: accentColor.value,
    }
  ]
}))

const max = computed(() => Math.max(...props.lastSession.slice(0, 8).map(b => +b.xp)))

const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      display: false,
      max: max.value == 0 ? undefined : max.value * 1.1, min: 0,
    },
    x: { display: false },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
}))


function showEffect() {
  const width = window.innerWidth;
  const k = width / 800;
  console.log('width', width);

  const shared: confetti.Options = {
    particleCount: 150,
    spread: 60,
    scalar: 1.5 * k,
    startVelocity: 80 * k,
    gravity: 0.8 * k,
    origin: { y: 1.2, x: 0 }
  }


  function explosion() {
    confettiCanvas?.({
      ...shared,
      angle: 60,
      origin: { y: 1.2, x: 0 }
    });

    confettiCanvas?.({
      ...shared,
      angle: 120,
      origin: { y: 1.2, x: 1 }
    });
  }

  async function effect() {
    explosion()
    await new Promise(resolve => setTimeout(resolve, 500))
    explosion()
    await new Promise(resolve => setTimeout(resolve, 500))
    explosion()
  }

  effect()
}

const place = computed(() => props.place);
const placeTween = useTweenCounter(place, { duration: 1 });


const route = useRoute();

onMounted(() => {
  if (route.meta.clearPage)
    document.body.style.backgroundColor = 'transparent';

  if (confettiCanvasRef.value) {
    confettiCanvas = confetti.create(confettiCanvasRef.value, { resize: true })
  }
})

function showRecordScreen() {
  nextTick(() => showEffect())
}

defineExpose({
  showRecordScreen
})

</script>

<style lang="scss" scoped>
.abs-full {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.record {
  pointer-events: none;
  border-radius: 3em;
  overflow: hidden;

  canvas {
    width: 100%;
    height: 100%;
  }
}

.card {
  font-size: 1.3vw;
  padding: 1em 4em;
  border-radius: 3em;
  background-color: #292929;
  // background-color: #1414146e;
  background-blend-mode: multiply;
  background-size: 50em;
  // border: 0.3em solid #aeaeaeb4;
  // margin: 1em;
  // box-shadow: 0 0 3em 0px #000000c1;
  position: relative;
  flex: 1;

  $grey: #c4c4c4;

  .main {

    color: white;

    .l1 {
      text-wrap: nowrap;
    }

    .l2 {
      font-size: 3.4em;

      margin: 0.5em 0;
      // display: none;

      .sep {
        width: 0;
        border-right: 0.08em solid #525252d2;
        margin: 0 1em;
      }

      table {
        width: 100%;
        text-wrap: nowrap
      }
    }

    .l3 {
      // display: none;
      margin-bottom: 2em;

      .flex {
        justify-content: space-between;
      }

      .chart-container {
        margin-bottom: 1em;
        margin-left: 2em;
        max-width: 18em;
      }
    }

    .small {
      font-size: 4em;
    }

    .big {
      font-size: 8em;
    }

    .right {
      text-align: right;
    }

    // p {
    //   font-size: 8em;
    // }

    .bold {
      font-weight: bold;
    }

    .num {
      font-variant-numeric: tabular-nums;
    }
  }

  .grey {
    color: $grey;
  }

  .green {
    color: var(--accent-color)
  }

  .today {
    color: var(--accent-color)
  }
}
</style>
