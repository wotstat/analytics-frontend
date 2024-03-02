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
      <p>Время боя в секундах</p>
      От:
      <input type="number" v-model="selectedFrom">
      До:
      <input type="number" v-model="selectedTo">
    </div>

    <hr>

    <div class="flex settings-line">
      <p>Отображение</p>
      <select v-model="selectedDisplay">
        <option value="shots">Все выстрелы</option>
        <option value="group">Кластеризация</option>
      </select>
    </div>

    <div class="flex settings-line">
      <p>Отмечать</p>
      <select v-model="selectedPointVariant">
        <option value="target">Куда стреляли</option>
        <option value="gun">Откуда стреляли</option>
        <option value="all">Куда и откуда</option>
      </select>
    </div>

    <template v-if="selectedDisplay == 'shots'">

      <div class="flex settings-line">
        <p>Завершение выстрела</p>
        <select v-model="selectedTracerEnd">
          <option value="clientMarkerPoint">Клиентский прицел</option>
          <option value="serverMarkerPoint">Серверный прицел</option>
          <option value="tracerEnd">Исчезновение трассера</option>
          <option value="hitPoint">Точка попадания</option>
        </select>
      </div>


      <div class="flex settings-line">
        <p>Показывать трассеры</p>
        <input type="checkbox" v-model="showTracers">
      </div>

      <div class="flex settings-line">
        <p>Подсвечивать при наведение</p>
        <input type="checkbox" v-model="highlightTracers">
      </div>

    </template>

    <div class="minimap">
      <div class="map-container">
        <img class="map" v-if="arenaMinimapUrl" :src="arenaMinimapUrl">
      </div>

      <div class="overlay-container" ref="containerRef" @click="onClickShot">
        <MinimapOverlays v-if="arenaTag" :arenaTag="arenaTag" :gameplay="selectedGameplay" :allyTeam="selectedTeam" />
        <CanvasVue ref="tracerCanvasRef" :style="{
          visibility: showTracers ? 'visible' : 'hidden',
        }" />
        <CanvasVue :redrawGenerator="redrawGenerator" ref="canvasRef" />
        <CanvasVue class="hover-canvas" @redraw="hoverRender" ref="hoverCanvasRef" />
      </div>
    </div>
    <p>Выстрелов: {{ totalDraw }}</p>
  </div>

  <PopupWindow v-if="selectedShot" @close="closeShotInfo" :title="'Информация о выстреле'">
    <ShotInfo :shotID="selectedShot" />
  </PopupWindow>
</template>

<script setup lang="ts">

import SettingsTitle from '@/components/SettingsTitle.vue';
import StatParamsTitle from "@/components/StatParamsTitle.vue";
import MinimapOverlays from '@/components/MinimapOverlays.vue';
import PopupWindow from '@/components/PopupWindow.vue';
import ShotInfo from "@/components/widgets/ShotInfo/Index.vue";
import CanvasVue from "@/components/Canvas.vue";

import { useQueryStatParams, whereClause } from "@/composition/useQueryStatParams";
import { query, queryAsync, queryComputed } from '@/db';
import { aranaMinimapUrl, convertCoordinate, loadArenaMeta } from '@/utils/arenas';
import { getArenaName } from '@/utils/i18n';
import { computedAsync, useDebounce, useLocalStorage, useMouseInElement } from '@vueuse/core';
import { computed, ref, watch, watchEffect } from 'vue';
import { BloomColor } from '@/components/bloomColors';
import { Quadtree, Circle } from '@timohausmann/quadtree-ts';
import { useRoute, useRouter } from 'vue-router';

const LOAD_COUNT = 2000;
const HOVER_RADIUS = 0.05;
const CLICK_RADIUS = 0.005;

const params = useQueryStatParams();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const hoverCanvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const tracerCanvasRef = ref<InstanceType<typeof CanvasVue> | null>(null);
const tracerCtx = computed(() => tracerCanvasRef.value?.context());

