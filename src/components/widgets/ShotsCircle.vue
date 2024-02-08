<template>
  <div class="shot-container">
    <CanvasVue @redraw="redraw" ref="canvasRef" />
    <svg v-if="maskRadius && maskRadius < 0.99">
      <path :d="maskPath" />
      <circle cx="50%" cy="50%" :r="`${(props.maskRadius ?? 1) / 2 * 100}%`" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import CanvasVue from "@/components/Canvas.vue";
import { computed, ref, shallowRef } from "vue";

import { useDebounceFn } from '@vueuse/core'
import { query } from "@/db";
import { BloomColor } from "../bloomColors";
import { StatParams, whereClause } from "@/composition/useQueryStatParams";

const LOAD_COUNT = 1000;
const RENDER_COUNT = 20;

const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const ctxRef = shallowRef<CanvasRenderingContext2D | null>(null);
const widthRef = ref(0);
const heightRef = ref(0);

const props = defineProps<{
  limitShot?: number,
  drawDelay?: number,
  drawCount?: number,
  maskRadius?: number,
  params?: StatParams
}>()

const radius = computed(() => Math.min(widthRef.value, heightRef.value) / 2 - 1);
let timeoutHandler: ReturnType<typeof setTimeout> | null = null;

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
      ${props.params ? whereClause(props.params, { withWhere: shotsData.length == 0 }) : ''}
      order by id desc 
      limit ${LOAD_COUNT} 
      offset ${shotsData.length};`)

  shotsData.push(...result.data.map(row => ({
    id: row.id,
    x: row.r * Math.cos(row.theta),
    y: row.r * Math.sin(row.theta),
    hit: row.hit == 1,
  })));

  loadingFinished = result.data.length < LOAD_COUNT || (props.limitShot != null && LOAD_COUNT * shotsData.length > props.limitShot);
  loading = false;
}

async function startDrawProcess() {
  if (timeoutHandler) clearTimeout(timeoutHandler);

  let currentCount = 0;
  const r = radius.value

  function draw() {
    timeoutHandler = setTimeout(draw, props.drawDelay ?? 1);
    let countToDraw = props.drawCount ?? RENDER_COUNT;

    if (currentCount + countToDraw > shotsData.length) {
      if (loadingFinished) {
        clearTimeout(timeoutHandler);
      }
      loadNextBatch()
      countToDraw = Math.min(countToDraw, shotsData.length - currentCount);
    }

    const ctx = ctxRef.value
    if (!ctx) return

    for (let i = 0; i < countToDraw; i++) {
      const shot = shotsData[currentCount + i];
      const x = shot.x * r;
      const y = shot.y * r;
      ctx.fillStyle = shot.hit ? BloomColor.gold.main : BloomColor.green.main;
      ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
      ctx.shadowBlur = r / 40;
      ctx.beginPath();
      ctx.arc(widthRef.value / 2 + x, heightRef.value / 2 + y, r / 150, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();

    }
    currentCount += countToDraw;
  }
  draw()
}

const maskPath = computed(() => {
  const width = widthRef.value;
  const outerRadius = width / 2;
  const innerRadius = outerRadius * (props.maskRadius ?? 1);

  return `M 0, 0 l 0, ${width} l ${width}, 0 l 0, -${width} Z
   M ${width / 2 - 0.5}, ${width / 2}
   m 0 -${outerRadius}
   m 1 ${outerRadius - innerRadius}
   a ${innerRadius}, ${innerRadius}, 0, 1, 1, -1, 0
   Z`
})

</script>

<style scoped lang="scss">
@import '@/styles/textColors.scss';

.shot-container {
  position: relative;

  svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    path {
      fill: $background-secondary;
      fill-opacity: 0.8;
    }

    circle {
      fill: none;
      stroke: #e7ffde;
      filter: drop-shadow(0 0 10px #639e31);
      stroke-width: 1;
    }
  }
}
</style>