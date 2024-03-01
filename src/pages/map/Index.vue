<template>
  <div class="center-container">
    <h4><i>Сервис в очень ранней разработке. Прототип</i></h4>
    <SettingsTitle>
      Карты позиций
    </SettingsTitle>
    <h3>
      <StatParamsTitle />
    </h3>

    <div class="flex settings-line">
      <p>Карта</p>
      <select v-model="selectedMap">
        <option v-for="item in arenas" :value="item.tag">
          {{ getArenaName(item.tag.split('/')[1] + '/name').value }} – {{ item.count }}
        </option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Команда</p>
      <select v-model="selectedTeam">
        <option :value="1">1</option>
        <option :value="2">2</option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Геймплей</p>
      <select v-model="selectedGameplay">
        <option value="ctf">ctf</option>
        <option value="domination">domination</option>
        <option value="assault">assault</option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Отображение</p>
      <select v-model="selectedDisplay">
        <option value="shots">Все выстрелы</option>
        <option value="group">Кластеризация</option>
      </select>
    </div>

    <div class="flex settings-line" v-if="selectedDisplay == 'shots'">
      <p>Показывать трассеры</p>
      <input type="checkbox" v-model="showTracers">
    </div>

    <div class="flex settings-line">
      <p>Время боя в секундах</p>
      От:
      <input type="number" v-model="selectedFrom">
      До:
      <input type="number" v-model="selectedTo">
    </div>

    <div class="minimap">
      <div class="map-container">
        <img class="map" v-if="arenaMinimapUrl" :src="arenaMinimapUrl">
      </div>

      <div class="overlay-container">
        <MinimapOverlays v-if="arenaTag" :arenaTag="arenaTag" :gameplay="selectedGameplay" :allyTeam="selectedTeam" />
        <CanvasVue ref="tracerCanvasRef" :style="{
          visibility: showTracers ? 'visible' : 'hidden',
        }" />
        <CanvasVue :redrawGenerator="redrawGenerator" ref="canvasRef" />
      </div>
    </div>
    <p>Выстрелов: {{ totalDraw }}</p>
  </div>
</template>

<script setup lang="ts">

import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import MinimapOverlays from '@/components/MinimapOverlays.vue';
import CanvasVue from "@/components/Canvas.vue";

import { useQueryStatParams, whereClause } from "@/composition/useQueryStatParams";
import { query, queryAsync, queryComputed } from '@/db';
import { aranaMinimapUrl, convertCoordinate, loadArenaMeta } from '@/utils/arenas';
import { getArenaName } from '@/utils/i18n';
import { computedAsync, useDebounce } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { BloomColor } from '@/components/bloomColors';

const LOAD_COUNT = 2000;

const params = useQueryStatParams();

const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const tracerCanvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const tracerCtx = computed(() => tracerCanvasRef.value?.context());

const selectedMap = ref<string | null>(null);
const selectedTeam = ref<1 | 2>(1);
const selectedGameplay = ref<'ctf' | 'domination' | 'assault'>('ctf');
const selectedDisplay = ref<'shots' | 'group'>('shots');
const selectedFrom = ref(0);
const showTracers = ref(true);
const selectedTo = ref(900);

const arenaTag = computed(() => selectedMap.value?.split('/')[1]);
const arenaMeta = computedAsync(async () => arenaTag.value ? await loadArenaMeta(arenaTag.value) : null);

const totalDraw = ref(0);

const arenas = queryComputed<{ tag: string, count: number }>(() => `
select arenaTag as tag, count() as count from Event_OnShot
${whereClause(params)}
group by arenaTag
order by count desc
`);

watch(arenas, (value) => {
  if (value.length > 0 && !selectedMap.value) {
    selectedMap.value = value[0].tag;
  }
});

const arenaMinimapUrl = computedAsync(() => {
  if (selectedMap.value == null) return null;
  return aranaMinimapUrl(selectedMap.value);
})