const selectedMap = ref<string | null>(null);
const selectedTeam = ref<1 | 2>(1);
const selectedGameplay = ref<'ctf' | 'domination' | 'assault'>('ctf');
const selectedDisplay = ref<'shots' | 'group'>('shots');
const selectedPointVariant = ref<'gun' | 'target' | 'all'>('all');
const selectedTracerEnd = ref<'clientMarkerPoint' | 'serverMarkerPoint' | 'tracerEnd' | 'hitPoint'>('tracerEnd');
const selectedFrom = ref(0);
const showTracers = useLocalStorage('mapShowTracers', true);
const highlightTracers = useLocalStorage('mapHighlightTracers', false);
const selectedTo = ref(900);

const arenaTag = computed(() => selectedMap.value?.split('/')[1]);
const arenaMeta = computedAsync(async () => arenaTag.value ? await loadArenaMeta(arenaTag.value) : null);

const totalDraw = ref(0);
const nearestShotId = ref<string | null>(null)

const { elementX, elementY, elementHeight, elementWidth, isOutside } = useMouseInElement(containerRef)
watch(() => [elementX.value, elementY.value, isOutside.value], () => hoverCanvasRef.value?.redraw())

const quadTree = new Quadtree({
  x: 0,
  y: 0,
  width: 1,
  height: 1,
  maxLevels: 5,
});


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

