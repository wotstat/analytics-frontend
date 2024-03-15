<template>
  <div class="shot-container" ref="container" :style="{ cursor: highlighted ? 'pointer' : '' }" @click="onClick">
    <CanvasVue @redraw="redraw" ref="canvasRef" />
    <svg v-if="maskRadius && maskRadius < 0.99">
      <path :d="maskPath" />
      <circle cx="50%" cy="50%" :r="`${(props.maskRadius ?? 1) / 2 * 100}%`" />
    </svg>

    <svg v-if="highlighted">
      <circle class="highlight" :cx="highlighted.x * 100 + '%'" :cy="highlighted.y * 100 + '%'" r="3px" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import CanvasVue from "@/components/Canvas.vue";
import { computed, ref, shallowRef } from "vue";
import { Quadtree, Circle } from '@timohausmann/quadtree-ts';

import { useDebounceFn, useMouseInElement } from '@vueuse/core'
import { query } from "@/db";
import { BloomColor } from "../bloomColors";
import { StatParams, whereClause } from "@/composition/useQueryStatParams";

const COUNT_TO_SMALL_SIZE = 3000;
const LOAD_COUNT = 1000;
const RENDER_COUNT = 20;
const HOVER_RADIUS = 0.02;
const MOBILE_HOVER_RADIUS = 0.15;

const container = ref<HTMLElement | null>(null);
const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const { elementX, elementY, elementHeight, elementWidth, isOutside } = useMouseInElement(container)

const widthRef = ref(0);
const heightRef = ref(0);

const quadTree = new Quadtree({
  x: -1,
  y: -1,
  width: 2,
  height: 2,
  maxLevels: 5,
});

const props = defineProps<{
  limitShot?: number,
  drawDelay?: number,
  drawCount?: number,
  maskRadius?: number,
  params?: StatParams,
  allowHover?: boolean,
}>()

const emit = defineEmits<{
  onClickShot: [id: string]
}>()

const radius = computed(() => Math.min(widthRef.value, heightRef.value) / 2 - 1);
let timeoutHandler: ReturnType<typeof setTimeout> | null = null;
let totalCount = -1;

const renderShotsDebounce = useDebounceFn(() => {
  startDrawProcess();
}, 200);

function redraw(ctx: CanvasRenderingContext2D, width: number, height: number) {
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

  const toAdd = result.data.map(row => ({
    id: row.id,
    x: row.r * Math.cos(row.theta),
    y: -row.r * Math.sin(row.theta),
    hit: row.hit == 1,
  }));

  shotsData.push(...toAdd);

  const circles = toAdd.map(p => new Circle({
    x: p.x,
    y: p.y,
    r: 0.001,
    data: p.id
  }))

  for (const circle of circles) quadTree.insert(circle)

  loadingFinished = result.data.length < LOAD_COUNT || (props.limitShot != null && LOAD_COUNT + shotsData.length > props.limitShot);
  loading = false;
}

function lerp(from: number, to: number, from2: number, to2: number, value: number) {
  return (value - from2) / (to2 - from2) * (to - from) + from;
}

async function startDrawProcess() {
  if (timeoutHandler) clearTimeout(timeoutHandler);

  if (totalCount == -1) {

    const count = query<{ count: number }>(`
      SELECT count(*) as count FROM Event_OnShot 
      ${props.params ? whereClause(props.params) : ''};`)

    const loadFirstBatch = loadNextBatch()

    const [countResult, _] = await Promise.all([count, loadFirstBatch])

    totalCount = Math.min(countResult.data[0].count, props.limitShot ?? 100000);
  }

  let currentCount = 0;
  const r = radius.value
  const d = Math.min(500, Math.max(150, lerp(150, 500, 250, 5000, totalCount)));
  const pointRadius = r / d;
  const renderCount = props.drawCount ?? RENDER_COUNT * (totalCount > COUNT_TO_SMALL_SIZE ? 2 : 1);

  function draw() {
    let countToDraw = props.drawCount ?? renderCount;

    if (currentCount + LOAD_COUNT > shotsData.length) {
      loadNextBatch()
      countToDraw = Math.min(countToDraw, shotsData.length - currentCount);
    }

    const ctx = canvasRef.value?.context()
    if (!ctx) return

    for (let i = 0; i < countToDraw; i++) {
      const shot = shotsData[currentCount + i];
      const x = shot.x * r;
      const y = shot.y * r;
      ctx.fillStyle = shot.hit ? BloomColor.gold.main : BloomColor.green.main;
      ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
      ctx.shadowBlur = r / 40;
      ctx.beginPath();
      ctx.arc(widthRef.value / 2 + x, heightRef.value / 2 + y, pointRadius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();

    }
    currentCount += countToDraw;

    if (currentCount < totalCount) {
      timeoutHandler = setTimeout(draw, props.drawDelay ?? 1);
    }
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


function isMobile() {
  return navigator.maxTouchPoints > 0;
}

const highlighted = computed(() => {
  if (!props.allowHover) return;
  if (isOutside.value) return;

  const x = elementX.value / elementWidth.value * 2 - 1;
  const y = elementY.value / elementHeight.value * 2 - 1;

  const radius = isMobile() ? MOBILE_HOVER_RADIUS : HOVER_RADIUS;

  const res = quadTree.retrieve(new Circle({
    x, y, r: radius,
  })) as Circle<string>[];

  if (res.length == 0) return;

  let nearest = res[0]
  let distance = (nearest.x - x) ** 2 + (nearest.y - y) ** 2
  for (let i = 1; i < res.length; i++) {
    const d = (res[i].x - x) ** 2 + (res[i].y - y) ** 2
    if (d < distance) {
      distance = d;
      nearest = res[i];
    }
  }

  if (Math.sqrt(distance) > radius) return

  const SCALE_FIX_FACTOR = 0.996;
  return {
    x: (nearest.x * SCALE_FIX_FACTOR + 1) / 2,
    y: (nearest.y * SCALE_FIX_FACTOR + 1) / 2,
    id: nearest.data!
  };
})

function onClick() {
  if (highlighted.value) {
    emit('onClickShot', highlighted.value.id)
  }
}

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

    circle:not(.highlight) {
      fill: none;
      stroke: #e7ffde;
      filter: drop-shadow(0 0 10px #639e31);
      stroke-width: 1;
    }

    circle.highlight {
      fill: #cdeafa;
      // fill: none;
      // stroke: #cdeafa;
      filter: drop-shadow(0 0 5px #142de9);

      // stroke-width: 1;
    }
  }
}
</style>