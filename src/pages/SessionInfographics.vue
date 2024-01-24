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

const shotsData = shallowRef<{ r: number, theta: number, hasHit: boolean }[]>([]);

onMounted(async () => {
  const data = await query<{
    ballisticResultServer_r: number,
    ballisticResultServer_theta: number,
    hasHit: 0 | 1,
  }>('SELECT ballisticResultServer_r, ballisticResultServer_theta, length(results.order) > 0 as hasHit FROM Event_OnShot')

  shotsData.value = data.data.map(row => ({
    r: row.ballisticResultServer_r,
    theta: row.ballisticResultServer_theta,
    hasHit: row.hasHit == 1,
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
    ctx.fillStyle = iterator.hasHit ? '#ffdd9c' : '#e7ffde';
    ctx.shadowColor = iterator.hasHit ? '#f73c08' : "#639e31";
    ctx.shadowBlur = radius / 40;
    ctx.beginPath();
    ctx.arc(width / 2 + x, height / 2 + y, radius / 150, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  }

}

const renderShotsDebounce = useDebounceFn((ctx: CanvasRenderingContext2D, width: number, height: number, offset: number = 0) => {
  renderShots(ctx, width, height);
}, 200);

function redraw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const radius = Math.min(width, height) / 2 - 1;

  ctx.setLineDash([radius / 20]);
  ctx.strokeStyle = '#78d63a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#78d63a';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, radius / 60, 0, 2 * Math.PI);
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