function hoverRender(ctx: CanvasRenderingContext2D, width: number, height: number) {
  nearestShotId.value = null;
  if (isOutside.value) return;

  const x = elementX.value / width;
  const y = elementY.value / height;

  const shots = quadTree.retrieve(new Circle({
    x, y, r: HOVER_RADIUS * 2,
  })) as Circle<Point>[];

  if (shots.length == 0) return;

  const r = width / 500;
  const tracerWidth = width / 1000;


  let nearest = shots[0]
  let distance = (nearest.x - x) ** 2 + (nearest.y - y) ** 2
  for (const shot of shots) {
    if (!shot.data) continue;

    const d = (shot.x - x) ** 2 + (shot.y - y) ** 2
    if (d < distance) {
      distance = d;
      nearest = shot;
    }

    if (distance > HOVER_RADIUS ** 2) continue;

    ctx.globalAlpha = Math.max(0, Math.min(1, 1 - d / HOVER_RADIUS ** 2));
    ctx.fillStyle = shot.data.hit ? BloomColor.gold.main : BloomColor.green.main;
    ctx.beginPath();
    ctx.arc(shot.x * width, shot.y * width, r, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = shot.data.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
    ctx.beginPath();
    ctx.moveTo(shot.data.tankPos.x * width, shot.data.tankPos.y * height);
    ctx.lineTo(shot.data.hitPos.x * width, shot.data.hitPos.y * height);
    ctx.lineWidth = tracerWidth;
    ctx.stroke();

  }

  if (distance < CLICK_RADIUS ** 2) {
    ctx.globalAlpha = 1;
    ctx.shadowBlur = width / 200;

    if (nearest.data && highlightTracers.value) {
      ctx.beginPath();
      ctx.strokeStyle = BloomColor.blue.main;
      ctx.shadowColor = BloomColor.blue.bloom;
      ctx.moveTo(nearest.data.tankPos.x * width, nearest.data.tankPos.y * height);
      ctx.lineTo(nearest.data.hitPos.x * width, nearest.data.hitPos.y * height);
      ctx.lineWidth = tracerWidth * 2;
      ctx.stroke();
    }

    ctx.fillStyle = BloomColor.blue.main;
    ctx.shadowColor = BloomColor.blue.bloom;
    ctx.beginPath();
    ctx.arc(nearest.x * width, nearest.y * width, r * 2, 0, 2 * Math.PI);
    ctx.fill();

    nearestShotId.value = nearest.data?.id ?? null;
  }

}


let shotsData: { id: string, x: number, z: number, hitX: number, hitZ: number, hit: boolean }[] = []
type Coord = NonNullable<ReturnType<typeof relativeCoordinate>>
type Point = typeof shotsData[number] & { tankPos: Coord, hitPos: Coord }
let loading = false;
let loadingFinished = false;

async function loadNextBatch() {
  if (loading) return;
  if (loadingFinished) return;
  if (!selectedMap.value) return;

  loading = true;

  console.log(`load ${LOAD_COUNT} shots offset ${shotsData.length}`);

  const result = await query<{ id: string, x: number, z: number, hitX: number, hitZ: number, hit: number }>(`
      select
            id as id,
            gunPoint_x                      as x,
            gunPoint_z                      as z,
            ${selectedTracerEnd.value}_x    as hitX,
            ${selectedTracerEnd.value}_z    as hitZ,
            length(results.order) > 0       as hit
      from Event_OnShot
      where arenaTag = '${selectedMap.value}'
      and team = ${selectedTeam.value}
      and battleGameplay = '${selectedGameplay.value}'
      and battleTime >= ${selectedFrom.value * 1000}
      and battleTime <= ${selectedTo.value * 1000}
      ${selectedTracerEnd.value == 'hitPoint' ? 'and hitPoint_x is not NULL' : ''}
      ${whereClause(params, { withWhere: false })}
      limit ${LOAD_COUNT}
      offset ${shotsData.length};`)

  shotsData.push(...result.data.map(row => ({
    id: row.id,
    x: row.x,
    z: row.z,
    hitX: row.hitX,
    hitZ: row.hitZ,
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
  const tracerWidth = width / 5000;
  tracerCtx.value?.clearRect(0, 0, width, height);
  quadTree.clear();

  yield 100

  function drawShot(shot: typeof shotsData[number]) {
    const tankPos = relativeCoordinate(shot.x, shot.z)
    const hitPos = relativeCoordinate(shot.hitX, shot.hitZ)

    if (!tankPos || !hitPos) return;
    if (!tracerCtx.value) return
    const variant = selectedPointVariant.value

    quadTree.insert(new Circle<Point>({
      x: variant == 'target' ? hitPos.x : tankPos.x,
      y: variant == 'target' ? hitPos.y : tankPos.y,
      r: 0.001,
      data: {
        ...shot,
        tankPos,
        hitPos,
      }
    }))

    ctx.shadowBlur = width / 200;
    // HIT 
    {
      if (variant == 'all' || variant == 'target') {
        ctx.fillStyle = shot.hit ? BloomColor.gold.main : BloomColor.green.main;
        ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
        ctx.strokeStyle = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;

        ctx.beginPath();
        ctx.arc(hitPos.x * width, hitPos.y * width, r / 2, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
    }

    // TANK
    {
      if (variant != 'target') {
        if (variant == 'gun') {
          ctx.fillStyle = shot.hit ? BloomColor.gold.main : BloomColor.green.main;
          ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
          ctx.strokeStyle = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
        } else {
          ctx.fillStyle = BloomColor.blue.main
          ctx.shadowColor = BloomColor.blue.bloom
        }


        ctx.beginPath();
        ctx.arc(tankPos.x * width, tankPos.y * width, r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
    }

    // TRACER
    {
      const ctx = tracerCtx.value;

      ctx.shadowColor = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
      ctx.strokeStyle = shot.hit ? BloomColor.gold.bloom : BloomColor.green.bloom;
      ctx.shadowBlur = 5;

      ctx.beginPath();
      ctx.moveTo(tankPos.x * width, tankPos.y * width);
      ctx.lineTo(hitPos.x * width, hitPos.y * width);
      ctx.lineWidth = tracerWidth;
      ctx.stroke();
    }

    drawCount += 1
  }


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
      drawShot(shot)
    }

    console.log(`Draw ${drawCount} / ${shotsData.length} shots`);

    totalDraw.value = drawCount;
    yield 100
  }
}

const debouncedFrom = useDebounce(selectedFrom, 500);
const debouncedTo = useDebounce(selectedTo, 500);

watch(() => [selectedMap.value, selectedTeam.value, selectedGameplay.value, debouncedFrom.value, debouncedTo.value, selectedPointVariant.value, selectedTracerEnd.value], () => {
  shotsData = []
  loading = false;
  loadingFinished = false;
  canvasRef.value?.redraw()
}, { immediate: true })



const route = useRoute();
const router = useRouter();
const selectedShot = computed(() => route.query.shot as string | undefined);

function onClickShot() {
  if (nearestShotId.value) {
    router.push({ query: { ...route.query, shot: nearestShotId.value } });
  }
}

function closeShotInfo() {
  router.push({ query: { ...route.query, shot: undefined } });
}

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

    &:hover {
      *:not(.hover-canvas) {
        :deep(canvas) {
          filter: brightness(0.8) opacity(0.6);
        }
      }
    }

    :deep(canvas) {
      transition: filter 0.1s;
    }
  }

}
</style>