let shotsData: { x: number, z: number, markerX: number, markerZ: number, hit: boolean }[] = []
let loading = false;
let loadingFinished = false;

async function loadNextBatch() {
  if (loading) return;
  if (loadingFinished) return;
  if (!selectedMap.value) return;

  loading = true;

  console.log(`load ${LOAD_COUNT} shots offset ${shotsData.length}`);
  const result = await query<{ x: number, z: number, markerX: number, markerZ: number, hit: number }>(`
      select
            gunPoint_x          as x,
            gunPoint_z          as z,
            serverMarkerPoint_x as markerX,
            serverMarkerPoint_z as markerZ,
            length(results.order) > 0 as hit
      from Event_OnShot
      where arenaTag = '${selectedMap.value}'
      and team = ${selectedTeam.value}
      and battleGameplay = '${selectedGameplay.value}'
      and battleTime >= ${selectedFrom.value * 1000}
      and battleTime <= ${selectedTo.value * 1000}
      ${whereClause(params, { withWhere: false })}
      limit ${LOAD_COUNT}
      offset ${shotsData.length};`)



  shotsData.push(...result.data.map(row => ({
    x: row.x,
    z: row.z,
    markerX: row.markerX,
    markerZ: row.markerZ,
    hit: row.hit == 1,
  })));

  loadingFinished = result.data.length < LOAD_COUNT;
  loading = false;
}

function relativeCoordinate(x: number, y: number) {
  if (!arenaMeta.value) return null
  const { x: nx, y: ny } = convertCoordinate({ x, y }, arenaMeta.value.boundingBox)
  return { x: nx, y: ny }
}

function* redrawGenerator(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const DRAW_COUNT = 500;
  const r = width / 500;
  tracerCtx.value?.clearRect(0, 0, width, height);

  yield 100

  let drawCount = 0
  while (drawCount < 50000) {
    if (drawCount == shotsData.length) {
      if (loadingFinished) return console.log('FINISHED')
      loadNextBatch()
      yield 500
      continue
    }

    for (let i = 0; i < DRAW_COUNT && drawCount < shotsData.length; i++) {
      const shot = shotsData[drawCount]

      const tankPos = relativeCoordinate(shot.x, shot.z)
      const markerPos = relativeCoordinate(shot.markerX, shot.markerZ)


      ctx.fillStyle = shot.hit ? BloomColor.gold.main : BloomColor.green.main;
      ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
      ctx.strokeStyle = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
      ctx.shadowBlur = 5;

      if (!tankPos || !markerPos) break;

      drawCount += 1
      ctx.beginPath();
      ctx.arc(tankPos.x * width - r / 2, tankPos.y * width - r / 2, r, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();

      if (tracerCtx.value) {
        const ctx = tracerCtx.value;

        ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
        ctx.strokeStyle = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(tankPos.x * width, tankPos.y * width);
        ctx.lineTo(markerPos.x * width, markerPos.y * width);
        ctx.lineWidth = 0.1;
        ctx.stroke();
      }
    }

    console.log(`Draw ${drawCount} / ${shotsData.length} shots`);

    totalDraw.value = drawCount;
    yield 100
  }
}

const debouncedFrom = useDebounce(selectedFrom, 500);
const debouncedTo = useDebounce(selectedTo, 500);

watch(() => [selectedMap.value, selectedTeam.value, selectedGameplay.value, debouncedFrom.value, debouncedTo.value], () => {
  shotsData = []
  loading = false;
  loadingFinished = false;
  canvasRef.value?.redraw()
}, { immediate: true })



</script>

<style lang="scss" scoped>
.settings-line {
  margin-bottom: 5px;
  align-items: center;
}

.minimap {
  margin: 20px auto;
  user-select: none;
  position: relative;
  width: auto;
  max-width: 800px;
  aspect-ratio: 1;

  .map-container,
  .overlay-container {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
  }

  .map-container {
    img.map {
      width: 100%;
      pointer-events: none;
      filter: brightness(0.6);
    }
  }

  .overlay-container {
    >* {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }

}
</style>