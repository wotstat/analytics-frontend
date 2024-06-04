<template>
  <div class="flex">
    <div class="card">
      <div class="main">
        <p>Место: <span class="green bold num">{{ processor(placeTween) }}</span></p>
      </div>

      <div class="record abs-full">
        <canvas ref="confettiCanvasRef"></canvas>
      </div>
    </div>
  </div>
  <!-- <button @click="showRecordScreen(22542)">Show Best</button> -->
</template>


<script setup lang="ts">
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useTweenCounter } from '@/composition/useTweenCounter';
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import confetti from 'canvas-confetti'

const confettiCanvasRef = ref<HTMLCanvasElement | null>(null);
let confettiCanvas: confetti.CreateTypes | null = null


const props = defineProps<{
  place: number;
}>();

const processor = useFixedSpaceProcessor(0)

function showEffect() {
  const width = window.innerWidth;
  const k = width / 800;
  console.log('width', width);

  const shared: confetti.Options = {
    particleCount: 220,
    spread: 60,
    scalar: 1.5 * k,
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
  background-color: #3a3a3ad2;
  margin: 3em;
  box-shadow: 0 0 3em 0px #000000c1;
  position: relative;


  .main {
    p {
      font-size: 8em;
    }

    .bold {
      font-weight: bold;
    }

    .num {
      font-variant-numeric: tabular-nums;
    }
  }

  $grey: #c4c4c4;

  .green {
    color: #7ee927;
  }
}
</style>
