<template>
  <canvas ref="canvas"></canvas>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Confetti from 'canvas-confetti'

const canvas = ref<HTMLCanvasElement | null>(null);

const confetti = ref<Confetti.CreateTypes | null>(null);

onMounted(() => {
  if (!canvas.value) return;

  confetti.value = Confetti.create(canvas.value, {
    resize: true,
    useWorker: true
  });

})

defineExpose({
  start: confetti
})

</script>


<style lang="scss" scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>