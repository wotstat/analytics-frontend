<template>
  <div class="card" :class="players.length > 1 ? '' : 'solo'">
    <div class="main" :class="showRecord ? 'hidden' : ''">
      <table>
        <thead>
          <tr>
            <th v-if="players.length > 1" class="wide">Никнейм</th>
            <th class="green center">Очки в ср. ({{ battles }})</th>
            <th class="center">Посл. бой</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(player, i) in players" v-if="players.length > 1">
            <th class="wide nickname">{{ nickProcessor(player.nickname) }}</th>
            <td class="green">{{ processor(avgTween[i]) }}</td>
            <td>{{ processor(lastTween[i]) }}</td>
          </tr>

          <tr class="avg">
            <th class="wide" v-if="players.length > 1">Сумма</th>
            <td class="green">{{ processor(sumTween[0]) }}</td>
            <td>{{ processor(sumTween[1]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="record abs-full" :class="showRecord ? '' : 'hidden'">
      <canvas ref="confettiCanvasRef"></canvas>
      <div class="content abs-full">
        <h2 :class="`count-${players.length}`">Рекорд</h2>
        <h1 class=" green" :class="`count-${players.length}`">
          {{ useFixedSpaceProcessor(0)(record) }}
        </h1>
        <h2 class="hidden" :class="`count-${players.length}`">Рекорд</h2>
      </div>

      <div class="progress"></div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import confetti from 'canvas-confetti'

const confettiCanvasRef = ref<HTMLCanvasElement | null>(null);
let confettiCanvas: confetti.CreateTypes | null = null


const record = ref(0);

const props = defineProps<{
  players: {
    nickname: string;
    avg: number;
    last: number;
  }[];
  battles: number,
  sum: {
    avg: number,
    last: number,
  };
}>();

const showRecord = ref(false);

const processor = useFixedSpaceProcessor(0)

function nickProcessor(name: string) {
  if (name.endsWith('_Chuck')) return name.slice(0, -6);
  return name;
}

function showEffect() {
  const width = window.innerWidth;
  const k = width / 800;
  console.log('width', width);

  const shared: confetti.Options = {
    particleCount: 120,
    spread: 60,
    scalar: 1 * k,
    startVelocity: 40 * k,
    gravity: 0.8 * k,
    origin: { y: 1.2, x: 0 }
  }


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

const avg = computed(() => props.players.map(t => t.avg));
const avgTween = useTweenCounter(avg, { duration: 1 });

const last = computed(() => props.players.map(t => t.last));
const lastTween = useTweenCounter(last, { duration: 1 });

const sum = computed(() => [props.sum.avg, props.sum.last]);
const sumTween = useTweenCounter(sum, { duration: 1 })

const route = useRoute();

onMounted(() => {
  if (route.meta.clearPage)
    document.body.style.backgroundColor = 'transparent';

  if (confettiCanvasRef.value) {
    confettiCanvas = confetti.create(confettiCanvasRef.value, { resize: true })
  }
})

function showRecordScreen(score: number) {
  showRecord.value = true;
  record.value = score;
  nextTick(() => showEffect())

  setTimeout(() => {
    showRecord.value = false;
  }, 8000);
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

  &.hidden {
    opacity: 0;
    transition: 1s;
  }

  .content {
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    h2,
    h1 {
      margin: 0;
    }

    h1 {
      font-weight: 900;
      white-space: nowrap;

      &.count-3 {
        font-size: 15em;
      }

      &.count-2 {
        font-size: 12em;
      }

      &.count-1 {
        font-size: 7em;
      }
    }

    h2 {
      font-size: 4em;

      &.hidden {
        visibility: hidden;

        &.count-1 {
          font-size: 2em;
        }
      }

      &.count-1 {
        font-size: 3em;
      }
    }

  }

  canvas {
    width: 100%;
    height: 100%;
  }

  .progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 1em;
    background-color: #8a8a8a6c;
    width: 0%;
  }
}

.card {
  font-size: 1.3vw;
  padding: 3em 3em 2.3em 3em;
  border-radius: 3em;
  background-color: #3a3a3ad2;
  margin: 3em;
  box-shadow: 0 0 3em 0px #000000c1;
  position: relative;


  .main {
    &.hidden {
      opacity: 0;
      transition: opacity 0.2s;
    }

    transition: opacity 2s;
  }

  &.solo {
    font-size: 2vw;
  }

  $grey: #c4c4c4;

  h1 {
    color: #fff;
    text-align: left;
    font-size: 5em;
    margin: 0;
  }


  table {
    table-layout: fixed;
    border-collapse: collapse;
    width: 100%;

    th,
    td {
      padding: 0 0.5em;
      line-height: 1.3;
      text-wrap: nowrap;
      white-space: nowrap;

      &.wide {
        width: 40%;
      }
    }

    th:first-child {
      padding-left: 0;
    }

    td:last-child,
    th:last-child {
      padding-right: 0;
    }

    thead {
      th {
        color: $grey;
        font-size: 3em;
        text-align: left;
        font-weight: normal;
        padding: 0;

        &.center {
          text-align: center;
        }
      }

      th:last-child {
        padding-left: 0.58em;
      }
    }

    tbody {
      tr {

        th {
          color: #fff;
          font-size: 3em;
          text-align: left;
          font-weight: bold;
        }

        td {
          color: #fff;
          font-size: 3.5em;
          text-align: center;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
      }

      .avg {
        th {
          color: $grey;
          font-size: 3em;
          text-align: left;
          font-weight: normal;
        }

        td {
          font-size: 4em;
          text-align: center;
          font-weight: 900;
        }

      }
    }
  }

  .nickname {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .footer {
    color: $grey;
    font-size: 3em;
    padding-left: 2px;
    text-align: left;
    margin: 0;

    span {
      font-weight: 800;
    }
  }

  .green {
    color: #7ee927;
    // color: rgb(191, 245, 110);

    // color: #e7ffde;
    // filter: drop-shadow(0 0 0.3em #639e31);
  }
}

.record:not(.hidden) {
  h1 {
    animation: 1s showRecord;
  }

  h2 {
    animation: 2s showTitle;
  }

  .progress {
    animation: 8s progress linear;
  }

  @keyframes showRecord {
    0% {
      scale: 0.7;
      opacity: 0;
    }

    80% {
      scale: 1.2;
      opacity: 1;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes showTitle {
    0% {
      opacity: 0;
      transform: translateY(-5em);
    }

    20% {
      scale: 0.7;
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes progress {
    0% {
      width: 100%;
    }

    100% {
      width: 0%;
    }
  }
}
</style>
