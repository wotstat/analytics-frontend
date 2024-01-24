<template>
  <div>
    <h1>Сессионная инфографика</h1>

    <div class="card">
      <CanvasVue @redraw="redraw" ref="canvasRef" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, shallowRef, watch, } from 'vue';
import { useDebounceFn } from '@vueuse/core'
import CanvasVue from "@/components/Canvas.vue";

import { query } from "@/db";

const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);

const shotsData = shallowRef<{ r: number, theta: number }[]>([]);

onMounted(async () => {
  const data = await query('SELECT ballisticResultServer_r, ballisticResultServer_theta FROM Event_OnShot')
  shotsData.value = data.data.map((row: any) => ({
    r: row.ballisticResultServer_r,
    theta: row.ballisticResultServer_theta,
  }));
})

watch(shotsData, (data) => {
  canvasRef.value?.redraw();
})

let timeoutHandler: number | null = null;
function renderShots(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number = 0) {
  const COUNT = 50;
  if (shotsData.value.length === 0) return;
  if (offset == 0) {
    if (timeoutHandler) clearTimeout(timeoutHandler);
  }
  timeoutHandler = setTimeout(() => renderShots(ctx, width, height, offset + COUNT), 10);

  const data = shotsData.value.slice(offset, offset + COUNT);
  const radius = Math.min(width, height) / 2 - 1;
  for (const iterator of data) {
    const x = iterator.r * Math.cos(iterator.theta) * radius;
    const y = iterator.r * Math.sin(iterator.theta) * radius;
    ctx.fillStyle = '#e7ffde';
    ctx.shadowColor = "#639e31";
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(width / 2 + x, height / 2 + y, 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

}

const renderShotsDebounce = useDebounceFn((ctx: CanvasRenderingContext2D, width: number, height: number, offset: number = 0) => {
  renderShots(ctx, width, height);
}, 200);

function redraw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // dashed stroke style
  ctx.setLineDash([20, 20]);
  ctx.strokeStyle = '#78d63a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 1, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#78d63a';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 5, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();

  renderShotsDebounce(ctx, width, height);
}
</script>

<style lang="scss" scoped>
.card {
  padding: 40px;
}
</style>