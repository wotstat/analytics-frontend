<template>
  <CanvasVue @redraw="redraw" ref="canvasRef" />
</template>

<script setup lang="ts">
import CanvasVue from "@/components/Canvas.vue";
import { computed, ref, shallowRef } from "vue";

import { useDebounceFn } from '@vueuse/core'
import { query } from "@/db";

const LOAD_COUNT = 1000;
const RENDER_COUNT = 20;

const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const ctxRef = shallowRef<CanvasRenderingContext2D | null>(null);
const widthRef = ref(0);
const heightRef = ref(0);

const radius = computed(() => Math.min(widthRef.value, heightRef.value) / 2 - 1);
let timeoutHandler: number | null = null;

const renderShotsDebounce = useDebounceFn(() => {
  startDrawProcess();
}, 200);

function redraw(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctxRef.value = ctx;
  widthRef.value = width;
  heightRef.value = height;

  const r = radius.value

  ctx.setLineDash([r / 20]);
  ctx.strokeStyle = '#78d63a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#78d63a';
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, r / 60, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();

  if (timeoutHandler) clearTimeout(timeoutHandler)
  renderShotsDebounce();
}

let shotsData: { id: string, x: number, y: number, hit: boolean }[] = []

let loading = false;
let loadingFinished = false;
async function loadNextBatch() {
  if (loading) return;
  if (loadingFinished) return;

  loading = true;

  console.log(`load ${LOAD_COUNT} shots offset ${shotsData.length} started at ${shotsData.length > 0 ? 'where id < ' + shotsData[0].id : 'all'}`);
  const result = await query<{ id: string, r: number, theta: number, hit: number }>(`
    SELECT id, 
    ballisticResultServer_r as r, 
    ballisticResultServer_theta as theta, 
    length(results.order) > 0 as hit FROM Event_OnShot 
      ${shotsData.length > 0 ? 'where id < ' + shotsData[0].id : ''}
      order by id desc 
      limit ${LOAD_COUNT} 
      offset ${shotsData.length};`)

  shotsData.push(...result.data.map(row => ({
    id: row.id,
    x: row.r * Math.cos(row.theta),
    y: row.r * Math.sin(row.theta),
    hit: row.hit == 1,
  })));

  loadingFinished = result.data.length < LOAD_COUNT;
  loading = false;
}

async function startDrawProcess() {
  if (timeoutHandler) clearTimeout(timeoutHandler);

  let currentCount = 0;
  const r = radius.value

  function draw() {
    timeoutHandler = setTimeout(draw, 1);
    if (currentCount + RENDER_COUNT > shotsData.length) {
      if (loadingFinished) {
        console.log('finished');
        clearTimeout(timeoutHandler);
      }
      loadNextBatch()
      return
    }

    const ctx = ctxRef.value
    if (!ctx) return

    for (let i = 0; i < RENDER_COUNT; i++) {
      const shot = shotsData[currentCount + i];
      const x = shot.x * r;
      const y = shot.y * r;
      ctx.fillStyle = shot.hit ? '#ffdd9c' : '#e7ffde';
      ctx.shadowColor = shot.hit ? '#f73c08' : "#639e31";
      ctx.shadowBlur = r / 40;
      ctx.beginPath();
      ctx.arc(widthRef.value / 2 + x, heightRef.value / 2 + y, r / 150, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();

    }
    currentCount += RENDER_COUNT;
  }
  draw()
}
</script>